import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../../constants/Colors';
import { useAuthStore } from '../../../store/auth-store';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { socketService } from '../../../services/socket.service';

export default function PartnerDashboard() {
  const { user } = useAuthStore();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [incomingJobs, setIncomingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    try {
      const res = await api.get('/jobs/my/partner');
      setActiveJobs(res.data.data.filter((j: any) => !['COMPLETED', 'CONFIRMED', 'CANCELLED'].includes(j.status)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();

    // Listen for incoming job broadcasts from WebSocket
    if (socketService.socket) {
      socketService.socket.on('job:broadcasted', (payload) => {
        // Fetch the full job details since payload only has basic info
        api.get(\`/jobs/\${payload.jobId}\`).then(res => {
          setIncomingJobs(prev => [res.data.data, ...prev]);
        });
      });
      
      socketService.socket.on('job:cancelled', (payload) => {
        setIncomingJobs(prev => prev.filter(j => j._id !== payload.jobId));
        fetchMyJobs(); // Refresh active jobs in case it was an active one
      });
    }

    // Ping location to make sure we are eligible for broadcasts
    // Simulated Lat/Long for demo
    api.put('/location/update', { latitude: 40.7128, longitude: -74.0060 }).catch(console.error);

    return () => {
      socketService.socket?.off('job:broadcasted');
      socketService.socket?.off('job:cancelled');
    };
  }, []);

  const handleAccept = async (jobId: string) => {
    try {
      await api.put(\`/jobs/\${jobId}/accept\`);
      Alert.alert('Success', 'Job accepted!');
      setIncomingJobs(prev => prev.filter(j => j._id !== jobId));
      fetchMyJobs(); // move to active
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not accept job');
    }
  };

  const updateJobStatus = async (jobId: string, action: 'start' | 'complete') => {
    try {
      await api.put(\`/jobs/\${jobId}/\${action}\`);
      fetchMyJobs();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>You are Online & Looking for work</Text>
      </View>

      <View style={{ flex: 1, padding: 24 }}>
        {loading ? (
          <ActivityIndicator color={Colors.partner.primary} />
        ) : (
          <>
            {incomingJobs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Incoming Broadcasts</Text>
                {incomingJobs.map(job => (
                  <Card key={job._id} style={styles.jobCard} elevated>
                    <Text style={styles.jobDesc}>{job.description}</Text>
                    <Text style={styles.jobAmount}>{job.offeredAmount} AFX</Text>
                    <Button 
                      title="Accept Job" 
                      mode="partner" 
                      style={{ marginTop: 16 }} 
                      onPress={() => handleAccept(job._id)}
                    />
                  </Card>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Active Jobs</Text>
            {activeJobs.length === 0 ? (
              <Text style={styles.emptyText}>No active jobs at the moment.</Text>
            ) : (
              <FlatList
                data={activeJobs}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <Card style={styles.jobCard} elevated>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobStatus}>{item.status}</Text>
                      <Text style={styles.jobAmount}>{item.offeredAmount} AFX</Text>
                    </View>
                    <Text style={styles.jobDesc}>{item.description}</Text>
                    
                    <View style={styles.actions}>
                      {item.status === 'ACCEPTED' && (
                        <Button 
                          title="Start Work" 
                          mode="partner" 
                          onPress={() => updateJobStatus(item._id, 'start')} 
                        />
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <Button 
                          title="Mark Complete" 
                          mode="partner" 
                          variant="secondary"
                          onPress={() => updateJobStatus(item._id, 'complete')} 
                        />
                      )}
                    </View>
                  </Card>
                )}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.partner.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.partner.primaryLight,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 32,
  },
  jobCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.partner.primaryDark,
    backgroundColor: Colors.partner.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.partner.primary,
  },
  jobDesc: {
    fontSize: 16,
    color: Colors.light.text,
  },
  actions: {
    marginTop: 16,
  }
});

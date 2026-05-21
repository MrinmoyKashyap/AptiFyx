import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../../constants/Colors';
import { useAuthStore } from '../../../store/auth-store';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Simulated categories since we don't have a specific endpoint to list all in backend right now
// Wait, I seeded them in 003_seed.sql but didn't make a GET /categories endpoint.
// We'll hardcode the matching UUIDs from the seed file for the UI.
const CATEGORIES = [
  { id: 'ca7e6000-0000-0000-0000-000000000001', name: 'Plumbing', icon: 'wrench' },
  { id: 'ca7e6000-0000-0000-0000-000000000002', name: 'Electrical', icon: 'lightning-bolt' },
  { id: 'ca7e6000-0000-0000-0000-000000000003', name: 'Cleaning', icon: 'broom' },
  { id: 'ca7e6000-0000-0000-0000-000000000004', name: 'Moving', icon: 'truck-outline' },
  { id: 'ca7e6000-0000-0000-0000-000000000005', name: 'Painting', icon: 'format-paint' },
  { id: 'ca7e6000-0000-0000-0000-000000000006', name: 'Carpentry', icon: 'hammer' }
];

export default function CustomerHome() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs/my/customer');
      setActiveJobs(res.data.data.filter((j: any) => !['COMPLETED', 'CONFIRMED', 'CANCELLED'].includes(j.status)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleServicePress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/(app)/(customer)/request',
      params: { categoryId, categoryName }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello, {user?.name?.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>What do you need help with?</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.customer.primary} style={{ marginTop: 24 }} />
      ) : activeJobs.length > 0 ? (
        <View style={styles.activeJobsSection}>
          <Text style={styles.sectionTitle}>Active Requests</Text>
          {activeJobs.map(job => (
            <Card key={job._id} style={styles.jobCard} elevated>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.description}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
              </View>
              <Text style={styles.jobAmount}>{job.offeredAmount} AFX</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { marginHorizontal: 24 }]}>Services</Text>
      <FlatList
        data={CATEGORIES}
        numColumns={2}
        contentContainerStyle={styles.grid}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card 
            style={styles.serviceCard} 
            elevated 
            onPress={() => handleServicePress(item.id, item.name)}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={Colors.customer.primary} />
            </View>
            <Text style={styles.serviceName}>{item.name}</Text>
          </Card>
        )}
      />
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
    backgroundColor: Colors.customer.primary,
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
    color: Colors.customer.primaryLight,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 24,
    marginBottom: 16,
  },
  grid: {
    padding: 16,
  },
  serviceCard: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.customer.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activeJobsSection: {
    paddingHorizontal: 24,
  },
  jobCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobAmount: {
    fontSize: 14,
    color: Colors.customer.primary,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusBadge: {
    backgroundColor: Colors.customer.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.customer.primaryDark,
  }
});

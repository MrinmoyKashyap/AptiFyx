import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/Colors';
import { api } from '../../../services/api';
import { Button } from '../../../components/ui/Button';

export default function RequestService() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const categoryId = params.categoryId as string;
  const categoryName = params.categoryName as string;

  const [description, setDescription] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // In a real app, you would use expo-location to get current lat/long. 
  // For MVP, we will hardcode a coordinate or use simulated ones.
  const MOCK_LAT = 40.7128;
  const MOCK_LNG = -74.0060;

  const handleBroadcast = async () => {
    if (description.length < 10) {
      Alert.alert('Error', 'Please describe your problem in at least 10 characters.');
      return;
    }
    
    if (isNaN(Number(offeredAmount)) || Number(offeredAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/jobs', {
        categoryId,
        description,
        offeredAmount: Number(offeredAmount),
        location: {
          latitude: MOCK_LAT,
          longitude: MOCK_LNG
        }
      });

      if (res.data.success) {
        Alert.alert(
          'Success', 
          \`Job broadcasted! \${res.data.data.broadcastResult.matchedCount} partners notified.\`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to broadcast job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request {categoryName}</Text>
        <Text style={styles.subtitle}>Partners nearby will be notified immediately</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Describe the issue</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="E.g. The kitchen sink is leaking and won't stop..."
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Offered Amount (AFX)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="E.g. 50"
          value={offeredAmount}
          onChangeText={setOfferedAmount}
        />

        <Button 
          title="Broadcast Request" 
          onPress={handleBroadcast} 
          isLoading={loading}
          style={{ marginTop: 24 }}
        />
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.customer.primaryLight,
    marginTop: 8,
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  }
});

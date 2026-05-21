import { View, StyleSheet, ScrollView } from 'react-native';
import { ModeSwitch } from '../../../components/ModeSwitch';
import { Button } from '../../../components/ui/Button';
import CustomerProfileDetails from './profile'; // We'll just reuse the stub here or update it
import { Colors } from '../../../constants/Colors';
import { useAuthStore } from '../../../store/auth-store';
import { Text } from 'react-native';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>App Mode</Text>
        <ModeSwitch />

        <Button 
          title="Logout" 
          variant="danger" 
          style={styles.logoutBtn} 
          onPress={logout} 
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
  content: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  email: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  logoutBtn: {
    marginTop: 48,
  }
});

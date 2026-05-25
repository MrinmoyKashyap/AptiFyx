import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { disconnectSocket } from '../../services/socket';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function CustomerProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          disconnectSocket();
          logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.phone}>+91 {user?.phone}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏠 Customer</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <InfoRow icon="📱" label="Phone" value={`+91 ${user?.phone}`} />
          <InfoRow icon="👤" label="Name" value={user?.name ?? ''} />
          {user?.address && <InfoRow icon="📍" label="Address" value={user.address} />}

          <View style={styles.divider} />

          <MenuRow icon="📋" label="Job History" onPress={() => {}} />
          <MenuRow icon="⭐" label="My Reviews" onPress={() => {}} />
          <MenuRow icon="❓" label="Help & Support" onPress={() => {}} />
          <MenuRow icon="📜" label="Terms & Privacy" onPress={() => {}} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  backText: { color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.lg },
  profileSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightBold },
  name: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  phone: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.fontSizeMD },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  badgeText: { color: Colors.textInverse, fontSize: Typography.fontSizeSM },

  content: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl,
    backgroundColor: Colors.background, marginTop: -20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  infoRow: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoIcon: { fontSize: 20, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  infoValue: { fontSize: Typography.fontSizeMD, color: Colors.text, fontWeight: Typography.fontWeightMedium },

  divider: { height: 8, marginVertical: Spacing.md },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: Typography.fontSizeMD, color: Colors.text },
  menuArrow: { color: Colors.textMuted, fontSize: 18 },

  logoutBtn: {
    marginTop: Spacing.xl, borderWidth: 1.5, borderColor: Colors.error + '40',
    borderRadius: BorderRadius.full, paddingVertical: 14, alignItems: 'center',
    backgroundColor: Colors.error + '08',
  },
  logoutText: { color: Colors.error, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold },
});

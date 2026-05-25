import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { disconnectSocket } from '../../services/socket';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SERVICES_LIST = [
  { slug: 'plumbing', name: 'Plumbing', icon: '🔧' },
  { slug: 'electrician', name: 'Electrician', icon: '⚡' },
  { slug: 'carpentry', name: 'Carpentry', icon: '🪚' },
  { slug: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { slug: 'painting', name: 'Painting', icon: '🎨' },
  { slug: 'ac_repair', name: 'AC Repair', icon: '❄️' },
  { slug: 'pest_control', name: 'Pest Control', icon: '🐛' },
  { slug: 'moving', name: 'Moving', icon: '📦' },
  { slug: 'appliance_repair', name: 'Appliance Repair', icon: '🔌' },
  { slug: 'gardening', name: 'Gardening', icon: '🌿' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export default function ProviderProfileScreen({ navigation }: Props) {
  const { provider, logout, updateProvider } = useAuthStore();

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
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{provider?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{provider?.name}</Text>
            <Text style={styles.phone}>+91 {provider?.phone}</Text>
            <View style={styles.statsRow}>
              <StatItem label="Jobs" value={provider?.totalJobsDone?.toString() ?? '0'} />
              <View style={styles.statDivider} />
              <StatItem label="Rating" value={`⭐ ${provider?.rating?.toFixed(1) ?? '5.0'}`} />
              <View style={styles.statDivider} />
              <StatItem label="Pending" value={`₹${provider?.pendingCommission ?? 0}`} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <InfoRow icon="📱" label="Phone" value={`+91 ${provider?.phone}`} />
          {provider?.address && <InfoRow icon="📍" label="Address" value={provider.address} />}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Services</Text>
            <View style={styles.servicesGrid}>
              {SERVICES_LIST.map(service => {
                const active = provider?.services?.includes(service.slug);
                return (
                  <View
                    key={service.slug}
                    style={[styles.serviceChip, active && styles.serviceChipActive]}
                  >
                    <Text style={styles.serviceChipIcon}>{service.icon}</Text>
                    <Text style={[styles.serviceChipText, active && styles.serviceChipTextActive]}>
                      {service.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <MenuRow icon="💳" label="Commission History" onPress={() => navigation.navigate('Commission')} />
          <MenuRow icon="📋" label="Job History" onPress={() => {}} />
          <MenuRow icon="❓" label="Help & Support" onPress={() => {}} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  backText: { color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.lg },
  profileSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightBold },
  name: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  phone: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeMD },
  statsRow: { flexDirection: 'row', marginTop: Spacing.sm },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  statValue: { color: Colors.textInverse, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: Typography.fontSizeXS },

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

  section: { marginVertical: Spacing.lg },
  sectionTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.md },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  serviceChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  serviceChipIcon: { fontSize: 14 },
  serviceChipText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  serviceChipTextActive: { color: Colors.primary, fontWeight: Typography.fontWeightSemiBold },

  divider: { height: 8, marginVertical: Spacing.sm },
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

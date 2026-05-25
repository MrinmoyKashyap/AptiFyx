import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import { getServices } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<any> };

const SERVICE_COLORS = [
  '#4F46E5', '#F59E0B', '#8B5CF6', '#10B981',
  '#EF4444', '#06B6D4', '#84CC16', '#F97316',
  '#6366F1', '#22C55E', '#64748B', '#EC4899',
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { services, setServices } = useJobStore();

  useEffect(() => {
    if (services.length === 0) {
      getServices().then(r => setServices(r.data)).catch(() => {});
    }
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TouchableOpacity
              style={styles.searchInput}
              onPress={() => navigation.navigate('ServiceSelection')}
            >
              <Text style={styles.searchPlaceholder}>What service do you need?</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="⚡" label="Fast Matching" value="< 2 min" color={Colors.accent} />
          <StatCard icon="⭐" label="Avg Rating" value="4.8/5" color={Colors.success} />
          <StatCard icon="🛡️" label="Verified" value="100%" color={Colors.primary} />
        </View>

        {/* Services Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <Text style={styles.sectionCount}>{services.length} available</Text>
          </View>
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <TouchableOpacity
                key={service.slug}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('ServiceSelection', { preselect: service })}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.serviceIconBg,
                  { backgroundColor: (SERVICE_COLORS[index % SERVICE_COLORS.length]) + '15' }
                ]}>
                  <Text style={styles.serviceIcon}>{service.icon}</Text>
                </View>
                <Text style={styles.serviceCardName}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <StepCard
              number="1" icon="📢"
              title="Broadcast Request"
              desc="Select a service and your request is sent to nearby professionals"
            />
            <StepCard
              number="2" icon="🤝"
              title="Get Accepted"
              desc="A provider accepts your request and calls you to discuss the job"
            />
            <StepCard
              number="3" icon="✅"
              title="Job Done"
              desc="Share OTP to start, provider confirms completion when done"
            />
          </View>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Floating Request Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ServiceSelection')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabText}>+ Request a Service</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StepCard({ number, icon, title, desc }: { number: string; icon: string; title: string; desc: string }) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepLeft}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <View style={styles.stepLine} />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepIcon}>{icon}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.fontSizeSM },
  userName: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  profileBtn: {},
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1 },
  searchPlaceholder: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.fontSizeMD },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    marginTop: -20, gap: Spacing.sm,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderTopWidth: 3, ...Shadow.md,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },
  statLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center' },

  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text },
  sectionCount: { fontSize: Typography.fontSizeSM, color: Colors.textMuted },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  serviceIconBg: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  serviceIcon: { fontSize: 24 },
  serviceCardName: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: Typography.fontWeightMedium },

  stepsContainer: { gap: 0 },
  stepCard: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.xs },
  stepLeft: { alignItems: 'center', width: 32 },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { color: Colors.textInverse, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeSM },
  stepLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
  stepContent: { flex: 1, paddingBottom: Spacing.lg },
  stepIcon: { fontSize: 24, marginBottom: 4 },
  stepTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: 4 },
  stepDesc: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 18 },

  fabContainer: {
    position: 'absolute', bottom: 24, left: Spacing.lg, right: Spacing.lg,
  },
  fab: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.primary },
  fabGradient: { paddingVertical: 16, alignItems: 'center' },
  fabText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },
});

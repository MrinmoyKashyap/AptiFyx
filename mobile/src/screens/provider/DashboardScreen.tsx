import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, Switch, Alert, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import { toggleProviderStatus, updateProviderLocation, getProviderEarnings } from '../../services/api';
import { getSocket, emitProviderUpdateLocation } from '../../services/socket';
import { IncomingJobNotification } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function DashboardScreen({ navigation }: Props) {
  const { provider, updateProvider } = useAuthStore();
  const {
    incomingJobs, addIncomingJob, removeIncomingJob,
    canAcceptJobs, setCanAcceptJobs,
  } = useJobStore();

  const [isOnline, setIsOnline] = useState(provider?.isOnline ?? false);
  const isOnlineRef = useRef(provider?.isOnline ?? false);
  const [earnings, setEarnings] = useState({ totalJobsDone: 0, pendingCommission: 0, unpaidJobCount: 0 });
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    loadEarnings();
    setupSocketListeners();
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      const socket = getSocket();
      if (socket) {
        socket.off('provider:new_job');
        socket.off('provider:job_taken');
        socket.off('provider:customer_cancelled');
      }
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
    } else {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    }
  }, [isOnline]);

  const loadEarnings = async () => {
    try {
      const res = await getProviderEarnings();
      setEarnings(res.data);
      setCanAcceptJobs(res.data.unpaidJobCount <= 2);
    } catch {}
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('provider:new_job', (job: IncomingJobNotification) => {
      if (!isOnlineRef.current) return;
      Vibration.vibrate([0, 300, 100, 300, 100, 300]);
      addIncomingJob(job);
      navigation.navigate('IncomingRequest', { job });
    });

    socket.on('provider:job_taken', ({ jobId }: { jobId: string }) => {
      removeIncomingJob(jobId);
    });

    socket.on('provider:customer_cancelled', ({ jobId }: { jobId: string }) => {
      removeIncomingJob(jobId);
    });
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const sendLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        emitProviderUpdateLocation(loc.coords.latitude, loc.coords.longitude);
        await updateProviderLocation(loc.coords.latitude, loc.coords.longitude);
      } catch {}
    };

    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, 15000);
  };

  const handleToggleStatus = async () => {
    if (!canAcceptJobs && !isOnline) {
      Alert.alert(
        'Payment Required',
        `You have ${earnings.unpaidJobCount} unpaid jobs. Please pay the pending commission to go online.`,
        [
          { text: 'Pay Now', onPress: () => navigation.navigate('Commission') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      const newStatus = !isOnline;
      await toggleProviderStatus(newStatus);
      setIsOnline(newStatus);
      updateProvider({ isOnline: newStatus });
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const servicesList = provider?.services?.join(', ') || 'None selected';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>{provider?.name?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('ProviderProfile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{provider?.name?.charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Online Toggle */}
          <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
            <View style={styles.onlineLeft}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? Colors.online : Colors.offline }]} />
              <View>
                <Text style={styles.onlineLabel}>{isOnline ? 'You\'re Online' : 'You\'re Offline'}</Text>
                <Text style={styles.onlineSubLabel}>
                  {isOnline ? 'Receiving job requests' : 'Toggle to start receiving jobs'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleStatus}
              trackColor={{ false: '#374151', true: Colors.success }}
              thumbColor={Colors.textInverse}
            />
          </View>
        </LinearGradient>

        {/* Commission Warning */}
        {!canAcceptJobs && (
          <TouchableOpacity
            style={styles.commissionWarning}
            onPress={() => navigation.navigate('Commission')}
          >
            <Text style={styles.commissionWarningIcon}>⚠️</Text>
            <View style={styles.commissionWarningText}>
              <Text style={styles.commissionWarningTitle}>Payment Required</Text>
              <Text style={styles.commissionWarningSubtitle}>
                Pay ₹{earnings.pendingCommission} to continue accepting jobs
              </Text>
            </View>
            <Text style={styles.commissionWarningArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard icon="✅" label="Jobs Done" value={earnings.totalJobsDone.toString()} color={Colors.success} />
          <StatsCard icon="💰" label="Pending" value={`₹${earnings.pendingCommission}`} color={Colors.accent} />
          <StatsCard icon="⭐" label="Rating" value={provider?.rating?.toFixed(1) ?? '5.0'} color={Colors.primary} />
        </View>

        {/* Incoming Jobs */}
        {isOnline && incomingJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Incoming Requests ({incomingJobs.length})</Text>
            {incomingJobs.map(job => (
              <TouchableOpacity
                key={job.jobId}
                style={styles.incomingJobCard}
                onPress={() => navigation.navigate('IncomingRequest', { job })}
                activeOpacity={0.9}
              >
                <View style={styles.incomingJobLeft}>
                  <Text style={styles.incomingJobIcon}>📢</Text>
                  <View>
                    <Text style={styles.incomingJobService}>{job.serviceName}</Text>
                    <Text style={styles.incomingJobDist}>📍 {job.distanceKm} km away</Text>
                    {job.address && (
                      <Text style={styles.incomingJobAddr} numberOfLines={1}>{job.address}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.incomingJobRight}>
                  <View style={styles.incomingJobBadge}>
                    <Text style={styles.incomingJobBadgeText}>View</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderProfile')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.servicesRow}>
            {provider?.services?.map((s, i) => (
              <View key={i} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{s.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="📋" label="Job History"
              onPress={() => navigation.navigate('JobHistory')}
              color={Colors.primary}
            />
            <QuickAction
              icon="💳" label="Payments"
              onPress={() => navigation.navigate('Commission')}
              color={Colors.accent}
              badge={earnings.unpaidJobCount > 0 ? earnings.unpaidJobCount.toString() : undefined}
            />
            <QuickAction
              icon="⭐" label="My Reviews"
              onPress={() => {}}
              color={Colors.success}
            />
            <QuickAction
              icon="🛠️" label="Settings"
              onPress={() => navigation.navigate('ProviderProfile')}
              color={Colors.textSecondary}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.statsCard, { borderTopColor: color }]}>
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, color, badge }: {
  icon: string; label: string; onPress: () => void; color: string; badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Text style={styles.quickActionEmoji}>{icon}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  headerGreeting: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeSM },
  headerName: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  profileBtn: {},
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  onlineCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  onlineCardActive: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  onlineLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineLabel: { color: Colors.textInverse, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold },
  onlineSubLabel: { color: 'rgba(255,255,255,0.5)', fontSize: Typography.fontSizeXS },

  commissionWarning: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.error + '10', marginHorizontal: Spacing.lg,
    marginTop: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  commissionWarningIcon: { fontSize: 24 },
  commissionWarningText: { flex: 1 },
  commissionWarningTitle: { color: Colors.error, fontWeight: Typography.fontWeightSemiBold, fontSize: Typography.fontSizeMD },
  commissionWarningSubtitle: { color: Colors.error + 'CC', fontSize: Typography.fontSizeSM },
  commissionWarningArrow: { color: Colors.error, fontSize: 20, fontWeight: Typography.fontWeightBold },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.md, gap: Spacing.sm,
  },
  statsCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderTopWidth: 3, ...Shadow.md,
  },
  statsIcon: { fontSize: 20, marginBottom: 4 },
  statsValue: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold },
  statsLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textAlign: 'center' },

  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  editLink: { color: Colors.primary, fontSize: Typography.fontSizeSM },

  incomingJobCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.accent + '40',
    ...Shadow.md,
  },
  incomingJobLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flex: 1 },
  incomingJobIcon: { fontSize: 28 },
  incomingJobService: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },
  incomingJobDist: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  incomingJobAddr: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, maxWidth: 200 },
  incomingJobRight: {},
  incomingJobBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  incomingJobBadgeText: { color: Colors.textInverse, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold },

  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  serviceChipText: { color: Colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickAction: {
    width: '22%', alignItems: 'center', gap: 6,
  },
  quickActionIcon: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionEmoji: { fontSize: 26 },
  quickActionLabel: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textAlign: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: Colors.textInverse, fontSize: 10, fontWeight: Typography.fontWeightBold },
});

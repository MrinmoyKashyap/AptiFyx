import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { getPendingCommissions, payCommission, payLater } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: {
    params?: {
      commissionDue?: number;
      totalPending?: number;
      unpaidJobCount?: number;
      canAcceptMoreJobs?: boolean;
      jobId?: string;
    };
  };
};

interface PendingData {
  totalPending: number;
  unpaidJobCount: number;
  maxUnpaidJobs: number;
  canAcceptMoreJobs: boolean;
  items: Array<{ id: string; amount: number; createdAt: string; jobId?: string }>;
}

export default function CommissionScreen({ navigation, route }: Props) {
  const params = route?.params;
  const { provider, updateProvider } = useAuthStore();
  const { setCanAcceptJobs } = useJobStore();

  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await getPendingCommissions();
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load commission data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayAll = async () => {
    Alert.alert(
      'Confirm Payment',
      `Pay ₹${data?.totalPending} to AptiFyx?\n(This is a demo payment)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setPaying(true);
            try {
              await payCommission({ payAll: true });
              updateProvider({ pendingCommission: 0, unpaidJobCount: 0 });
              setCanAcceptJobs(true);
              Alert.alert('✅ Payment Successful!', `₹${data?.totalPending} paid to AptiFyx.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert('Payment Failed', 'Please try again.');
            } finally {
              setPaying(false);
            }
          },
        },
      ]
    );
  };

  const handlePayLater = async () => {
    try {
      const res = await payLater();
      if (res.data.canAcceptMoreJobs) {
        Alert.alert('Noted', res.data.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'Limit Reached',
          `You've reached the maximum of ${res.data.maxUnpaidJobs} deferred payments. Pay now to continue accepting jobs.`
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to defer payment.');
    }
  };

  const remaining = data ? data.maxUnpaidJobs - data.unpaidJobCount : 0;
  const isJobCompletion = params?.commissionDue != null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.header}
      >
        {!isJobCompletion && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>💰</Text>
          </View>
          <Text style={styles.headerTitle}>
            {isJobCompletion ? 'Job Completed!' : 'Commission Ledger'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isJobCompletion
              ? `₹${params?.commissionDue ?? 20} commission due to AptiFyx`
              : 'Manage your AptiFyx commission payments'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: Colors.accent }]}>
                <Text style={styles.statIcon}>💳</Text>
                <Text style={[styles.statAmount, { color: Colors.accent }]}>
                  ₹{data?.totalPending ?? 0}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={[styles.statCard, { borderColor: Colors.error }]}>
                <Text style={styles.statIcon}>📊</Text>
                <Text style={[styles.statAmount, { color: Colors.error }]}>
                  {data?.unpaidJobCount ?? 0}/{data?.maxUnpaidJobs ?? 2}
                </Text>
                <Text style={styles.statLabel}>Deferred</Text>
              </View>
              <View style={[styles.statCard, { borderColor: Colors.success }]}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={[styles.statAmount, { color: Colors.success }]}>
                  {remaining > 0 ? `+${remaining}` : '0'}
                </Text>
                <Text style={styles.statLabel}>Jobs Left</Text>
              </View>
            </View>

            {/* Limit warning */}
            {!data?.canAcceptMoreJobs && (
              <View style={styles.limitWarning}>
                <Text style={styles.limitWarningIcon}>🚫</Text>
                <Text style={styles.limitWarningText}>
                  You've reached the deferred payment limit. Pay now to accept more jobs.
                </Text>
              </View>
            )}

            {data?.canAcceptMoreJobs && data.unpaidJobCount > 0 && (
              <View style={styles.limitInfo}>
                <Text style={styles.limitInfoIcon}>ℹ️</Text>
                <Text style={styles.limitInfoText}>
                  You can accept {remaining} more job(s) before payment is required.
                </Text>
              </View>
            )}

            {/* Commission items */}
            {(data?.items?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Commissions</Text>
                {data?.items.map(item => (
                  <View key={item.id} style={styles.commissionItem}>
                    <View style={styles.commissionItemLeft}>
                      <Text style={styles.commissionItemIcon}>🔧</Text>
                      <View>
                        <Text style={styles.commissionItemLabel}>Job Commission</Text>
                        <Text style={styles.commissionItemDate}>
                          {new Date(item.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commissionItemAmount}>₹{item.amount}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pay CTA */}
            {(data?.totalPending ?? 0) > 0 && (
              <View style={styles.paySection}>
                <Text style={styles.paySectionTitle}>Complete Your Payment</Text>
                <Text style={styles.paySectionSubtitle}>
                  AptiFyx charges ₹20 per completed job as platform commission.
                  This enables us to maintain service quality and support.
                </Text>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handlePayAll}
                  disabled={paying}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.payBtnGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    {paying ? (
                      <ActivityIndicator color={Colors.textInverse} />
                    ) : (
                      <>
                        <Text style={styles.payBtnIcon}>💳</Text>
                        <Text style={styles.payBtnText}>Pay ₹{data?.totalPending} Now</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {isJobCompletion && (data?.canAcceptMoreJobs ?? true) && (
                  <TouchableOpacity
                    style={styles.payLaterBtn}
                    onPress={handlePayLater}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.payLaterBtnText}>Pay Later</Text>
                    <Text style={styles.payLaterBtnSub}>
                      ({remaining > 0 ? `${remaining} more jobs allowed` : 'Limit reached'})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {(data?.totalPending ?? 0) === 0 && (
              <View style={styles.allClear}>
                <Text style={styles.allClearIcon}>🎉</Text>
                <Text style={styles.allClearTitle}>All Clear!</Text>
                <Text style={styles.allClearSubtitle}>No pending commissions.</Text>
                <TouchableOpacity
                  style={styles.allClearBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.allClearBtnText}>Back to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.fontSizeMD, marginBottom: Spacing.md },
  headerContent: { alignItems: 'center' },
  headerIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  headerIconText: { fontSize: 36 },
  headerTitle: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, marginBottom: Spacing.xs },
  headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeSM, textAlign: 'center' },

  scrollContent: { padding: Spacing.lg },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1.5, ...Shadow.sm,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statAmount: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightExtraBold },
  statLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },

  limitWarning: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.error + '10', borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.error + '30', marginBottom: Spacing.md,
  },
  limitWarningIcon: { fontSize: 20 },
  limitWarningText: { flex: 1, color: Colors.error, fontSize: Typography.fontSizeSM, lineHeight: 20 },

  limitInfo: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primary + '08', borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '20', marginBottom: Spacing.md,
  },
  limitInfoIcon: { fontSize: 18 },
  limitInfoText: { flex: 1, color: Colors.primary, fontSize: Typography.fontSizeSM, lineHeight: 20 },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  commissionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  commissionItemLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  commissionItemIcon: { fontSize: 20 },
  commissionItemLabel: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium, color: Colors.text },
  commissionItemDate: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  commissionItemAmount: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.accent },

  paySection: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.md, marginBottom: Spacing.xl,
  },
  paySectionTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.xs },
  paySectionSubtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  payBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadow.primary },
  payBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16,
  },
  payBtnIcon: { fontSize: 22 },
  payBtnText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },
  payLaterBtn: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.full, paddingVertical: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  payLaterBtnText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium },
  payLaterBtnSub: { color: Colors.textMuted, fontSize: Typography.fontSizeXS },

  allClear: { alignItems: 'center', marginTop: Spacing.xxl, gap: Spacing.md },
  allClearIcon: { fontSize: 60 },
  allClearTitle: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold, color: Colors.success },
  allClearSubtitle: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  allClearBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 12, paddingHorizontal: Spacing.xxl, ...Shadow.primary,
  },
  allClearBtnText: { color: Colors.textInverse, fontWeight: Typography.fontWeightBold },
});

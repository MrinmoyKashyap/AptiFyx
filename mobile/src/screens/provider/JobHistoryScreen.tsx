import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { getProviderJobs } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

type JobRecord = {
  id: string;
  status: string;
  serviceName: string;
  address?: string;
  createdAt: string;
  completedAt?: string;
  customer: { name: string; phone: string };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  completed:  { label: 'Completed',  color: Colors.success, icon: '✅' },
  cancelled:  { label: 'Cancelled',  color: Colors.error,   icon: '✕'  },
  in_progress:{ label: 'In Progress',color: Colors.accent,  icon: '🔧' },
  accepted:   { label: 'Accepted',   color: Colors.primary, icon: '✓'  },
  broadcasting:{ label: 'Broadcast', color: Colors.textMuted,icon: '📢'},
};

export default function JobHistoryScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getProviderJobs();
      setJobs(res.data?.jobs ?? res.data ?? []);
    } catch {
      setError('Failed to load job history. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const completedCount = jobs.filter(j => j.status === 'completed').length;
  const cancelledCount = jobs.filter(j => j.status === 'cancelled').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job History</Text>
        <View style={styles.summaryRow}>
          <SummaryChip label="Completed" value={completedCount} color={Colors.success} />
          <SummaryChip label="Cancelled" value={cancelledCount} color={Colors.error} />
          <SummaryChip label="Total" value={jobs.length} color={Colors.primary} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadJobs()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadJobs(true)}
              tintColor={Colors.primary}
            />
          }
        >
          {jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptySubtitle}>Your completed jobs will appear here.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {jobs.map(job => {
                const cfg = STATUS_CONFIG[job.status] ?? { label: job.status, color: Colors.textMuted, icon: '•' };
                return (
                  <View key={job.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.serviceIcon}>{cfg.icon}</Text>
                        <View>
                          <Text style={styles.serviceName}>{job.serviceName}</Text>
                          <Text style={styles.customerName}>👤 {job.customer?.name}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>

                    {job.address && (
                      <View style={styles.addressRow}>
                        <Text style={styles.addressIcon}>📍</Text>
                        <Text style={styles.addressText} numberOfLines={1}>{job.address}</Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>{formatDate(job.createdAt)}</Text>
                      {job.status === 'completed' && (
                        <View style={styles.commissionBadge}>
                          <Text style={styles.commissionText}>₹20 commission</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 40 }} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.sm },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.fontSizeMD },
  headerTitle: {
    color: Colors.textInverse, fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold, marginBottom: Spacing.lg,
  },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryChip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryValue: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: Typography.fontSizeXS, marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { color: Colors.textMuted, marginTop: Spacing.md, fontSize: Typography.fontSizeMD },
  errorIcon: { fontSize: 40, marginBottom: Spacing.md },
  errorText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, paddingVertical: 12, paddingHorizontal: Spacing.xl,
  },
  retryText: { color: Colors.textInverse, fontWeight: Typography.fontWeightSemiBold },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, textAlign: 'center' },

  listContainer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    ...Shadow.md, borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  cardLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', flex: 1 },
  serviceIcon: { fontSize: 24 },
  serviceName: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },
  customerName: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8,
  },
  statusText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightSemiBold },
  addressRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: Spacing.sm },
  addressIcon: { fontSize: 13 },
  addressText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  commissionBadge: {
    backgroundColor: Colors.success + '15', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  commissionText: { fontSize: Typography.fontSizeXS, color: Colors.success, fontWeight: Typography.fontWeightMedium },
});

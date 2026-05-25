import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  StatusBar, SafeAreaView, Linking, Animated, Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { emitProviderAcceptJob, emitProviderCancelJob, getSocket } from '../../services/socket';
import { useJobStore } from '../../store/jobStore';
import { IncomingJobNotification } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { job: IncomingJobNotification } };
};

const ACCEPT_TIMEOUT = 30; // seconds to accept

export default function IncomingRequestScreen({ navigation, route }: Props) {
  const { job } = route.params;
  const { removeIncomingJob, canAcceptJobs } = useJobStore();

  const [countdown, setCountdown] = useState(ACCEPT_TIMEOUT);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    Vibration.vibrate([0, 400, 200, 400]);

    timerRef.current = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: ACCEPT_TIMEOUT * 1000,
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown === 0 && !hasNavigated.current) {
      hasNavigated.current = true;
      handleDecline();
    }
  }, [countdown]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('provider:job_accepted_confirm', (data: any) => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      navigation.replace('ProviderActiveJob', { jobData: data });
    });

    socket.on('provider:job_unavailable', () => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      removeIncomingJob(job.jobId);
      navigation.goBack();
    });

    return () => {
      socket.off('provider:job_accepted_confirm');
      socket.off('provider:job_unavailable');
    };
  }, []);

  const handleAcceptAndCall = () => {
    if (!canAcceptJobs) {
      Alert.alert(
        'Payment Required',
        'You have reached the maximum unpaid jobs limit. Please pay your commission first.',
        [
          { text: 'Pay Now', onPress: () => navigation.navigate('Commission') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    emitProviderAcceptJob(job.jobId);
    removeIncomingJob(job.jobId);
    // Navigation will happen via socket event 'provider:job_accepted_confirm'
  };

  const handleDecline = () => {
    removeIncomingJob(job.jobId);
    navigation.goBack();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradient}
      >
        {/* Timer bar */}
        <View style={styles.timerBarBg}>
          <Animated.View style={[styles.timerBarFill, { width: progressWidth }]} />
        </View>

        {/* Map preview */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: job.latitude,
              longitude: job.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: job.latitude, longitude: job.longitude }}>
              <View style={styles.jobMarker}>
                <Text style={styles.jobMarkerText}>📍</Text>
              </View>
            </Marker>
          </MapView>
          <LinearGradient
            colors={['transparent', 'rgba(15,23,42,0.9)']}
            style={styles.mapOverlay}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Notification header */}
          <View style={styles.notifHeader}>
            <View style={styles.notifBell}>
              <Text style={styles.notifBellText}>🔔</Text>
            </View>
            <Text style={styles.notifTitle}>New Job Request!</Text>
            <View style={styles.countdown}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          </View>

          {/* Job details */}
          <Animated.View style={[styles.jobCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.jobHeader}>
              <Text style={styles.serviceName}>{job.serviceName}</Text>
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceBadgeText}>📍 {job.distanceKm} km</Text>
              </View>
            </View>

            {job.address && (
              <View style={styles.addressRow}>
                <Text style={styles.addressIcon}>🏠</Text>
                <Text style={styles.addressText}>{job.address}</Text>
              </View>
            )}

            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>👤</Text>
              <Text style={styles.customerName}>Customer: {job.customerName}</Text>
            </View>

            <View style={styles.jobMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>💰</Text>
                <Text style={styles.metaText}>Discuss price on call</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⚡</Text>
                <Text style={styles.metaText}>Immediate request</Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptAndCall}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.success, '#059669']}
                style={styles.acceptBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.acceptBtnIcon}>📞</Text>
                <View>
                  <Text style={styles.acceptBtnTitle}>Accept & Call</Text>
                  <Text style={styles.acceptBtnSub}>You'll be connected immediately</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineBtn}
              onPress={handleDecline}
              activeOpacity={0.85}
            >
              <Text style={styles.declineBtnText}>✕  Skip Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },

  timerBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  timerBarFill: { height: 4, backgroundColor: Colors.accent },

  mapContainer: { height: 180, position: 'relative' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },

  content: { flex: 1, padding: Spacing.lg },

  notifHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  notifBell: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifBellText: { fontSize: 22 },
  notifTitle: { flex: 1, color: Colors.textInverse, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  countdown: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  countdownText: { color: Colors.textInverse, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeSM },

  jobCard: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  serviceName: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  distanceBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  distanceBadgeText: { color: Colors.textInverse, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  addressIcon: { fontSize: 16 },
  addressText: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: Typography.fontSizeSM, lineHeight: 20 },
  customerRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: Spacing.md },
  customerIcon: { fontSize: 16 },
  customerName: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium },
  jobMeta: { flexDirection: 'row', gap: Spacing.lg },
  metaItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaIcon: { fontSize: 14 },
  metaText: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeSM },

  actions: { gap: Spacing.md },
  acceptBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.primary },
  acceptBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg,
  },
  acceptBtnIcon: { fontSize: 32 },
  acceptBtnTitle: { color: Colors.textInverse, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  acceptBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: Typography.fontSizeSM },

  declineBtn: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl, paddingVertical: 14,
    alignItems: 'center',
  },
  declineBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium },

  jobMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  jobMarkerText: { fontSize: 20 },
});

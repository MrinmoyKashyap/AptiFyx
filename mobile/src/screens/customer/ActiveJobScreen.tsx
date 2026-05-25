import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  StatusBar, SafeAreaView, Linking, ScrollView,
  Animated, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { getSocket, emitCustomerCancelJob } from '../../services/socket';
import { useJobStore } from '../../store/jobStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      jobId: string;
      service: { name: string; icon: string; color: string; slug: string };
      otp: string;
      provider: {
        id: string; name: string; phone: string;
        rating: number; totalJobsDone: number;
        latitude?: number; longitude?: number;
      };
    };
  };
};

type JobPhase = 'accepted' | 'in_progress' | 'completed';

export default function ActiveJobScreen({ navigation, route }: Props) {
  const { jobId, service, otp, provider: initialProvider } = route.params;
  const { setActiveJob, setJobOtp } = useJobStore();

  const [phase, setPhase] = useState<JobPhase>('accepted');
  const [provider] = useState(initialProvider);
  const [otpDigits] = useState(otp.split(''));

  const otpRevealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(otpRevealAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('customer:job_completed', () => {
      setPhase('completed');
      setActiveJob(null);
      setJobOtp(null);
    });

    socket.on('provider:customer_cancelled', () => {
      setPhase('accepted');
    });

    return () => {
      socket.off('customer:job_completed');
      socket.off('provider:customer_cancelled');
    };
  }, []);

  const handleCallProvider = () => {
    Linking.openURL(`tel:${provider.phone}`);
  };

  const handleCancelJob = () => {
    Alert.alert(
      'Cancel Job?',
      'This will cancel the current job and you\'ll need to start over.',
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Cancel Job',
          style: 'destructive',
          onPress: () => {
            emitCustomerCancelJob(jobId);
            setActiveJob(null);
            setJobOtp(null);
            navigation.reset({ index: 0, routes: [{ name: 'CustomerApp' }] });
          },
        },
      ]
    );
  };

  const handleJobDone = () => {
    navigation.reset({ index: 0, routes: [{ name: 'CustomerApp' }] });
  };

  const providerCoords = provider.latitude && provider.longitude
    ? { latitude: provider.latitude, longitude: provider.longitude }
    : null;

  const defaultRegion = {
    latitude: 28.6139, longitude: 77.2090,
    latitudeDelta: 0.02, longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {phase === 'completed' ? (
        <CompletedView service={service} onDone={handleJobDone} />
      ) : (
        <>
          {/* Map */}
          {providerCoords && (
            <MapView
              style={styles.map}
              initialRegion={{ ...providerCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              showsUserLocation
            >
              <Marker coordinate={providerCoords} title={provider.name}>
                <View style={[styles.providerMarker, { backgroundColor: service.color }]}>
                  <Text style={styles.providerMarkerIcon}>{service.icon}</Text>
                </View>
              </Marker>
            </MapView>
          )}

          <ScrollView
            style={[styles.bottomSheet, !providerCoords && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Status badge */}
            <View style={[styles.statusBadge, {
              backgroundColor: phase === 'in_progress' ? Colors.success + '15' : Colors.accent + '15'
            }]}>
              <View style={[styles.statusDot, {
                backgroundColor: phase === 'in_progress' ? Colors.success : Colors.accent
              }]} />
              <Text style={[styles.statusText, {
                color: phase === 'in_progress' ? Colors.success : Colors.accent
              }]}>
                {phase === 'in_progress' ? 'Job In Progress' : 'Provider On the Way'}
              </Text>
            </View>

            {/* Provider card */}
            <View style={styles.providerCard}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerAvatarText}>
                  {provider.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <View style={styles.providerMeta}>
                  <Text style={styles.providerRating}>⭐ {provider.rating.toFixed(1)}</Text>
                  <Text style={styles.providerDot}>•</Text>
                  <Text style={styles.providerJobs}>{provider.totalJobsDone} jobs done</Text>
                </View>
              </View>
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagIcon}>{service.icon}</Text>
                <Text style={styles.serviceTagText}>{service.name}</Text>
              </View>
            </View>

            {/* Call button */}
            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCallProvider}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.success, '#059669']}
                style={styles.callBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.callBtnIcon}>📞</Text>
                <Text style={styles.callBtnText}>Call {provider.name.split(' ')[0]}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* OTP Card */}
            {phase === 'accepted' && (
              <Animated.View style={[styles.otpCard, { opacity: otpRevealAnim }]}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={styles.otpGradient}
                >
                  <Text style={styles.otpLabel}>Job Start OTP</Text>
                  <Text style={styles.otpHint}>
                    Share this with {provider.name.split(' ')[0]} to start the job
                  </Text>
                  <View style={styles.otpDigitsRow}>
                    {otpDigits.map((digit, i) => (
                      <View key={i} style={styles.otpDigitBox}>
                        <Text style={styles.otpDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.otpWarning}>🔒 Don't share until provider arrives</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Info card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>💡 What happens next?</Text>
              {phase === 'accepted' ? (
                <>
                  <InfoStep icon="📞" text={`${provider.name.split(' ')[0]} will call you to discuss the job and pricing`} />
                  <InfoStep icon="🔑" text="Share the OTP above to start the job officially" />
                  <InfoStep icon="✅" text="Provider will mark the job complete when done" />
                </>
              ) : (
                <>
                  <InfoStep icon="🔧" text="Work is in progress" />
                  <InfoStep icon="✅" text="Provider will confirm completion when done" />
                  <InfoStep icon="⭐" text="You'll be able to rate the experience after" />
                </>
              )}
            </View>

            {/* Cancel button */}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
              <Text style={styles.cancelBtnText}>✕ Cancel Job</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function InfoStep({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoStep}>
      <Text style={styles.infoStepIcon}>{icon}</Text>
      <Text style={styles.infoStepText}>{text}</Text>
    </View>
  );
}

function CompletedView({ service, onDone }: { service: any; onDone: () => void }) {
  return (
    <View style={styles.completedContainer}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.completedGradient}
      >
        <View style={styles.completedIcon}>
          <Text style={styles.completedIconText}>✅</Text>
        </View>
        <Text style={styles.completedTitle}>Job Completed!</Text>
        <Text style={styles.completedSubtitle}>
          Your {service.name.toLowerCase()} job has been completed successfully.
        </Text>
        <TouchableOpacity style={styles.completedBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.completedBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { height: 220 },

  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
    marginTop: -20, ...Shadow.lg,
  },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: Spacing.md,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },

  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  providerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  providerAvatarText: { color: Colors.textInverse, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  providerInfo: { flex: 1 },
  providerName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  providerRating: { fontSize: Typography.fontSizeSM, color: Colors.accent },
  providerDot: { color: Colors.textMuted },
  providerJobs: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  serviceTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  serviceTagIcon: { fontSize: 14 },
  serviceTagText: { fontSize: Typography.fontSizeXS, color: Colors.primary, fontWeight: Typography.fontWeightMedium },

  callBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md, ...Shadow.md },
  callBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
  callBtnIcon: { fontSize: 20 },
  callBtnText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  otpCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md, ...Shadow.primary },
  otpGradient: { padding: Spacing.xl, alignItems: 'center' },
  otpLabel: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, marginBottom: 4 },
  otpHint: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.fontSizeXS, textAlign: 'center', marginBottom: Spacing.lg },
  otpDigitsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  otpDigitBox: {
    width: 44, height: 54, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  otpDigitText: { color: Colors.textInverse, fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold },
  otpWarning: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSizeXS },

  infoCard: {
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  infoTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightSemiBold, color: Colors.text, marginBottom: Spacing.sm },
  infoStep: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  infoStepIcon: { fontSize: 16, width: 20 },
  infoStepText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },

  cancelBtn: {
    borderWidth: 1, borderColor: Colors.error + '40',
    borderRadius: BorderRadius.full, paddingVertical: 12,
    alignItems: 'center', backgroundColor: Colors.error + '05',
  },
  cancelBtnText: { color: Colors.error, fontWeight: Typography.fontWeightSemiBold },

  completedContainer: { flex: 1 },
  completedGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  completedIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completedIconText: { fontSize: 50 },
  completedTitle: {
    fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textInverse, marginBottom: Spacing.md,
  },
  completedSubtitle: {
    color: 'rgba(255,255,255,0.8)', fontSize: Typography.fontSizeMD,
    textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl,
  },
  completedBtn: {
    backgroundColor: Colors.textInverse, borderRadius: BorderRadius.full,
    paddingVertical: 14, paddingHorizontal: Spacing.xxl,
  },
  completedBtnText: { color: Colors.success, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  providerMarker: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.textInverse, ...Shadow.md,
  },
  providerMarkerIcon: { fontSize: 20 },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  StatusBar, SafeAreaView, ScrollView, Linking, PanResponder,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { emitProviderCancelJob, emitProviderCompleteJob, getSocket } from '../../services/socket';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      jobData: {
        jobId: string;
        customerName: string;
        customerPhone: string;
        latitude: number;
        longitude: number;
        address?: string;
        serviceName: string;
      };
    };
  };
};

const SLIDER_WIDTH = 280;
const KNOB_SIZE = 56;

export default function ProviderActiveJobScreen({ navigation, route }: Props) {
  const { jobData } = route.params;
  const [phase, setPhase] = useState<'active' | 'completing' | 'completed'>('active');
  const [sliderX] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);

  const handleCallCustomer = () => {
    Linking.openURL(`tel:${jobData.customerPhone}`);
  };

  const handleCancelJob = () => {
    Alert.alert(
      'Cancel Job?',
      'Are you sure you want to cancel this job? The customer will be notified.',
      [
        { text: 'Keep Job', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            emitProviderCancelJob(jobData.jobId);
            navigation.reset({ index: 0, routes: [{ name: 'ProviderApp' }] });
          },
        },
      ]
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setIsDragging(true),
      onPanResponderMove: (_, gesture) => {
        const maxX = SLIDER_WIDTH - KNOB_SIZE;
        const newX = Math.max(0, Math.min(gesture.dx, maxX));
        sliderX.setValue(newX);
      },
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false);
        const maxX = SLIDER_WIDTH - KNOB_SIZE;
        if (gesture.dx >= maxX * 0.85) {
          sliderX.setValue(maxX);
          setPhase('completing');
          // Complete the job
          emitProviderCompleteJob(jobData.jobId);

          // Listen for completion confirmation or navigate
          const socket = getSocket();
          if (socket) {
            socket.once('provider:job_completed', (data: any) => {
              setPhase('completed');
              navigation.navigate('CommissionPayment', {
                commissionDue: data.commissionDue,
                totalPending: data.totalPending,
                unpaidJobCount: data.unpaidJobCount,
                canAcceptMoreJobs: data.canAcceptMoreJobs,
                jobId: jobData.jobId,
              });
            });
          }
        } else {
          Animated.spring(sliderX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const knobBgColor = sliderX.interpolate({
    inputRange: [0, SLIDER_WIDTH - KNOB_SIZE],
    outputRange: [Colors.success, '#059669'],
    extrapolate: 'clamp',
  });

  const fillWidth = Animated.add(sliderX, KNOB_SIZE);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.success, '#059669']}
          style={styles.header}
        >
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Job In Progress</Text>
          </View>
          <Text style={styles.headerService}>{jobData.serviceName}</Text>
          <View style={styles.headerEarning}>
            <Text style={styles.headerEarningText}>💰 Discuss price with customer</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Customer Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {jobData.customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{jobData.customerName}</Text>
              <Text style={styles.customerPhone}>{jobData.customerPhone}</Text>
              {jobData.address && (
                <View style={styles.addressRow}>
                  <Text style={styles.addressIcon}>📍</Text>
                  <Text style={styles.addressText} numberOfLines={2}>{jobData.address}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Call Button */}
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallCustomer}
            activeOpacity={0.85}
          >
            <Text style={styles.callBtnIcon}>📞</Text>
            <Text style={styles.callBtnText}>Call Customer</Text>
          </TouchableOpacity>

          {/* Job checklist */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>📋 Job Checklist</Text>
            <CheckItem text="Arrive at customer's location" />
            <CheckItem text="Discuss job details and pricing" />
            <CheckItem text="Get OTP from customer to start" />
            <CheckItem text="Complete the work professionally" />
            <CheckItem text="Confirm completion with slide below" />
          </View>

          {/* Complete Slider */}
          <View style={styles.sliderSection}>
            <Text style={styles.sliderLabel}>
              {phase === 'completing' ? '⏳ Completing...' : '👉 Slide to mark job complete'}
            </Text>
            <View style={[styles.sliderTrack, { width: SLIDER_WIDTH }]}>
              {/* Fill */}
              <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
              {/* Track text */}
              <Text style={styles.sliderTrackText}>Slide to Complete →</Text>
              {/* Knob */}
              <Animated.View
                style={[
                  styles.sliderKnob,
                  { transform: [{ translateX: sliderX }], backgroundColor: knobBgColor },
                ]}
                {...(phase === 'active' ? panResponder.panHandlers : {})}
              >
                <Text style={styles.sliderKnobIcon}>✓</Text>
              </Animated.View>
            </View>
          </View>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
            <Text style={styles.cancelBtnText}>Cancel Job</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <View style={styles.checkItem}>
      <Text style={styles.checkIcon}>☐</Text>
      <Text style={styles.checkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textInverse },
  statusText: { color: Colors.textInverse, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
  headerService: { color: Colors.textInverse, fontSize: Typography.fontSize3XL, fontWeight: Typography.fontWeightExtraBold },
  headerEarning: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, marginTop: Spacing.sm,
  },
  headerEarningText: { color: Colors.textInverse, fontSize: Typography.fontSizeSM },

  content: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg,
    marginTop: -20, backgroundColor: Colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },

  customerCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    ...Shadow.md, borderWidth: 1, borderColor: Colors.border,
  },
  customerAvatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { color: Colors.textInverse, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  customerInfo: { flex: 1 },
  customerName: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },
  customerPhone: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: 6 },
  addressRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  addressIcon: { fontSize: 14 },
  addressText: { flex: 1, fontSize: Typography.fontSizeXS, color: Colors.textMuted, lineHeight: 16 },

  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: Colors.success,
    borderRadius: BorderRadius.full, paddingVertical: 14, marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  callBtnIcon: { fontSize: 22 },
  callBtnText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  checklistCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.xl, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  checklistTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.sm },
  checkItem: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  checkIcon: { fontSize: 16, color: Colors.textMuted },
  checkText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },

  sliderSection: { alignItems: 'center', marginBottom: Spacing.xl },
  sliderLabel: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, marginBottom: Spacing.md, fontWeight: Typography.fontWeightMedium },
  sliderTrack: {
    height: KNOB_SIZE + 8, borderRadius: (KNOB_SIZE + 8) / 2,
    backgroundColor: Colors.success + '20',
    borderWidth: 2, borderColor: Colors.success + '40',
    overflow: 'hidden', justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sliderFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: Colors.success + '30',
    borderRadius: (KNOB_SIZE + 8) / 2,
  },
  sliderTrackText: {
    position: 'absolute', alignSelf: 'center',
    color: Colors.success, fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  sliderKnob: {
    width: KNOB_SIZE, height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    margin: 4, ...Shadow.md,
  },
  sliderKnobIcon: { color: Colors.textInverse, fontSize: 24, fontWeight: Typography.fontWeightBold },

  cancelBtn: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.full, paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
});

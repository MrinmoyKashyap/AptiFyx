import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { verifyCustomerOtp, verifyProviderOtp, sendOtp } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { connectSocket } from '../../services/socket';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

type RegistrationData = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      phone: string;
      role: 'customer' | 'provider';
      otp?: string; // Dev mode
      registrationData?: RegistrationData;
    };
  };
};

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const { phone, role, otp: prefillOtp, registrationData } = route.params;

  const [code, setCode] = useState(prefillOtp || '');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);
  const { setAuth } = useAuthStore();

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      return Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
    }
    setLoading(true);
    try {
      let response;
      if (role === 'customer') {
        response = await verifyCustomerOtp({
          phone,
          otp: code,
          ...registrationData,
        });
      } else {
        response = await verifyProviderOtp({
          phone,
          otp: code,
          ...registrationData,
        });
      }

      const { token, user } = response.data;
      setAuth(token, role, user);

      // Connect socket
      connectSocket(token);

      // Navigate to appropriate home
      navigation.reset({
        index: 0,
        routes: [{ name: role === 'customer' ? 'CustomerApp' : 'ProviderApp' }],
      });
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.error || 'Invalid OTP. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendOtp(phone, role);
      setResendTimer(30);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  const maskedPhone = phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.primary, Colors.gradientEnd]}
        style={styles.topSection}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <View style={styles.topContent}>
          <View style={styles.otpIcon}>
            <Feather name="smartphone" size={32} color={Colors.textInverse} />
          </View>
          <Text style={styles.topTitle}>Verify OTP</Text>
          <Text style={styles.topSubtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>+91 {maskedPhone}</Text>
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.bottomSection}>
        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <View style={styles.otpBoxes}>
            {Array.from({ length: 6 }).map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.otpBox,
                  code.length > i && styles.otpBoxFilled,
                  code.length === i && styles.otpBoxActive,
                ]}
                onPress={() => inputRef.current?.focus()}
              >
                <Text style={styles.otpDigit}>{code[i] || ''}</Text>
                {code.length === i && <View style={styles.cursor} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dev mode hint */}
        {prefillOtp && (
          <View style={styles.devHint}>
            <Feather name="tool" size={14} color={Colors.accent} />
            <Text style={styles.devHintText}>Dev Mode — OTP: {prefillOtp}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, (loading || code.length < 6) && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || code.length < 6}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  topSection: { paddingBottom: 60 },
  backBtn: { padding: Spacing.md },
  topContent: { alignItems: 'center', paddingVertical: Spacing.xl },
  otpIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  topTitle: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textInverse, marginBottom: Spacing.sm,
  },
  topSubtitle: {
    textAlign: 'center', color: 'rgba(255,255,255,0.75)',
    fontSize: Typography.fontSizeMD, lineHeight: 24,
  },
  phoneHighlight: { color: Colors.textInverse, fontWeight: Typography.fontWeightBold },

  bottomSection: {
    flex: 1, backgroundColor: Colors.background,
    marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
    ...Shadow.lg,
  },

  otpContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  hiddenInput: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  otpBoxes: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 48, height: 58, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  otpBoxActive: { borderColor: Colors.primary, borderWidth: 2.5 },
  otpDigit: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold, color: Colors.text },
  cursor: {
    position: 'absolute', bottom: 10, width: 2, height: 20,
    backgroundColor: Colors.primary,
  },

  devHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    backgroundColor: Colors.accent + '10', borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.md,
  },
  devHintText: { color: Colors.accent, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },

  verifyBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, alignItems: 'center', ...Shadow.primary,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: {
    color: Colors.textInverse, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  resendText: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  resendTimer: { color: Colors.textMuted, fontSize: Typography.fontSizeSM },
  resendLink: { color: Colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
});

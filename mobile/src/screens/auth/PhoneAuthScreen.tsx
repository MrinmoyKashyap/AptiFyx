import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, StatusBar, SafeAreaView,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { sendOtp } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { mode: 'login' | 'register'; role: 'customer' | 'provider' } };
};

const SERVICES_LIST = [
  { slug: 'plumbing', name: 'Plumbing', icon: 'pipe-wrench' },
  { slug: 'electrician', name: 'Electrician', icon: 'lightning-bolt' },
  { slug: 'carpentry', name: 'Carpentry', icon: 'saw-blade' },
  { slug: 'cleaning', name: 'Cleaning', icon: 'broom' },
  { slug: 'painting', name: 'Painting', icon: 'format-paint' },
  { slug: 'ac_repair', name: 'AC Repair', icon: 'air-conditioner' },
  { slug: 'pest_control', name: 'Pest Control', icon: 'bug' },
  { slug: 'moving', name: 'Moving', icon: 'truck-fast' },
  { slug: 'appliance_repair', name: 'Appliance Repair', icon: 'power-plug' },
  { slug: 'gardening', name: 'Gardening', icon: 'leaf' },
];

export default function PhoneAuthScreen({ navigation, route }: Props) {
  const { mode, role } = route.params;
  const isRegister = mode === 'register';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby services.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      const [place] = await Location.reverseGeocodeAsync(location.coords);
      if (place) {
        const addr = [place.street, place.district, place.city, place.region]
          .filter(Boolean).join(', ');
        setAddress(addr);
      }
    } catch {
      Alert.alert('Error', 'Failed to get location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleService = (slug: string) => {
    setSelectedServices(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleContinue = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
    }
    if (isRegister && !name.trim()) {
      return Alert.alert('Required', 'Please enter your full name.');
    }
    if (isRegister && role === 'provider' && selectedServices.length === 0) {
      return Alert.alert('Required', 'Please select at least one service you provide.');
    }

    // Default to New Delhi if location wasn't detected so testing works
    const finalLat = coords?.latitude ?? 28.6139;
    const finalLng = coords?.longitude ?? 77.2090;

    setLoading(true);
    try {
      const response = await sendOtp(cleanPhone, role);
      const otp = response.data.otp; // Dev mode returns OTP

      navigation.navigate('OTPVerify', {
        phone: cleanPhone,
        role,
        otp, // prefill in dev
        registrationData: isRegister ? {
          name: name.trim(),
          address: address.trim(),
          latitude: finalLat,
          longitude: finalLng,
          services: selectedServices,
        } : undefined,
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isProvider = role === 'provider';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.roleBadge}>
                <Feather name={isProvider ? "tool" : "home"} size={14} color={Colors.primary} />
                <Text style={styles.roleBadgeText}>
                  {isProvider ? 'Service Partner' : 'Customer'}
                </Text>
              </View>
              <Text style={styles.title}>
                {isRegister ? 'Create Account' : 'Log In'}
              </Text>
              <Text style={styles.subtitle}>
                {isRegister
                  ? 'Enter your details to get started'
                  : 'Enter your phone to receive an OTP'}
              </Text>
            </View>

            {/* Phone Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Registration fields */}
            {isRegister && (
              <>
                <View style={styles.section}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    autoCapitalize="words"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your address"
                    multiline
                    numberOfLines={2}
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.detectBtn}
                    onPress={detectLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <Feather name="map-pin" size={14} color={Colors.primary} />
                        <Text style={styles.detectBtnText}>Detect My Location</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {coords && (
                    <Text style={styles.locationConfirmed}>
                      <Feather name="check-circle" size={12} color={Colors.success} /> Location detected
                    </Text>
                  )}
                </View>

                {/* Provider service selection */}
                {isProvider && (
                  <View style={styles.section}>
                    <Text style={styles.label}>Services You Provide *</Text>
                    <Text style={styles.sublabel}>Select all that apply</Text>
                    <View style={styles.servicesGrid}>
                      {SERVICES_LIST.map(service => {
                        const selected = selectedServices.includes(service.slug);
                        return (
                          <TouchableOpacity
                            key={service.slug}
                            style={[styles.serviceChip, selected && styles.serviceChipSelected]}
                            onPress={() => toggleService(service.slug)}
                          >
                            <MaterialCommunityIcons 
                              name={service.icon as any} 
                              size={16} 
                              color={selected ? Colors.primary : Colors.textSecondary} 
                            />
                            <Text style={[
                              styles.serviceChipText,
                              selected && styles.serviceChipTextSelected
                            ]}>
                              {service.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.continueBtnText}>Send OTP</Text>
                  <Feather name="arrow-right" size={20} color={Colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.otpNote}>
              You'll receive a 6-digit OTP on your mobile number
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { padding: Spacing.md, alignSelf: 'flex-start' },

  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.xl },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', backgroundColor: Colors.primaryLight + '20',
    borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.primaryLight + '40',
  },
  roleBadgeText: { color: Colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold },
  title: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.text, marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary },

  section: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold,
    color: Colors.text, marginBottom: 8,
  },
  sublabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginBottom: 10 },

  phoneInputRow: { flexDirection: 'row', gap: Spacing.sm },
  countryCode: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, justifyContent: 'center',
    ...Shadow.sm,
  },
  countryCodeText: { fontSize: Typography.fontSizeMD, color: Colors.text, fontWeight: Typography.fontWeightSemiBold },
  phoneInput: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: Typography.fontSizeLG, color: Colors.text, ...Shadow.sm,
  },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: Typography.fontSizeMD, color: Colors.text, ...Shadow.sm,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },

  detectBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.primary + '40',
    borderRadius: BorderRadius.md, backgroundColor: Colors.primary + '08',
    alignSelf: 'flex-start',
  },
  detectBtnText: { color: Colors.primary, fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightMedium },
  locationConfirmed: { color: Colors.success, fontSize: Typography.fontSizeXS, marginTop: 8 },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  serviceChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  serviceChipText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  serviceChipTextSelected: { color: Colors.primary },

  continueBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.md, ...Shadow.primary,
  },
  continueBtnDisabled: { opacity: 0.7 },
  continueBtnText: {
    color: Colors.textInverse, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },

  otpNote: {
    textAlign: 'center', color: Colors.textMuted,
    fontSize: Typography.fontSizeXS, marginTop: Spacing.md,
  },
});

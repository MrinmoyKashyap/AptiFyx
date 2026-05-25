import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background decorations */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Image 
                source={require('../../../assets/logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>AptiFyx</Text>
            <Text style={styles.logoTagline}>On-Demand Local Services</Text>
          </View>

          {/* Feature highlights */}
          <View style={styles.features}>
            <FeatureRow icon="toolbox-outline" text="100+ services at your fingertips" />
            <FeatureRow icon="map-marker-radius-outline" text="Find experts near you instantly" />
            <FeatureRow icon="shield-star-outline" text="Trusted, reviewed professionals" />
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('RoleSelection', { mode: 'login' })}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('RoleSelection', { mode: 'register' })}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <MaterialCommunityIcons name={icon as any} size={20} color={Colors.textInverse} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, width, height },

  circle1: {
    position: 'absolute', width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80, right: -80,
  },
  circle2: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 100, left: -60,
  },
  circle3: {
    position: 'absolute', width: 150, height: 150,
    borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.03)',
    top: height * 0.3, right: -40,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingTop: height * 0.12,
    paddingBottom: Spacing.xl,
  },

  logoContainer: { alignItems: 'center' },
  logoIcon: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.lg,
  },
  logoImage: { width: 64, height: 64 },
  logoText: {
    fontSize: Typography.fontSize4XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  logoTagline: {
    fontSize: Typography.fontSizeMD,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  features: { gap: Spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: {
    fontSize: Typography.fontSizeMD,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: Typography.fontWeightMedium,
  },

  buttonContainer: { gap: Spacing.sm },
  primaryButton: {
    backgroundColor: Colors.textInverse,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.md,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightSemiBold,
  },

  termsText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: Typography.fontSizeXS,
    lineHeight: 18,
  },
  termsLink: { color: 'rgba(255,255,255,0.8)', textDecorationLine: 'underline' },
});

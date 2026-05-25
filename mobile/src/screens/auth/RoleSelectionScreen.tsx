import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: { params: { mode: 'login' | 'register' } };
};

export default function RoleSelectionScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const title = mode === 'login' ? 'Welcome Back!' : 'Join AptiFyx';
  const subtitle = mode === 'login'
    ? 'Select how you\'d like to continue'
    : 'Choose your role to get started';

  const navigate = (role: 'customer' | 'provider') => {
    navigation.navigate('PhoneAuth', { mode, role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.cards}>
          {/* Customer Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => navigate('customer')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardIconBg}>
                <Feather name="home" size={28} color={Colors.textInverse} />
              </View>
              <Text style={styles.cardTitle}>Customer</Text>
              <Text style={styles.cardDescription}>
                Find and book trusted local service professionals in minutes
              </Text>
              <View style={styles.cardFeatures}>
                <ChipItem text="Browse Services" />
                <ChipItem text="Real-time Tracking" />
                <ChipItem text="Secure Payments" />
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>Get Help</Text>
                <Feather name="arrow-right" size={16} color={Colors.textInverse} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Provider Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => navigate('provider')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#18181B', '#27272A']} // Sleek dark grey/black for provider
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={[styles.cardIconBg, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Feather name="tool" size={28} color={Colors.textInverse} />
              </View>
              <Text style={styles.cardTitle}>Service Partner</Text>
              <Text style={styles.cardDescription}>
                Offer your expertise to local customers and grow your income
              </Text>
              <View style={styles.cardFeatures}>
                <ChipItem text="Set Your Rates" dark />
                <ChipItem text="Accept Jobs" dark />
                <ChipItem text="Track Earnings" dark />
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>Start Earning</Text>
                <Feather name="arrow-right" size={16} color={Colors.textInverse} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ChipItem({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <View style={[styles.chip, dark && styles.chipDark]}>
      <Text style={[styles.chipText, dark && styles.chipTextDark]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { padding: Spacing.md, alignSelf: 'flex-start' },

  content: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { marginBottom: Spacing.xl, marginTop: Spacing.sm },
  title: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
  },

  cards: { gap: Spacing.md },
  roleCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.lg },
  cardGradient: { padding: Spacing.xl },
  cardIconBg: {
    width: 60, height: 60, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.fontSizeSM,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.lg },
  cardArrow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  cardArrowText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeightSemiBold,
    fontSize: Typography.fontSizeMD,
  },

  chip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  chipText: { color: 'rgba(255,255,255,0.9)', fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightMedium },
  chipTextDark: { color: 'rgba(255,255,255,0.7)' },
});

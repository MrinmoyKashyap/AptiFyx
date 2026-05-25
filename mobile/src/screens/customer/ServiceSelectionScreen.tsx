import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useJobStore } from '../../store/jobStore';
import { getServices } from '../../services/api';
import { Service } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: { params?: { preselect?: Service } };
};

export default function ServiceSelectionScreen({ navigation, route }: Props) {
  const { services, setServices } = useJobStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const preselect = route?.params?.preselect;

  useEffect(() => {
    if (services.length === 0) {
      setLoading(true);
      getServices().then(r => setServices(r.data)).finally(() => setLoading(false));
    }
    if (preselect) {
      handleSelect(preselect);
    }
  }, []);

  const handleSelect = async (service: Service) => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        navigation.navigate('BroadcastMap', { service, location: null });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      const address = place
        ? [place.street, place.district, place.city].filter(Boolean).join(', ')
        : undefined;

      navigation.navigate('BroadcastMap', {
        service,
        location: { latitude: loc.coords.latitude, longitude: loc.coords.longitude, address },
      });
    } catch {
      navigation.navigate('BroadcastMap', { service, location: null });
    } finally {
      setLoading(false);
    }
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>What do you need?</Text>
        <Text style={styles.subtitle}>Choose a service to broadcast your request</Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search services..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {filtered.map((service) => (
              <TouchableOpacity
                key={service.slug}
                style={[styles.card, { borderTopColor: service.color }]}
                onPress={() => handleSelect(service)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconBg, { backgroundColor: service.color + '15' }]}>
                  <MaterialCommunityIcons name={service.icon as any} size={28} color={service.color} />
                </View>
                <Text style={styles.cardName}>{service.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.cardTap}>Tap to request</Text>
                  <Feather name="arrow-right" size={12} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Feather name="search" size={32} color={Colors.border} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No services found for "{search}"</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { marginBottom: Spacing.md },
  title: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightExtraBold, color: Colors.text },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.md },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: Typography.fontSizeMD, color: Colors.text },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium },

  scrollContent: { padding: Spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: {
    width: '48%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderTopWidth: 4, ...Shadow.sm,
  },
  iconBg: {
    width: 56, height: 56, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardName: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: 6 },
  cardTap: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.fontWeightMedium },

  empty: { alignItems: 'center', marginTop: Spacing.xxl },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
});

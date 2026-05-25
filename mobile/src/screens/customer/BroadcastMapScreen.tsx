import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  StatusBar, SafeAreaView, Animated, Easing, Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useJobStore } from '../../store/jobStore';
import { getSocket, emitCustomerBroadcastJob, emitCustomerCancelJob } from '../../services/socket';
import { Service } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      service: Service;
      location: { latitude: number; longitude: number; address?: string } | null;
    };
  };
};

const DEFAULT_LOCATION = { latitude: 28.6139, longitude: 77.2090 }; // New Delhi

export default function BroadcastMapScreen({ navigation, route }: Props) {
  const { service, location } = route.params;
  const { user } = useAuthStore();
  const { activeJob, setActiveJob, jobOtp, setJobOtp, broadcastRadius, providersNotified, setBroadcastStatus } = useJobStore();

  const [broadcasting, setBroadcasting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const radarLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const coords = location || DEFAULT_LOCATION;

  useEffect(() => {
    if (broadcasting) {
      startAnimations();
    }
  }, [broadcasting]);

  // Listen for socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('customer:job_created', ({ jobId: id }: { jobId: string }) => {
      setJobId(id);
      setBroadcasting(true);
    });

    socket.on('customer:broadcast_status', ({ radiusKm, providersNotified: notified }: { jobId: string; radiusKm: number; providersNotified: number }) => {
      setBroadcastStatus(radiusKm, notified);
    });

    socket.on('customer:provider_accepted', ({ otp, provider, jobId: id }: any) => {
      setBroadcasting(false);
      setJobOtp(otp);
      setActiveJob({ id, status: 'accepted', provider, ...coords } as any);
      navigation.replace('ActiveJob', { jobId: id, service, otp, provider });
    });

    socket.on('customer:provider_cancelled', () => {
      Alert.alert('Provider Cancelled', 'The provider cancelled. Re-broadcasting your request...');
      setBroadcasting(true);
    });

    return () => {
      socket.off('customer:job_created');
      socket.off('customer:broadcast_status');
      socket.off('customer:provider_accepted');
      socket.off('customer:provider_cancelled');
      if (pulseLoopRef.current) pulseLoopRef.current.stop();
      if (radarLoopRef.current) radarLoopRef.current.stop();
    };
  }, []);

  const startAnimations = () => {
    if (pulseLoopRef.current) pulseLoopRef.current.stop();
    if (radarLoopRef.current) radarLoopRef.current.stop();
    pulseAnim.setValue(1);
    radarAnim.setValue(0);

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();

    radarLoopRef.current = Animated.loop(
      Animated.timing(radarAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false })
    );
    radarLoopRef.current.start();
  };

  const handleBroadcast = () => {
    emitCustomerBroadcastJob({
      serviceSlug: service.slug,
      serviceName: service.name,
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: location?.address,
    });
    setBroadcasting(true);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request?',
      'This will cancel your broadcast. You will need to start over.',
      [
        { text: 'Keep Searching', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: () => {
            if (jobId) emitCustomerCancelJob(jobId);
            setBroadcasting(false);
            setJobId(null);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const radarScale = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1.8],
  });

  const radarOpacity = radarAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Broadcast radius circle */}
        {broadcasting && broadcastRadius > 0 && (
          <Circle
            center={coords}
            radius={broadcastRadius * 1000}
            fillColor="rgba(107, 33, 168, 0.08)"
            strokeColor="rgba(107, 33, 168, 0.3)"
            strokeWidth={2}
          />
        )}

        {/* User marker */}
        <Marker coordinate={coords} title="Your Location" description={`Looking for ${service.name}`}>
          <View style={styles.markerContainer}>
            <Animated.View style={[styles.markerPulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={[styles.marker, { backgroundColor: service.color }]}>
              <MaterialCommunityIcons name={service.icon as any} size={22} color={Colors.textInverse} />
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Top info bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarInner}>
          <TouchableOpacity onPress={() => !broadcasting && navigation.goBack()} style={styles.topBackBtn}>
            <Feather name="x" size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.serviceInfo}>
            <MaterialCommunityIcons name={service.icon as any} size={20} color={service.color} />
            <Text style={styles.serviceInfoName}>{service.name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* Bottom card */}
      <View style={styles.bottomCard}>
        {!broadcasting ? (
          <View style={styles.readyContent}>
            <Text style={styles.readyTitle}>Ready to find a {service.name} professional?</Text>
            {location?.address && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={Colors.primary} />
                <Text style={styles.locationText} numberOfLines={2}>{location.address}</Text>
              </View>
            )}
            <Text style={styles.readySubtitle}>
              Your request will be sent to nearby {service.name.toLowerCase()} providers
            </Text>
            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: service.color }]}
              onPress={handleBroadcast}
              activeOpacity={0.9}
            >
              <Feather name="radio" size={20} color={Colors.textInverse} style={{ marginRight: 8 }} />
              <Text style={styles.broadcastBtnText}>Broadcast Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.broadcastingContent}>
            {/* Animated radar */}
            <View style={[styles.radarContainer, { backgroundColor: service.color + '15', borderColor: service.color + '40' }]}>
              <Animated.View
                style={[
                  styles.radarRing,
                  { opacity: radarOpacity, transform: [{ scale: radarScale }], borderColor: service.color, backgroundColor: service.color + '20' },
                ]}
              />
              <View style={[styles.radarCenter, { backgroundColor: service.color }]}>
                <MaterialCommunityIcons name={service.icon as any} size={28} color={Colors.textInverse} />
              </View>
            </View>

            <View style={styles.broadcastingStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: service.color }]}>{broadcastRadius || '5'}</Text>
                <Text style={styles.statLabel}>km radius</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: Colors.success }]}>{providersNotified}</Text>
                <Text style={styles.statLabel}>notified</Text>
              </View>
            </View>

            <Text style={styles.broadcastingTitle}>Broadcasting Request</Text>
            <Text style={styles.broadcastingSubtitle}>
              Searching for available {service.name.toLowerCase()} providers nearby...
            </Text>

            <View style={styles.pulseDotsRow}>
              <PulseDot delay={0} color={service.color} />
              <PulseDot delay={300} color={service.color} />
              <PulseDot delay={600} color={service.color} />
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function PulseDot({ delay, color }: { delay: number, color: string }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.pulseDot, { opacity: anim, backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.lg, marginTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    ...Shadow.md,
  },
  topBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  serviceInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceInfoName: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },

  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(107, 33, 168, 0.2)',
  },
  marker: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.surface,
    ...Shadow.md,
  },

  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    ...Shadow.lg,
  },

  readyContent: { gap: Spacing.md },
  readyTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text },
  locationRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  locationText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  readySubtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
  broadcastBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    borderRadius: BorderRadius.full, paddingVertical: 16,
    ...Shadow.md, marginTop: Spacing.sm,
  },
  broadcastBtnText: { color: Colors.textInverse, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },

  broadcastingContent: { alignItems: 'center', gap: Spacing.md },
  radarContainer: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  radarRing: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2,
  },
  radarCenter: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  broadcastingStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  statNumber: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBold },
  statLabel: { fontSize: Typography.fontSizeXS, color: Colors.textMuted },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  broadcastingTitle: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold, color: Colors.text },
  broadcastingSubtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, textAlign: 'center' },
  pulseDotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },

  cancelBtn: {
    borderWidth: 1.5, borderColor: Colors.error,
    borderRadius: BorderRadius.full, paddingVertical: 12, paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  cancelBtnText: { color: Colors.error, fontWeight: Typography.fontWeightSemiBold, fontSize: Typography.fontSizeMD },
});

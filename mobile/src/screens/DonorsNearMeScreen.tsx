import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Circle, Marker } from 'react-native-maps';
import { fetchNearbyDonors } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme } from '../theme';
import type { Donor } from '../types';

const radiusOptions = [5, 10, 25, 50];

function fmtDistance(km?: number) {
  if (km == null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function DonorsNearMeScreen() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(10);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNearby = useCallback(async (nextRadius = radius) => {
    setLoading(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location required', 'Allow location access to find donors near you.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const nextPosition = { lat: current.coords.latitude, lng: current.coords.longitude };
      setPosition(nextPosition);

      const data = await fetchNearbyDonors(nextPosition.lat, nextPosition.lng, nextRadius * 1000);
      const enriched = (Array.isArray(data) ? data : []).map((donor) => {
        const coords = donor.location?.coordinates;
        if (!coords) return donor;
        return {
          ...donor,
          distance: haversine(nextPosition.lat, nextPosition.lng, coords[1], coords[0]),
        };
      });
      setDonors(enriched.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999)));
    } catch (error) {
      Alert.alert('Could not find nearby donors', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  const region = useMemo(() => {
    if (!position) return null;
    return {
      latitude: position.lat,
      longitude: position.lng,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [position]);

  function call(number?: string) {
    if (!number) {
      Alert.alert('No phone number', 'This donor has no contact number listed.');
      return;
    }
    Linking.openURL(`tel:${number}`);
  }

  function whatsapp(number?: string) {
    if (!number) {
      Alert.alert('No phone number', 'This donor has no WhatsApp number listed.');
      return;
    }
    Linking.openURL(`https://wa.me/${number.replace(/[^\d]/g, '')}`);
  }

  return (
    <Screen>
      <Header title="Donors near me" subtitle="Use Android location services to find nearby donors." />

      <View style={styles.radiusRow}>
        {radiusOptions.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setRadius(item);
              if (position) loadNearby(item);
            }}
            style={[styles.radius, radius === item && styles.radiusActive]}
          >
            <Text style={[styles.radiusText, radius === item && styles.radiusTextActive]}>{item} km</Text>
          </Pressable>
        ))}
      </View>

      <Button title={position ? 'Refresh nearby donors' : 'Find donors near me'} loading={loading} onPress={() => loadNearby()} />

      {loading ? <ActivityIndicator color={theme.colors.primary} size="large" /> : null}

      {region ? (
        <MapView style={styles.map} initialRegion={region} region={region}>
          <Marker coordinate={{ latitude: position!.lat, longitude: position!.lng }} title="You are here" pinColor={theme.colors.info} />
          <Circle
            center={{ latitude: position!.lat, longitude: position!.lng }}
            radius={radius * 1000}
            strokeColor="rgba(37, 99, 235, 0.45)"
            fillColor="rgba(37, 99, 235, 0.08)"
          />
          {donors.map((donor) => {
            const coords = donor.location?.coordinates;
            if (!coords) return null;
            return (
              <Marker
                key={donor._id}
                coordinate={{ latitude: coords[1], longitude: coords[0] }}
                title={`${donor.name} (${donor.bloodGroup})`}
                description={fmtDistance(donor.distance)}
                pinColor={donor.availability ? theme.colors.primary : theme.colors.muted}
              />
            );
          })}
        </MapView>
      ) : null}

      <View style={styles.list}>
        {donors.map((donor) => (
          <View key={donor._id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.name}>{donor.name}</Text>
              <Text style={styles.badge}>{donor.bloodGroup}</Text>
            </View>
            <Text style={styles.meta}>
              {fmtDistance(donor.distance)} away - {donor.availability ? 'Available' : 'Unavailable'}
            </Text>
            <View style={styles.actions}>
              <Button title="Call" variant="secondary" onPress={() => call(donor.contactNumber)} />
              <Button title="WhatsApp" variant="secondary" onPress={() => whatsapp(donor.contactNumber)} />
            </View>
          </View>
        ))}
        {position && donors.length === 0 && !loading ? (
          <Text style={styles.empty}>No donors found nearby. Try increasing the radius.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radius: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  radiusActive: {
    backgroundColor: theme.colors.primary,
  },
  radiusText: {
    color: theme.colors.muted,
    fontWeight: '900',
  },
  radiusTextActive: {
    color: '#fff',
  },
  map: {
    borderRadius: 20,
    height: 300,
    overflow: 'hidden',
    width: '100%',
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    gap: 10,
    padding: 16,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 12,
    color: theme.colors.primary,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  meta: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  empty: {
    color: theme.colors.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
});

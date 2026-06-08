import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { theme } from '../../theme';
import { TextField } from '../TextField';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  areaName: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationInputProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof LocationData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        onChange({
          ...value,
          address: `${place.name || ''} ${place.street || ''}`.trim(),
          city: place.city || '',
          state: place.region || '',
          zipCode: place.postalCode || '',
          areaName: place.district || '',
          latitude,
          longitude,
        });
      } else {
        onChange({
          ...value,
          address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error detecting location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Address</Text>
      <View style={styles.card}>
        <View style={styles.addressRow}>
           <Text style={styles.icon}>📍</Text>
           <View style={{ flex: 1 }}>
            <TextField
              label=""
              placeholder="Enter address..."
              value={value.address}
              onChangeText={(val) => updateField('address', val)}
              style={styles.addressInput}
            />
           </View>
           <TouchableOpacity onPress={detectLocation} disabled={loading}>
             {loading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.detectText}>Use my location</Text>}
           </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <TextField
              label="City"
              value={value.city}
              onChangeText={(val) => updateField('city', val)}
              style={styles.gridInput}
            />
          </View>
          <View style={styles.gridItem}>
            <TextField
              label="State"
              value={value.state}
              onChangeText={(val) => updateField('state', val)}
              style={styles.gridInput}
            />
          </View>
          <View style={styles.gridItem}>
            <TextField
              label="Zip"
              value={value.zipCode}
              onChangeText={(val) => updateField('zipCode', val)}
              style={styles.gridInput}
            />
          </View>
        </View>

        <View style={styles.status}>
           <View style={[styles.dot, value.latitude ? styles.dotActive : null]} />
           <Text style={styles.statusText}>{value.latitude ? 'Address Detected' : 'No GPS Signal'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 20,
  },
  addressInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  detectText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridItem: {
    flex: 1,
  },
  gridInput: {
    backgroundColor: theme.colors.surface,
    minHeight: 44,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.muted,
  },
  dotActive: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
});

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { createBloodRequest } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { bloodGroups, theme, urgencyColors } from '../theme';

const urgencyOptions = [
  { value: 'low', label: 'Normal' },
  { value: 'medium', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Emergency' },
] as const;

export function CreateRequestScreen() {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [patientName, setPatientName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location required', 'Allow location access or enter coordinates manually.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      if (!address) {
        const reverse = await Location.reverseGeocodeAsync(current.coords);
        const first = reverse[0];
        if (first) {
          setAddress([first.name, first.street, first.district].filter(Boolean).join(', '));
          setCity(first.city || first.subregion || '');
          setStateName(first.region || '');
          setZipCode(first.postalCode || '');
        }
      }
    } catch (error) {
      Alert.alert('Location error', error instanceof Error ? error.message : 'Could not read your location.');
    } finally {
      setLocating(false);
    }
  }

  async function submit() {
    if (!patientName.trim() || !hospitalName.trim() || !contactNumber.trim() || !requiredDate.trim()) {
      Alert.alert('Missing details', 'Patient, hospital, contact number, and required date are required.');
      return;
    }
    if (!coords) {
      Alert.alert('Location required', 'Use current location before posting this request.');
      return;
    }

    setLoading(true);
    try {
      await createBloodRequest({
        patientName: patientName.trim(),
        hospitalName: hospitalName.trim(),
        contactNumber: contactNumber.trim(),
        requiredDate: new Date(requiredDate).toISOString(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        bloodGroup,
        unitsRequired,
        urgency,
        notes: notes.trim() || undefined,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: address.trim(),
          city: city.trim(),
          state: stateName.trim(),
          zipCode: zipCode.trim(),
        },
      });
      Alert.alert('Request posted', 'LifeLink is notifying compatible donors.');
      setPatientName('');
      setHospitalName('');
      setContactNumber('');
      setRequiredDate('');
      setExpiresAt('');
      setNotes('');
    } catch (error) {
      Alert.alert('Could not create request', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Request blood" subtitle="Post an urgent request with native Android location support." />

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Blood group needed</Text>
        <View style={styles.grid}>
          {bloodGroups.map((group) => (
            <Pressable key={group} onPress={() => setBloodGroup(group)} style={[styles.choice, bloodGroup === group && styles.choiceActive]}>
              <Text style={[styles.choiceText, bloodGroup === group && styles.choiceTextActive]}>{group}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Urgency</Text>
        <View style={styles.grid}>
          {urgencyOptions.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setUrgency(item.value)}
              style={[
                styles.urgency,
                urgency === item.value && { borderColor: urgencyColors[item.value], backgroundColor: '#fff7f7' },
              ]}
            >
              <Text style={[styles.urgencyText, urgency === item.value && { color: urgencyColors[item.value] }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Units required</Text>
        <View style={styles.stepper}>
          <Button title="-" variant="secondary" onPress={() => setUnitsRequired((value) => Math.max(1, value - 1))} />
          <Text style={styles.units}>{unitsRequired}</Text>
          <Button title="+" variant="secondary" onPress={() => setUnitsRequired((value) => Math.min(20, value + 1))} />
        </View>
      </View>

      <View style={styles.card}>
        <TextField label="Patient name" value={patientName} onChangeText={setPatientName} placeholder="Patient name" />
        <TextField label="Hospital name" value={hospitalName} onChangeText={setHospitalName} placeholder="Hospital name" />
        <TextField label="Contact number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" placeholder="+91..." />
        <TextField label="Required date/time" value={requiredDate} onChangeText={setRequiredDate} placeholder="2026-06-07 18:30" />
        <TextField label="Expires at" value={expiresAt} onChangeText={setExpiresAt} placeholder="Optional: 2026-06-08 18:30" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Hospital location</Text>
        <Button title={coords ? 'Refresh current location' : 'Use current location'} loading={locating} variant="secondary" onPress={useCurrentLocation} />
        {coords ? <Text style={styles.locationText}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text> : null}
        <TextField label="Address" value={address} onChangeText={setAddress} placeholder="Hospital address" />
        <TextField label="City" value={city} onChangeText={setCity} placeholder="City" />
        <TextField label="State" value={stateName} onChangeText={setStateName} placeholder="State" />
        <TextField label="Zip code" value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" placeholder="Zip code" />
      </View>

      <View style={styles.card}>
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Ward number, instructions, or special needs" />
      </View>

      <Button title="Post blood request" loading={loading} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    gap: 14,
    padding: 16,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  choiceText: {
    color: theme.colors.text,
    fontWeight: '900',
  },
  choiceTextActive: {
    color: '#fff',
  },
  urgency: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 2,
    minWidth: 118,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  urgencyText: {
    color: theme.colors.muted,
    fontWeight: '900',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  units: {
    color: theme.colors.primary,
    fontSize: 42,
    fontWeight: '900',
    minWidth: 72,
    textAlign: 'center',
  },
  locationText: {
    color: theme.colors.info,
    fontWeight: '800',
    textAlign: 'center',
  },
});

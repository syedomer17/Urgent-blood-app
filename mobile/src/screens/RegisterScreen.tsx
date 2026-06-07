import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import type { AuthStackParamList } from '../navigation/types';
import { bloodGroups, theme } from '../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [role, setRole] = useState<'donor' | 'requester'>('donor');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Name, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        contactNumber: contactNumber.trim(),
        role,
        bloodGroup: role === 'donor' ? bloodGroup : undefined,
      });
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Create account" subtitle="Join as a donor or requester and start using LifeLink on Android." />

      <View style={styles.segment}>
        {(['donor', 'requester'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setRole(item)}
            style={[styles.segmentButton, role === item && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>
              {item === 'donor' ? 'Donor' : 'Requester'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Contact number"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
        placeholder="+91..."
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 6 characters" />

      {role === 'donor' ? (
        <View style={styles.groupWrap}>
          <Text style={styles.label}>Blood group</Text>
          <View style={styles.groups}>
            {bloodGroups.map((group) => (
              <Pressable
                key={group}
                onPress={() => setBloodGroup(group)}
                style={[styles.group, bloodGroup === group && styles.groupActive]}
              >
                <Text style={[styles.groupText, bloodGroup === group && styles.groupTextActive]}>{group}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Button title="Register" loading={loading} onPress={submit} />
      <Button title="Back to login" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.muted,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: '#fff',
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  groupWrap: {
    gap: 10,
  },
  groups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  groupText: {
    color: theme.colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  groupTextActive: {
    color: '#fff',
  },
});

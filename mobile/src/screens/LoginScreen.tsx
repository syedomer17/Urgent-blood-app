import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { useAuth } from '../auth/AuthProvider';
import { theme } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.hero}>
          <Text style={styles.brand}>LifeLink</Text>
          <Text style={styles.tagline}>Urgent blood support, now native on Android.</Text>
        </View>
        <View style={styles.card}>
          <Header title="Welcome back" subtitle="Sign in to manage requests, donors, and live alerts." />
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
          />
          <Button title="Login" loading={loading} onPress={submit} />
          <Button title="Create account" variant="ghost" onPress={() => navigation.navigate('Register')} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    gap: 8,
    padding: 28,
  },
  brand: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '900',
  },
  tagline: {
    color: '#fee2e2',
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    gap: 16,
    padding: 18,
  },
});

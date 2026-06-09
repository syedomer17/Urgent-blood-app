import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, LogIn, Mail, Lock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { TextField } from '../TextField';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthProvider';

interface LoginFormProps {
  onBack: () => void;
  onRegisterClick: () => void;
}

export function LoginForm({ onBack, onRegisterClick }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both email and password.',
      });
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'Successfully logged in.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error?.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.logoText}>LifeLink</Text>
        <Text style={styles.headerSub}>Empowering Donors, Saving Lives</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login</Text>
        
        <View style={styles.form}>
          <TextField
            label="Email Address"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            labelStyle={styles.label}
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            labelStyle={styles.label}
          />

          <Button 
            title="Access Account" 
            onPress={handleSubmit} 
            loading={loading}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />
        </View>

        <TouchableOpacity onPress={onRegisterClick} style={styles.footer}>
          <Text style={styles.footerText}>
            New to LifeLink? <Text style={styles.signUp}>Create Account</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    height: 56,
    borderRadius: 16,
    color: '#fff',
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loginButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  signUp: {
    color: '#fff',
    fontWeight: '800',
  },
});

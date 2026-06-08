import { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SplashView } from '../components/login/SplashView';
import { LoginForm } from '../components/login/LoginForm';
import { theme } from '../theme';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Background decoration (simulating the web's blur circles) */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      {showForm ? (
        <LoginForm 
          onBack={() => setShowForm(false)} 
          onRegisterClick={() => navigation.navigate('Register')}
        />
      ) : (
        <SplashView 
          onLoginClick={() => setShowForm(true)} 
          onRegisterClick={() => navigation.navigate('Register')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary, // Using primary as base
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -50,
    left: -100,
  },
  circle2: {
    width: 400,
    height: 400,
    bottom: -150,
    right: -150,
  },
});

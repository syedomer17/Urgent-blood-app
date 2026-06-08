import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Button } from '../Button';

interface SplashViewProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function SplashView({ onLoginClick, onRegisterClick }: SplashViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/blood.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>LifeLink</Text>
        <View style={styles.taglineRow}>
          <View style={styles.line} />
          <Text style={styles.tagline}>THE VITAL PULSE</Text>
          <View style={styles.line} />
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Save a Life,{'\n'}Donate Blood</Text>
        <Text style={styles.heroSub}>A real-time platform connecting donors and requesters in your area.</Text>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Get Started" 
          onPress={onRegisterClick} 
          style={styles.getStarted} 
          textStyle={styles.getStartedText}
        />
        <TouchableOpacity onPress={onLoginClick} style={styles.loginButton}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SECURE & VERIFIED PLATFORM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 70,
    height: 70,
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  line: {
    height: 1,
    width: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
  },
  heroSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  actions: {
    gap: 16,
  },
  getStarted: {
    backgroundColor: '#fff',
    minHeight: 64,
    borderRadius: 20,
  },
  getStartedText: {
    color: '#b71c1c',
  },
  loginButton: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
});

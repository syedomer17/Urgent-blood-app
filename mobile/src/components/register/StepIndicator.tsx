import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  label: string;
}

export function StepIndicator({ currentStep, totalSteps, label }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.steps}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.step,
              i + 1 === currentStep ? styles.activeStep : styles.inactiveStep,
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 24,
  },
  steps: {
    flexDirection: 'row',
    gap: 8,
  },
  step: {
    height: 4,
    borderRadius: 2,
    flex: 1,
  },
  activeStep: {
    backgroundColor: theme.colors.primary,
    flex: 2,
  },
  inactiveStep: {
    backgroundColor: theme.colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';

export type Role = 'donor' | 'requester' | 'hospital';

interface RoleToggleProps {
  value: Role;
  onChange: (value: Role) => void;
}

const roles: { key: Role; label: string; icon: string }[] = [
  { key: 'donor', label: 'Donor', icon: '❤️' },
  { key: 'requester', label: 'Requester', icon: '🆘' },
  { key: 'hospital', label: 'Hospital', icon: '🏥' },
];

export function RoleToggle({ value, onChange }: RoleToggleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Primary Role</Text>
      <View style={styles.container}>
        {roles.map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.button,
              value === key && styles.activeButton,
            ]}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.buttonText, value === key && styles.activeText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
  },
  activeButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  activeText: {
    color: theme.colors.primary,
  },
});

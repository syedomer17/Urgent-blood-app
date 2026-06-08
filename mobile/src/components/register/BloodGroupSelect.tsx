import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme, bloodGroups } from '../../theme';

interface BloodGroupSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function BloodGroupSelect({ value, onChange }: BloodGroupSelectProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Blood Group</Text>
      <View style={styles.groups}>
        {bloodGroups.map((group) => (
          <Pressable
            key={group}
            onPress={() => onChange(group)}
            style={[styles.group, value === group && styles.groupActive]}
          >
            <Text style={[styles.groupText, value === group && styles.groupTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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

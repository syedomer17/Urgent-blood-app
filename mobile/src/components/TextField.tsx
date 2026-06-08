import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View, type StyleProp, type TextStyle, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
}

export function TextField({ label, style, labelStyle, secureTextEntry, ...props }: TextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      <View style={styles.inputContainer}>
        <TextInput
          {...props}
          secureTextEntry={isSecure}
          placeholderTextColor="#98a2b3"
          style={[styles.input, style]}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.toggle} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.toggleText}>{isPasswordVisible ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  toggle: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 18,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { TextField } from '../TextField';

interface HospitalFieldsProps {
  hospitalName: string;
  onHospitalNameChange: (val: string) => void;
  registrationNumber: string;
  onRegistrationNumberChange: (val: string) => void;
  licenseNumber: string;
  onLicenseNumberChange: (val: string) => void;
  gstNumber: string;
  onGstNumberChange: (val: string) => void;
  hospitalAddress: string;
  onHospitalAddressChange: (val: string) => void;
  hospitalEmail: string;
  onHospitalEmailChange: (val: string) => void;
  hospitalPhone: string;
  onHospitalPhoneChange: (val: string) => void;
  documentName: string;
  onPickDocument: () => void;
}

export function HospitalFields(props: HospitalFieldsProps) {
  return (
    <View style={styles.container}>
      <TextField
        label="Hospital Name"
        placeholder="City General Hospital"
        value={props.hospitalName}
        onChangeText={props.onHospitalNameChange}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Reg. Number"
            placeholder="HOSP-12345"
            value={props.registrationNumber}
            onChangeText={props.onRegistrationNumberChange}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="License Number"
            placeholder="LIC-98765"
            value={props.licenseNumber}
            onChangeText={props.onLicenseNumberChange}
          />
        </View>
      </View>
      <TextField
        label="GST Number (Optional)"
        placeholder="22AAAAA0000A1Z5"
        value={props.gstNumber}
        onChangeText={props.onGstNumberChange}
      />
      <TextField
        label="Hospital Address"
        placeholder="123 Health St, City"
        value={props.hospitalAddress}
        onChangeText={props.onHospitalAddressChange}
        multiline
      />
      <TextField
        label="Hospital Email"
        placeholder="contact@hospital.com"
        value={props.hospitalEmail}
        onChangeText={props.onHospitalEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField
        label="Hospital Phone"
        placeholder="+1 (555) 000-0000"
        value={props.hospitalPhone}
        onChangeText={props.onHospitalPhoneChange}
        keyboardType="phone-pad"
      />

      <View style={styles.documentArea}>
        <Text style={styles.label}>Verification Document</Text>
        <TouchableOpacity style={styles.picker} onPress={props.onPickDocument}>
          <Text style={styles.pickerIcon}>📄</Text>
          <Text style={styles.pickerText}>
            {props.documentName || 'Select hospital document (PDF/Image)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  documentArea: {
    gap: 8,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  picker: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  pickerIcon: {
    fontSize: 24,
  },
  pickerText: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});

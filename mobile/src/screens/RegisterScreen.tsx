import { useState } from 'react';
import { Alert, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { RoleToggle, type Role } from '../components/register/RoleToggle';
import { BloodGroupSelect } from '../components/register/BloodGroupSelect';
import { StepIndicator } from '../components/register/StepIndicator';
import { HospitalFields } from '../components/register/HospitalFields';
import { LocationInput, type LocationData } from '../components/register/LocationInput';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, registerHospital } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Step 2 fields
  const [role, setRole] = useState<Role>('donor');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [location, setLocation] = useState<LocationData>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    areaName: '',
    latitude: null,
    longitude: null,
  });

  // Hospital fields
  const [hospitalName, setHospitalName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [document, setDocument] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [loading, setLoading] = useState(false);

  function handleNextStep() {
    if (!name.trim()) { Alert.alert('Error', 'Full name is required.'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Email address is required.'); return; }
    if (!password) { Alert.alert('Error', 'Password is required.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }

    setStep(2);
  }

  async function handlePickDocument() {
    // Note: Document picker requires expo-document-picker to be installed.
    // For now, we provide an informative alert.
    Alert.alert(
      'Document Selection',
      'Please select a verification document. (Note: Integration with expo-document-picker is recommended for production).',
      [
        {
          text: 'Mock Selection',
          onPress: () => setDocument({
            uri: 'file://mock/hospital-doc.pdf',
            name: 'hospital-doc.pdf',
            type: 'application/pdf',
          })
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  async function handleSubmit() {
    if (role === 'hospital') {
      if (!hospitalName.trim()) { Alert.alert('Error', 'Hospital name is required.'); return; }
      if (!registrationNumber.trim()) { Alert.alert('Error', 'Registration number is required.'); return; }
      if (!licenseNumber.trim()) { Alert.alert('Error', 'License number is required.'); return; }
      if (!hospitalAddress.trim()) { Alert.alert('Error', 'Hospital address is required.'); return; }
      if (!hospitalEmail.trim()) { Alert.alert('Error', 'Hospital email is required.'); return; }
      if (!hospitalPhone.trim()) { Alert.alert('Error', 'Hospital phone is required.'); return; }
      if (!document) { Alert.alert('Error', 'Please upload a hospital document.'); return; }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', email.trim());
        formData.append('password', password);
        formData.append('role', 'hospital');
        if (contactNumber.trim()) formData.append('contactNumber', contactNumber.trim());
        formData.append('hospitalName', hospitalName.trim());
        formData.append('registrationNumber', registrationNumber.trim());
        formData.append('licenseNumber', licenseNumber.trim());
        if (gstNumber.trim()) formData.append('gstNumber', gstNumber.trim());
        formData.append('hospitalAddress', hospitalAddress.trim());
        formData.append('hospitalEmail', hospitalEmail.trim());
        formData.append('hospitalPhone', hospitalPhone.trim());
        
        formData.append('document', {
          uri: document.uri,
          name: document.name,
          type: document.type,
        } as any);

        await registerHospital(formData);
        Alert.alert('Success', 'Hospital registered! Pending verification.');
      } catch (error: any) {
        Alert.alert('Registration failed', error?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (role === 'donor' && !bloodGroup) {
      Alert.alert('Error', 'Blood group is required for donors.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      contactNumber: contactNumber.trim(),
    };

    if (role === 'donor') payload.bloodGroup = bloodGroup;

    if (location.latitude !== null) {
      payload.location = {
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        areaName: location.areaName,
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    setLoading(true);
    try {
      await register(payload);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Registration failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={true}>
        <Header 
          title={step === 1 ? "Create account" : "Complete profile"} 
          subtitle={step === 1 ? "Start your journey as a life-saving hero today." : "Help us match you with those who need you most."} 
        />

        <StepIndicator 
          currentStep={step} 
          totalSteps={2} 
          label={step === 1 ? "Step 1: Account Details" : role === 'hospital' ? "Step 2: Hospital Verification" : "Step 2: Profile Details"}
        />

        {step === 1 ? (
          <View style={styles.form}>
            <TextField label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
            <TextField label="Email Address" placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
            <TextField label="Contact Number" placeholder="+1 (555) 000-0000" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
            
            <Button title="Continue" onPress={handleNextStep} style={styles.submit} />
            <Button title="Already have an account? Log In" variant="ghost" onPress={() => navigation.navigate('Login')} />
          </View>
        ) : (
          <View style={styles.form}>
            <RoleToggle value={role} onChange={setRole} />
            
            {role === 'hospital' ? (
              <HospitalFields 
                hospitalName={hospitalName} onHospitalNameChange={setHospitalName}
                registrationNumber={registrationNumber} onRegistrationNumberChange={setRegistrationNumber}
                licenseNumber={licenseNumber} onLicenseNumberChange={setLicenseNumber}
                gstNumber={gstNumber} onGstNumberChange={setGstNumber}
                hospitalAddress={hospitalAddress} onHospitalAddressChange={setHospitalAddress}
                hospitalEmail={hospitalEmail} onHospitalEmailChange={setHospitalEmail}
                hospitalPhone={hospitalPhone} onHospitalPhoneChange={setHospitalPhone}
                documentName={document?.name || ''} onPickDocument={handlePickDocument}
              />
            ) : (
              <>
                {role === 'donor' && <BloodGroupSelect value={bloodGroup} onChange={setBloodGroup} />}
                <LocationInput value={location} onChange={setLocation} />
              </>
            )}

            <View style={styles.actions}>
              <Button title={role === 'hospital' ? "Register Hospital" : "Create Account"} onPress={handleSubmit} loading={loading} style={styles.submit} />
              <Button title="Back" variant="secondary" onPress={() => setStep(1)} />
            </View>
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 20,
    paddingBottom: 40,
  },
  submit: {
    marginTop: 10,
  },
  actions: {
    gap: 12,
  }
});

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, ScrollView, Switch, Pressable } from 'react-native';
import { updateProfile } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { TextField } from '../components/TextField';
import { useAuth } from '../auth/AuthProvider';
import { theme } from '../theme';

function toDateInputValue(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function toDateTimeInputValue(value?: string) {
  return value ? value.slice(0, 16).replace('T', ' ') : '';
}

export function ProfileScreen() {
  const { user, logout, reloadProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(user?.dateOfBirth));
  const [weightKg, setWeightKg] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [medicalConditions, setMedicalConditions] = useState((user?.medicalConditions || []).join(', '));
  const [nextReminderAt, setNextReminderAt] = useState(toDateTimeInputValue(user?.nextReminderAt));
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(user?.reminderEnabled));

  async function confirmLogout() {
    Alert.alert('Logout', 'Sign out of LifeLink?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  const handleCancel = () => {
    setEditing(false);
    setName(user?.name || '');
    setBloodGroup(user?.bloodGroup || '');
    setContactNumber(user?.contactNumber || '');
    setDateOfBirth(toDateInputValue(user?.dateOfBirth));
    setWeightKg(user?.weightKg ? String(user.weightKg) : '');
    setMedicalConditions((user?.medicalConditions || []).join(', '));
    setNextReminderAt(toDateTimeInputValue(user?.nextReminderAt));
    setReminderEnabled(Boolean(user?.reminderEnabled));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (bloodGroup !== (user.bloodGroup || '')) body.bloodGroup = bloodGroup;
      if (contactNumber !== (user.contactNumber || '')) body.contactNumber = contactNumber;
      if (dateOfBirth !== toDateInputValue(user.dateOfBirth)) body.dateOfBirth = dateOfBirth || null;
      if (weightKg !== (user.weightKg ? String(user.weightKg) : '')) body.weightKg = weightKg ? Number(weightKg) : null;
      
      const medCondStr = (user.medicalConditions || []).join(', ');
      if (medicalConditions !== medCondStr) {
        body.medicalConditions = medicalConditions.split(',').map((i) => i.trim()).filter(Boolean);
      }
      
      if (nextReminderAt.replace(' ', 'T') !== toDateTimeInputValue(user.nextReminderAt).replace(' ', 'T')) {
        body.nextReminderAt = nextReminderAt ? new Date(nextReminderAt).toISOString() : null;
      }
      
      if (reminderEnabled !== Boolean(user.reminderEnabled)) body.reminderEnabled = reminderEnabled;

      if (Object.keys(body).length > 0) {
        await updateProfile(body);
        await reloadProfile();
        Alert.alert('Success', 'Profile updated successfully!');
      }
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={true}>
      <Header title="Profile" subtitle="Manage your LifeLink account settings." />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Account Details</Text>
          {!editing ? (
            <Pressable onPress={() => setEditing(true)}>
              <Text style={styles.editBtn}>Edit</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleCancel}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {!editing ? (
          <View style={styles.rows}>
            <ProfileRow label="Name" value={user?.name} />
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow label="Role" value={user?.role.toUpperCase()} />
            <ProfileRow label="Blood Group" value={user?.bloodGroup || '-'} />
            <ProfileRow label="Contact" value={user?.contactNumber || '-'} />
            {user?.role === 'donor' && (
              <>
                <ProfileRow label="Weight (kg)" value={user?.weightKg ? String(user.weightKg) : '-'} />
                <ProfileRow label="DOB" value={toDateInputValue(user?.dateOfBirth) || '-'} />
                <ProfileRow label="Medical" value={user?.medicalConditions?.length ? user.medicalConditions.join(', ') : 'None'} />
              </>
            )}
            <ProfileRow label="Location" value={user?.location?.city || user?.location?.address || '-'} />
            <ProfileRow label="Verified" value={user?.isVerified ? 'Yes' : 'No'} />
          </View>
        ) : (
          <View style={styles.form}>
            <TextField label="Full Name" value={name} onChangeText={setName} />
            <TextField label="Contact Number" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
            
            {user?.role === 'donor' && (
              <>
                <TextField label="Blood Group" value={bloodGroup} onChangeText={setBloodGroup} placeholder="e.g. O+" />
                <TextField label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
                <TextField label="Date of Birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />
                <TextField label="Medical Conditions (comma separated)" value={medicalConditions} onChangeText={setMedicalConditions} multiline />
                <TextField label="Next Reminder At (YYYY-MM-DD HH:mm)" value={nextReminderAt} onChangeText={setNextReminderAt} />
                
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Enable Reminders</Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primarySoft }}
                    thumbColor={reminderEnabled ? theme.colors.primary : '#f4f3f4'}
                  />
                </View>
              </>
            )}

            <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: 10 }} />
          </View>
        )}
      </View>

      {user?.role === 'donor' && !editing ? (
        <Button
          title={user.availability === false ? 'Turn availability on' : 'Turn availability off'}
          variant="secondary"
          onPress={async () => {
            try {
              await updateProfile({ availability: user.availability === false });
              await reloadProfile();
            } catch (error) {
              Alert.alert('Could not update availability', error instanceof Error ? error.message : 'Please try again.');
            }
          }}
        />
      ) : null}

      {!editing && (
        <>
          <Button title="Refresh Profile" variant="secondary" onPress={reloadProfile} />
          <Button title="Logout" onPress={confirmLogout} style={styles.logoutBtn} />
        </>
      )}
    </Screen>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    gap: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  editBtn: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  cancelBtn: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.muted,
  },
  rows: {
    gap: 12,
  },
  row: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  label: {
    color: theme.colors.muted,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: theme.colors.text,
    flex: 1,
    fontWeight: '800',
    textAlign: 'right',
  },
  form: {
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    marginTop: 20,
  },
});

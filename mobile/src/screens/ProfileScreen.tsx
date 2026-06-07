import { Alert, StyleSheet, Text, View } from 'react-native';
import { updateProfile } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useAuth } from '../auth/AuthProvider';
import { theme } from '../theme';

export function ProfileScreen() {
  const { user, logout, reloadProfile } = useAuth();

  async function confirmLogout() {
    Alert.alert('Logout', 'Sign out of LifeLink?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Screen>
      <Header title="Profile" subtitle="Your account details from the LifeLink backend." />

      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rows}>
          <ProfileRow label="Role" value={user?.role} />
          <ProfileRow label="Blood group" value={user?.bloodGroup || '-'} />
          <ProfileRow label="Contact" value={user?.contactNumber || '-'} />
          <ProfileRow label="Location" value={user?.location?.city || user?.location?.address || '-'} />
          <ProfileRow label="Verified" value={user?.isVerified ? 'Yes' : 'No'} />
        </View>
      </View>

      {user?.role === 'donor' ? (
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
      <Button title="Refresh profile" variant="secondary" onPress={reloadProfile} />
      <Button title="Logout" onPress={confirmLogout} />
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
  },
  name: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  email: {
    color: theme.colors.muted,
    fontWeight: '700',
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
  },
  value: {
    color: theme.colors.text,
    flex: 1,
    fontWeight: '900',
    textAlign: 'right',
  },
});

import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchAdminStats, fetchDonors, fetchMyRequests, fetchRequests } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useAuth } from '../auth/AuthProvider';
import { theme } from '../theme';
import type { AppTabParamList } from '../navigation/types';
import type { BloodRequest, Donor } from '../types';

function homeTitle(role?: string) {
  if (role === 'admin') return 'Admin dashboard';
  if (role === 'hospital') return 'Hospital dashboard';
  if (role === 'requester') return 'Requester dashboard';
  return 'Donor dashboard';
}

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

export function DashboardScreen({ navigation }: Props) {
  const { user, reloadProfile } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [adminStats, setAdminStats] = useState<Record<string, unknown> | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      if (user?.role === 'requester' || user?.role === 'hospital') {
        const data = await fetchMyRequests();
        setRequests(Array.isArray(data) ? data : data.requests || []);
      } else if (user?.role === 'admin') {
        const [stats, allRequests] = await Promise.all([fetchAdminStats(), fetchRequests()]);
        setAdminStats(stats);
        setRequests(Array.isArray(allRequests) ? allRequests : []);
      } else {
        const [allRequests, donorList] = await Promise.all([fetchRequests(), fetchDonors()]);
        setRequests(Array.isArray(allRequests) ? allRequests : []);
        setDonors(Array.isArray(donorList) ? donorList : []);
      }
    } catch (error) {
      Alert.alert('Dashboard error', error instanceof Error ? error.message : 'Could not load dashboard data.');
    }
  }, [user?.role]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const pending = requests.filter((request) => request.status === 'pending').length;
  const accepted = requests.filter((request) => request.status === 'accepted').length;
  const fulfilled = requests.filter((request) => request.status === 'fulfilled').length;
  const availableDonors = donors.filter((donor) => donor.availability).length;

  return (
    <Screen>
      <Header
        title={homeTitle(user?.role)}
        subtitle={`Hi ${user?.name ?? 'there'}, your LifeLink mobile workspace is ready.`}
      />

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.role === 'admin' ? String(adminStats?.activeRequests ?? pending) : pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.role === 'donor' ? (user?.availability === false ? 'Off' : 'On') : accepted}</Text>
          <Text style={styles.statLabel}>{user?.role === 'donor' ? 'Availability' : 'Accepted'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.role === 'donor' ? availableDonors : fulfilled}</Text>
          <Text style={styles.statLabel}>{user?.role === 'donor' ? 'Available donors' : 'Fulfilled'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <Text style={styles.body}>
          Access the same LifeLink flows from the React client: requests, donor search,
          nearby map, profile, and emergency request creation.
        </Text>
        <View style={styles.actions}>
          {(user?.role === 'requester' || user?.role === 'hospital' || user?.role === 'admin') ? (
            <Button title="New request" onPress={() => navigation.navigate('Create')} />
          ) : null}
          <Button title="Donors near me" variant="secondary" onPress={() => navigation.navigate('Nearby')} />
        </View>
      </View>

      <Button title="Refresh dashboard" variant="secondary" onPress={() => { reloadProfile(); loadDashboard(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    flex: 1,
    padding: 14,
  },
  statNumber: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    gap: 8,
    padding: 18,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});

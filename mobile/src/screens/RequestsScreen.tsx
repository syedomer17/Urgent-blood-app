import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchRequests } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme, urgencyColors } from '../theme';
import type { BloodRequest } from '../types';

const filters = ['all', 'pending', 'accepted', 'fulfilled', 'cancelled'] as const;

export function RequestsScreen() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load requests', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'all' ? requests : requests.filter((request) => request.status === filter);

  return (
    <Screen>
      <Header title="Blood requests" subtitle="Track active requests and urgency from the backend." />
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="large" />
      ) : (
        <View style={styles.list}>
          <Pressable onPress={load} style={styles.refresh}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
          {visible.map((request) => (
            <View key={request._id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.patient}>{request.patientName}</Text>
                <Text style={styles.blood}>{request.bloodGroup}</Text>
              </View>
              <Text style={styles.meta}>{request.unitsRequired} unit(s) - {request.status}</Text>
              <View style={styles.row}>
                <Text style={[styles.urgency, { color: urgencyColors[request.urgency] }]}>{request.urgency.toUpperCase()}</Text>
                <Text style={styles.city}>{request.location?.city || request.location?.address || 'Location pending'}</Text>
              </View>
            </View>
          ))}
          {visible.length === 0 ? <Text style={styles.empty}>No requests match this filter.</Text> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filter: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    gap: 12,
  },
  refresh: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    gap: 8,
    padding: 16,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  patient: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  blood: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 12,
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  meta: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  urgency: {
    fontSize: 12,
    fontWeight: '900',
  },
  city: {
    color: theme.colors.muted,
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
  },
  empty: {
    color: theme.colors.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
});

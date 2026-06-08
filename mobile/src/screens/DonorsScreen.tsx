import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchDonors } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { bloodGroups, theme } from '../theme';
import type { Donor } from '../types';

export function DonorsScreen() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [bloodFilter, setBloodFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchDonors();
      setDonors(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Could not load donors', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (bloodFilter === 'all' ? donors : donors.filter((donor) => donor.bloodGroup === bloodFilter)),
    [bloodFilter, donors],
  );

  return (
    <Screen>
      <Header title="Donors" subtitle="Browse registered donors with blood group and availability filters." />
      <View style={styles.groups}>
        {['all', ...bloodGroups].map((group) => (
          <Pressable key={group} onPress={() => setBloodFilter(group)} style={[styles.group, bloodFilter === group && styles.groupActive]}>
            <Text style={[styles.groupText, bloodFilter === group && styles.groupTextActive]}>{group}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} size="large" />
      ) : (
        <View style={styles.list}>
          {visible.map((donor) => (
            <View key={donor._id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{donor.bloodGroup}</Text>
              </View>
              <View style={styles.detail}>
                <Text style={styles.name}>{donor.name}</Text>
                <Text style={styles.meta}>
                  {donor.availability ? 'Available' : 'Unavailable'} - Rating {donor.trustRating?.toFixed?.(1) || '0.0'}
                </Text>
                <Text style={styles.meta}>{donor.location?.city || donor.location?.address || 'Location not set'}</Text>
              </View>
            </View>
          ))}
          {visible.length === 0 ? <Text style={styles.empty}>No donors found.</Text> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  groups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  groupActive: {
    backgroundColor: theme.colors.primary,
  },
  groupText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  groupTextActive: {
    color: '#fff',
  },
  list: {
    gap: 12,
  },
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  detail: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    color: theme.colors.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
});

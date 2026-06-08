import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { fetchMyRequests } from '../api/lifelink';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme } from '../theme';
import type { BloodRequest } from '../types';

export function RequesterDashboardScreen({ navigation }: any) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchMyRequests();
      const requestsList = Array.isArray(data) ? data : (data as any).requests || [];
      setRequests(requestsList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load your requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const pending = requests.filter((r) => r.status === 'pending').length;
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;

  const renderItem = ({ item }: { item: BloodRequest }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.bloodCircle}>
          <Text style={styles.bloodText}>{item.bloodGroup}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'pending' ? styles.statusPending : item.status === 'accepted' ? styles.statusAccepted : styles.statusFulfilled]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.metaText}>📍 {item.location?.city || item.location?.address || 'Location N/A'}</Text>
        <Text style={styles.metaText}>💉 {item.unitsRequired} Units Required</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title="Requester Panel" subtitle="Track your requests and manage donors." />

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate('Create')}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionLabel}>New Request</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => navigation.navigate('Nearby')}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionLabel}>Donors Near Me</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{pending}</Text>
          <Text style={styles.statLab}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: theme.colors.info }]}>{accepted}</Text>
          <Text style={styles.statLab}>Accepted</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: theme.colors.success }]}>{fulfilled}</Text>
          <Text style={styles.statLab}>Fulfilled</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>My Requests</Text>
      
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't made any requests yet.</Text>
            <Button title="Create First Request" onPress={() => navigation.navigate('Create')} variant="ghost" />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  statLab: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bloodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPending: { backgroundColor: '#fef3c7' },
  statusAccepted: { backgroundColor: '#dbeafe' },
  statusFulfilled: { backgroundColor: '#dcfce7' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  cardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 10,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 16,
    textAlign: 'center',
  },
});

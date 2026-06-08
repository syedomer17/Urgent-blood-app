import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { fetchMyRequests, fetchUserDonors } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme, bloodGroups } from '../theme';
import type { BloodRequest, Donor } from '../types';

type Tab = 'overview' | 'requests' | 'donors';

export function HospitalDashboardScreen() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bloodFilter, setBloodFilter] = useState<string>('all');

  const loadData = async () => {
    try {
      const [reqData, donorData] = await Promise.all([
        fetchMyRequests(),
        fetchUserDonors(),
      ]);
      
      const requestsList = Array.isArray(reqData) ? reqData : (reqData as any).requests || [];
      setRequests(requestsList);
      setDonors(donorData || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load hospital dashboard');
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

  const stats = useMemo(() => {
    const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;
    const successRate = requests.length > 0 ? Math.round((fulfilled / requests.length) * 100) : 0;
    const totalDonations = donors.reduce((sum, donor) => sum + (donor.totalDonations || 0), 0);
    
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      accepted: requests.filter((r) => r.status === 'accepted').length,
      fulfilled,
      total: requests.length,
      successRate,
      totalDonations,
    };
  }, [requests, donors]);

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => bloodFilter === 'all' || d.bloodGroup === bloodFilter);
  }, [donors, bloodFilter]);

  const inventory = useMemo(() => {
    return bloodGroups.map((group) => {
      const groupDonors = donors.filter((d) => d.bloodGroup === group);
      const available = groupDonors.filter((d) => d.availability).length;
      return { group, available };
    });
  }, [donors]);

  if (loading && !refreshing) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title="Hospital Panel" subtitle="Manage requests and track donors." />

      <View style={styles.tabBar}>
        {(['overview', 'requests', 'donors'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tab, activeTab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'overview' && (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.warning }]}>
              <Text style={styles.statVal}>{stats.pending}</Text>
              <Text style={styles.statLab}>Pending</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.info }]}>
              <Text style={styles.statVal}>{stats.accepted}</Text>
              <Text style={styles.statLab}>Accepted</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.success }]}>
              <Text style={styles.statVal}>{stats.fulfilled}</Text>
              <Text style={styles.statLab}>Fulfilled</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.primary }]}>
              <Text style={styles.statVal}>{stats.total}</Text>
              <Text style={styles.statLab}>Total</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.success }]}>
              <Text style={styles.statVal}>{stats.successRate}%</Text>
              <Text style={styles.statLab}>Success Rate</Text>
            </View>
            <View style={[styles.statBox, { borderLeftColor: theme.colors.info }]}>
              <Text style={styles.statVal}>{stats.totalDonations}</Text>
              <Text style={styles.statLab}>Donation Recs</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Donor Availability by Group</Text>
          <View style={styles.inventoryGrid}>
            {inventory.map((item) => (
              <View key={item.group} style={styles.inventoryCard}>
                <Text style={styles.invGroup}>{item.group}</Text>
                <Text style={[styles.invVal, item.available < 3 && styles.invLow]}>
                  {item.available} <Text style={styles.invSub}>Donors</Text>
                </Text>
                {item.available < 3 && <Text style={styles.lowTag}>LOW</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {activeTab === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.reqHeader}>
                <Text style={styles.reqPatient}>{item.patientName}</Text>
                <View style={[styles.statusBadge, 
                  item.status === 'pending' ? styles.statusPending : 
                  item.status === 'accepted' ? styles.statusAccepted : 
                  item.status === 'fulfilled' ? styles.statusFulfilled : 
                  styles.statusCancelled
                ]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.reqMeta}>{item.bloodGroup} • {item.unitsRequired} Units</Text>
              <Text style={styles.reqDate}>Required: {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests created yet.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'donors' && (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingRight: 20 }}>
            <Pressable 
              onPress={() => setBloodFilter('all')} 
              style={[styles.bloodChip, bloodFilter === 'all' && styles.bloodChipActive]}
            >
              <Text style={[styles.bloodChipText, bloodFilter === 'all' && styles.bloodChipTextActive]}>ALL</Text>
            </Pressable>
            {bloodGroups.map((bg) => (
              <Pressable 
                key={bg} 
                onPress={() => setBloodFilter(bg)} 
                style={[styles.bloodChip, bloodFilter === bg && styles.bloodChipActive]}
              >
                <Text style={[styles.bloodChipText, bloodFilter === bg && styles.bloodChipTextActive]}>{bg}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={filteredDonors}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <View style={styles.donorCard}>
                <View style={styles.donorAvatar}>
                  <Text style={styles.donorAvatarText}>{item.bloodGroup}</Text>
                </View>
                <View style={styles.donorInfo}>
                  <Text style={styles.donorName}>{item.name}</Text>
                  <Text style={styles.donorMeta}>{item.location?.city || item.location?.address || 'No location'}</Text>
                  <View style={styles.donorTags}>
                    <View style={[styles.tag, item.availability ? styles.tagSuccess : styles.tagMuted]}>
                      <Text style={styles.tagText}>{item.availability ? 'Available' : 'Unavailable'}</Text>
                    </View>
                    {item.trustRating && (
                      <View style={[styles.tag, styles.tagInfo]}>
                        <Text style={styles.tagText}>⭐ {item.trustRating}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No donors found matching criteria.</Text>}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statLab: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inventoryCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 4,
  },
  invGroup: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  invVal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  invSub: {
    fontSize: 10,
    color: theme.colors.muted,
  },
  invLow: {
    color: theme.colors.danger,
  },
  lowTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqPatient: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPending: { backgroundColor: '#fef3c7' },
  statusAccepted: { backgroundColor: '#dbeafe' },
  statusFulfilled: { backgroundColor: '#dcfce7' },
  statusCancelled: { backgroundColor: '#f3f4f6' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  reqMeta: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: 4,
  },
  reqDate: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 40,
  },
  bloodChip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bloodChipActive: {
    backgroundColor: theme.colors.primary,
  },
  bloodChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
  },
  bloodChipTextActive: {
    color: '#fff',
  },
  donorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 16,
  },
  donorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  donorAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  donorInfo: {
    flex: 1,
    gap: 2,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  donorMeta: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  donorTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagSuccess: { backgroundColor: '#dcfce7' },
  tagMuted: { backgroundColor: '#f3f4f6' },
  tagInfo: { backgroundColor: '#dbeafe' },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: 40,
    fontSize: 16,
  },
});

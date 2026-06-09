import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LayoutDashboard, ClipboardList, Users, ArrowUpRight, CheckCircle2, AlertCircle, Droplets, MapPin, Star, History } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load hospital dashboard',
      });
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
      <Header title="Hospital Hub" subtitle="Operations management" />

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('overview')} 
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
        >
          <LayoutDashboard size={18} color={activeTab === 'overview' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'overview' && styles.tabLabelActive]}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('requests')} 
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
        >
          <ClipboardList size={18} color={activeTab === 'requests' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('donors')} 
          style={[styles.tabItem, activeTab === 'donors' && styles.tabItemActive]}
        >
          <Users size={18} color={activeTab === 'donors' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'donors' && styles.tabLabelActive]}>Donors</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' && (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsGrid}>
            <StatBox label="Pending" value={stats.pending} color={theme.colors.warning} />
            <StatBox label="Accepted" value={stats.accepted} color={theme.colors.info} />
            <StatBox label="Fulfilled" value={stats.fulfilled} color={theme.colors.success} />
            <StatBox label="Efficiency" value={`${stats.successRate}%`} color={theme.colors.primary} />
          </View>

          <View style={styles.sectionHeader}>
            <Droplets size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Blood Inventory</Text>
          </View>
          <View style={styles.inventoryGrid}>
            {inventory.map((item) => (
              <View key={item.group} style={styles.inventoryCard}>
                <Text style={styles.invGroup}>{item.group}</Text>
                <Text style={[styles.invVal, item.available < 3 && styles.invLow]}>{item.available}</Text>
                <Text style={styles.invSub}>Ready</Text>
                {item.available < 3 && <View style={styles.lowBadge}><Text style={styles.lowBadgeText}>LOW</Text></View>}
              </View>
            ))}
          </View>

          <View style={{ height: 20 }} />
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqPatient}>{item.patientName}</Text>
                  <Text style={styles.reqMeta}>{item.bloodGroup} • {item.unitsRequired} Units</Text>
                </View>
                <View style={[styles.statusBadge, 
                  item.status === 'pending' ? styles.statusPending : 
                  item.status === 'accepted' ? styles.statusAccepted : 
                  item.status === 'fulfilled' ? styles.statusFulfilled : 
                  styles.statusCancelled
                ]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.reqFooter}>
                <History size={14} color={theme.colors.muted} />
                <Text style={styles.reqDate}>Requested: {item.requiredDate ? new Date(item.requiredDate).toLocaleDateString() : 'N/A'}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ClipboardList size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>No requests created yet.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'donors' && (
        <View style={{ flex: 1 }}>
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity 
                onPress={() => setBloodFilter('all')} 
                style={[styles.bloodChip, bloodFilter === 'all' && styles.bloodChipActive]}
              >
                <Text style={[styles.bloodChipText, bloodFilter === 'all' && styles.bloodChipTextActive]}>ALL</Text>
              </TouchableOpacity>
              {bloodGroups.map((bg) => (
                <TouchableOpacity 
                  key={bg} 
                  onPress={() => setBloodFilter(bg)} 
                  style={[styles.bloodChip, bloodFilter === bg && styles.bloodChipActive]}
                >
                  <Text style={[styles.bloodChipText, bloodFilter === bg && styles.bloodChipTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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
                  <View style={styles.donorLocation}>
                    <MapPin size={12} color={theme.colors.muted} />
                    <Text style={styles.donorMeta}>{item.location?.city || item.location?.address || 'No location'}</Text>
                  </View>
                  <View style={styles.donorTags}>
                    <View style={[styles.tag, item.availability ? styles.tagSuccess : styles.tagMuted]}>
                      <Text style={[styles.tagText, { color: item.availability ? '#166534' : '#64748b' }]}>
                        {item.availability ? 'Available' : 'Busy'}
                      </Text>
                    </View>
                    {item.trustRating && (
                      <View style={[styles.tag, styles.tagInfo]}>
                        <Star size={10} color="#1e40af" />
                        <Text style={[styles.tagText, { color: '#1e40af' }]}>{item.trustRating}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ArrowUpRight size={20} color={theme.colors.border} />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={48} color={theme.colors.border} />
                <Text style={styles.emptyText}>No donors found matching criteria.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </Screen>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLab}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 6,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  tabLabelActive: {
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 5,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statLab: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inventoryCard: {
    width: '23%',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  invGroup: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  invVal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  invSub: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  invLow: {
    color: theme.colors.danger,
  },
  lowBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reqPatient: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusPending: { backgroundColor: '#fef3c7' },
  statusAccepted: { backgroundColor: '#dbeafe' },
  statusFulfilled: { backgroundColor: '#dcfce7' },
  statusCancelled: { backgroundColor: '#f3f4f6' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reqMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    marginTop: 4,
  },
  reqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
  },
  reqDate: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
  },
  bloodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bloodChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 16,
  },
  donorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  donorAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  donorLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  donorMeta: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  donorTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagSuccess: { backgroundColor: '#dcfce7' },
  tagMuted: { backgroundColor: '#f1f5f9' },
  tagInfo: { backgroundColor: '#dbeafe' },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'center',
  },
});

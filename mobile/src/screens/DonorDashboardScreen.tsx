import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, History as HistoryIcon, Trophy, Heart, Shield, Award, MapPin, ChevronRight, Activity } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fetchDonationHistory, fetchLeaderboard, fetchRequests } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { useAuth } from '../auth/AuthProvider';
import { theme } from '../theme';
import { canDonateTo } from '../utils/bloodCompatibility';
import type { AppTabParamList } from '../navigation/types';
import type { BloodRequest, DonationHistoryItem, DonorLeaderboardEntry } from '../types';

type Tab = 'dashboard' | 'history' | 'rankings';

export function DonorDashboardScreen({ navigation }: BottomTabScreenProps<AppTabParamList, 'Home'>) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [history, setHistory] = useState<DonationHistoryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<DonorLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [reqData, historyData, rankingsData] = await Promise.all([
        fetchRequests(),
        fetchDonationHistory(),
        fetchLeaderboard(),
      ]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setHistory(historyData || []);
      setLeaderboard(rankingsData || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to sync dashboard data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const compatibleRequests = useMemo(() => {
    if (!user?.bloodGroup) return requests.filter(r => r.status === 'pending');
    return requests.filter(r => r.status === 'pending' && canDonateTo(user.bloodGroup!, r.bloodGroup));
  }, [requests, user?.bloodGroup]);

  const myRank = useMemo(() => {
    return leaderboard.find(l => l.donorId === user?._id);
  }, [leaderboard, user?._id]);

  if (loading && !refreshing) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header
        title="Donor Hub"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Hero'}`}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('dashboard')} 
          style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
        >
          <LayoutDashboard size={18} color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('history')} 
          style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
        >
          <HistoryIcon size={18} color={activeTab === 'history' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>Past</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('rankings')} 
          style={[styles.tabItem, activeTab === 'rankings' && styles.tabItemActive]}
        >
          <Trophy size={18} color={activeTab === 'rankings' ? theme.colors.primary : theme.colors.muted} />
          <Text style={[styles.tabLabel, activeTab === 'rankings' && styles.tabLabelActive]}>Top</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dashboard' && (
        <FlatList
          data={compatibleRequests.slice(0, 10)}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.requestCard}
              onPress={() => navigation.navigate('Requests')}
            >
              <View style={styles.bloodAvatar}>
                <Text style={styles.bloodText}>{item.bloodGroup}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.reqTitle}>{item.patientName}</Text>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={theme.colors.muted} />
                  <Text style={styles.reqSub}>{item.location?.city || 'Urgent Location'}</Text>
                </View>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: item.urgency === 'critical' ? '#fee2e2' : theme.colors.primary + '10' }]}>
                 <Text style={[styles.urgencyText, { color: item.urgency === 'critical' ? '#ef4444' : theme.colors.primary }]}>{item.urgency.toUpperCase()}</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.border} />
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              <View style={styles.impactSection}>
                 <View style={styles.impactCard}>
                    <Heart size={20} color={theme.colors.primary} />
                    <Text style={styles.impactVal}>{user?.totalDonations || 0}</Text>
                    <Text style={styles.impactLab}>Lives Saved</Text>
                 </View>
                 <View style={[styles.impactCard, { backgroundColor: theme.colors.primary }]}>
                    <Award size={20} color="#fff" />
                    <Text style={[styles.impactVal, { color: '#fff' }]}>{myRank?.rank ? `#${myRank.rank}` : 'N/A'}</Text>
                    <Text style={[styles.impactLab, { color: 'rgba(255,255,255,0.8)' }]}>Global Rank</Text>
                 </View>
              </View>
              
              <View style={styles.statusBox}>
                <View style={styles.statusHeader}>
                  <Shield size={16} color={user?.availability ? theme.colors.success : theme.colors.muted} />
                  <Text style={styles.statusLabel}>Donor Status</Text>
                </View>
                <View style={[styles.statusIndicator, user?.availability ? styles.statusActive : styles.statusInactive]}>
                  <View style={[styles.statusDot, { backgroundColor: user?.availability ? theme.colors.success : theme.colors.muted }]} />
                  <Text style={styles.statusText}>{user?.availability ? 'Available for matches' : 'Currently Offline'}</Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Activity size={18} color={theme.colors.text} />
                <Text style={styles.sectionTitle}>Nearby Compatible Needs</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Heart size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySub}>We'll alert you when someone needs your blood type.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'history' && (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.historyDate}>{new Date(item.donationDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={styles.historyUnits}>{item.unitsDonated} Units Donated</Text>
                </View>
                <View style={styles.historyStatusBadge}>
                  <Text style={styles.historyStatusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <HistoryIcon size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>No history yet</Text>
              <Text style={styles.emptySub}>Your impact journey starts with your first donation.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'rankings' && (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.donorId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={[styles.rankCard, item.donorId === user?._id && styles.rankCardMe]}>
              <View style={styles.rankNumContainer}>
                <Text style={[styles.rankNum, item.rank <= 3 && styles.rankTop]}>{item.rank}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.name} {item.donorId === user?._id ? '(You)' : ''}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.rankBadge}>{item.badge || 'PRO DONOR'}</Text>
                </View>
              </View>
              <View style={styles.rankStats}>
                <Text style={styles.rankVal}>{item.totalDonations}</Text>
                <Text style={styles.rankLab}>SAVED</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Trophy size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>Ranking Hero...</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
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
  headerComponent: {
    marginBottom: 10,
  },
  impactSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  impactCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  impactVal: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  impactLab: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  statusBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  statusActive: {
    backgroundColor: '#f0fdf4',
  },
  statusInactive: {
    backgroundColor: '#f8fafc',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '800',
    fontSize: 14,
    color: theme.colors.text,
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
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bloodAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  bloodText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  reqSub: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  historyUnits: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  historyStatusBadge: {
    backgroundColor: theme.colors.success + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.success,
  },
  historyNotes: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: 12,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  rankCardMe: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05',
  },
  rankNumContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankNum: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.muted,
  },
  rankTop: {
    color: theme.colors.primary,
    fontSize: 22,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  badgeContainer: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  rankBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  rankStats: {
    alignItems: 'center',
  },
  rankVal: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
  },
  rankLab: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

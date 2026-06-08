import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { fetchDonationHistory, fetchLeaderboard, fetchRequests } from '../api/lifelink';
import { Button } from '../components/Button';
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
      console.error(error);
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
        title="Donor Dashboard"
        subtitle={`Hi ${user?.name ?? 'hero'}, ready to save lives today?`}
      />

      <View style={styles.tabBar}>
        {(['dashboard', 'history', 'rankings'] as Tab[]).map((t) => (
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

      {activeTab === 'dashboard' && (
        <FlatList
          data={compatibleRequests.slice(0, 10)}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{item.bloodGroup}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqTitle}>{item.patientName}</Text>
                <Text style={styles.reqSub}>{item.location?.city || 'Urgent Location'}</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: theme.colors.primarySoft }]}>
                 <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <>
              <View style={styles.impactGrid}>
                 <View style={styles.impactCard}>
                    <Text style={styles.impactVal}>{user?.totalDonations || 0}</Text>
                    <Text style={styles.impactLab}>Total Donations</Text>
                 </View>
                 <View style={[styles.impactCard, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.impactVal, { color: '#fff' }]}>{myRank?.rank ? `#${myRank.rank}` : '-'}</Text>
                    <Text style={[styles.impactLab, { color: 'rgba(255,255,255,0.7)' }]}>Global Rank</Text>
                 </View>
              </View>
              
              <View style={styles.statusSection}>
                <Text style={styles.statusLabel}>My Availability</Text>
                <View style={[styles.statusToggle, user?.availability ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{user?.availability ? 'Online - Receiving Alerts' : 'Offline - Not visible'}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Compatible Requests ({compatibleRequests.length})</Text>
            </>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No compatible requests in your area.</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
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
                <Text style={styles.historyDate}>{new Date(item.donationDate).toLocaleDateString()}</Text>
                <Text style={styles.historyUnits}>{item.unitsDonated} Units</Text>
              </View>
              <Text style={styles.historyNotes}>{item.notes || 'Routine donation completed.'}</Text>
              <View style={styles.historyStatus}>
                <View style={styles.dot} />
                <Text style={styles.historyStatusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't made any donations yet.</Text>}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'rankings' && (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.donorId}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={[styles.rankCard, item.donorId === user?._id && styles.rankCardMe]}>
              <Text style={styles.rankNum}>{item.rank}</Text>
              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.name} {item.donorId === user?._id ? '(You)' : ''}</Text>
                <Text style={styles.rankBadge}>{item.badge}</Text>
              </View>
              <View style={styles.rankStats}>
                <Text style={styles.rankVal}>{item.totalDonations}</Text>
                <Text style={styles.rankLab}>DONATIONS</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Leaderboard is being updated...</Text>}
          contentContainerStyle={styles.listContent}
        />
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
  impactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
  },
  impactVal: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  impactLab: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statusSection: {
    marginBottom: 24,
    gap: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  statusToggle: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  statusInactive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  statusText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  bloodBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  reqSub: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  historyUnits: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  historyNotes: {
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 18,
    marginBottom: 12,
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.success,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  rankCardMe: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  rankNum: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.muted,
    width: 30,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  rankBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
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
    fontWeight: '800',
    color: theme.colors.muted,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: 40,
    fontSize: 16,
  },
});

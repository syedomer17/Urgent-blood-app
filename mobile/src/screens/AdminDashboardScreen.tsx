import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { fetchAdminStats, fetchAdminReports } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme } from '../theme';
import type { AdminStats, AdminReports } from '../types';

export function AdminDashboardScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminReports(),
      ]);
      setStats(statsData);
      setReports(reportsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load admin data');
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

  if (loading && !refreshing) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title="Admin Panel" subtitle="Platform-wide stats and activity." />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Key Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Donors" value={stats?.totalDonors || 0} icon="👥" color="#3b82f6" />
          <StatCard label="Active Requests" value={stats?.activeRequests || 0} icon="🆘" color="#ef4444" />
          <StatCard label="Completed" value={stats?.completedDonations || 0} icon="✅" color="#10b981" />
          <StatCard label="Emergency" value={stats?.emergencyRequests || 0} icon="🔥" color="#f59e0b" />
        </View>

        {/* Blood Group Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blood Group Distribution</Text>
          <View style={styles.distributionContainer}>
            {stats?.bloodGroupDistribution.map((item) => (
              <View key={item._id} style={styles.distRow}>
                <Text style={styles.distLabel}>{item._id}</Text>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${Math.min((item.count / (stats.totalDonors || 1)) * 100, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.distValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hospital Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hospital Activity</Text>
          {reports?.hospitalActivity.map((h) => (
            <View key={h._id} style={styles.hospitalCard}>
              <Text style={styles.hospitalId} numberOfLines={1}>{h._id}</Text>
              <View style={styles.hospitalStats}>
                <View style={styles.hospitalStatItem}>
                  <Text style={styles.hStatVal}>{h.totalRequests}</Text>
                  <Text style={styles.hStatLab}>Requests</Text>
                </View>
                <View style={styles.hospitalStatItem}>
                  <Text style={[styles.hStatVal, { color: theme.colors.success }]}>{h.fulfilledRequests}</Text>
                  <Text style={styles.hStatLab}>Fulfilled</Text>
                </View>
                <View style={styles.hospitalStatItem}>
                  <Text style={[styles.hStatVal, { color: theme.colors.danger }]}>{h.cancelledRequests}</Text>
                  <Text style={styles.hStatLab}>Cancelled</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  distributionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distLabel: {
    width: 35,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  distValue: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    textAlign: 'right',
  },
  hospitalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hospitalId: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
    marginBottom: 12,
  },
  hospitalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hospitalStatItem: {
    alignItems: 'center',
  },
  hStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  hStatLab: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
});

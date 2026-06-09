import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Users, Activity, CheckCircle, Flame, AlertTriangle, TrendingUp, BarChart3, Clock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load admin data',
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
        title="Analytics" 
        subtitle="Real-time platform oversight" 
        rightElement={
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Activity size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Insights */}
        <View style={styles.statsGrid}>
          <StatCard 
            label="Total Donors" 
            value={stats?.totalDonors || 0} 
            icon={<Users size={20} color="#3b82f6" />} 
            color="#3b82f6" 
          />
          <StatCard 
            label="Active Requests" 
            value={stats?.activeRequests || 0} 
            icon={<AlertTriangle size={20} color="#ef4444" />} 
            color="#ef4444" 
          />
          <StatCard 
            label="Fulfilled" 
            value={stats?.completedDonations || 0} 
            icon={<CheckCircle size={20} color="#10b981" />} 
            color="#10b981" 
          />
          <StatCard 
            label="Emergency" 
            value={stats?.emergencyRequests || 0} 
            icon={<Flame size={20} color="#f59e0b" />} 
            color="#f59e0b" 
          />
        </View>

        {/* Average Response Time */}
        {stats?.averageResponseTimeMinutes && (
          <View style={styles.insightCard}>
            <View style={styles.insightIconBg}>
              <Clock size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightLabel}>Avg. Response Time</Text>
              <Text style={styles.insightValue}>{stats.averageResponseTimeMinutes} Minutes</Text>
            </View>
            <TrendingUp size={24} color={theme.colors.success} />
          </View>
        )}

        {/* Blood Group Distribution */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Blood Inventory</Text>
          </View>
          <View style={styles.distributionContainer}>
            {stats?.bloodGroupDistribution.map((item, index) => (
              <View key={item._id} style={[styles.distRow, index === 0 ? { marginTop: 0 } : {}]}>
                <View style={styles.distLabelContainer}>
                  <Text style={styles.distLabel}>{item._id}</Text>
                </View>
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

        {/* Hospital Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Hospital Partners</Text>
          </View>
          {reports?.hospitalActivity.map((h) => (
            <View key={h._id} style={styles.hospitalCard}>
              <View style={styles.hospitalHeader}>
                <Text style={styles.hospitalId} numberOfLines={1}>{h._id}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              </View>
              <View style={styles.hospitalStats}>
                <View style={styles.hospitalStatItem}>
                  <Text style={styles.hStatVal}>{h.totalRequests}</Text>
                  <Text style={styles.hStatLab}>Requests</Text>
                </View>
                <View style={styles.hospitalStatSeparator} />
                <View style={styles.hospitalStatItem}>
                  <Text style={[styles.hStatVal, { color: theme.colors.success }]}>{h.fulfilledRequests}</Text>
                  <Text style={styles.hStatLab}>Fulfilled</Text>
                </View>
                <View style={styles.hospitalStatSeparator} />
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

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 16,
  },
  insightIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
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
  distributionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  distLabelContainer: {
    width: 40,
  },
  distLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  distValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'right',
  },
  hospitalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hospitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalId: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.success,
    textTransform: 'uppercase',
  },
  hospitalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hospitalStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  hospitalStatSeparator: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },
  hStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  hStatLab: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});

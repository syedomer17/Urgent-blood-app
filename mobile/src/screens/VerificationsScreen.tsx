import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { ShieldCheck, UserCheck, XCircle, Info, Filter, Search } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fetchVerifications, handleVerification } from '../api/lifelink';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { theme } from '../theme';
import type { User } from '../types';

type RoleFilter = 'all' | 'hospital' | 'requester' | 'donor';

export function VerificationsScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('hospital');

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await fetchVerifications();
      setUsers(data || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load pending verifications',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const visibleUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    Alert.alert(
      action === 'approve' ? 'Approve Verification' : 'Reject Verification',
      `Are you sure you want to ${action} this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'approve' ? 'Approve' : 'Reject', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await handleVerification(id, action);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Verification ${action}d successfully`,
              });
              loadPending();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Action failed. Please try again.',
              });
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>

      {item.verification?.aiConfidence ? (
        <View style={[styles.aiInsight, item.verification.aiSuggestedVerified ? styles.aiSuccess : styles.aiWarning]}>
          <ShieldCheck size={14} color={item.verification.aiSuggestedVerified ? '#166534' : '#92400e'} />
          <Text style={[styles.aiText, { color: item.verification.aiSuggestedVerified ? '#166534' : '#92400e' }]}>
            AI Confidence: {item.verification.aiConfidence}%
          </Text>
        </View>
      ) : null}

      {item.role === 'hospital' && item.hospitalDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Info size={14} color={theme.colors.muted} />
            <Text style={styles.detailText}>
              <Text style={{ fontWeight: '700' }}>Hospital:</Text> {item.hospitalDetails.hospitalName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Info size={14} color={theme.colors.muted} />
            <Text style={styles.detailText}>
              <Text style={{ fontWeight: '700' }}>Reg No:</Text> {item.hospitalDetails.registrationNumber}
            </Text>
          </View>
        </View>
      )}

      {item.verification?.aiDetails ? (
        <View style={styles.aiDetailsBox}>
          <Text style={styles.aiDetailsTitle}>AI Analysis Output</Text>
          <Text style={styles.aiDetailsText}>{item.verification.aiDetails}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleAction(item._id, 'approve')}
          activeOpacity={0.8}
        >
          <UserCheck size={18} color="#fff" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleAction(item._id, 'reject')}
          activeOpacity={0.8}
        >
          <XCircle size={18} color="#fff" />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen scroll={false}>
      <Header 
        title="Pending Verify" 
        subtitle="Manage user credibility" 
      />

      <View style={styles.container}>
        <View style={styles.filterSection}>
          <View style={styles.filterIconContainer}>
            <Filter size={18} color={theme.colors.muted} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(['all', 'hospital', 'donor', 'requester'] as RoleFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setRoleFilter(f)}
                style={[styles.filterChip, roleFilter === f && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, roleFilter === f && styles.filterChipTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading && users.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Fetching pending users...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShieldCheck size={48} color={theme.colors.border} />
                <Text style={styles.emptyText}>All caught up!</Text>
                <Text style={styles.emptySubtext}>No pending verifications for this role.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            onRefresh={loadPending}
            refreshing={loading}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterIconContainer: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    marginRight: 12,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  email: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  aiInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  aiSuccess: {
    backgroundColor: '#dcfce7',
  },
  aiWarning: {
    backgroundColor: '#fef3c7',
  },
  aiText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsContainer: {
    backgroundColor: theme.colors.background,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
  },
  aiDetailsBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: 20,
  },
  aiDetailsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  aiDetailsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: theme.colors.success,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: theme.colors.danger,
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
});

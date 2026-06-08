import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
      Alert.alert('Error', 'Failed to load pending verifications');
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
    try {
      if (action === 'reject') {
        Alert.prompt(
          'Rejection Reason',
          'Enter a reason for rejection (optional)',
          async (reason) => {
            await handleVerification(id, action, reason);
            Alert.alert('Success', 'Verification rejected');
            loadPending();
          }
        );
      } else {
        await handleVerification(id, action);
        Alert.alert('Success', 'Verification approved');
        loadPending();
      }
    } catch (error) {
      Alert.alert('Error', 'Action failed');
    }
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.roleTag}>{item.role.toUpperCase()}</Text>
        </View>
        {item.verification?.aiConfidence ? (
          <View style={[styles.aiBadge, item.verification.aiSuggestedVerified ? styles.aiSuccess : styles.aiWarning]}>
            <Text style={styles.aiText}>AI: {item.verification.aiConfidence}%</Text>
          </View>
        ) : null}
      </View>

      {item.role === 'hospital' && item.hospitalDetails && (
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Hospital: <Text style={styles.detailValue}>{item.hospitalDetails.hospitalName}</Text></Text>
          <Text style={styles.detailLabel}>Reg No: <Text style={styles.detailValue}>{item.hospitalDetails.registrationNumber}</Text></Text>
        </View>
      )}

      {item.verification?.aiDetails ? (
        <View style={styles.aiDetailsBox}>
          <Text style={styles.aiDetailsTitle}>AI Analysis:</Text>
          <Text style={styles.aiDetailsText} numberOfLines={3}>{item.verification.aiDetails}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleAction(item._id, 'approve')}
        >
          <Text style={styles.approveBtnText}>Approve</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleAction(item._id, 'reject')}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen>
      <Header title="Verifications" subtitle="Approve or reject pending accounts." />

      <View style={styles.filterContainer}>
        {(['all', 'hospital', 'donor', 'requester'] as RoleFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setRoleFilter(f)}
            style={[styles.filterBtn, roleFilter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, roleFilter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending verifications for this role.</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={loadPending}
          refreshing={loading}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  email: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.primary,
    marginTop: 4,
    letterSpacing: 1,
  },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiSuccess: {
    backgroundColor: '#dcfce7',
  },
  aiWarning: {
    backgroundColor: '#fef3c7',
  },
  aiText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  details: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  detailValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  aiDetailsBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#cbd5e1',
    marginBottom: 16,
  },
  aiDetailsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
  },
  aiDetailsText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: theme.colors.success,
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  rejectBtn: {
    backgroundColor: theme.colors.danger,
  },
  rejectBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: 40,
    fontSize: 16,
  },
});

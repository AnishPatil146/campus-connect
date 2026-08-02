import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Header } from '../../components/ui/Header';
import { Activity, Clock, Shield, CheckCircle2, AlertCircle, Filter } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../store/useAuthStore';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  module?: string;
  details?: string;
  ipAddress?: string;
}

export const ActivityHistoryScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const modules = ['ALL', 'auth', 'attendance', 'payments', 'notes', 'library', 'courses', 'chat'];

  const fetchHistory = async () => {
    try {
      const moduleParam = selectedModule === 'ALL' ? '' : `&module=${selectedModule}`;
      const response = await apiClient.get(`/users/${user?.id || 'me'}/history?limit=30${moduleParam}`);
      if (response.data?.data) {
        setLogs(response.data.data);
      }
    } catch (err) {
      // Offline / fallback activity timeline mock
      setLogs([
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          userId: user?.id || 'usr-1',
          userName: user?.name || 'CurrentUser',
          role: user?.role || 'STUDENT',
          action: 'Log In to Workspace',
          module: 'auth',
          details: 'Authenticated via JWT bearer session',
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: user?.id || 'usr-1',
          userName: user?.name || 'CurrentUser',
          role: user?.role || 'STUDENT',
          action: 'Viewed Attendance',
          module: 'attendance',
          details: 'Subject-wise attendance percentage checked',
        },
        {
          id: 'log-3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: user?.id || 'usr-1',
          userName: user?.name || 'CurrentUser',
          role: user?.role || 'STUDENT',
          action: 'Initiated Fee Payment',
          module: 'payments',
          details: 'Razorpay payment initiated for Spring Term 2026',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    // Listen for real-time Socket.IO audit logs
    const handleNewAuditLog = (newLog: ActivityLogItem) => {
      if (newLog && (newLog.userId === user?.id || user?.role === 'ADMIN')) {
        setLogs((prevLogs) => [newLog, ...prevLogs]);
      }
    };

    socketService.on('audit:log', handleNewAuditLog);

    return () => {
      socketService.off('audit:log', handleNewAuditLog);
    };
  }, [user, selectedModule]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const getModuleBadgeVariant = (mod?: string) => {
    switch (mod) {
      case 'auth': return 'primary';
      case 'attendance': return 'success';
      case 'payments': return 'warning';
      case 'notes': return 'info';
      default: return 'primary';
    }
  };

  const renderLogItem = ({ item }: { item: ActivityLogItem }) => {
    const formattedDate = new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <GlassCard variant="outlined" style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.actionRow}>
            <Activity size={16} color={colors.primary} />
            <Text style={styles.actionTitle}>{item.action}</Text>
          </View>
          <Badge label={(item.module || 'GENERAL').toUpperCase()} variant={getModuleBadgeVariant(item.module)} />
        </View>

        {item.details && <Text style={styles.detailsText}>{item.details}</Text>}

        <View style={styles.logFooter}>
          <View style={styles.metaRow}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>

          <View style={styles.metaRow}>
            <Shield size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {item.userName} ({item.role})
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Activity & Audit History" subtitle="Real-time log of user operations across all modules" />

      {/* Module Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={modules}
          keyExtractor={(m) => m}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedModule(item)}
              style={[styles.filterChip, selectedModule === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedModule === item && styles.filterTextActive]}>
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <LoadingSpinner message="Fetching user activity trail..." />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AlertCircle size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Activity Logs Found</Text>
              <Text style={styles.emptySubtitle}>Perform actions in the app to record your activity trail.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  filterContainer: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgDark,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.textWhite,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  logCard: {
    padding: spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  detailsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

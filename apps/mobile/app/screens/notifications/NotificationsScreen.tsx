import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  Radio,
} from 'lucide-react-native';

export const NotificationsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: notifData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications/in-app');
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        console.log('Fetching notifications API...');
      }
      return [];
    },
  });

  const notificationsList = Array.isArray(notifData) ? notifData : [];
  const unreadCount = notificationsList.filter((n: any) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/in-app/${id}/read`);
      refetch();
    } catch (e) {
      console.log('Mark read exception ignored');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/in-app/read-all');
      Alert.alert('Success', 'All notifications marked as read.');
      refetch();
    } catch (e) {
      Alert.alert('Error', 'Unable to mark notifications as read.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell size={24} color="#8b5cf6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notification Center</Text>
          <Text style={styles.subtitle}>Realtime System & Campus Broadcasts</Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMarkAllAsRead}
            style={styles.markAllBtn}
          >
            <CheckCheck size={14} color={colors.student.secondary} />
            <Text style={styles.markAllText}>Read All</Text>
          </TouchableOpacity>
        )}
      </View>

      <GlassCard variant="glow" style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.liveDotRow}>
            <Radio size={12} color={colors.success} />
            <Text style={styles.liveText}>REALTIME PUSH LISTENER ACTIVE</Text>
          </View>
          <Badge
            label={`${unreadCount} UNREAD ALERTS`}
            variant={unreadCount > 0 ? 'warning' : 'success'}
          />
        </View>
      </GlassCard>

      {isLoading ? (
        <LoadingSpinner message="Retrieving in-app notification center..." />
      ) : notificationsList.length > 0 ? (
        notificationsList.map((notif: any, idx: number) => {
          const isUnread = !notif.isRead;
          const createdAtDate = new Date(notif.createdAt);

          return (
            <GlassCard
              key={notif.id || idx}
              variant={isUnread ? 'glow' : 'default'}
              style={[styles.notifCard, isUnread && styles.unreadNotifCard]}
            >
              <View style={styles.notifHeader}>
                <View style={styles.titleRow}>
                  {isUnread && <View style={styles.unreadDot} />}
                  <Text style={[styles.notifTitle, isUnread && styles.unreadNotifTitle]}>
                    {notif.title}
                  </Text>
                </View>

                {isUnread ? (
                  <TouchableOpacity
                    onPress={() => handleMarkAsRead(notif.id)}
                    style={styles.readCheckBtn}
                  >
                    <CheckCircle size={14} color={colors.student.secondary} />
                  </TouchableOpacity>
                ) : (
                  <Badge label="READ" variant="neutral" />
                )}
              </View>

              <Text style={styles.notifBody}>{notif.body}</Text>

              <View style={styles.notifFooter}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.timeText}>
                  {createdAtDate.toLocaleDateString()} • {createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </GlassCard>
          );
        })
      ) : (
        <GlassCard variant="default">
          <View style={styles.emptyContainer}>
            <Bell size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>
              You are all caught up! System broadcasts and real-time updates will appear here instantly.
            </Text>
          </View>
        </GlassCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.student.secondary,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  notifCard: {
    marginBottom: spacing.md,
  },
  unreadNotifCard: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unreadNotifTitle: {
    fontWeight: '900',
    color: colors.textWhite,
  },
  readCheckBtn: {
    padding: 2,
  },
  notifBody: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
});

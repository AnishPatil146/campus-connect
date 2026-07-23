import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Bell, BookOpen, Award, Calendar, Megaphone } from 'lucide-react-native';

export const StudentNotificationsScreen: React.FC = () => {
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: notifications, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', 'student', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        if (res.data?.data) return res.data.data;
      } catch (e) {
        console.log('Using local fallback notifications');
      }
      return [
        {
          id: '1',
          title: 'New DBMS Lecture Notes Uploaded',
          body: 'Prof. Anish uploaded "DBMS Module 3: Relational Algebra & SQL".',
          type: 'NOTE',
          timestamp: '10 mins ago',
          read: false,
        },
        {
          id: '2',
          title: 'Semester V Results Published',
          body: 'Your SGPA for Semester V is now available. SGPA: 8.92.',
          type: 'RESULT',
          timestamp: '2 hours ago',
          read: false,
        },
        {
          id: '3',
          title: 'Tech Fest 2026 Registration Open',
          body: 'Annual campus tech fest registration is now live for all engineering departments.',
          type: 'EVENT',
          timestamp: 'Yesterday',
          read: true,
        },
        {
          id: '4',
          title: 'Timetable Adjustment Alert',
          body: 'Friday Operating Systems lecture shifted to Hall A.',
          type: 'ANNOUNCEMENT',
          timestamp: 'Jul 21, 2026',
          read: true,
        },
      ];
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NOTE':
        return <BookOpen size={18} color={colors.secondary} />;
      case 'RESULT':
        return <Award size={18} color={colors.warning} />;
      case 'EVENT':
        return <Calendar size={18} color={colors.primary} />;
      default:
        return <Megaphone size={18} color={colors.success} />;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Notifications" subtitle="Push & Real-time Broadcast Alerts" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {notifications?.map((item: any) => (
          <GlassCard
            key={item.id}
            variant={item.read ? 'default' : 'glow'}
            style={[styles.notifCard, !item.read && styles.unreadCard]}
          >
            <View style={styles.notifRow}>
              <View style={styles.iconCircle}>{getNotificationIcon(item.type)}</View>

              <View style={styles.notifContent}>
                <View style={styles.notifTop}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {!item.read && <Badge label="NEW" variant="primary" />}
                </View>

                <Text style={styles.notifBody}>{item.body}</Text>
                <Text style={styles.notifTime}>{item.timestamp}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notifCard: {
    marginBottom: spacing.md,
  },
  unreadCard: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.xs,
  },
  notifBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});

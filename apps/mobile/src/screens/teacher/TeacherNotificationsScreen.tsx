import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Bell, Calendar, Clock, Megaphone } from 'lucide-react-native';

export const TeacherNotificationsScreen: React.FC = () => {
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: notifications, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', 'teacher', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notifications');
        if (res.data?.data) return res.data.data;
      } catch (e) {
        console.log('Using local fallback teacher notifications');
      }
      return [
        {
          id: '1',
          title: 'Attendance Marking Reminder',
          body: 'DBMS (Div A) lecture completed. Please submit attendance.',
          type: 'ATTENDANCE',
          timestamp: '15 mins ago',
          read: false,
        },
        {
          id: '2',
          title: 'Faculty Meeting Scheduled',
          body: 'Departmental curriculum review meeting tomorrow at 04:00 PM.',
          type: 'ANNOUNCEMENT',
          timestamp: '3 hours ago',
          read: true,
        },
      ];
    },
  });

  return (
    <View style={styles.container}>
      <Header title="Faculty Alerts" subtitle="Classroom Reminders & Timetable Updates" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {notifications?.map((item: any) => (
          <GlassCard
            key={item.id}
            variant={item.read ? 'default' : 'glow'}
            style={styles.notifCard}
          >
            <View style={styles.notifRow}>
              <View style={styles.iconBox}>
                <Bell size={18} color={colors.primary} />
              </View>

              <View style={styles.notifContent}>
                <View style={styles.notifTop}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  {!item.read && <Badge label="ACTION REQUIRED" variant="warning" />}
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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

import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { Bell, Calendar, Clock, Megaphone } from 'lucide-react-native';

export const TeacherNotificationsScreen: React.FC = () => {
  const {
    data: notifications,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['teacher', 'notifications'],
    endpoint: '/notifications/in-app',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Faculty Alerts..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Faculty Alerts" subtitle="Classroom Reminders & Timetable Updates" />
        <ErrorState message="Failed to load faculty notifications from database." onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Faculty Alerts" subtitle="Classroom Reminders & Timetable Updates" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {notifications && notifications.length > 0 ? (
          notifications.map((item: any) => (
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
          ))
        ) : (
          <EmptyState message="No Data Available" description="No faculty alerts or notices available." />
        )}
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

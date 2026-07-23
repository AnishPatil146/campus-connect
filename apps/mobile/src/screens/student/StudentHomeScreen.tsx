import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Radio,
} from 'lucide-react-native';

export const StudentHomeScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: dashboardData, refetch, isRefetching } = useQuery({
    queryKey: ['student', 'dashboard', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/student');
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        console.log('Failed to fetch student dashboard API:', e);
      }
      return null;
    },
  });

  const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const attendanceVal = dashboardData?.attendance !== undefined ? `${dashboardData.attendance}%` : '--%';
  const newNotesCount = dashboardData?.newNotesCount !== undefined ? dashboardData.newNotesCount : 0;
  const classesList = dashboardData?.todayClasses || [];
  const latestResult = dashboardData?.latestResult || null;
  const upcomingEvent = dashboardData?.upcomingEvent || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      {/* Top Header & Greeting */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.liveBadgeRow}>
            <Radio size={12} color={colors.success} />
            <Text style={styles.liveText}>REALTIME CONNECTED</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome back, {firstName}
          </Text>
          <Text style={styles.tenantSubtitle}>{tenantDisplayName}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats Widgets */}
      <View style={styles.statsGrid}>
        <StatCard
          title="ATTENDANCE"
          value={attendanceVal}
          subtitle="Academic Term Average"
          variant="glow"
          valueColor={colors.success}
          icon={<TrendingUp size={18} color={colors.success} />}
        />
        <StatCard
          title="NEW NOTES"
          value={newNotesCount}
          subtitle="Course Materials"
          variant="accent"
          valueColor={colors.student.secondary}
          icon={<BookOpen size={18} color={colors.student.secondary} />}
        />
      </View>

      {/* Today's Schedule Timeline Card */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Clock size={18} color={colors.student.primary} />
            <Text style={styles.cardTitle}>Today's Classes</Text>
          </View>
          <Badge label={`${classesList.length} Scheduled`} variant="primary" />
        </View>

        {classesList.length > 0 ? (
          classesList.map((item: any, index: number) => (
            <View
              key={item.id || index}
              style={[
                styles.classItem,
                index === classesList.length - 1 && styles.noBorder,
              ]}
            >
              <View style={styles.classTimeBox}>
                <Text style={styles.classTimeText}>{item.time?.split(' - ')[0] || '--:--'}</Text>
                <Text style={styles.classTimeSub}>{item.time?.split(' - ')[1] || ''}</Text>
              </View>

              <View style={styles.classInfo}>
                <Text style={styles.classSubject}>{item.subject || 'Lecture'}</Text>
                <View style={styles.classDetailsRow}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text style={styles.classDetailText}>{item.room || 'Classroom'}</Text>
                  {item.teacher && <Text style={styles.classDot}>•</Text>}
                  {item.teacher && <Text style={styles.classDetailText}>{item.teacher}</Text>}
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No classes scheduled for today.</Text>
          </View>
        )}
      </GlassCard>

      {/* Latest Results Summary */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Award size={18} color={colors.warning} />
            <Text style={styles.cardTitle}>Academic Performance</Text>
          </View>
          <Badge label={latestResult?.semester || 'Current Term'} variant="warning" />
        </View>

        {latestResult ? (
          <View style={styles.resultRow}>
            <View style={styles.resultCol}>
              <Text style={styles.resultLabel}>SGPA</Text>
              <Text style={[styles.resultVal, { color: colors.warning }]}>
                {latestResult.sgpa || '--'}
              </Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultCol}>
              <Text style={styles.resultLabel}>CGPA</Text>
              <Text style={[styles.resultVal, { color: colors.student.primary }]}>
                {latestResult.cgpa || '--'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No academic results published yet.</Text>
          </View>
        )}
      </GlassCard>

      {/* Upcoming Event */}
      {upcomingEvent && (
        <GlassCard variant="accent">
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleRow}>
              <Calendar size={18} color={colors.student.secondary} />
              <Text style={styles.cardTitle}>Upcoming Event</Text>
            </View>
            <Badge label="Campus Event" variant="info" />
          </View>

          <Text style={styles.eventTitle}>{upcomingEvent.title}</Text>
          <View style={styles.eventMetaRow}>
            <Calendar size={13} color={colors.textSecondary} />
            <Text style={styles.eventMetaText}>{upcomingEvent.date}</Text>
            {upcomingEvent.venue && <Text style={styles.classDot}>•</Text>}
            {upcomingEvent.venue && <MapPin size={13} color={colors.textSecondary} />}
            {upcomingEvent.venue && <Text style={styles.eventMetaText}>{upcomingEvent.venue}</Text>}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tenantSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.student.glow,
    borderWidth: 1.5,
    borderColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.student.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  classTimeBox: {
    width: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  classTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.student.primary,
  },
  classTimeSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  classDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  classDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  classDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  resultCol: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  resultVal: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  resultDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.bgCardBorder,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

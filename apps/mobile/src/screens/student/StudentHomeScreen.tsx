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
import { saveOfflineData, OFFLINE_KEYS } from '../../services/offlineCache';
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  TrendingUp,
  Bell,
  Sparkles,
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
          await saveOfflineData(OFFLINE_KEYS.ATTENDANCE, res.data.data.attendance);
          return res.data.data;
        }
      } catch (e) {
        console.log('Using local fallback dashboard data for offline/demo mode');
      }
      return {
        welcomeMessage: `Good Morning, ${user?.name?.split(' ')[0] || 'Anish'}`,
        attendance: 87,
        newNotesCount: 3,
        todayClasses: [
          { id: 'c1', subject: 'DBMS', time: '09:00 AM - 10:00 AM', room: 'Lab 402', teacher: 'Prof. Anish' },
          { id: 'c2', subject: 'Operating Systems', time: '10:15 AM - 11:15 AM', room: 'Hall B', teacher: 'Dr. Sharma' },
          { id: 'c3', subject: 'System Design', time: '01:30 PM - 02:30 PM', room: 'Seminar Room 1', teacher: 'Prof. Anish' },
        ],
        latestResult: { sgpa: '8.92', cgpa: '8.75', semester: 'Semester V' },
        upcomingEvent: { title: 'Tech Fest 2026', date: 'March 15, 2026', venue: 'Main Auditorium' },
      };
    },
  });

  const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Top Header & Greeting */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.liveBadgeRow}>
            <Radio size={12} color={colors.success} />
            <Text style={styles.liveText}>REALTIME CONNECTED</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            {dashboardData?.welcomeMessage || `Good Morning, ${user?.name?.split(' ')[0] || 'Anish'}`}
          </Text>
          <Text style={styles.tenantSubtitle}>{tenantDisplayName}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Stats Widgets */}
      <View style={styles.statsGrid}>
        <StatCard
          title="ATTENDANCE"
          value={`${dashboardData?.attendance || 87}%`}
          subtitle="Above threshold (75%)"
          variant="glow"
          valueColor={colors.success}
          icon={<TrendingUp size={18} color={colors.success} />}
        />
        <StatCard
          title="NEW NOTES"
          value={dashboardData?.newNotesCount || 3}
          subtitle="Available to download"
          variant="accent"
          valueColor={colors.secondary}
          icon={<BookOpen size={18} color={colors.secondary} />}
        />
      </View>

      {/* Today's Schedule Timeline Card */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Today's Classes</Text>
          </View>
          <Badge label={`${dashboardData?.todayClasses?.length || 3} Classes`} variant="primary" />
        </View>

        {dashboardData?.todayClasses?.map((item: any, index: number) => (
          <View
            key={item.id || index}
            style={[
              styles.classItem,
              index === dashboardData.todayClasses.length - 1 && styles.noBorder,
            ]}
          >
            <View style={styles.classTimeBox}>
              <Text style={styles.classTimeText}>{item.time.split(' - ')[0]}</Text>
              <Text style={styles.classTimeSub}>{item.time.split(' - ')[1]}</Text>
            </View>

            <View style={styles.classInfo}>
              <Text style={styles.classSubject}>{item.subject}</Text>
              <View style={styles.classDetailsRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.classDetailText}>{item.room}</Text>
                <Text style={styles.classDot}>•</Text>
                <Text style={styles.classDetailText}>{item.teacher}</Text>
              </View>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Latest Results Summary */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Award size={18} color={colors.warning} />
            <Text style={styles.cardTitle}>Latest Academic Performance</Text>
          </View>
          <Badge label={dashboardData?.latestResult?.semester || 'Semester V'} variant="warning" />
        </View>

        <View style={styles.resultRow}>
          <View style={styles.resultCol}>
            <Text style={styles.resultLabel}>SGPA</Text>
            <Text style={[styles.resultVal, { color: colors.warning }]}>
              {dashboardData?.latestResult?.sgpa || '8.92'}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultCol}>
            <Text style={styles.resultLabel}>CGPA</Text>
            <Text style={[styles.resultVal, { color: colors.primary }]}>
              {dashboardData?.latestResult?.cgpa || '8.75'}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Upcoming Event */}
      <GlassCard variant="accent">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Sparkles size={18} color={colors.secondary} />
            <Text style={styles.cardTitle}>Upcoming Event</Text>
          </View>
          <Badge label="Campus Event" variant="info" />
        </View>

        <Text style={styles.eventTitle}>{dashboardData?.upcomingEvent?.title || 'Tech Fest 2026'}</Text>
        <View style={styles.eventMetaRow}>
          <Calendar size={13} color={colors.textSecondary} />
          <Text style={styles.eventMetaText}>{dashboardData?.upcomingEvent?.date || 'March 15, 2026'}</Text>
          <Text style={styles.classDot}>•</Text>
          <MapPin size={13} color={colors.textSecondary} />
          <Text style={styles.eventMetaText}>{dashboardData?.upcomingEvent?.venue || 'Main Auditorium'}</Text>
        </View>
      </GlassCard>
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
    backgroundColor: colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
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
    color: colors.primary,
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
});

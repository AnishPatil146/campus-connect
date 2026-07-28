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
  Bell,
  Sparkles,
  User,
  Zap,
  FileText,
} from 'lucide-react-native';

export const DashboardScreen: React.FC<any> = ({ navigation }) => {
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
        console.log('Fetching student dashboard API...');
      }
      return null;
    },
  });

  const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  
  const attendanceObj = dashboardData?.attendance;
  const attendanceNum = attendanceObj?.overallPercentage !== undefined ? Number(attendanceObj.overallPercentage) : 82.5;
  const attendanceVal = `${attendanceNum.toFixed(1)}%`;
  
  const classesList = dashboardData?.todayClasses || [];
  const nextClass = classesList.length > 0 ? classesList[0] : null;
  const latestNotes = dashboardData?.latestNotes || [];
  const eventsList = dashboardData?.events || [];
  const notificationsList = dashboardData?.notifications || [];

  const isAttendanceSafe = attendanceNum >= 75;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      {/* 1. Welcome Card Header */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.liveBadgeRow}>
            <Radio size={12} color={colors.success} />
            <Text style={styles.liveText}>STUDENT PORTAL • REALTIME CONNECTED</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome back, {firstName}
          </Text>
          <Text style={styles.tenantSubtitle}>{tenantDisplayName}</Text>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileAvatar}
        >
          <Text style={styles.avatarText}>{firstName.charAt(0)}</Text>
        </TouchableOpacity>
      </View>

      {/* Academic Standing Banner */}
      <GlassCard variant="glow" style={styles.standingCard}>
        <View style={styles.standingRow}>
          <View style={styles.standingLeft}>
            <Badge label="ACADEMIC STANDING" variant="primary" />
            <Text style={styles.standingTitle}>{user?.department || 'Computer Science & Engineering'}</Text>
            <Text style={styles.standingSub}>{user?.semester || 'Semester 4'} • Roll: {user?.prn || user?.id.substring(0, 8)}</Text>
          </View>
          <View style={styles.standingBadgeBox}>
            <Award size={20} color={colors.student.secondary} />
            <Text style={styles.standingStatus}>GOOD</Text>
          </View>
        </View>
      </GlassCard>

      {/* 2. Attendance Overview & Course Notes Stat Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="ATTENDANCE RATE"
          value={attendanceVal}
          subtitle={isAttendanceSafe ? "Safe Threshold (≥75%)" : "Attention Required (<75%)"}
          variant="glow"
          valueColor={isAttendanceSafe ? colors.success : colors.danger}
          icon={<TrendingUp size={18} color={isAttendanceSafe ? colors.success : colors.danger} />}
        />
        <StatCard
          title="STUDY MATERIALS"
          value={latestNotes.length || 5}
          subtitle="Course Notes Available"
          variant="accent"
          valueColor={colors.student.secondary}
          icon={<BookOpen size={18} color={colors.student.secondary} />}
        />
      </View>

      {/* 3. Next Class Banner */}
      {nextClass && (
        <GlassCard variant="glow" style={styles.nextClassCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleRow}>
              <Zap size={18} color={colors.student.secondary} />
              <Text style={styles.cardTitle}>Next Class</Text>
            </View>
            <Badge label="UPCOMING" variant="info" />
          </View>

          <View style={styles.nextClassBody}>
            <View style={styles.nextClassTimeBox}>
              <Text style={styles.nextClassTimeText}>{nextClass.startTime || '09:00'}</Text>
              <Text style={styles.nextClassTimeSub}>Starts Soon</Text>
            </View>

            <View style={styles.nextClassInfo}>
              <Text style={styles.nextClassSubject}>{nextClass.subjectName || 'Database Systems'}</Text>
              <View style={styles.classDetailsRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.classDetailText}>{nextClass.classroom || 'Lab 302'}</Text>
                {nextClass.teacher && <Text style={styles.classDot}>•</Text>}
                {nextClass.teacher && <Text style={styles.classDetailText}>{nextClass.teacher}</Text>}
              </View>
            </View>
          </View>
        </GlassCard>
      )}

      {/* 4. Quick Actions Grid */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Sparkles size={18} color={colors.student.primary} />
            <Text style={styles.cardTitle}>Quick Actions</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Timetable')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(37, 99, 235, 0.15)' }]}>
              <Calendar size={18} color={colors.student.primary} />
            </View>
            <Text style={styles.quickTileLabel}>Timetable</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Attendance')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <TrendingUp size={18} color={colors.success} />
            </View>
            <Text style={styles.quickTileLabel}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Notes')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <BookOpen size={18} color={colors.student.secondary} />
            </View>
            <Text style={styles.quickTileLabel}>Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Events')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Calendar size={18} color={colors.warning} />
            </View>
            <Text style={styles.quickTileLabel}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Notifications')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Bell size={18} color="#8b5cf6" />
            </View>
            <Text style={styles.quickTileLabel}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Profile')} style={styles.quickTile}>
            <View style={[styles.quickIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <User size={18} color="#ec4899" />
            </View>
            <Text style={styles.quickTileLabel}>Profile</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* 5. Today's Classes Schedule */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Clock size={18} color={colors.student.primary} />
            <Text style={styles.cardTitle}>Today's Schedule</Text>
          </View>
          <Badge label={`${classesList.length} Lectures`} variant="primary" />
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
                <Text style={styles.classTimeText}>{item.startTime || '10:00'}</Text>
                <Text style={styles.classTimeSub}>{item.endTime || '11:00'}</Text>
              </View>

              <View style={styles.classInfo}>
                <Text style={styles.classSubject}>{item.subjectName || 'Subject Lecture'}</Text>
                <View style={styles.classDetailsRow}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text style={styles.classDetailText}>{item.classroom || 'Classroom'}</Text>
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

      {/* 6. Recent Notifications */}
      {notificationsList.length > 0 && (
        <GlassCard variant="default">
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleRow}>
              <Bell size={18} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Recent Notifications</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.seeAllText}>View Center</Text>
            </TouchableOpacity>
          </View>

          {notificationsList.slice(0, 3).map((notif: any, idx: number) => (
            <View key={notif.id || idx} style={[styles.notifRowItem, idx === 2 && styles.noBorder]}>
              <View style={styles.notifInfo}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifBody}>{notif.body}</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      )}

      {/* 7. Upcoming Events */}
      {eventsList.length > 0 && (
        <GlassCard variant="accent">
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleRow}>
              <Calendar size={18} color={colors.warning} />
              <Text style={styles.cardTitle}>Upcoming Event</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={styles.seeAllText}>All Events</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.eventTitle}>{eventsList[0].title}</Text>
          <View style={styles.eventMetaRow}>
            <Calendar size={13} color={colors.textSecondary} />
            <Text style={styles.eventMetaText}>
              {new Date(eventsList[0].startDatetime).toLocaleDateString()}
            </Text>
            {eventsList[0].venue && <Text style={styles.classDot}>•</Text>}
            {eventsList[0].venue && <MapPin size={13} color={colors.textSecondary} />}
            {eventsList[0].venue && <Text style={styles.eventMetaText}>{eventsList[0].venue}</Text>}
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
  standingCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  standingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  standingLeft: {
    flex: 1,
  },
  standingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  standingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  standingBadgeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: spacing.xs + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    minWidth: 64,
  },
  standingStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.student.secondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.sm,
  },
  nextClassCard: {
    marginBottom: spacing.md,
  },
  nextClassBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextClassTimeBox: {
    width: 80,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  nextClassTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.student.primary,
  },
  nextClassTimeSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  nextClassInfo: {
    flex: 1,
  },
  nextClassSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  quickTile: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginBottom: spacing.xs,
  },
  quickIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickTileLabel: {
    fontSize: 11,
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
    width: 80,
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
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.student.primary,
  },
  notifRowItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  notifInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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

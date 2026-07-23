import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import {
  Users,
  CheckSquare,
  BookOpen,
  Award,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Radio,
} from 'lucide-react-native';

export const TeacherHomeScreen: React.FC<any> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: teacherData, refetch, isRefetching } = useQuery({
    queryKey: ['teacher', 'dashboard', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/teacher');
        if (res.data?.data) return res.data.data;
      } catch (e) {
        console.log('Using local fallback teacher dashboard');
      }
      return {
        pendingAttendanceCount: 1,
        notesUploadedCount: 14,
        resultsPendingCount: 2,
        todayClasses: [
          { id: '1', division: 'Div A - Sem VI', subject: 'DBMS', time: '09:00 AM - 10:00 AM', room: 'Lab 402', status: 'PENDING' },
          { id: '2', division: 'Div B - Sem VI', subject: 'System Design', time: '01:30 PM - 02:30 PM', room: 'Seminar Room 1', status: 'COMPLETED' },
        ],
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
            <Text style={styles.liveText}>REALTIME TEACHER SUITE</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.name?.split(' ')[0] || 'Prof. Anish'}
          </Text>
          <Text style={styles.tenantSubtitle}>{tenantDisplayName}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Metric Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="ATTENDANCE PENDING"
          value={teacherData?.pendingAttendanceCount || 1}
          subtitle="Requires marking"
          variant="glow"
          valueColor={colors.warning}
          icon={<CheckSquare size={18} color={colors.warning} />}
        />
        <StatCard
          title="NOTES UPLOADED"
          value={teacherData?.notesUploadedCount || 14}
          subtitle="Course materials"
          variant="accent"
          valueColor={colors.secondary}
          icon={<BookOpen size={18} color={colors.secondary} />}
        />
      </View>

      {/* Quick Action Shortcuts */}
      <GlassCard variant="glow" style={styles.actionCard}>
        <View style={styles.cardHeaderRow}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Quick Classroom Actions</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <Button
            title="Mark Attendance (30s)"
            onPress={() => navigation.navigate('Attendance')}
            variant="primary"
            icon={<CheckSquare size={16} color={colors.textWhite} />}
            style={styles.actionBtn}
          />

          <Button
            title="Upload Note"
            onPress={() => navigation.navigate('Notes')}
            variant="secondary"
            icon={<BookOpen size={16} color={colors.textPrimary} />}
            style={styles.actionBtn}
          />
        </View>
      </GlassCard>

      {/* Today's Teaching Schedule */}
      <GlassCard variant="default">
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleWithIcon}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Today's Lectures</Text>
          </View>
          <Badge label={`${teacherData?.todayClasses?.length || 2} Sessions`} variant="primary" />
        </View>

        {teacherData?.todayClasses?.map((item: any, idx: number) => (
          <TouchableOpacity
            key={item.id || idx}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Attendance')}
            style={[styles.classItem, idx === teacherData.todayClasses.length - 1 && styles.noBorder]}
          >
            <View style={styles.classTimeBox}>
              <Text style={styles.classTimeText}>{item.time.split(' - ')[0]}</Text>
              <Text style={styles.classTimeSub}>{item.time.split(' - ')[1]}</Text>
            </View>

            <View style={styles.classInfo}>
              <Text style={styles.classSubject}>{item.subject}</Text>
              <Text style={styles.classDiv}>{item.division}</Text>
              <View style={styles.classDetailsRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.classDetailText}>{item.room}</Text>
              </View>
            </View>

            <Badge
              label={item.status}
              variant={item.status === 'COMPLETED' ? 'success' : 'warning'}
            />
          </TouchableOpacity>
        ))}
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
  actionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  actionBtn: {
    height: 46,
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
    width: 86,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    alignItems: 'center',
    marginRight: spacing.sm,
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
  classDiv: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 2,
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
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { CheckCircle2, AlertTriangle, Calendar, TrendingUp, Zap } from 'lucide-react-native';

export const StudentAttendanceScreen: React.FC = () => {
  const {
    data: attendanceData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['student', 'attendance'],
    endpoint: '/student/attendance',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Attendance Records..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Attendance Tracker" subtitle="Real-Time Attendance" />
        <ErrorState message="Failed to load attendance records from database." onRetry={refetch} />
      </View>
    );
  }

  const percentage = attendanceData?.overallPercentage !== undefined ? Number(attendanceData.overallPercentage) : (attendanceData?.percentage !== undefined ? Number(attendanceData.percentage) : 0);
  const presentCount = attendanceData?.presentCount !== undefined ? Number(attendanceData.presentCount) : (attendanceData?.present !== undefined ? Number(attendanceData.present) : 0);
  const absentCount = attendanceData?.absentCount !== undefined ? Number(attendanceData.absentCount) : (attendanceData?.absent !== undefined ? Number(attendanceData.absent) : 0);
  const totalClasses = presentCount + absentCount;
  const subjects = attendanceData?.subjectWise || attendanceData?.subjects || [];
  const history = attendanceData?.history || attendanceData?.records || [];

  const isHealthy = percentage >= 75;

  return (
    <View style={styles.container}>
      <Header
        title="Attendance Tracker"
        subtitle="Real-Time Socket Synced (<1s)"
        rightAction={
          <View style={styles.realtimePill}>
            <Zap size={12} color={colors.warning} />
            <Text style={styles.realtimeText}>LIVE</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Gauge Overview Card */}
        <GlassCard variant="glow" style={styles.gaugeCard}>
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugeVal}>{percentage}%</Text>
              <Text style={styles.gaugeLabel}>Overall</Text>
            </View>

            <View style={styles.gaugeDetails}>
              <Badge
                label={isHealthy ? 'SAFE ZONE (≥75%)' : 'WARNING (<75%)'}
                variant={isHealthy ? 'success' : 'danger'}
              />
              <Text style={styles.gaugeCountText}>
                <Text style={styles.boldText}>{presentCount}</Text> of{' '}
                {totalClasses} classes attended
              </Text>
              <Text style={styles.gaugeSubText}>
                {isHealthy
                  ? 'You are maintaining attendance above 75% threshold'
                  : 'Must attend upcoming consecutive classes to recover'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Subject Breakdown Header */}
        <View style={styles.sectionHeader}>
          <TrendingUp size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Subject Attendance</Text>
        </View>

        {subjects.length > 0 ? (
          subjects.map((sub: any, idx: number) => {
            const isSubHealthy = (sub.percentage ?? 0) >= 75;
            const subAttended = sub.present ?? sub.attended ?? 0;
            const subTotal = (sub.present ?? 0) + (sub.absent ?? 0) || (sub.total ?? 0);
            return (
              <GlassCard key={idx} variant="default" style={styles.subjectCard}>
                <View style={styles.subHeaderRow}>
                  <View>
                    <Text style={styles.subName}>{sub.subjectName || sub.name}</Text>
                    <Text style={styles.subCode}>{sub.code || ''}</Text>
                  </View>
                  <Text style={[styles.subPercentage, { color: isSubHealthy ? colors.success : colors.danger }]}>
                    {sub.percentage}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(sub.percentage ?? 0, 100)}%`,
                        backgroundColor: isSubHealthy ? colors.success : colors.danger,
                      },
                    ]}
                  />
                </View>

                <View style={styles.subFooterRow}>
                  <Text style={styles.subStats}>
                    Attended: {subAttended}/{subTotal} classes
                  </Text>
                  <Badge label={isSubHealthy ? 'Good' : 'At Risk'} variant={isSubHealthy ? 'success' : 'danger'} />
                </View>
              </GlassCard>
            );
          })
        ) : (
          <GlassCard variant="default" style={styles.subjectCard}>
            <Text style={{ color: colors.textMuted, textAlign: 'center', padding: spacing.md }}>No Data Available</Text>
          </GlassCard>
        )}

        {/* Recent Attendance Logs */}
        <View style={styles.sectionHeader}>
          <Calendar size={16} color={colors.secondary} />
          <Text style={styles.sectionTitle}>Recent Attendance Activity</Text>
        </View>

        <GlassCard variant="default">
          {history.length > 0 ? (
            history.map((log: any, i: number) => (
              <View key={i} style={[styles.logRow, i === history.length - 1 && styles.noBorder]}>
                <View style={styles.logLeft}>
                  {log.status === 'PRESENT' ? (
                    <CheckCircle2 size={18} color={colors.success} />
                  ) : (
                    <AlertTriangle size={18} color={colors.danger} />
                  )}
                  <View>
                    <Text style={styles.logSubject}>{log.subjectName || log.subject}</Text>
                    <Text style={styles.logDate}>{log.date}</Text>
                  </View>
                </View>
                <Badge label={log.status} variant={log.status === 'PRESENT' ? 'success' : 'danger'} />
              </View>
            ))
          ) : (
            <Text style={{ color: colors.textMuted, textAlign: 'center', padding: spacing.md }}>No Data Available</Text>
          )}
        </GlassCard>
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
  realtimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warning,
  },
  gaugeCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 3,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  gaugeVal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
  },
  gaugeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  gaugeDetails: {
    flex: 1,
  },
  gaugeCountText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  boldText: {
    fontWeight: '700',
    color: colors.primary,
  },
  gaugeSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subjectCard: {
    marginBottom: spacing.md,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  subName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subCode: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  subPercentage: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  subFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subStats: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

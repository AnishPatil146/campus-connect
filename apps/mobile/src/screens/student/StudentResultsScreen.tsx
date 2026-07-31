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
import { Award, TrendingUp, CheckCircle, Sparkles } from 'lucide-react-native';

export const StudentResultsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const {
    data: dashboardData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['student', 'results'],
    endpoint: '/dashboard/student',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Grade Report & Marksheet..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Academic Results" subtitle="Semester Grade Report & Transcripts" />
        <ErrorState message="Failed to load academic evaluation results from database." onRetry={refetch} />
      </View>
    );
  }

  const perf = dashboardData?.performance;
  const sgpaVal = perf?.gpa !== undefined && perf?.gpa !== null ? perf.gpa.toString() : '--';
  const cgpaVal = perf?.cgpa !== undefined && perf?.cgpa !== null ? perf.cgpa.toString() : sgpaVal;
  const subjectsList = perf?.subjects || [];
  return (
    <View style={styles.container}>
      <Header title="Academic Results" subtitle="Semester Grades & SGPA Summary" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Main GPA Scorecard */}
        <GlassCard variant="glow" style={styles.scorecard}>
          <View style={styles.scoreHeaderRow}>
            <View style={styles.scoreHeaderLeft}>
              <Award size={20} color={colors.warning} />
              <Text style={styles.scoreTitle}>{user?.semester || 'Semester Grade Summary'}</Text>
            </View>
            <Badge label="OFFICIAL MARKSHEET" variant="success" />
          </View>

          <View style={styles.gpaGrid}>
            <View style={styles.gpaBox}>
              <Text style={styles.gpaVal}>{sgpaVal}</Text>
              <Text style={styles.gpaLabel}>SGPA</Text>
            </View>

            <View style={styles.gpaDivider} />

            <View style={styles.gpaBox}>
              <Text style={[styles.gpaVal, { color: colors.secondary }]}>{cgpaVal}</Text>
              <Text style={styles.gpaLabel}>CUMULATIVE CGPA</Text>
            </View>
          </View>
        </GlassCard>

        {/* Subject Grades List */}
        <View style={styles.sectionHeader}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Subject Marksheet</Text>
        </View>

        {subjectsList && subjectsList.length > 0 ? (
          subjectsList.map((sub: any, idx: number) => (
            <GlassCard key={idx} variant="default" style={styles.subjectResultCard}>
              <View style={styles.subjectTopRow}>
                <View style={styles.subjectTitleContainer}>
                  <Text style={styles.subjectCode}>{sub.code || ''}</Text>
                  <Text style={styles.subjectName}>{sub.name || sub.subjectName || 'Course'}</Text>
                </View>
                {sub.grade && (
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeText}>{sub.grade}</Text>
                  </View>
                )}
              </View>

              <View style={styles.marksFooter}>
                <Text style={styles.marksText}>
                  Marks: <Text style={styles.marksBold}>{sub.marks}</Text> / {sub.maxMarks || 100}
                </Text>
                <View style={styles.statusIndicator}>
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={styles.statusText}>VERIFIED</Text>
                </View>
              </View>
            </GlassCard>
          ))
        ) : (
          <EmptyState message="No Data Available" description="No evaluation marks published yet for this semester." />
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
  scorecard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  gpaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  gpaBox: {
    alignItems: 'center',
  },
  gpaVal: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.warning,
  },
  gpaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  gpaDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.bgCardBorder,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subjectResultCard: {
    marginBottom: spacing.md,
  },
  subjectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  subjectTitleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  gradeBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  gradePoints: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  marksFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  marksText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  marksBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
});

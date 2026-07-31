import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { Search, UserCheck, TrendingUp } from 'lucide-react-native';

export const TeacherStudentsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: studentsData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['teacher', 'students', 'directory'],
    endpoint: '/students',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Student Directory..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Class Roster" subtitle="Student Directory & Academic Tracking" />
        <ErrorState message="Failed to load student directory from database." onRetry={refetch} />
      </View>
    );
  }

  const studentsList = Array.isArray(studentsData) ? studentsData : [];
  const filteredStudents = (studentsList || []).filter((s: any) => {
    const sName = s.name || `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.trim() || s.email || '';
    const sPrn = s.prn || s.rollNumber || '';
    return sName.toLowerCase().includes(searchQuery.toLowerCase()) || sPrn.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Header title="Class Roster" subtitle="Student Directory & Academic Tracking" />

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or PRN..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student: any) => {
            const attVal = parseFloat(student.attendance) || 0;
            const isAtRisk = attVal < 75;

            return (
              <GlassCard key={student.id} variant="default" style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{student.name ? student.name.charAt(0) : 'S'}</Text>
                  </View>
                  <View style={styles.studentMain}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentPrn}>{student.prn} • {student.division || 'General'}</Text>
                  </View>
                  <Badge
                    label={isAtRisk ? 'AT RISK (<75%)' : 'REGULAR'}
                    variant={isAtRisk ? 'danger' : 'success'}
                  />
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Attendance</Text>
                    <Text style={[styles.metricVal, { color: isAtRisk ? colors.danger : colors.success }]}>
                      {student.attendance || '--%'}
                    </Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Last SGPA</Text>
                    <Text style={[styles.metricVal, { color: colors.primary }]}>{student.sgpa || '--'}</Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        ) : (
          <EmptyState message="No Data Available" description="No student records found in institution directory." />
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
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  studentCard: {
    marginBottom: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  studentMain: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentPrn: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.bgCardBorder,
  },
});

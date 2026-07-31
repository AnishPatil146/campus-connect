import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { Clock, MapPin, User, Calendar as CalendarIcon } from 'lucide-react-native';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const StudentTimetableScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('MON');

  const {
    data: timetableData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['student', 'timetable', selectedDay],
    endpoint: `/student/timetable?day=${selectedDay}`,
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Timetable Schedule..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Class Timetable" subtitle="Weekly Schedule & Classroom Allocations" />
        <ErrorState message="Failed to load timetable schedule from database." onRetry={refetch} />
      </View>
    );
  }

  const slots = timetableData?.slots || (Array.isArray(timetableData) ? timetableData : []);

  return (
    <View style={styles.container}>
      <Header title="Class Timetable" subtitle="Weekly Schedule & Classroom Allocations" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {/* Next Class Hero Card */}
        {timetableData?.nextClass && (
          <GlassCard variant="glow" style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <Badge label="NEXT UP" variant="primary" />
              <Text style={styles.heroTime}>{timetableData.nextClass.time}</Text>
            </View>
            <Text style={styles.heroSubject}>{timetableData.nextClass.subject}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <MapPin size={14} color={colors.secondary} />
                <Text style={styles.heroMetaText}>Room {timetableData.nextClass.room}</Text>
              </View>
              <Text style={styles.heroDot}>•</Text>
              <View style={styles.heroMetaItem}>
                <User size={14} color={colors.secondary} />
                <Text style={styles.heroMetaText}>{timetableData.nextClass.teacher}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Day Switcher Selector */}
        <View style={styles.daySelectorRow}>
          {DAYS.map((day) => {
            const isActive = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                activeOpacity={0.8}
                onPress={() => setSelectedDay(day)}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Timetable Schedule Cards */}
        <View style={styles.scheduleList}>
          {slots && slots.length > 0 ? (
            slots.map((slot: any, index: number) => (
              <GlassCard key={slot.id || index} variant="default" style={styles.slotCard}>
                <View style={styles.slotTopRow}>
                  <View style={styles.timePill}>
                    <Clock size={12} color={colors.primary} />
                    <Text style={styles.timePillText}>{slot.time}</Text>
                  </View>
                  <Badge
                    label={slot.type || 'LECTURE'}
                    variant={slot.type === 'PRACTICAL' ? 'warning' : 'info'}
                  />
                </View>

                <Text style={styles.slotSubject}>{slot.subject}</Text>
                <Text style={styles.slotCode}>{slot.code}</Text>

                <View style={styles.slotFooter}>
                  <View style={styles.slotFooterItem}>
                    <MapPin size={13} color={colors.textSecondary} />
                    <Text style={styles.slotFooterText}>{slot.room}</Text>
                  </View>
                  <View style={styles.slotFooterItem}>
                    <User size={13} color={colors.textSecondary} />
                    <Text style={styles.slotFooterText}>{slot.teacher}</Text>
                  </View>
                </View>
              </GlassCard>
            ))
          ) : (
            <EmptyState message="No Data Available" description="No classes scheduled for this day." />
          )}
        </View>
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
  heroCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  heroSubject: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: spacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  heroDot: {
    color: colors.textMuted,
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  dayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginHorizontal: 2,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: colors.textWhite,
  },
  scheduleList: {
    marginTop: spacing.xs,
  },
  slotCard: {
    marginBottom: spacing.md,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  slotSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  slotCode: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  slotFooter: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  slotFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

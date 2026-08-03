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
import { Clock, MapPin, Users, Calendar as CalendarIcon } from 'lucide-react-native';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const TeacherTimetableScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('MON');

  const {
    data: timetableData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['teacher', 'timetable', selectedDay],
    endpoint: `/timetable/teacher/my-schedule?day=${selectedDay}`,
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Teaching Schedule..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Teaching Timetable" subtitle="Faculty Lecture Schedule & Classroom Allocations" />
        <ErrorState message="Failed to load faculty timetable from database." onRetry={refetch} />
      </View>
    );
  }

  const slots = timetableData?.slots || (Array.isArray(timetableData) ? timetableData : []);

  return (
    <View style={styles.container}>
      <Header title="Teaching Timetable" subtitle="Faculty Lecture Schedule & Classroom Allocations" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.teacher.primary} />}
      >
        {/* Next Class Hero Card */}
        {timetableData?.nextClass && (
          <GlassCard variant="glow" style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <Badge label="NEXT LECTURE" variant="success" />
              <Text style={styles.heroTime}>{timetableData.nextClass.time}</Text>
            </View>
            <Text style={styles.heroSubject}>{timetableData.nextClass.subject}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <MapPin size={14} color={colors.teacher.secondary} />
                <Text style={styles.heroMetaText}>Room {timetableData.nextClass.room}</Text>
              </View>
              <Text style={styles.heroDot}>•</Text>
              <View style={styles.heroMetaItem}>
                <Users size={14} color={colors.teacher.secondary} />
                <Text style={styles.heroMetaText}>{timetableData.nextClass.division || 'Div A'}</Text>
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
                    <Clock size={12} color={colors.teacher.secondary} />
                    <Text style={styles.timeText}>{slot.startTime || slot.time} - {slot.endTime || ''}</Text>
                  </View>
                  <Badge label={slot.room || 'Room 204'} variant="success" />
                </View>

                <Text style={styles.subjectTitle}>{slot.subjectName || slot.subject || 'Lecture'}</Text>

                <View style={styles.slotBottomRow}>
                  <View style={styles.infoPill}>
                    <Users size={12} color={colors.textMuted} />
                    <Text style={styles.infoText}>{slot.divisionName || slot.division || 'Division A'}</Text>
                  </View>
                  <Text style={styles.typeText}>{slot.type || 'Lecture'}</Text>
                </View>
              </GlassCard>
            ))
          ) : (
            <EmptyState
              message="No Lectures Scheduled"
              description={`You have no teaching lectures scheduled for ${selectedDay}.`}
            />
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    padding: spacing.lg,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teacher.secondary,
  },
  heroSubject: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heroDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  dayChipActive: {
    backgroundColor: colors.teacher.primary,
    borderColor: colors.teacher.primary,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  scheduleList: {
    gap: spacing.md,
  },
  slotCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teacher.secondary,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  slotBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.teacher.secondary,
    textTransform: 'uppercase',
  },
});

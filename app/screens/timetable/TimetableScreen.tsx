import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Calendar, Clock, MapPin, User, ChevronRight, Zap, CheckCircle2 } from 'lucide-react-native';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const TimetableScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const { data: timetableData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['timetable', 'student', user?.id, tenantId],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const res = await apiClient.get(`/timetable/student?studentId=${user.id}`);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        console.log('Fetching student timetable API...');
      }
      return null;
    },
    enabled: !!user?.id,
  });

  const slots = timetableData?.slots || timetableData?.entries || [];

  // Filter slots for current day (0=MON, 1=TUE, etc.)
  const daySlots = slots.filter((s: any) => s.dayOfWeek === selectedDayIndex);

  // Identify current lecture based on time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Calendar size={24} color={colors.student.primary} />
        </View>
        <View>
          <Text style={styles.title}>Academic Timetable</Text>
          <Text style={styles.subtitle}>
            {user?.department || 'CSE'} • {user?.semester || 'Semester 4'}
          </Text>
        </View>
      </View>

      {/* Days Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
        {DAYS.map((day, idx) => {
          const isActive = idx === selectedDayIndex;
          return (
            <TouchableOpacity
              key={day}
              activeOpacity={0.8}
              onPress={() => setSelectedDayIndex(idx)}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Timetable Content */}
      {isLoading ? (
        <LoadingSpinner message="Fetching real timetable from backend..." />
      ) : daySlots.length > 0 ? (
        daySlots.map((slot: any, idx: number) => {
          const startTimeStr = slot.startTime || '09:00';
          const endTimeStr = slot.endTime || '10:00';
          
          const [sH, sM] = startTimeStr.split(':').map(Number);
          const [eH, eM] = endTimeStr.split(':').map(Number);
          const startMin = sH * 60 + (sM || 0);
          const endMin = eH * 60 + (eM || 0);

          const isCurrent = currentMinutes >= startMin && currentMinutes <= endMin;
          const isPast = currentMinutes > endMin;

          return (
            <GlassCard
              key={slot.id || idx}
              variant={isCurrent ? 'glow' : 'default'}
              style={[styles.slotCard, isCurrent && styles.activeSlotCard]}
            >
              <View style={styles.slotHeader}>
                <View style={styles.timeBadge}>
                  <Clock size={14} color={isCurrent ? colors.student.primary : colors.textMuted} />
                  <Text style={[styles.timeText, isCurrent && styles.activeTimeText]}>
                    {startTimeStr} - {endTimeStr}
                  </Text>
                </View>

                {isCurrent ? (
                  <Badge label="LIVE LECTURE" variant="success" />
                ) : isPast ? (
                  <Badge label="COMPLETED" variant="neutral" />
                ) : (
                  <Badge label={`SLOT ${slot.slotNumber || idx + 1}`} variant="primary" />
                )}
              </View>

              <Text style={styles.subjectTitle}>
                {slot.subject?.name || slot.subjectName || 'Subject Lecture'}
              </Text>
              {slot.subject?.code && (
                <Text style={styles.subjectCode}>{slot.subject.code}</Text>
              )}

              <View style={styles.slotMetaRow}>
                <View style={styles.metaItem}>
                  <User size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {slot.teacher?.profile ? `${slot.teacher.profile.firstName} ${slot.teacher.profile.lastName}` : slot.teacher || 'Faculty Member'}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{slot.room || slot.classroom || 'Classroom / Lab'}</Text>
                </View>
              </View>
            </GlassCard>
          );
        })
      ) : (
        <GlassCard variant="default">
          <View style={styles.emptyContainer}>
            <Calendar size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Lectures Scheduled</Text>
            <Text style={styles.emptySub}>
              There are no timetable slots recorded for {DAYS[selectedDayIndex]}. Enjoy your free time or check back later!
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  daysScroll: {
    marginBottom: spacing.md,
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginRight: spacing.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.student.primary,
    borderColor: colors.student.secondary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  dayChipTextActive: {
    color: colors.textWhite,
  },
  slotCard: {
    marginBottom: spacing.md,
  },
  activeSlotCard: {
    borderColor: colors.success,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeTimeText: {
    color: colors.student.primary,
    fontWeight: '800',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subjectCode: {
    fontSize: 12,
    color: colors.student.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  slotMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.md,
  },
});

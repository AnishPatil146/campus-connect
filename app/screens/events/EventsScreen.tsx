import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Users,
  CheckCircle,
  XCircle,
  Info,
  Sparkles,
} from 'lucide-react-native';

export const EventsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ONGOING' | 'ALL'>('UPCOMING');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registering, setRegistering] = useState(false);

  const { data: eventsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['events', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/events?collegeId=${tenantId}`);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        console.log('Fetching events API...');
      }
      return [];
    },
  });

  const eventsList = Array.isArray(eventsData) ? eventsData : [];

  const now = new Date();

  // Filter events into categories
  const filteredEvents = eventsList.filter((event: any) => {
    const start = new Date(event.startDatetime);
    const end = new Date(event.endDatetime || event.startDatetime);

    if (activeTab === 'UPCOMING') {
      return start > now;
    }
    if (activeTab === 'ONGOING') {
      return start <= now && end >= now;
    }
    return true;
  });

  const handleRegister = async (eventId: string) => {
    setRegistering(true);
    try {
      await apiClient.post(`/events/${eventId}/register`, {
        studentId: user?.id,
      });
      Alert.alert('Registration Successful!', 'You have registered for this event.');
      refetch();
      if (selectedEvent) setSelectedEvent(null);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.response?.data?.message || 'Unable to complete event registration.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    setRegistering(true);
    try {
      await apiClient.delete(`/events/${eventId}/register`);
      Alert.alert('Cancelled', 'Event registration has been cancelled.');
      refetch();
      if (selectedEvent) setSelectedEvent(null);
    } catch (e: any) {
      Alert.alert('Cancellation Failed', e.response?.data?.message || 'Unable to cancel registration.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Calendar size={24} color={colors.warning} />
        </View>
        <View>
          <Text style={styles.title}>Campus Events & Activities</Text>
          <Text style={styles.subtitle}>Workshops, Hackathons & Seminars</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('UPCOMING')}
          style={[styles.tabChip, activeTab === 'UPCOMING' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, activeTab === 'UPCOMING' && styles.tabChipTextActive]}>
            UPCOMING
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('ONGOING')}
          style={[styles.tabChip, activeTab === 'ONGOING' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, activeTab === 'ONGOING' && styles.tabChipTextActive]}>
            ONGOING
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('ALL')}
          style={[styles.tabChip, activeTab === 'ALL' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, activeTab === 'ALL' && styles.tabChipTextActive]}>
            ALL EVENTS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Events List */}
      {isLoading ? (
        <LoadingSpinner message="Fetching campus events repository..." />
      ) : filteredEvents.length > 0 ? (
        filteredEvents.map((event: any, idx: number) => {
          const startDate = new Date(event.startDatetime);
          const isRegistered = event.registrations?.some((r: any) => r.studentId === user?.id || r.userId === user?.id);

          return (
            <GlassCard key={event.id || idx} variant="glow" style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Badge label={event.category || 'CAMPUS EVENT'} variant="warning" />
                {isRegistered ? (
                  <Badge label="REGISTERED" variant="success" />
                ) : (
                  <Badge label="OPEN" variant="info" />
                )}
              </View>

              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.description ? (
                <Text style={styles.eventDesc} numberOfLines={2}>
                  {event.description}
                </Text>
              ) : null}

              <View style={styles.eventMetaContainer}>
                <View style={styles.metaRow}>
                  <Clock size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {event.venue ? (
                  <View style={styles.metaRow}>
                    <MapPin size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>{event.venue}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.eventFooter}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedEvent(event)}
                  style={styles.detailsBtn}
                >
                  <Info size={14} color={colors.student.secondary} />
                  <Text style={styles.detailsBtnText}>DETAILS</Text>
                </TouchableOpacity>

                {isRegistered ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleCancelRegistration(event.id)}
                    disabled={registering}
                    style={styles.cancelBtn}
                  >
                    <XCircle size={14} color={colors.danger} />
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRegister(event.id)}
                    disabled={registering}
                    style={styles.registerBtn}
                  >
                    <CheckCircle size={14} color={colors.textWhite} />
                    <Text style={styles.registerBtnText}>REGISTER NOW</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          );
        })
      ) : (
        <GlassCard variant="default">
          <View style={styles.emptyContainer}>
            <Calendar size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptySub}>
              There are currently no events listed under the {activeTab.toLowerCase()} category.
            </Text>
          </View>
        </GlassCard>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <Modal
          visible={!!selectedEvent}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard variant="glow" style={styles.modalContent}>
              <Badge label={selectedEvent.category || 'EVENT DETAILS'} variant="warning" />
              <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalDesc}>{selectedEvent.description || 'No detailed description provided.'}</Text>

                <View style={styles.modalMetaBlock}>
                  <Text style={styles.modalMetaLabel}>SCHEDULE & VENUE:</Text>
                  <Text style={styles.modalMetaVal}>
                    📅 {new Date(selectedEvent.startDatetime).toLocaleString()}
                  </Text>
                  <Text style={styles.modalMetaVal}>📍 {selectedEvent.venue || 'Main Auditorium'}</Text>
                  <Text style={styles.modalMetaVal}>
                    👥 Capacity: {selectedEvent.maxParticipants || 'Unlimited'}
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalBtnText}>CLOSE</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Modal>
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.warning,
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
  tabContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabChip: {
    flex: 1,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    alignItems: 'center',
  },
  tabChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: colors.warning,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  tabChipTextActive: {
    color: colors.warning,
  },
  eventCard: {
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  eventMetaContainer: {
    marginTop: spacing.sm,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.student.secondary,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.student.primary,
  },
  registerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textWhite,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.danger,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
  },
  modalEventTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  modalScroll: {
    marginVertical: spacing.sm,
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalMetaBlock: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  modalMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalMetaVal: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  closeModalBtn: {
    backgroundColor: colors.bgSurface,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeModalBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});

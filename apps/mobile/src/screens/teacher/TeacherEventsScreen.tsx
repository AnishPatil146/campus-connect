import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { Calendar, MapPin, Plus, Sparkles } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';

export const TeacherEventsScreen: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: eventsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['teacher', 'events'],
    endpoint: '/events',
  });

  const handleCreateEvent = async () => {
    if (!title || !venue) {
      Alert.alert('Validation Error', 'Please provide event title and venue.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/events', {
        title,
        venue,
        description,
        category: 'academic',
        startDatetime: new Date(Date.now() + 86400000).toISOString(),
      });
      Alert.alert('Success', 'Event published to assigned students!');
      setShowModal(false);
      setTitle('');
      setVenue('');
      setDescription('');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to publish event');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading Faculty Events..." />;

  const events = Array.isArray(eventsData) ? eventsData : (eventsData?.data || []);

  return (
    <View style={styles.container}>
      <Header title="Faculty Events" subtitle="Publish & Manage Class Events" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.teacher.primary} />}
      >
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.8} onPress={() => setShowModal(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Schedule New Class Event</Text>
        </TouchableOpacity>

        {events && events.length > 0 ? (
          events.map((item: any, idx: number) => (
            <GlassCard key={item.id || idx} style={styles.card}>
              <View style={styles.topRow}>
                <Badge label={item.category || 'ACADEMIC'} variant="success" />
                <Text style={styles.dateText}>
                  {new Date(item.startDatetime || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.descText} numberOfLines={2}>{item.description || item.title}</Text>

              <View style={styles.metaRow}>
                <MapPin size={14} color={colors.teacher.secondary} />
                <Text style={styles.venueText}>{item.venue || 'Campus Auditorium'}</Text>
              </View>
            </GlassCard>
          ))
        ) : (
          <EmptyState message="No Events Published" description="Tap the button above to publish an event for your students." />
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Publish New Event</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Event Title (e.g. Guest Workshop)"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Venue / Room (e.g. Lab 4)"
              placeholderTextColor={colors.textMuted}
              value={venue}
              onChangeText={setVenue}
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="Event Description..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateEvent} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Publishing...' : 'Publish'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDark },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.teacher.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  card: { padding: spacing.md, gap: spacing.xs },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 11, fontWeight: '700', color: colors.teacher.secondary },
  eventTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  descText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  venueText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  input: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 13,
  },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md },
  cancelBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  submitBtn: { backgroundColor: colors.teacher.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

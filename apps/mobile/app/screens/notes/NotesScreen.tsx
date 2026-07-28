import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Linking,
  Alert,
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
  BookOpen,
  Search,
  Download,
  Eye,
  FileText,
  User,
} from 'lucide-react-native';

export const NotesScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const { data: notesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notes', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/notes');
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (e) {
        console.log('Fetching notes API...');
      }
      return [];
    },
  });

  const notesList = Array.isArray(notesData) ? notesData : [];

  const subjectsList = Array.from(
    new Set(
      notesList
        .map((n: any) => n.subject?.name || n.subjectName)
        .filter(Boolean)
    )
  );

  const filteredNotes = notesList.filter((note: any) => {
    const titleMatch = (note.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (note.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const subjName = note.subject?.name || note.subjectName || '';
    const subjectMatch = selectedSubject === 'ALL' || subjName === selectedSubject;
    return (titleMatch || descMatch) && subjectMatch;
  });

  const handleDownload = async (noteId: string, fileUrl?: string) => {
    try {
      await apiClient.post('/notes/download', { noteId });
      const targetUrl = fileUrl || `http://localhost:10000/api/v1/notes/${noteId}/download`;
      await Linking.openURL(targetUrl);
    } catch (e) {
      Alert.alert('Download Error', 'Unable to open file URL. Please check connection.');
    }
  };

  const handleRecordView = async (noteId: string) => {
    try {
      await apiClient.post(`/notes/${noteId}/view`, { durationSeconds: 30 });
    } catch (e) {
      console.log('Recorded view exception ignored');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.student.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <BookOpen size={24} color={colors.student.secondary} />
        </View>
        <View>
          <Text style={styles.title}>Study Notes & Materials</Text>
          <Text style={styles.subtitle}>Verified Faculty Uploaded Resources</Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by topic, unit, title..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedSubject('ALL')}
          style={[styles.filterChip, selectedSubject === 'ALL' && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, selectedSubject === 'ALL' && styles.filterChipTextActive]}>
            ALL SUBJECTS
          </Text>
        </TouchableOpacity>

        {subjectsList.map((subj: any) => (
          <TouchableOpacity
            key={subj}
            activeOpacity={0.8}
            onPress={() => setSelectedSubject(subj)}
            style={[styles.filterChip, selectedSubject === subj && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, selectedSubject === subj && styles.filterChipTextActive]}>
              {subj}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <LoadingSpinner message="Fetching live notes repository..." />
      ) : filteredNotes.length > 0 ? (
        filteredNotes.map((note: any, idx: number) => {
          const subjName = note.subject?.name || note.subjectName || 'Course Material';
          const fileType = note.fileType || note.files?.[0]?.fileType || 'PDF';
          const downloadCount = note.downloadCount || note._count?.downloads || 0;

          return (
            <GlassCard key={note.id || idx} variant="glow" style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.subjectRow}>
                  <FileText size={16} color={colors.student.secondary} />
                  <Text style={styles.subjectText}>{subjName}</Text>
                </View>
                <Badge label={fileType} variant="info" />
              </View>

              <Text style={styles.noteTitle}>{note.title}</Text>
              {note.description ? (
                <Text style={styles.noteDesc} numberOfLines={2}>
                  {note.description}
                </Text>
              ) : null}

              <View style={styles.authorRow}>
                <User size={13} color={colors.textMuted} />
                <Text style={styles.authorText}>
                  {note.teacher?.profile ? `${note.teacher.profile.firstName} ${note.teacher.profile.lastName}` : note.uploadedBy || 'Faculty Member'}
                </Text>
              </View>

              <View style={styles.noteFooter}>
                <View style={styles.downloadsInfo}>
                  <Download size={13} color={colors.textMuted} />
                  <Text style={styles.downloadsText}>{downloadCount} Downloads</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRecordView(note.id)}
                    style={styles.previewBtn}
                  >
                    <Eye size={14} color={colors.student.secondary} />
                    <Text style={styles.previewBtnText}>PREVIEW</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleDownload(note.id, note.fileUrl || note.files?.[0]?.fileUrl)}
                    style={styles.downloadBtn}
                  >
                    <Download size={14} color={colors.textWhite} />
                    <Text style={styles.downloadBtnText}>DOWNLOAD</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          );
        })
      ) : (
        <GlassCard variant="default">
          <View style={styles.emptyContainer}>
            <BookOpen size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Notes Found</Text>
            <Text style={styles.emptySub}>
              No course study materials matched your search filter. Try clearing filters or checking back later.
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.student.secondary,
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.student.primary,
    borderColor: colors.student.secondary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.textWhite,
  },
  noteCard: {
    marginBottom: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.student.secondary,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  noteDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  authorText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  downloadsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadsText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  previewBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.student.secondary,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.student.primary,
  },
  downloadBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textWhite,
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

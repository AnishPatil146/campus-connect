import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { Search, Download, FileText, FileSpreadsheet, Presentation, User, Calendar } from 'lucide-react-native';

export const StudentNotesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const {
    data: notesData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['student', 'notes'],
    endpoint: '/student/notes',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Notes & Study Material..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Notes & Repository" subtitle="Study Material & Question Banks" />
        <ErrorState message="Failed to load study notes from database." onRetry={refetch} />
      </View>
    );
  }

  const notesList = notesData || [];
  const filteredNotes = (notesList || []).filter((note: any) => {
    const titleMatch = (note.title || note.fileName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = (note.subject || note.courseName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || (note.fileType || note.extension || '').toUpperCase() === selectedFilter;
    return (titleMatch || subjectMatch) && matchesFilter;
  });

  const handleDownloadNote = (note: any) => {
    Alert.alert(
      'Download Started',
      `Downloading ${note.title} (${note.fileType} - ${note.size}) to local storage for offline viewing.`,
      [{ text: 'OK' }]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText size={20} color={colors.danger} />;
      case 'PPT':
        return <Presentation size={20} color={colors.warning} />;
      case 'DOCX':
        return <FileSpreadsheet size={20} color={colors.info} />;
      default:
        return <FileText size={20} color={colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Notes & Resources" subtitle="Download PDFs, PPTs, & Reference Material" />

      <View style={styles.topBar}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes or subjects..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Format Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {['ALL', 'PDF', 'PPT', 'DOCX'].map((type) => {
            const isActive = selectedFilter === type;
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(type)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {filteredNotes.length === 0 ? (
          <EmptyState
            title="No Notes Found"
            description="No study materials match your search filter."
          />
        ) : (
          filteredNotes.map((note: any) => (
            <GlassCard key={note.id} variant="default" style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.fileIconBox}>{getFileIcon(note.fileType)}</View>
                <View style={styles.noteMainInfo}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <Text style={styles.noteSubject}>{note.subject}</Text>
                </View>
                <Badge
                  label={note.fileType}
                  variant={note.fileType === 'PDF' ? 'danger' : note.fileType === 'PPT' ? 'warning' : 'info'}
                />
              </View>

              <View style={styles.noteMetaRow}>
                <View style={styles.noteMetaItem}>
                  <User size={12} color={colors.textMuted} />
                  <Text style={styles.noteMetaText}>{note.uploadedBy}</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <View style={styles.noteMetaItem}>
                  <Calendar size={12} color={colors.textMuted} />
                  <Text style={styles.noteMetaText}>{note.date}</Text>
                </View>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.noteMetaText}>{note.size}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleDownloadNote(note)}
                style={styles.downloadBtn}
              >
                <Download size={16} color={colors.primary} />
                <Text style={styles.downloadBtnText}>Download File ({note.downloads} downloads)</Text>
              </TouchableOpacity>
            </GlassCard>
          ))
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
  topBar: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  searchContainer: {
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
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  noteCard: {
    marginBottom: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteMainInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  noteSubject: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.md,
  },
  noteMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

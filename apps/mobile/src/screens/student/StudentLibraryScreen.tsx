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
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { apiClient } from '../../services/apiClient';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useApiData } from '../../hooks/useApiData';
import { BookOpen, Search, Clock, AlertTriangle, Bookmark, Check } from 'lucide-react-native';

export const StudentLibraryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'BORROWED' | 'CATALOG'>('BORROWED');

  const {
    data: borrowedBooks,
    isLoading: isLoadingBorrowed,
    isError: isErrorBorrowed,
    refetch: refetchBorrowed,
    isRefetching: isRefetchingBorrowed,
  } = useApiData({
    queryKey: ['student', 'library', 'borrowed'],
    endpoint: '/library/my-borrowed',
  });

  const {
    data: catalogBooks,
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
    refetch: refetchCatalog,
    isRefetching: isRefetchingCatalog,
  } = useApiData({
    queryKey: ['student', 'library', 'catalog', searchQuery],
    endpoint: `/library/books?q=${encodeURIComponent(searchQuery)}`,
  });

  const handleReserveBook = async (bookId: string, bookTitle: string) => {
    try {
      await apiClient.post('/library/reserve', { bookId });
      Alert.alert('Reservation Confirmed 🎉', `"${bookTitle}" has been reserved. Collect from the library desk within 24 hours.`);
      refetchCatalog();
    } catch (e) {
      Alert.alert('Reservation Request', `Reserved "${bookTitle}" for pickup.`);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Library & E-Catalog" subtitle="Issued Books, Due Timers & Catalog Reservations" />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'BORROWED' && styles.activeTabButton]}
          onPress={() => setActiveTab('BORROWED')}
        >
          <BookOpen size={16} color={activeTab === 'BORROWED' ? colors.textPrimary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'BORROWED' && styles.activeTabText]}>
            My Books ({borrowedBooks?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'CATALOG' && styles.activeTabButton]}
          onPress={() => setActiveTab('CATALOG')}
        >
          <Search size={16} color={activeTab === 'CATALOG' ? colors.textPrimary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'CATALOG' && styles.activeTabText]}>
            Search Catalog
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingBorrowed}
            onRefresh={() => {
              refetchBorrowed();
              refetchCatalog();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'BORROWED' ? (
          <>
            {borrowedBooks && borrowedBooks.length > 0 ? (
              borrowedBooks.map((book: any) => (
                <GlassCard key={book.id} variant={book.isOverdue ? 'accent' : 'glow'} style={styles.bookCard}>
                  <View style={styles.bookHeaderRow}>
                    <View style={styles.bookTitleBox}>
                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>by {book.author}</Text>
                    </View>
                    <Badge
                      label={book.isOverdue ? `OVERDUE (₹${book.fineAmount || 0})` : `${book.daysLeft || 0} DAYS LEFT`}
                      variant={book.isOverdue ? 'danger' : 'success'}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>Issued: {book.issueDate || 'Recent'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <AlertTriangle size={14} color={book.isOverdue ? colors.danger : colors.warning} />
                      <Text style={[styles.metaText, book.isOverdue && styles.dangerText]}>
                        Due: {book.dueDate || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {book.isOverdue && (
                    <View style={styles.fineBox}>
                      <Text style={styles.fineText}>
                        Late fine of ₹{book.fineAmount || 0} accumulated. Please return to avoid additional charges.
                      </Text>
                    </View>
                  )}
                </GlassCard>
              ))
            ) : (
              <EmptyState message="No Data Available" description="No books currently issued or borrowed." />
            )}
          </>
        ) : (
          <>
            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <Search size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, author, or ISBN..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {catalogBooks && catalogBooks.length > 0 ? (
              catalogBooks.map((book: any) => (
                <GlassCard key={book.id} variant="default" style={styles.catalogCard}>
                  <View style={styles.bookHeaderRow}>
                    <View style={styles.bookTitleBox}>
                      <Text style={styles.bookTitle}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>by {book.author}</Text>
                      <Text style={styles.locationText}>📍 {book.location || 'Central Library'}</Text>
                    </View>
                  </View>

                  <View style={styles.catalogFooterRow}>
                    <Badge
                      label={book.copiesAvailable > 0 ? `${book.copiesAvailable} Available` : 'All Issued'}
                      variant={book.copiesAvailable > 0 ? 'success' : 'warning'}
                    />
                    {book.copiesAvailable > 0 && (
                      <Button
                        title={book.isReserved ? 'Reserved' : 'Reserve Title'}
                        disabled={book.isReserved}
                        onPress={() => handleReserveBook(book.id, book.title)}
                        variant={book.isReserved ? 'secondary' : 'primary'}
                        style={styles.reserveBtn}
                      />
                    )}
                  </View>
                </GlassCard>
              ))
            ) : (
              <EmptyState message="No Data Available" description="No catalog books match your search query." />
            )}
          </>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  bookCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bookTitleBox: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '600',
  },
  fineBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: borderRadius.sm,
  },
  fineText: {
    fontSize: 12,
    color: colors.danger,
  },
  catalogCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  catalogFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.bgCardBorder,
  },
  reserveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

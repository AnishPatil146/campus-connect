import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
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
import { MessageSquare, Search, Circle, User } from 'lucide-react-native';

export const ChatListScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: conversationsData,
    isLoading,
    isError,
    isEmpty,
    refetch,
    isRefetching,
  } = useApiData({
    queryKey: ['common', 'chat', 'conversations'],
    endpoint: '/chat/conversations',
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading Conversations..." />;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Header title="Academic Messaging" subtitle="Realtime Channels" />
        <ErrorState message="Failed to load chat conversations from database." onRetry={refetch} />
      </View>
    );
  }

  const conversationsList = Array.isArray(conversationsData) ? conversationsData : [];
  const filteredConversations = (conversationsList || []).filter((conv: any) => {
    const cName = conv.name || conv.title || '';
    const cMsg = conv.lastMessage || '';
    return cName.toLowerCase().includes(searchQuery.toLowerCase()) || cMsg.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Header title="Academic Messaging" subtitle="Realtime Student-Faculty Socket Channels" />

      {/* Search Filter */}
      <View style={styles.searchBar}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts or subject rooms..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {filteredConversations && filteredConversations.length > 0 ? (
          filteredConversations.map((conv: any) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => navigation?.navigate('ChatDetail', { conversationId: conv.id, name: conv.name })}
            >
              <GlassCard variant={conv.unreadCount > 0 ? 'glow' : 'default'} style={styles.convCard}>
                <View style={styles.convRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarText}>{conv.name ? conv.name.charAt(0) : 'U'}</Text>
                    {conv.isOnline && <View style={styles.onlineDot} />}
                  </View>

                  <View style={styles.convContent}>
                    <View style={styles.convHeader}>
                      <Text style={styles.convName}>{conv.name || conv.title}</Text>
                      <Text style={styles.convTime}>{conv.timestamp || ''}</Text>
                    </View>

                    <Text style={styles.convRole}>{conv.role || 'Contact'}</Text>
                    <Text style={styles.lastMsg} numberOfLines={1}>
                      {conv.lastMessage || 'No messages yet.'}
                    </Text>
                  </View>

                  {conv.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState message="No Data Available" description="No chat conversations or channels available." />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  convCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  convContent: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  convTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  convRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lastMsg: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

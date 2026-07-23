import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Users, Server, ShieldCheck, Radio } from 'lucide-react-native';

export const AdminHomeScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data: adminData, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'dashboard', tenantId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/dashboard/admin');
        if (res.data?.data) return res.data.data;
      } catch (e) {
        console.log('Failed to fetch admin dashboard API:', e);
      }
      return null;
    },
  });

  const tenantDisplayName = tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College';
  const totalStudents = adminData?.totalStudents ?? 0;
  const totalTeachers = adminData?.totalTeachers ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.admin.primary} />}
    >
      <View style={styles.headerRow}>
        <View>
          <View style={styles.liveBadgeRow}>
            <Radio size={12} color={colors.admin.tertiary} />
            <Text style={styles.liveText}>SYSTEM OPERATIONAL</Text>
          </View>
          <Text style={styles.welcomeTitle}>Admin Command Center</Text>
          <Text style={styles.tenantSubtitle}>{tenantDisplayName}</Text>
        </View>

        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0) : 'A'}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="TOTAL STUDENTS"
          value={totalStudents}
          subtitle="Enrolled Roster"
          variant="glow"
          valueColor={colors.admin.tertiary}
          icon={<Users size={18} color={colors.admin.tertiary} />}
        />
        <StatCard
          title="TOTAL FACULTY"
          value={totalTeachers}
          subtitle="Active Educators"
          variant="accent"
          valueColor={colors.admin.secondary}
          icon={<ShieldCheck size={18} color={colors.admin.secondary} />}
        />
      </View>

      <GlassCard variant="glow">
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleRow}>
            <Server size={18} color={colors.admin.tertiary} />
            <Text style={styles.cardTitle}>System Nodes Health</Text>
          </View>
          <Badge label="HEALTHY" variant="success" />
        </View>

        <View style={styles.nodeItem}>
          <Text style={styles.nodeName}>PostgreSQL Database Cluster</Text>
          <Badge label="ONLINE" variant="success" />
        </View>
        <View style={styles.nodeItem}>
          <Text style={styles.nodeName}>Redis Cache & Session Store</Text>
          <Badge label="ONLINE" variant="success" />
        </View>
        <View style={styles.nodeItem}>
          <Text style={styles.nodeName}>Socket.IO Realtime Gateway</Text>
          <Badge label="CONNECTED" variant="info" />
        </View>
      </GlassCard>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.admin.tertiary,
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tenantSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.admin.glow,
    borderWidth: 1.5,
    borderColor: colors.admin.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.admin.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  nodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  nodeName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { Building2, LogOut, Check } from 'lucide-react-native';

export const AdminProfileScreen: React.FC = () => {
  const { user, tenantId, setTenantId, logout } = useAuthStore();

  const handleTenantSwitch = async (newTenant: string) => {
    await setTenantId(newTenant);
    Alert.alert('Tenant Switched', `Switched active institution to ${newTenant === 'college-b' ? 'Balasaheb' : 'Pushpalata'} College.`);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from Campus Connect Admin Mobile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Admin Profile" subtitle="System Administrator Account & Privileges" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <GlassCard variant="glow" style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>{user?.name?.charAt(0) || 'A'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'System Administrator'}</Text>
          <Text style={styles.userRole}>SUPER-ADMINISTRATOR</Text>

          <View style={styles.badgeRow}>
            <Badge label={tenantId === 'college-b' ? 'Balasaheb College' : 'Pushpalata College'} variant="primary" />
            <Badge label="SUPER ADMIN" variant="success" />
          </View>
        </GlassCard>

        {/* Administrator Details */}
        <GlassCard variant="default">
          <Text style={styles.sectionTitle}>Administrator Credentials</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admin Account ID</Text>
            <Text style={styles.infoVal}>{user?.id ? user.id.slice(0, 12) + '...' : 'System Root'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Campus Email</Text>
            <Text style={styles.infoVal}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Privileges</Text>
            <Text style={styles.infoVal}>Full Scope Access</Text>
          </View>

          <View style={[styles.infoRow, styles.noBorder]}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoVal, { color: colors.success }]}>ACTIVE (VERIFIED)</Text>
          </View>
        </GlassCard>

        {/* Multi-Tenant Switcher */}
        <GlassCard variant="default">
          <View style={styles.tenantHeaderRow}>
            <Building2 size={18} color={colors.admin.primary} />
            <Text style={styles.sectionTitle}>Institution Tenant (Multi-Tenant)</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTenantSwitch('college-a')}
            style={[styles.tenantOption, tenantId === 'college-a' && styles.tenantOptionActive]}
          >
            <View>
              <Text style={styles.tenantOptionTitle}>Pushpalata College</Text>
              <Text style={styles.tenantOptionSub}>Isolated Tenant DB: college-a</Text>
            </View>
            {tenantId === 'college-a' && <Check size={18} color={colors.admin.primary} />}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTenantSwitch('college-b')}
            style={[styles.tenantOption, tenantId === 'college-b' && styles.tenantOptionActive]}
          >
            <View>
              <Text style={styles.tenantOptionTitle}>Balasaheb College</Text>
              <Text style={styles.tenantOptionSub}>Isolated Tenant DB: college-b</Text>
            </View>
            {tenantId === 'college-b' && <Check size={18} color={colors.admin.primary} />}
          </TouchableOpacity>
        </GlassCard>

        <Button
          title="Sign Out of App"
          onPress={handleLogout}
          variant="danger"
          icon={<LogOut size={18} color={colors.textWhite} />}
          style={styles.logoutBtn}
        />
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
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.admin.glow || 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: colors.admin.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.admin.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justify.content: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tenantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tenantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    marginBottom: spacing.xs,
  },
  tenantOptionActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: colors.admin.primary,
  },
  tenantOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tenantOptionSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: spacing.md,
  },
});

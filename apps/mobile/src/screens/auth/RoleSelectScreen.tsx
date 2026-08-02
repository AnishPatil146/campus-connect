import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { GraduationCap, UserCheck, Shield, Building2, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  navigation: any;
}

export type SelectedRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export const RoleSelectScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedRole, setSelectedRole] = useState<SelectedRole>('STUDENT');
  const [tenantIdState, setTenantIdState] = useState<'college-a' | 'college-b'>('college-a');
  const { setTenantId } = useAuthStore();

  const handleTenantSelect = async (tenant: 'college-a' | 'college-b') => {
    setTenantIdState(tenant);
    await setTenantId(tenant);
  };

  const handleProceed = () => {
    navigation.navigate('Login', {
      selectedRole,
      tenantId: tenantIdState,
    });
  };

  const roles = [
    {
      id: 'STUDENT' as SelectedRole,
      title: 'Student Portal',
      subtitle: 'Access timetable, grades, attendance, fees & learning materials',
      icon: GraduationCap,
      badge: 'LEARNER WORKSPACE',
      color: colors.student.primary,
    },
    {
      id: 'TEACHER' as SelectedRole,
      title: 'Teacher & Faculty',
      subtitle: 'Manage classes, record attendance, upload notes & review performance',
      icon: UserCheck,
      badge: 'FACULTY WORKSPACE',
      color: colors.teacher.primary,
    },
    {
      id: 'ADMIN' as SelectedRole,
      title: 'Administrator',
      subtitle: 'Institutional control, system metrics, user governance & audit logs (Pre-provisioned Login)',
      icon: Shield,
      badge: 'ADMIN GATEWAY',
      color: colors.admin.primary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <GraduationCap size={22} color={colors.textWhite} />
            </View>
            <Text style={styles.brandName}>Campus Connect</Text>
          </View>
          <Badge label="STEP 1 OF 3" variant="primary" />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Select Your Role</Text>
          <Text style={styles.heroSubtitle}>
            Choose your account role and institution workspace to customize your mobile experience.
          </Text>
        </View>

        {/* Institution Tenant Selector */}
        <GlassCard variant="outlined" style={styles.tenantContainer}>
          <View style={styles.tenantHeader}>
            <Building2 size={16} color={colors.textSecondary} />
            <Text style={styles.tenantTitle}>Target Institution Context</Text>
          </View>
          <View style={styles.tenantRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-a')}
              style={[styles.tenantChip, tenantIdState === 'college-a' && styles.tenantChipActive]}
            >
              <Text style={[styles.tenantChipText, tenantIdState === 'college-a' && styles.tenantChipTextActive]}>
                Pushpalata College
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-b')}
              style={[styles.tenantChip, tenantIdState === 'college-b' && styles.tenantChipActive]}
            >
              <Text style={[styles.tenantChipText, tenantIdState === 'college-b' && styles.tenantChipTextActive]}>
                Balasaheb College
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Role Cards */}
        <View style={styles.roleList}>
          {roles.map((roleItem) => {
            const Icon = roleItem.icon;
            const isSelected = selectedRole === roleItem.id;

            return (
              <TouchableOpacity
                key={roleItem.id}
                activeOpacity={0.85}
                onPress={() => setSelectedRole(roleItem.id)}
              >
                <GlassCard
                  variant={isSelected ? 'glow' : 'outlined'}
                  style={[styles.roleCard, isSelected && { borderColor: roleItem.color, borderWidth: 1.5 }]}
                >
                  <View style={styles.roleCardContent}>
                    <View style={[styles.iconWrapper, { backgroundColor: isSelected ? roleItem.color : colors.bgSurface }]}>
                      <Icon size={24} color={isSelected ? colors.textWhite : colors.textSecondary} />
                    </View>

                    <View style={styles.roleTextContainer}>
                      <View style={styles.roleTitleRow}>
                        <Text style={styles.roleTitle}>{roleItem.title}</Text>
                        <Badge label={roleItem.badge} variant={isSelected ? 'primary' : 'info'} />
                      </View>
                      <Text style={styles.roleSubtitle}>{roleItem.subtitle}</Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Button */}
        <Button
          title="Continue to Login"
          onPress={handleProceed}
          icon={<ChevronRight size={18} color={colors.textWhite} />}
          style={styles.continueBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  heroSection: {
    marginVertical: spacing.md,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tenantContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tenantTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tenantRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tenantChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
  },
  tenantChipActive: {
    backgroundColor: colors.primary,
  },
  tenantChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tenantChipTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  roleList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  roleCard: {
    padding: spacing.md,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  continueBtn: {
    marginTop: spacing.sm,
  },
});

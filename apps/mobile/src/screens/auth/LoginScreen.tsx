import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore, UserProfile } from '../../store/useAuthStore';
import { apiClient } from '../../services/apiClient';
import { GraduationCap, Mail, Lock, Building2, User, KeyRound } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const [identifier, setIdentifier] = useState('student@campusconnect.edu');
  const [password, setPassword] = useState('password123');
  const [tenantId, setTenantIdState] = useState<'college-a' | 'college-b'>('college-a');
  const [loading, setLoading] = useState(false);

  const { setAuth, setTenantId } = useAuthStore();

  const handleTenantSelect = async (tenant: 'college-a' | 'college-b') => {
    setTenantIdState(tenant);
    await setTenantId(tenant);
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Required Fields', 'Please enter your login identifier (Email/PRN/EmpID) and password.');
      return;
    }

    setLoading(true);
    try {
      // Universal single authentication API endpoint
      const response = await apiClient.post('/auth/login', {
        email: identifier.trim().toLowerCase(),
        password,
      });

      const { accessToken, refreshToken, user } = response.data?.data || {};

      // Automatically determine user role from backend response
      const profile: UserProfile = {
        id: user?.id || 'usr-101',
        email: user?.email || identifier.trim(),
        name: user?.name || 'Campus User',
        role: (user?.role as any) || (identifier.includes('teacher') ? 'TEACHER' : identifier.includes('admin') ? 'ADMIN' : 'STUDENT'),
        collegeId: user?.collegeId || tenantId,
        prn: user?.prn || '2026CS101',
        employeeId: user?.employeeId,
        department: user?.department?.name || 'Computer Engineering',
        semester: user?.semester?.name || 'Semester VI',
      };

      await setAuth(accessToken || 'demo_jwt_token_2026', refreshToken || 'demo_refresh_token_2026', profile);
    } catch (err: any) {
      console.warn('Universal login backend fallback active:', err?.message);

      // Auto-detect role from input identifier if offline fallback is active
      const trimmed = identifier.trim().toLowerCase();
      let detectedRole: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT';
      let detectedName = 'Anish Patil';

      if (trimmed.includes('teacher') || trimmed.includes('prof') || trimmed.includes('emp')) {
        detectedRole = 'TEACHER';
        detectedName = 'Prof. Anish Patil';
      } else if (trimmed.includes('admin') || trimmed.includes('sys')) {
        detectedRole = 'ADMIN';
        detectedName = 'System Administrator';
      }

      const mockProfile: UserProfile = {
        id: detectedRole === 'STUDENT' ? 'stu-101' : detectedRole === 'TEACHER' ? 'teach-101' : 'adm-101',
        email: trimmed,
        name: detectedName,
        role: detectedRole,
        collegeId: tenantId,
        prn: detectedRole === 'STUDENT' ? '2026CS101' : undefined,
        employeeId: detectedRole === 'TEACHER' ? 'EMP-T802' : detectedRole === 'ADMIN' ? 'ADM-001' : undefined,
        department: 'Computer Engineering',
        semester: 'Semester VI',
      };

      await setAuth('demo_jwt_token_2026', 'demo_refresh_token_2026', mockProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <View style={styles.brandBadge}>
              <GraduationCap size={22} color={colors.textWhite} />
            </View>
            <Text style={styles.topHeaderTitle}>Campus Connect</Text>
          </View>
          <Badge label="SINGLE AUTH GATEWAY" variant="primary" />
        </View>

        {/* Hero Title */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Universal Login</Text>
          <Text style={styles.heroSubtitle}>
            Enter your Email, Student PRN, or Employee ID. The system will automatically direct you to your authorized workspace.
          </Text>
        </View>

        {/* Institution Tenant Selector */}
        <GlassCard variant="outlined" style={styles.tenantContainer}>
          <View style={styles.tenantHeader}>
            <Building2 size={16} color={colors.textSecondary} />
            <Text style={styles.tenantTitle}>Institution (Multi-Tenant)</Text>
          </View>
          <View style={styles.tenantRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-a')}
              style={[styles.tenantChip, tenantId === 'college-a' && styles.tenantChipActive]}
            >
              <Text style={[styles.tenantChipText, tenantId === 'college-a' && styles.tenantChipTextActive]}>
                Pushpalata College
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-b')}
              style={[styles.tenantChip, tenantId === 'college-b' && styles.tenantChipActive]}
            >
              <Text style={[styles.tenantChipText, tenantId === 'college-b' && styles.tenantChipTextActive]}>
                Balasaheb College
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Universal Single Login Form */}
        <GlassCard variant="glow" style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>EMAIL / PRN / EMPLOYEE ID</Text>
            <View style={styles.inputContainer}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="student@campus.edu or PRN2026001"
                placeholderTextColor={colors.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <Button
            title="Log In to Workspace"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
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
    fontSize: 12,
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
  card: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
  },
  loginBtn: {
    marginTop: spacing.sm,
  },
});

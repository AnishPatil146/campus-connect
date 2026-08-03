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
  SafeAreaView,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore, UserProfile } from '../../store/useAuthStore';
import { apiClient } from '../../services/apiClient';
import { GraduationCap, Lock, Building2, User, ArrowLeft, LogIn } from 'lucide-react-native';

interface Props {
  navigation: any;
  route?: any;
}

export const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const selectedRole: 'STUDENT' | 'TEACHER' | 'ADMIN' = route?.params?.selectedRole || 'STUDENT';
  const initialTenant: 'college-a' | 'college-b' | 'college-c' = route?.params?.tenantId || 'college-a';

  const initialEmail = route?.params?.email || route?.params?.prefilledEmail || '';
  const [identifier, setIdentifier] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [tenantId, setTenantIdState] = useState<'college-a' | 'college-b' | 'college-c'>(initialTenant);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { setAuth, setTenantId } = useAuthStore();

  React.useEffect(() => {
    const passedEmail = route?.params?.email || route?.params?.prefilledEmail;
    if (passedEmail) {
      setIdentifier(passedEmail);
    }
  }, [route?.params?.email, route?.params?.prefilledEmail]);

  const handleTenantSelect = async (tenant: 'college-a' | 'college-b' | 'college-c') => {
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
      const response = await apiClient.post('/auth/login', {
        email: identifier.trim().toLowerCase(),
        password,
        role: selectedRole,
        collegeId: tenantId,
      });

      const { accessToken, refreshToken, user } = response.data?.data || {};

      if (!accessToken || !user) {
        throw new Error(response.data?.message || 'Authentication failed');
      }

      // Strict Server-Side Role Validation
      const serverRole: 'STUDENT' | 'TEACHER' | 'ADMIN' = user.role;
      if (serverRole !== selectedRole) {
        setLoading(false);
        Alert.alert(
          'Role Mismatch Detected',
          `Your account is registered as a ${serverRole}, but you selected ${selectedRole} on Screen 1.\n\nPlease switch to ${serverRole} role or return to role selection.`,
          [
            {
              text: `Login as ${serverRole}`,
              onPress: () => {
                const profile: UserProfile = {
                  id: user.id,
                  email: user.email,
                  name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                  role: serverRole,
                  collegeId: user.collegeId || tenantId,
                  prn: user.prn || user.rollNumber,
                  employeeId: user.employeeId,
                  department: user.department?.name,
                  semester: user.semester?.name,
                  avatarUrl: user.avatarUrl,
                };
                setAuth(accessToken, refreshToken, profile);
              },
            },
            {
              text: 'Change Selected Role',
              onPress: () => navigation.navigate('RoleSelect'),
              style: 'cancel',
            },
          ]
        );
        return;
      }

      const profile: UserProfile = {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: user.role,
        collegeId: user.collegeId || tenantId,
        prn: user.prn || user.rollNumber,
        employeeId: user.employeeId,
        department: user.department?.name,
        semester: user.semester?.name,
        avatarUrl: user.avatarUrl,
      };

      await setAuth(accessToken, refreshToken, profile);
    } catch (err: any) {
      if (!err.response) {
        Alert.alert('Network Error', 'Unable to reach the server. Please check your network connection.');
      } else if (err.response.status === 401 || err.response.status === 400) {
        const errorMsg = err.response.data?.message || 'Invalid credentials. Please verify your email/ID and password.';
        Alert.alert('Invalid Credentials', errorMsg);
      } else {
        const errorMsg = err.response.data?.message || 'A server error occurred. Please try again later.';
        Alert.alert('Server Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      Alert.alert(
        'Google Institutional Sign-In',
        'Please enter your institutional email (@pushpalatacollege.edu, @balasahebcollege.edu, or @campusconnect.edu) to authenticate via SSO.',
        [{ text: 'OK' }]
      );
    }, 600);
  };

  const roleTitleMap = {
    STUDENT: 'Student Workspace',
    TEACHER: 'Faculty Workspace',
    ADMIN: 'Administrator Control',
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              onPress={() => navigation.navigate('RoleSelect')}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.topHeaderLeft}>
              <View style={styles.brandBadge}>
                <GraduationCap size={20} color={colors.textWhite} />
              </View>
              <Text style={styles.topHeaderTitle}>Campus Connect</Text>
            </View>

            <Badge label={`${selectedRole} GATEWAY`} variant="primary" />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>{roleTitleMap[selectedRole]}</Text>
            <Text style={styles.heroSubtitle}>
              Sign in with your registered email, PRN, or employee ID to access your authorized dashboard.
            </Text>
          </View>

          {/* Institution Selector */}
          <GlassCard variant="outlined" style={styles.tenantContainer}>
            <View style={styles.tenantHeader}>
              <Building2 size={16} color={colors.textSecondary} />
              <Text style={styles.tenantTitle}>Target Institution Context</Text>
            </View>
            <View style={styles.tenantRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTenantSelect('college-a')}
                style={[styles.tenantChip, tenantId === 'college-a' && styles.tenantChipActive]}
              >
                <Text style={[styles.tenantChipText, tenantId === 'college-a' && styles.tenantChipTextActive]}>
                  Pushpalata
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTenantSelect('college-b')}
                style={[styles.tenantChip, tenantId === 'college-b' && styles.tenantChipActive]}
              >
                <Text style={[styles.tenantChipText, tenantId === 'college-b' && styles.tenantChipTextActive]}>
                  BMCS (Junior)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleTenantSelect('college-c')}
                style={[styles.tenantChip, tenantId === 'college-c' && styles.tenantChipActive]}
              >
                <Text style={[styles.tenantChipText, tenantId === 'college-c' && styles.tenantChipTextActive]}>
                  BMCS (Senior)
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Login Form Card */}
          <GlassCard variant="glow" style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>EMAIL / PRN / EMPLOYEE ID</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={selectedRole === 'STUDENT' ? 'Email / PRN Number' : 'Email / Employee ID'}
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
              title={`Log In as ${selectedRole}`}
              onPress={handleLogin}
              loading={loading}
              icon={<LogIn size={18} color={colors.textWhite} />}
              style={styles.loginBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              style={styles.googleBtn}
            >
              <View style={styles.googleIconBadge}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Sign in with Google SSO</Text>
            </TouchableOpacity>

            {/* Sign Up Link (Disabled for Admin) */}
            {selectedRole !== 'ADMIN' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('SignUp', { selectedRole, tenantId })}
                style={styles.signUpLink}
              >
                <Text style={styles.signUpText}>
                  Don't have an account? <Text style={styles.signUpBold}>Sign Up Now</Text>
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  tenantContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  tenantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tenantTitle: {
    fontSize: 11,
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
    fontSize: 14,
  },
  loginBtn: {
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.bgCardBorder,
  },
  dividerText: {
    fontSize: 11,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
    fontWeight: 'bold',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    borderRadius: borderRadius.md,
    height: 46,
    gap: spacing.sm,
  },
  googleIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  signUpLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signUpBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

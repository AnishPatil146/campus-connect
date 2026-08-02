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
import { apiClient } from '../../services/apiClient';
import { User, Mail, Lock, Building2, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

interface Props {
  navigation: any;
  route?: any;
}

export const SignUpScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialRole = route?.params?.selectedRole === 'ADMIN' ? 'STUDENT' : (route?.params?.selectedRole || 'STUDENT');
  const initialTenant = route?.params?.tenantId || 'college-a';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>(initialRole === 'TEACHER' ? 'TEACHER' : 'STUDENT');
  const [tenantId, setTenantId] = useState<'college-a' | 'college-b'>(initialTenant);
  const [loading, setLoading] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (route?.params?.selectedRole === 'ADMIN') {
      Alert.alert(
        'Admin Self-Registration Disabled',
        'Administrator accounts are pre-provisioned server-side by system administrators. Please log in directly.',
        [
          {
            text: 'Go to Admin Login',
            onPress: () => navigation.replace('Login', { selectedRole: 'ADMIN', tenantId: initialTenant }),
          },
        ]
      );
    }
  }, [route?.params?.selectedRole]);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Required Fields', 'Please fill in all required fields (Name, Email/PRN, and Password).');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setRegisteredNotice(null);

    try {
      const response = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        collegeId: tenantId,
      });

      const data = response.data;
      if (data?.success || response.status === 201 || response.status === 200) {
        const msg = data?.message || 'Account registration submitted successfully!';
        setRegisteredNotice(msg);
        Alert.alert(
          'Registration Successful',
          `${msg}\n\nYou can now log into your account.`,
          [
            {
              text: 'Proceed to Login',
              onPress: () => navigation.navigate('Login', { selectedRole: role, tenantId }),
            },
          ]
        );
      } else {
        throw new Error(data?.message || 'Registration failed.');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unable to register account. Please try again.';
      Alert.alert('Registration Error', errorMsg);
    } finally {
      setLoading(false);
    }
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
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Badge label="NEW USER" variant="primary" />
          </View>

          {/* Intro Section */}
          <View style={styles.introSection}>
            <Text style={styles.heroTitle}>Student & Faculty Registration</Text>
            <Text style={styles.heroSubtitle}>
              Register your account. Pre-imported student and teacher profiles will be automatically verified and activated.
            </Text>
          </View>

          {registeredNotice && (
            <GlassCard variant="outlined" style={styles.noticeCard}>
              <CheckCircle2 size={20} color="#10B981" />
              <Text style={styles.noticeText}>{registeredNotice}</Text>
            </GlassCard>
          )}

          {/* Form */}
          <GlassCard variant="glow" style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={styles.inputContainer}>
                <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Anish Patil"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Email / PRN */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>EMAIL / PRN / EMPLOYEE ID</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@campusconnect.edu or PRN"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Role & Tenant */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>ROLE & INSTITUTION</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'STUDENT' && styles.roleChipActive]}
                  onPress={() => setRole('STUDENT')}
                >
                  <Text style={[styles.chipText, role === 'STUDENT' && styles.chipTextActive]}>Student</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleChip, role === 'TEACHER' && styles.roleChipActive]}
                  onPress={() => setRole('TEACHER')}
                >
                  <Text style={[styles.chipText, role === 'TEACHER' && styles.chipTextActive]}>Faculty</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password */}
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

            {/* Confirm Password */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputContainer}>
                <ShieldCheck size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <Button
              title="Register Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Login', { selectedRole: role, tenantId })}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Log In</Text>
              </Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  introSection: {
    marginVertical: spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  noticeCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderColor: '#10B981',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  formCard: {
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
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleChip: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  loginLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

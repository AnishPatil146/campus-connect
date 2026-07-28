import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../services/apiClient';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Building2, Sparkles } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('student.a@collegea.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantId, setTenantIdState] = useState<'college-a' | 'college-b'>('college-a');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const setTenantId = useAuthStore((state) => state.setTenantId);

  const handleTenantSelect = async (selectedTenant: 'college-a' | 'college-b') => {
    setTenantIdState(selectedTenant);
    await setTenantId(selectedTenant);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.post(
        '/auth/login',
        {
          email: email.trim(),
          password: password.trim(),
        },
        {
          headers: {
            'x-college-id': tenantId,
          },
        }
      );

      if (response.data?.data) {
        const { token, refreshToken, user } = response.data.data;
        const userProfile = {
          id: user.id,
          email: user.email,
          name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Student',
          role: user.role || 'STUDENT',
          collegeId: tenantId,
          prn: user.prn || user.studentProfile?.prn,
          department: user.department?.name || user.studentProfile?.department?.name || 'Computer Science & Engineering',
          semester: user.semester?.name || user.studentProfile?.semester?.name || 'Semester 4',
          avatarUrl: user.avatarUrl,
        };

        await setAuth(token, refreshToken, userProfile);
      } else {
        setErrorMessage(response.data?.message || 'Login failed. Please check credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const apiMsg = error.response?.data?.message || 'Invalid credentials or network failure';
      setErrorMessage(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={36} color={colors.student.primary} />
          </View>
          <Text style={styles.title}>CAMPUS CONNECT</Text>
          <Text style={styles.subtitle}>Mobile Portal • Production Connected</Text>
        </View>

        {/* Tenant Selection Selector */}
        <View style={styles.tenantSelectorContainer}>
          <Text style={styles.tenantLabel}>SELECT COLLEGE INSTANCE:</Text>
          <View style={styles.tenantRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-a')}
              style={[
                styles.tenantChip,
                tenantId === 'college-a' && styles.tenantChipActive,
              ]}
            >
              <Building2 size={14} color={tenantId === 'college-a' ? colors.student.secondary : colors.textMuted} />
              <Text style={[styles.tenantChipText, tenantId === 'college-a' && styles.tenantChipTextActive]}>
                Pushpalata College
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTenantSelect('college-b')}
              style={[
                styles.tenantChip,
                tenantId === 'college-b' && styles.tenantChipActive,
              ]}
            >
              <Building2 size={14} color={tenantId === 'college-b' ? colors.student.secondary : colors.textMuted} />
              <Text style={[styles.tenantChipText, tenantId === 'college-b' && styles.tenantChipTextActive]}>
                Balasaheb College
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Login Form Card */}
        <GlassCard variant="glow" style={styles.formCard}>
          <Text style={styles.formHeaderTitle}>Sign In to Account</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="student@college.edu"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Preset Student Login Selector Shortcut */}
          <TouchableOpacity
            style={styles.presetLink}
            onPress={() => {
              if (tenantId === 'college-a') {
                setEmail('student.a@collegea.edu');
              } else {
                setEmail('student.b@collegeb.edu');
              }
              setPassword('password123');
            }}
          >
            <Sparkles size={12} color={colors.student.secondary} />
            <Text style={styles.presetLinkText}>Auto-fill Verified Student Credentials</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.textWhite} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>SECURE LOGIN</Text>
            )}
          </TouchableOpacity>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tenantSelectorContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  tenantLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  tenantRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tenantChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.bgGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
  },
  tenantChipActive: {
    borderColor: colors.student.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  tenantChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tenantChipTextActive: {
    color: colors.textPrimary,
  },
  formCard: {
    width: '100%',
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  presetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  presetLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.student.secondary,
  },
  submitButton: {
    backgroundColor: colors.student.primary,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textWhite,
    letterSpacing: 0.8,
  },
});

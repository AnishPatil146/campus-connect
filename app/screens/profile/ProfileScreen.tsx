import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../services/apiClient';
import {
  User,
  Building2,
  BookOpen,
  Hash,
  Mail,
  Shield,
  Key,
  LogOut,
  Sparkles,
  Award,
  Lock,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const tenantId = useAuthStore((state) => state.tenantId);
  const logout = useAuthStore((state) => state.logout);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const collegeName = tenantId === 'college-b' ? 'Balasaheb College of Engineering' : 'Pushpalata Institute of Technology';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please fill in both current and new password fields.');
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully.');
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out of Campus Connect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.post('/auth/logout');
          } catch (e) {
            console.log('Logout API cleanup exception ignored');
          }
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header Avatar */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarBig}>
          <Text style={styles.avatarBigText}>{firstName.charAt(0)}</Text>
        </View>
        <Text style={styles.nameText}>{user?.name || 'Student User'}</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          <Badge label={user?.role || 'STUDENT'} variant="primary" />
          <Badge label="ACTIVE SESSION" variant="success" />
        </View>
      </View>

      {/* College & Department Information Card */}
      <GlassCard variant="glow" style={styles.infoCard}>
        <Text style={styles.cardSectionTitle}>ACADEMIC AFFILIATION</Text>

        <View style={styles.infoItem}>
          <Building2 size={16} color={colors.student.primary} />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>COLLEGE INSTANCE</Text>
            <Text style={styles.infoValue}>{collegeName}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <BookOpen size={16} color={colors.student.secondary} />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>DEPARTMENT</Text>
            <Text style={styles.infoValue}>{user?.department || 'Computer Science & Engineering'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Award size={16} color={colors.warning} />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>SEMESTER & TERM</Text>
            <Text style={styles.infoValue}>{user?.semester || 'Semester 4'}</Text>
          </View>
        </View>

        <View style={[styles.infoItem, styles.noBorder]}>
          <Hash size={16} color={colors.success} />
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>PERMANENT REGISTRATION NO. (PRN)</Text>
            <Text style={styles.infoValue}>{user?.prn || user?.id || 'PRN-2026-CS882'}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Security & Action Shortcuts */}
      <GlassCard variant="default">
        <Text style={styles.cardSectionTitle}>ACCOUNT & SECURITY</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setPasswordModalVisible(true)}
          style={styles.actionRow}
        >
          <View style={styles.actionLeft}>
            <Key size={16} color={colors.student.secondary} />
            <Text style={styles.actionTitle}>Change Security Password</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={[styles.actionRow, styles.noBorder]}
        >
          <View style={styles.actionLeft}>
            <LogOut size={16} color={colors.danger} />
            <Text style={[styles.actionTitle, { color: colors.danger }]}>Sign Out of Mobile App</Text>
          </View>
          <Text style={[styles.actionArrow, { color: colors.danger }]}>›</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard variant="glow" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Account Password</Text>

            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholder="••••••••••••"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••••••"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={changingPassword}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>
                  {changingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.student.glow,
    borderWidth: 2,
    borderColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarBigText: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.student.primary,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emailText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoTextGroup: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgCardBorder,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  submitBtn: {
    backgroundColor: colors.student.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textWhite,
  },
});

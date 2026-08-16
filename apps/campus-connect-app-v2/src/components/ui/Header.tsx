import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, School } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  unreadCount?: number;
  showTenantBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNotificationPress,
  unreadCount = 0,
  showTenantBadge = true,
}) => {
  const { user, tenantId } = useAuthStore();

  const getCollegeName = () => {
    if (tenantId === 'college-b') return 'Balasaheb College';
    if (tenantId === 'college-c') return 'College of Technology';
    return 'Pushpalata College';
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showTenantBadge ? (
          <View style={styles.tenantPill}>
            <School size={12} color={colors.student.primary} />
            <Text style={styles.tenantText}>{getCollegeName()}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title || `Hello, ${user?.name?.split(' ')[0] || 'User'} 👋`}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {onNotificationPress ? (
        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Bell size={20} color={colors.textPrimary} />
          {unreadCount > 0 ? (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  left: {
    flex: 1,
  },
  tenantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.student.surface,
    borderColor: colors.student.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  tenantText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.student.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successGlow, text: colors.success, border: 'rgba(16, 185, 129, 0.4)' };
      case 'warning':
        return { bg: colors.warningGlow, text: colors.warning, border: 'rgba(245, 158, 11, 0.4)' };
      case 'danger':
        return { bg: colors.dangerGlow, text: colors.danger, border: 'rgba(239, 68, 68, 0.4)' };
      case 'primary':
        return { bg: colors.primaryGlow, text: colors.primary, border: 'rgba(99, 102, 241, 0.4)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.2)', text: colors.info, border: 'rgba(59, 130, 246, 0.4)' };
    }
  };

  const badgeColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors.bg, borderColor: badgeColors.border }]}>
      <Text style={[styles.text, { color: badgeColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

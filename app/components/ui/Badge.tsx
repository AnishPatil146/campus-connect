import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius } from '../../theme/spacing';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.successGlow, text: colors.success, border: 'rgba(16, 185, 129, 0.3)' };
      case 'warning':
        return { bg: colors.warningGlow, text: colors.warning, border: 'rgba(245, 158, 11, 0.3)' };
      case 'danger':
        return { bg: colors.dangerGlow, text: colors.danger, border: 'rgba(239, 68, 68, 0.3)' };
      case 'info':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: colors.info, border: 'rgba(59, 130, 246, 0.3)' };
      case 'neutral':
        return { bg: 'rgba(255, 255, 255, 0.05)', text: colors.textSecondary, border: colors.bgCardBorder };
      case 'primary':
      default:
        return { bg: colors.primaryGlow, text: colors.student.secondary, border: 'rgba(37, 99, 235, 0.3)' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

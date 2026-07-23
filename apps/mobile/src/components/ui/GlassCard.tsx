import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glow' | 'accent' | 'outlined';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'default' }) => {
  let extraStyles: ViewStyle = {};

  if (variant === 'glow') {
    extraStyles = {
      borderColor: 'rgba(99, 102, 241, 0.4)',
      ...shadows.glowPrimary,
    };
  } else if (variant === 'accent') {
    extraStyles = {
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
    };
  } else if (variant === 'outlined') {
    extraStyles = {
      backgroundColor: 'transparent',
      borderColor: colors.bgCardBorder,
    };
  }

  return (
    <View style={[styles.card, extraStyles, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
});

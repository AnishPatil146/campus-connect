import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, shadows } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'glow' | 'accent';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'glow' && styles.glow,
        variant === 'accent' && styles.accent,
        shadows.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgGlass,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.bgCardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  glow: {
    borderColor: 'rgba(37, 99, 235, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  accent: {
    borderColor: 'rgba(139, 92, 246, 0.35)',
    backgroundColor: 'rgba(30, 27, 75, 0.45)',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'glow' | 'accent';
  valueColor?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  valueColor = colors.textPrimary,
  style,
}) => {
  return (
    <GlassCard variant={variant} style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
});

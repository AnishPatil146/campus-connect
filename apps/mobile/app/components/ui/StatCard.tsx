import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'glow' | 'accent';
  valueColor?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  variant = 'default',
  valueColor = colors.textPrimary,
  icon,
}) => {
  return (
    <GlassCard variant={variant} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconContainer: {
    padding: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

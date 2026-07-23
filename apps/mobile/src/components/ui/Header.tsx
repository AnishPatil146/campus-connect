import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { Badge } from './Badge';

interface HeaderProps {
  title: string;
  subtitle?: string;
  tenantName?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, tenantName, rightAction }) => {
  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        {tenantName && (
          <View style={styles.tenantRow}>
            <Badge label={tenantName} variant="primary" />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.actionContainer}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bgDark,
  },
  titleContainer: {
    flex: 1,
  },
  tenantRow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  actionContainer: {
    marginLeft: spacing.md,
  },
});

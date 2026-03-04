import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { colors, spacing, typography } from '../../theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

export function StatCard({ title, value, subtitle, color = colors.primary, onPress }: StatCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    margin: spacing.xs,
  },
  title: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InvoiceLine } from '../../models/Invoice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

interface InvoiceLineItemProps {
  line: Omit<InvoiceLine, 'id' | 'invoiceId'>;
  index: number;
  onRemove?: () => void;
}

export function InvoiceLineItem({ line, index, onRemove }: InvoiceLineItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.index}>#{index + 1}</Text>
        <Text style={styles.description} numberOfLines={1}>{line.description}</Text>
        {onRemove && (
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Text style={styles.removeTxt}>X</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.detail}>{line.quantity} x {formatCurrency(line.unitPrice)}</Text>
        {line.discount > 0 && <Text style={styles.discount}>-{line.discount}%</Text>}
        <Text style={styles.detail}>IVA {line.vatRate}%</Text>
        <Text style={styles.total}>{formatCurrency(line.total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  index: {
    ...typography.caption,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  description: {
    ...typography.body,
    flex: 1,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeTxt: {
    color: colors.error,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detail: {
    ...typography.caption,
  },
  discount: {
    ...typography.caption,
    color: colors.error,
  },
  total: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});

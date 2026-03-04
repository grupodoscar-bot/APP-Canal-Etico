import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { Invoice } from '../../models/Invoice';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

const statusColors: Record<string, string> = {
  draft: colors.textLight,
  pending: colors.statusPending,
  sent: colors.statusSent,
  accepted: colors.statusAccepted,
  rejected: colors.statusRejected,
};

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[invoice.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColors[invoice.status] }]}>
            {INVOICE_STATUS_LABELS[invoice.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.clientName}>{invoice.clientName || 'Sin cliente'}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(invoice.issueDate)}</Text>
        <Text style={styles.amount}>{formatCurrency(invoice.totalAmount)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  invoiceNumber: {
    ...typography.h3,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientName: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...typography.caption,
  },
  amount: {
    ...typography.h3,
    color: colors.primary,
  },
});

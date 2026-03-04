import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { InvoiceLineItem } from '../../components/invoices/InvoiceLineItem';
import { useAuth } from '../../context/AuthContext';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice } from '../../models/Invoice';
import { CompanySettings } from '../../models/User';
import { sendInvoiceToAeat } from '../../services/aeat';
import { getOne } from '../../services/database';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../../utils/constants';
import { VerifactuQR } from '../../components/invoices/VerifactuQR';
import { generateInvoicePdf } from '../../services/pdf';

const statusColors: Record<string, string> = {
  draft: colors.textLight,
  pending: colors.statusPending,
  sent: colors.statusSent,
  accepted: colors.statusAccepted,
  rejected: colors.statusRejected,
};

export function InvoiceDetailScreen({ route }: any) {
  const { invoiceId } = route.params;
  const { user } = useAuth();
  const { getInvoice, updateInvoiceStatus } = useInvoices(user?.id || 0);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadInvoice();
    loadCompany();
  }, [invoiceId]);

  const loadInvoice = async () => {
    const inv = await getInvoice(invoiceId);
    setInvoice(inv);
  };

  const loadCompany = async () => {
    const c = await getOne<any>(
      'SELECT * FROM company_settings WHERE user_id = ?',
      [user?.id],
    );
    if (c) setCompany(c);
  };

  const handleSendToAeat = async () => {
    if (!invoice) return;

    Alert.alert(
      'Enviar a AEAT',
      '¿Deseas enviar esta factura a la AEAT (modo pruebas)?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setSending(true);
            try {
              if (!company) {
                Alert.alert('Error', 'Configura los datos de tu empresa en Ajustes');
                return;
              }
              const response = await sendInvoiceToAeat(invoice, company as CompanySettings, true);
              const newStatus = response.success ? 'accepted' : 'rejected';
              await updateInvoiceStatus(invoice.id, newStatus, response.responseCode, response.message);
              await loadInvoice();
              Alert.alert(
                response.success ? 'Enviada' : 'Error',
                response.message,
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !company) {
      Alert.alert('Error', 'Configura los datos de tu empresa en Ajustes');
      return;
    }
    setGeneratingPdf(true);
    try {
      const filePath = await generateInvoicePdf(invoice, company);
      Alert.alert('PDF generado', `Factura guardada en:\n${filePath}`);
    } catch (e: any) {
      Alert.alert('Error al generar PDF', e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!invoice) return <View style={styles.loading}><Text>Cargando...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <View style={[styles.badge, { backgroundColor: statusColors[invoice.status] + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColors[invoice.status] }]}>
              {INVOICE_STATUS_LABELS[invoice.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.date}>Fecha: {formatDate(invoice.issueDate)}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.clientName}>{invoice.clientName}</Text>
        <Text style={styles.clientNif}>NIF: {invoice.clientNif}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Líneas de factura</Text>
        {invoice.lines?.map((line, index) => (
          <InvoiceLineItem key={line.id} line={line} index={index} />
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Totales</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Base imponible</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.taxBase)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.totalVat)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmount)}</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Verifactu</Text>
        <Text style={styles.hashLabel}>Hash SHA-256:</Text>
        <Text style={styles.hashValue} numberOfLines={2}>{invoice.hash}</Text>
        <Text style={styles.hashLabel}>Huella:</Text>
        <Text style={styles.hashValue}>{invoice.fingerprint}</Text>
      </Card>

      {invoice.verifactuQr ? (
        <Card style={styles.section}>
          <VerifactuQR url={invoice.verifactuQr} />
        </Card>
      ) : null}

      <View style={styles.actions}>
        {(invoice.status === 'draft' || invoice.status === 'pending') && (
          <Button
            title="Enviar a AEAT (pruebas)"
            onPress={handleSendToAeat}
            loading={sending}
            style={styles.actionBtn}
          />
        )}
        <Button
          title="Descargar PDF"
          onPress={handleDownloadPdf}
          variant="outline"
          loading={generatingPdf}
          style={styles.actionBtn}
        />
      </View>

      {invoice.aeatResponseMessage && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Respuesta AEAT</Text>
          <Text style={styles.aeatResponse}>{invoice.aeatResponseMessage}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  invoiceNumber: {
    ...typography.h1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    ...typography.bodySmall,
  },
  section: {
    margin: spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  clientName: {
    ...typography.body,
    fontWeight: '600',
  },
  clientNif: {
    ...typography.bodySmall,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    ...typography.body,
  },
  totalValue: {
    ...typography.body,
    fontWeight: '600',
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  grandTotalLabel: {
    ...typography.h3,
  },
  grandTotalValue: {
    ...typography.h2,
    color: colors.primary,
  },
  hashLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  hashValue: {
    ...typography.bodySmall,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
  },
  actions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    marginBottom: 0,
  },
  aeatResponse: {
    ...typography.body,
  },
});

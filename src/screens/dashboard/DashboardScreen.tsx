import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatCard } from '../../components/dashboard/StatCard';
import { InvoiceCard } from '../../components/invoices/InvoiceCard';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useInvoices } from '../../hooks/useInvoices';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

export function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { invoices, loading, loadInvoices } = useInvoices(user?.id || 0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingCount = invoices.filter(inv => inv.status === 'draft' || inv.status === 'pending').length;
  const sentCount = invoices.filter(inv => inv.status === 'sent' || inv.status === 'accepted').length;
  const recentInvoices = invoices.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.welcome}>
        <Text style={styles.greeting}>Hola, {user?.name}</Text>
        <Text style={styles.welcomeSubtitle}>Panel de control Verifactu</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Total facturado"
          value={formatCurrency(totalInvoiced)}
          color={colors.primary}
        />
        <StatCard
          title="Facturas"
          value={String(invoices.length)}
          subtitle="emitidas"
          color={colors.info}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Pendientes"
          value={String(pendingCount)}
          subtitle="sin enviar"
          color={colors.statusPending}
          onPress={() => navigation.navigate('Facturas')}
        />
        <StatCard
          title="Enviadas"
          value={String(sentCount)}
          subtitle="a la AEAT"
          color={colors.statusAccepted}
        />
      </View>

      <View style={styles.section}>
        <Button
          title="+ Nueva factura"
          onPress={() => navigation.navigate('Facturas', { screen: 'CreateInvoice' })}
          style={styles.newInvoiceBtn}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas facturas</Text>
        {recentInvoices.length === 0 ? (
          <Text style={styles.empty}>No hay facturas aún. Crea tu primera factura.</Text>
        ) : (
          recentInvoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPress={() => navigation.navigate('Facturas', {
                screen: 'InvoiceDetail',
                params: { invoiceId: invoice.id },
              })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  welcome: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  greeting: {
    ...typography.h1,
    color: colors.white,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  newInvoiceBtn: {
    marginTop: spacing.sm,
  },
  empty: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

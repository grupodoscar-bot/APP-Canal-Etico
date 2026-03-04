import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { InvoiceCard } from '../../components/invoices/InvoiceCard';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useInvoices } from '../../hooks/useInvoices';
import { colors, spacing, typography } from '../../theme';

export function InvoiceListScreen({ navigation }: any) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Facturas</Text>
        <Button
          title="+ Nueva"
          onPress={() => navigation.navigate('CreateInvoice')}
          style={styles.newBtn}
        />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={invoices.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay facturas. Crea tu primera factura.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    ...typography.h2,
  },
  newBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});

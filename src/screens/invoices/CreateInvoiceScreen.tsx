import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { InvoiceLineItem } from '../../components/invoices/InvoiceLineItem';
import { useAuth } from '../../context/AuthContext';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { useInvoices } from '../../hooks/useInvoices';
import { InvoiceLine } from '../../models/Invoice';
import { Client } from '../../models/Client';
import { Product } from '../../models/Product';
import { getOne } from '../../services/database';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { formatCurrency, getCurrentDateISO, roundToTwo } from '../../utils/formatters';

export function CreateInvoiceScreen({ navigation }: any) {
  const { user } = useAuth();
  const userId = user?.id || 0;
  const { clients, loadClients } = useClients(userId);
  const { products, loadProducts } = useProducts(userId);
  const { createInvoice } = useInvoices(userId);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [issueDate, setIssueDate] = useState(getCurrentDateISO());
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<Omit<InvoiceLine, 'id' | 'invoiceId'>[]>([]);
  const [loading, setLoading] = useState(false);

  // For adding lines manually
  const [lineDesc, setLineDesc] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [linePrice, setLinePrice] = useState('');
  const [lineVat, setLineVat] = useState('21');

  useEffect(() => {
    loadClients();
    loadProducts();
  }, []);

  const addLineFromProduct = (product: Product) => {
    const qty = 1;
    const subtotal = roundToTwo(qty * product.unitPrice);
    const vatAmount = roundToTwo(subtotal * product.vatRate / 100);
    setLines(prev => [...prev, {
      productId: product.id,
      description: product.description,
      quantity: qty,
      unitPrice: product.unitPrice,
      discount: 0,
      vatRate: product.vatRate,
      subtotal,
      vatAmount,
      total: roundToTwo(subtotal + vatAmount),
    }]);
    setShowProductPicker(false);
  };

  const addManualLine = () => {
    const qty = parseFloat(lineQty) || 1;
    const price = parseFloat(linePrice) || 0;
    const vat = parseFloat(lineVat) || 21;
    if (!lineDesc || price <= 0) {
      Alert.alert('Error', 'Introduce descripción y precio');
      return;
    }
    const subtotal = roundToTwo(qty * price);
    const vatAmount = roundToTwo(subtotal * vat / 100);
    setLines(prev => [...prev, {
      description: lineDesc,
      quantity: qty,
      unitPrice: price,
      discount: 0,
      vatRate: vat,
      subtotal,
      vatAmount,
      total: roundToTwo(subtotal + vatAmount),
    }]);
    setLineDesc('');
    setLineQty('1');
    setLinePrice('');
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const taxBase = roundToTwo(lines.reduce((sum, l) => sum + l.subtotal, 0));
  const totalVat = roundToTwo(lines.reduce((sum, l) => sum + l.vatAmount, 0));
  const totalAmount = roundToTwo(taxBase + totalVat);

  const handleCreate = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Selecciona un cliente');
      return;
    }
    if (lines.length === 0) {
      Alert.alert('Error', 'Añade al menos una línea');
      return;
    }

    const company = await getOne<any>(
      'SELECT * FROM company_settings WHERE user_id = ?',
      [userId],
    );
    if (!company) {
      Alert.alert('Error', 'Configura los datos de tu empresa en Ajustes antes de crear facturas');
      return;
    }

    setLoading(true);
    try {
      await createInvoice(
        selectedClient.id,
        issueDate,
        description,
        lines,
        company.nif,
      );
      Alert.alert('Factura creada', 'La factura se ha creado correctamente');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Client Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowClientPicker(!showClientPicker)}
          >
            <Text style={selectedClient ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedClient ? `${selectedClient.name} (${selectedClient.nif})` : 'Seleccionar cliente...'}
            </Text>
          </TouchableOpacity>
          {showClientPicker && (
            <View style={styles.pickerList}>
              {clients.map(client => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.pickerItem}
                  onPress={() => { setSelectedClient(client); setShowClientPicker(false); }}
                >
                  <Text style={styles.pickerItemText}>{client.name}</Text>
                  <Text style={styles.pickerItemSubtext}>{client.nif}</Text>
                </TouchableOpacity>
              ))}
              {clients.length === 0 && (
                <Text style={styles.pickerEmpty}>No hay clientes. Crea uno primero.</Text>
              )}
            </View>
          )}
        </Card>

        {/* Invoice Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de factura</Text>
          <Input label="Fecha de expedición" value={issueDate} onChangeText={setIssueDate} placeholder="YYYY-MM-DD" />
          <Input label="Descripción" value={description} onChangeText={setDescription} placeholder="Descripción de la operación" />
        </Card>

        {/* Lines */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Líneas de factura</Text>

          {lines.map((line, index) => (
            <InvoiceLineItem
              key={index}
              line={line}
              index={index}
              onRemove={() => removeLine(index)}
            />
          ))}

          {/* Add from product */}
          <Button
            title="Añadir desde productos"
            onPress={() => setShowProductPicker(!showProductPicker)}
            variant="outline"
            style={styles.addBtn}
          />
          {showProductPicker && (
            <View style={styles.pickerList}>
              {products.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.pickerItem}
                  onPress={() => addLineFromProduct(product)}
                >
                  <Text style={styles.pickerItemText}>{product.description}</Text>
                  <Text style={styles.pickerItemSubtext}>
                    {formatCurrency(product.unitPrice)} - IVA {product.vatRate}%
                  </Text>
                </TouchableOpacity>
              ))}
              {products.length === 0 && (
                <Text style={styles.pickerEmpty}>No hay productos. Crea uno primero.</Text>
              )}
            </View>
          )}

          {/* Manual line */}
          <Text style={styles.manualTitle}>Añadir línea manual</Text>
          <Input label="Descripción" value={lineDesc} onChangeText={setLineDesc} placeholder="Servicio o producto" />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input label="Cantidad" value={lineQty} onChangeText={setLineQty} keyboardType="numeric" />
            </View>
            <View style={styles.halfInput}>
              <Input label="Precio" value={linePrice} onChangeText={setLinePrice} keyboardType="numeric" placeholder="0.00" />
            </View>
          </View>
          <Input label="IVA (%)" value={lineVat} onChangeText={setLineVat} keyboardType="numeric" />
          <Button title="Añadir línea" onPress={addManualLine} variant="secondary" />
        </Card>

        {/* Totals */}
        {lines.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.totalRow}>
              <Text>Base imponible</Text>
              <Text style={styles.totalValue}>{formatCurrency(taxBase)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>IVA</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalVat)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </Card>
        )}

        <Button
          title="Crear factura"
          onPress={handleCreate}
          loading={loading}
          disabled={!selectedClient || lines.length === 0}
          style={styles.createBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  pickerText: {
    ...typography.body,
  },
  pickerPlaceholder: {
    ...typography.body,
    color: colors.textLight,
  },
  pickerList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    maxHeight: 200,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pickerItemText: {
    ...typography.body,
    fontWeight: '600',
  },
  pickerItemSubtext: {
    ...typography.caption,
  },
  pickerEmpty: {
    ...typography.bodySmall,
    padding: spacing.md,
    textAlign: 'center',
  },
  addBtn: {
    marginBottom: spacing.md,
  },
  manualTitle: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalValue: {
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
  createBtn: {
    marginTop: spacing.md,
  },
});

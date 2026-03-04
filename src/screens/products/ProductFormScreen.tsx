import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, View, Text, TouchableOpacity } from 'react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { VAT_RATES } from '../../utils/constants';

export function ProductFormScreen({ route, navigation }: any) {
  const productId = route.params?.productId;
  const isEditing = Boolean(productId);
  const { user } = useAuth();
  const { addProduct, updateProduct, getProduct } = useProducts(user?.id || 0);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [vatRate, setVatRate] = useState(21);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    const product = await getProduct(productId);
    if (product) {
      setCode(product.code);
      setDescription(product.description);
      setUnitPrice(String(product.unitPrice));
      setVatRate(product.vatRate);
      setCategory(product.category || '');
    }
  };

  const handleSave = async () => {
    if (!code || !description || !unitPrice) {
      Alert.alert('Error', 'Código, descripción y precio son obligatorios');
      return;
    }
    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Introduce un precio válido');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        code,
        description,
        unitPrice: price,
        vatRate: vatRate as any,
        category: category || undefined,
      };

      if (isEditing) {
        await updateProduct(productId, productData);
        Alert.alert('Guardado', 'Producto actualizado');
      } else {
        await addProduct(productData as any);
        Alert.alert('Guardado', 'Producto creado');
      }
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
        <Input label="Código *" value={code} onChangeText={setCode} placeholder="PROD-001" />
        <Input label="Descripción *" value={description} onChangeText={setDescription} placeholder="Servicio de consultoría" />
        <Input label="Precio unitario (EUR) *" value={unitPrice} onChangeText={setUnitPrice} placeholder="100.00" keyboardType="numeric" />

        <Text style={styles.label}>Tipo de IVA *</Text>
        <View style={styles.vatOptions}>
          {VAT_RATES.map(rate => (
            <TouchableOpacity
              key={rate.value}
              style={[styles.vatOption, vatRate === rate.value && styles.vatOptionSelected]}
              onPress={() => setVatRate(rate.value)}
            >
              <Text style={[styles.vatOptionText, vatRate === rate.value && styles.vatOptionTextSelected]}>
                {rate.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Categoría" value={category} onChangeText={setCategory} placeholder="Servicios, Material, etc." />

        <Button
          title={isEditing ? 'Guardar cambios' : 'Crear producto'}
          onPress={handleSave}
          loading={loading}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  vatOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  vatOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  vatOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vatOptionText: {
    ...typography.bodySmall,
  },
  vatOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});

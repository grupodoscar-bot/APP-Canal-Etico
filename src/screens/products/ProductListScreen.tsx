import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

export function ProductListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { products, loading, loadProducts, deleteProduct } = useProducts(user?.id || 0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleDelete = (id: number, desc: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de eliminar "${desc}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteProduct(id) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productos</Text>
        <Button
          title="+ Nuevo"
          onPress={() => navigation.navigate('ProductForm')}
          style={styles.newBtn}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('ProductForm', { productId: item.id })}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.productCode}>{item.code}</Text>
                <Text style={styles.productDesc}>{item.description}</Text>
                <Text style={styles.productPrice}>
                  {formatCurrency(item.unitPrice)} - IVA {item.vatRate}%
                </Text>
                {item.category && <Text style={styles.productCategory}>{item.category}</Text>}
              </View>
              <Button
                title="X"
                onPress={() => handleDelete(item.id, item.description)}
                variant="danger"
                style={styles.deleteBtn}
              />
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={products.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay productos. Añade tu primer producto.</Text>
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
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  productCode: {
    ...typography.caption,
    fontWeight: '700',
  },
  productDesc: {
    ...typography.body,
    fontWeight: '600',
  },
  productPrice: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  productCategory: {
    ...typography.caption,
    marginTop: 2,
  },
  deleteBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
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

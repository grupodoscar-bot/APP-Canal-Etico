import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useClients } from '../../hooks/useClients';
import { colors, spacing, typography } from '../../theme';

export function ClientListScreen({ navigation }: any) {
  const { user } = useAuth();
  const { clients, loading, loadClients, deleteClient } = useClients(user?.id || 0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Eliminar cliente',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteClient(id) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clientes</Text>
        <Button
          title="+ Nuevo"
          onPress={() => navigation.navigate('ClientForm')}
          style={styles.newBtn}
        />
      </View>

      <FlatList
        data={clients}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('ClientForm', { clientId: item.id })}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.clientNif}>NIF: {item.nif}</Text>
                <Text style={styles.clientDetail}>{item.city}, {item.province}</Text>
                {item.email && <Text style={styles.clientDetail}>{item.email}</Text>}
              </View>
              <Button
                title="X"
                onPress={() => handleDelete(item.id, item.name)}
                variant="danger"
                style={styles.deleteBtn}
              />
            </View>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={clients.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay clientes. Añade tu primer cliente.</Text>
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
  clientName: {
    ...typography.body,
    fontWeight: '600',
  },
  clientNif: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  clientDetail: {
    ...typography.caption,
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

import { useState, useCallback } from 'react';
import { Client } from '../models/Client';
import { getAll, executeSql, getOne } from '../services/database';

export function useClients(userId: number) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const rows = await getAll<any>(
      'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC',
      [userId],
    );
    setClients(rows.map(mapRowToClient));
    setLoading(false);
  }, [userId]);

  const addClient = useCallback(async (client: Omit<Client, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const result = await executeSql(
      `INSERT INTO clients (user_id, nif, name, trade_name, address, city, postal_code, province, country, phone, email, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, client.nif, client.name, client.tradeName || null, client.address,
       client.city, client.postalCode, client.province, client.country,
       client.phone || null, client.email || null, client.notes || null],
    );
    await loadClients();
    return result.insertId;
  }, [userId, loadClients]);

  const updateClient = useCallback(async (id: number, client: Partial<Client>) => {
    await executeSql(
      `UPDATE clients SET nif=?, name=?, trade_name=?, address=?, city=?,
       postal_code=?, province=?, country=?, phone=?, email=?, notes=?,
       updated_at=datetime('now') WHERE id=? AND user_id=?`,
      [client.nif, client.name, client.tradeName || null, client.address,
       client.city, client.postalCode, client.province, client.country,
       client.phone || null, client.email || null, client.notes || null,
       id, userId],
    );
    await loadClients();
  }, [userId, loadClients]);

  const deleteClient = useCallback(async (id: number) => {
    await executeSql('DELETE FROM clients WHERE id=? AND user_id=?', [id, userId]);
    await loadClients();
  }, [userId, loadClients]);

  const getClient = useCallback(async (id: number): Promise<Client | null> => {
    const row = await getOne<any>(
      'SELECT * FROM clients WHERE id=? AND user_id=?',
      [id, userId],
    );
    return row ? mapRowToClient(row) : null;
  }, [userId]);

  return { clients, loading, loadClients, addClient, updateClient, deleteClient, getClient };
}

function mapRowToClient(row: any): Client {
  return {
    id: row.id,
    userId: row.user_id,
    nif: row.nif,
    name: row.name,
    tradeName: row.trade_name,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    province: row.province,
    country: row.country,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

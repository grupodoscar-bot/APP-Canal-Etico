import { useState, useCallback } from 'react';
import { Product } from '../models/Product';
import { getAll, executeSql, getOne } from '../services/database';

export function useProducts(userId: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const rows = await getAll<any>(
      'SELECT * FROM products WHERE user_id = ? AND active = 1 ORDER BY description ASC',
      [userId],
    );
    setProducts(rows.map(mapRowToProduct));
    setLoading(false);
  }, [userId]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'userId' | 'active' | 'createdAt' | 'updatedAt'>) => {
    const result = await executeSql(
      `INSERT INTO products (user_id, code, description, unit_price, vat_rate, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, product.code, product.description, product.unitPrice,
       product.vatRate, product.category || null],
    );
    await loadProducts();
    return result.insertId;
  }, [userId, loadProducts]);

  const updateProduct = useCallback(async (id: number, product: Partial<Product>) => {
    await executeSql(
      `UPDATE products SET code=?, description=?, unit_price=?, vat_rate=?,
       category=?, updated_at=datetime('now') WHERE id=? AND user_id=?`,
      [product.code, product.description, product.unitPrice, product.vatRate,
       product.category || null, id, userId],
    );
    await loadProducts();
  }, [userId, loadProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    await executeSql(
      'UPDATE products SET active=0, updated_at=datetime(\'now\') WHERE id=? AND user_id=?',
      [id, userId],
    );
    await loadProducts();
  }, [userId, loadProducts]);

  const getProduct = useCallback(async (id: number): Promise<Product | null> => {
    const row = await getOne<any>(
      'SELECT * FROM products WHERE id=? AND user_id=?',
      [id, userId],
    );
    return row ? mapRowToProduct(row) : null;
  }, [userId]);

  return { products, loading, loadProducts, addProduct, updateProduct, deleteProduct, getProduct };
}

function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    description: row.description,
    unitPrice: row.unit_price,
    vatRate: row.vat_rate,
    category: row.category,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

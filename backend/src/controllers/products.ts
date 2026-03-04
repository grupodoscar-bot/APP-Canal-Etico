import { Response } from 'express';
import { query } from '../config/database';
import { productSchema } from '../utils/validators';
import { AuthRequest } from '../types';

export async function listProducts(req: AuthRequest, res: Response) {
  const tenantId = req.auth!.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;

  const countResult = await query(
    'SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND active = true',
    [tenantId],
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    'SELECT * FROM products WHERE tenant_id = $1 AND active = true ORDER BY description ASC LIMIT $2 OFFSET $3',
    [tenantId, limit, offset],
  );

  res.json({ success: true, data: result.rows, meta: { page, limit, total } });
}

export async function getProduct(req: AuthRequest, res: Response) {
  const result = await query(
    'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.auth!.tenantId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function createProduct(req: AuthRequest, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const d = parsed.data;
  const result = await query(
    `INSERT INTO products (tenant_id, code, description, unit_price, vat_rate, category)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.auth!.tenantId, d.code, d.description, d.unitPrice, d.vatRate, d.category || null],
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}

export async function updateProduct(req: AuthRequest, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const d = parsed.data;
  const result = await query(
    `UPDATE products SET code=$1, description=$2, unit_price=$3, vat_rate=$4, category=$5
     WHERE id=$6 AND tenant_id=$7 RETURNING *`,
    [d.code, d.description, d.unitPrice, d.vatRate, d.category || null,
     req.params.id, req.auth!.tenantId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  const result = await query(
    'UPDATE products SET active = false WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [req.params.id, req.auth!.tenantId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }
  res.json({ success: true, data: { deleted: true } });
}

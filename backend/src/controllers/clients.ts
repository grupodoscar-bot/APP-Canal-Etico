import { Response } from 'express';
import { query } from '../config/database';
import { clientSchema } from '../utils/validators';
import { AuthRequest } from '../types';

export async function listClients(req: AuthRequest, res: Response) {
  const tenantId = req.auth!.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let sql = 'SELECT * FROM clients WHERE tenant_id = $1';
  const params: any[] = [tenantId];

  if (search) {
    sql += ' AND (name ILIKE $2 OR nif ILIKE $2)';
    params.push(`%${search}%`);
  }

  const countResult = await query(sql.replace('*', 'COUNT(*)'), params);
  const total = parseInt(countResult.rows[0].count);

  sql += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  res.json({
    success: true,
    data: result.rows,
    meta: { page, limit, total },
  });
}

export async function getClient(req: AuthRequest, res: Response) {
  const result = await query(
    'SELECT * FROM clients WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.auth!.tenantId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function createClient(req: AuthRequest, res: Response) {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const d = parsed.data;
  const result = await query(
    `INSERT INTO clients (tenant_id, nif, name, trade_name, address, city, postal_code, province, country, phone, email, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [req.auth!.tenantId, d.nif.toUpperCase(), d.name, d.tradeName || null, d.address,
     d.city, d.postalCode, d.province, d.country, d.phone || null, d.email || null, d.notes || null],
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}

export async function updateClient(req: AuthRequest, res: Response) {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const d = parsed.data;
  const result = await query(
    `UPDATE clients SET nif=$1, name=$2, trade_name=$3, address=$4, city=$5,
     postal_code=$6, province=$7, country=$8, phone=$9, email=$10, notes=$11
     WHERE id=$12 AND tenant_id=$13 RETURNING *`,
    [d.nif.toUpperCase(), d.name, d.tradeName || null, d.address, d.city,
     d.postalCode, d.province, d.country, d.phone || null, d.email || null,
     d.notes || null, req.params.id, req.auth!.tenantId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function deleteClient(req: AuthRequest, res: Response) {
  const result = await query(
    'DELETE FROM clients WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [req.params.id, req.auth!.tenantId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
  }
  res.json({ success: true, data: { deleted: true } });
}

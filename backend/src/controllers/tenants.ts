import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function getTenant(req: AuthRequest, res: Response) {
  const result = await query('SELECT * FROM tenants WHERE id = $1', [req.auth!.tenantId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function updateTenant(req: AuthRequest, res: Response) {
  const { companyName, tradeName, address, city, postalCode, province, phone, email, invoiceSeries, logoUrl } = req.body;

  const result = await query(
    `UPDATE tenants SET company_name = COALESCE($1, company_name),
     trade_name = $2, address = COALESCE($3, address),
     city = COALESCE($4, city), postal_code = COALESCE($5, postal_code),
     province = COALESCE($6, province), phone = $7, email = $8,
     invoice_series = COALESCE($9, invoice_series), logo_url = $10
     WHERE id = $11 RETURNING *`,
    [companyName, tradeName || null, address, city, postalCode, province,
     phone || null, email || null, invoiceSeries, logoUrl || null, req.auth!.tenantId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
  }
  res.json({ success: true, data: result.rows[0] });
}

export async function getDashboard(req: AuthRequest, res: Response) {
  const tenantId = req.auth!.tenantId;

  const [totalResult, statusResult, amountResult] = await Promise.all([
    query('SELECT COUNT(*) FROM invoices WHERE tenant_id = $1', [tenantId]),
    query(
      `SELECT status, COUNT(*) as count FROM invoices WHERE tenant_id = $1 GROUP BY status`,
      [tenantId],
    ),
    query(
      `SELECT COALESCE(SUM(total_amount), 0) as total,
              COALESCE(SUM(CASE WHEN issue_date >= date_trunc('month', CURRENT_DATE) THEN total_amount ELSE 0 END), 0) as month_total
       FROM invoices WHERE tenant_id = $1`,
      [tenantId],
    ),
  ]);

  const statusCounts: Record<string, number> = {};
  statusResult.rows.forEach((r: any) => { statusCounts[r.status] = parseInt(r.count); });

  res.json({
    success: true,
    data: {
      totalInvoices: parseInt(totalResult.rows[0].count),
      statusCounts,
      totalAmount: parseFloat(amountResult.rows[0].total),
      monthAmount: parseFloat(amountResult.rows[0].month_total),
    },
  });
}

import { Response } from 'express';
import { query, transaction } from '../config/database';
import { createInvoiceSchema } from '../utils/validators';
import { generateInvoiceHash, generateFingerprint, generateVerifactuQRUrl, formatInvoiceNumber } from '../utils/hash';
import { AuthRequest } from '../types';

export async function listInvoices(req: AuthRequest, res: Response) {
  const tenantId = req.auth!.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;

  let sql = `SELECT i.*, c.name as client_name, c.nif as client_nif
             FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
             WHERE i.tenant_id = $1`;
  const params: any[] = [tenantId];

  if (status) {
    sql += ` AND i.status = $${params.length + 1}`;
    params.push(status);
  }

  const countSql = sql.replace('i.*, c.name as client_name, c.nif as client_nif', 'COUNT(*)');
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count);

  sql += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  res.json({ success: true, data: result.rows, meta: { page, limit, total } });
}

export async function getInvoice(req: AuthRequest, res: Response) {
  const tenantId = req.auth!.tenantId;

  const invoiceResult = await query(
    `SELECT i.*, c.name as client_name, c.nif as client_nif
     FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
     WHERE i.id = $1 AND i.tenant_id = $2`,
    [req.params.id, tenantId],
  );

  if (invoiceResult.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Factura no encontrada' });
  }

  const linesResult = await query(
    'SELECT * FROM invoice_lines WHERE invoice_id = $1',
    [req.params.id],
  );

  const invoice = { ...invoiceResult.rows[0], lines: linesResult.rows };
  res.json({ success: true, data: invoice });
}

export async function createInvoice(req: AuthRequest, res: Response) {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { clientId, issueDate, description, lines } = parsed.data;
  const tenantId = req.auth!.tenantId;
  const userId = req.auth!.userId;

  try {
    const invoice = await transaction(async (client) => {
      // Get tenant info
      const tenantResult = await client.query(
        'SELECT nif, invoice_series, next_invoice_number FROM tenants WHERE id = $1',
        [tenantId],
      );
      const tenant = tenantResult.rows[0];
      const series = tenant.invoice_series;
      const number = tenant.next_invoice_number;
      const invoiceNumber = formatInvoiceNumber(series, number);

      // Verify client belongs to this tenant
      const clientCheck = await client.query(
        'SELECT id FROM clients WHERE id = $1 AND tenant_id = $2',
        [clientId, tenantId],
      );
      if (clientCheck.rows.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Calculate totals
      const computedLines = lines.map(line => {
        const subtotal = roundToTwo(line.quantity * line.unitPrice * (1 - line.discount / 100));
        const vatAmount = roundToTwo(subtotal * line.vatRate / 100);
        return { ...line, subtotal, vatAmount, total: roundToTwo(subtotal + vatAmount) };
      });

      const taxBase = roundToTwo(computedLines.reduce((s, l) => s + l.subtotal, 0));
      const totalVat = roundToTwo(computedLines.reduce((s, l) => s + l.vatAmount, 0));
      const totalAmount = roundToTwo(taxBase + totalVat);

      // Get previous hash
      const lastInvoice = await client.query(
        'SELECT hash FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1',
        [tenantId],
      );
      const previousHash = lastInvoice.rows[0]?.hash || '';

      // Generate Verifactu hash
      const hash = generateInvoiceHash(previousHash, series, number, issueDate, totalAmount);
      const fingerprint = generateFingerprint(tenant.nif, invoiceNumber, issueDate, hash);
      const verifactuQr = generateVerifactuQRUrl(tenant.nif, invoiceNumber, issueDate, totalAmount);

      // Insert invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (tenant_id, client_id, created_by, series, number, invoice_number,
         issue_date, description, tax_base, total_vat, total_amount, status,
         hash, previous_hash, fingerprint, verifactu_qr)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft',$12,$13,$14,$15)
         RETURNING *`,
        [tenantId, clientId, userId, series, number, invoiceNumber, issueDate,
         description || null, taxBase, totalVat, totalAmount, hash, previousHash,
         fingerprint, verifactuQr],
      );
      const invoiceId = invoiceResult.rows[0].id;

      // Insert lines
      for (const line of computedLines) {
        await client.query(
          `INSERT INTO invoice_lines (invoice_id, product_id, description, quantity,
           unit_price, discount, vat_rate, subtotal, vat_amount, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [invoiceId, line.productId || null, line.description, line.quantity,
           line.unitPrice, line.discount, line.vatRate, line.subtotal,
           line.vatAmount, line.total],
        );
      }

      // Update next invoice number
      await client.query(
        'UPDATE tenants SET next_invoice_number = $1 WHERE id = $2',
        [number + 1, tenantId],
      );

      return { ...invoiceResult.rows[0], lines: computedLines };
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function updateInvoiceStatus(req: AuthRequest, res: Response) {
  const { status } = req.body;
  const validStatuses = ['draft', 'pending', 'sent', 'accepted', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Estado no válido' });
  }

  const result = await query(
    `UPDATE invoices SET status = $1,
     sent_to_aeat_at = CASE WHEN $1 IN ('sent','accepted') THEN NOW() ELSE sent_to_aeat_at END
     WHERE id = $2 AND tenant_id = $3 RETURNING *`,
    [status, req.params.id, req.auth!.tenantId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Factura no encontrada' });
  }

  res.json({ success: true, data: result.rows[0] });
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

import { useState, useCallback } from 'react';
import { Invoice, InvoiceLine } from '../models/Invoice';
import { getAll, executeSql, getOne } from '../services/database';
import { generateInvoiceHash, generateFingerprint, generateVerifactuQRUrl } from '../services/invoiceHash';
import { formatInvoiceNumber, roundToTwo } from '../utils/formatters';

export function useInvoices(userId: number) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const rows = await getAll<any>(
      `SELECT i.*, c.name as client_name, c.nif as client_nif
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [userId],
    );
    setInvoices(rows.map(mapRowToInvoice));
    setLoading(false);
  }, [userId]);

  const getLastInvoice = useCallback(async (): Promise<Invoice | null> => {
    const row = await getOne<any>(
      'SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId],
    );
    return row ? mapRowToInvoice(row) : null;
  }, [userId]);

  const createInvoice = useCallback(async (
    clientId: number,
    issueDate: string,
    description: string,
    lines: Omit<InvoiceLine, 'id' | 'invoiceId'>[],
    emitterNif: string,
  ): Promise<number> => {
    // Get next invoice number
    const settings = await getOne<any>(
      'SELECT invoice_series, next_invoice_number FROM company_settings WHERE user_id = ?',
      [userId],
    );
    const series = settings?.invoice_series || 'F';
    const number = settings?.next_invoice_number || 1;
    const invoiceNumber = formatInvoiceNumber(series, number);

    // Calculate totals
    const taxBase = roundToTwo(lines.reduce((sum, l) => sum + l.subtotal, 0));
    const totalVat = roundToTwo(lines.reduce((sum, l) => sum + l.vatAmount, 0));
    const totalAmount = roundToTwo(taxBase + totalVat);

    // Get previous hash for chaining
    const lastInvoice = await getLastInvoice();
    const previousHash = lastInvoice?.hash || '';

    // Generate Verifactu hash: SHA256(previous_hash + series + number + date + total)
    const hash = generateInvoiceHash(previousHash, series, number, issueDate, totalAmount);
    const fingerprint = generateFingerprint(emitterNif, invoiceNumber, issueDate, hash);

    // Generate Verifactu QR URL and store it
    const verifactuQr = generateVerifactuQRUrl(emitterNif, invoiceNumber, issueDate, totalAmount);

    // Insert invoice
    const result = await executeSql(
      `INSERT INTO invoices (user_id, client_id, series, number, invoice_number,
       issue_date, description, tax_base, total_vat, total_amount, status,
       hash, previous_hash, fingerprint, verifactu_qr)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
      [userId, clientId, series, number, invoiceNumber, issueDate, description,
       taxBase, totalVat, totalAmount, hash, previousHash, fingerprint, verifactuQr],
    );
    const invoiceId = result.insertId;

    // Insert lines
    for (const line of lines) {
      await executeSql(
        `INSERT INTO invoice_lines (invoice_id, product_id, description, quantity,
         unit_price, discount, vat_rate, subtotal, vat_amount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, line.productId || null, line.description, line.quantity,
         line.unitPrice, line.discount, line.vatRate, line.subtotal,
         line.vatAmount, line.total],
      );
    }

    // Update next invoice number
    await executeSql(
      'UPDATE company_settings SET next_invoice_number = ? WHERE user_id = ?',
      [number + 1, userId],
    );

    await loadInvoices();
    return invoiceId;
  }, [userId, loadInvoices, getLastInvoice]);

  const getInvoice = useCallback(async (id: number): Promise<Invoice | null> => {
    const row = await getOne<any>(
      `SELECT i.*, c.name as client_name, c.nif as client_nif
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.id = ? AND i.user_id = ?`,
      [id, userId],
    );
    if (!row) return null;

    const invoice = mapRowToInvoice(row);
    const lineRows = await getAll<any>(
      'SELECT * FROM invoice_lines WHERE invoice_id = ?',
      [id],
    );
    invoice.lines = lineRows.map(mapRowToLine);
    return invoice;
  }, [userId]);

  const updateInvoiceStatus = useCallback(async (
    id: number,
    status: string,
    aeatResponseCode?: string,
    aeatResponseMessage?: string,
  ) => {
    await executeSql(
      `UPDATE invoices SET status=?, aeat_response_code=?, aeat_response_message=?,
       sent_to_aeat_at=CASE WHEN ?='sent' THEN datetime('now') ELSE sent_to_aeat_at END,
       updated_at=datetime('now') WHERE id=? AND user_id=?`,
      [status, aeatResponseCode || null, aeatResponseMessage || null, status, id, userId],
    );
    await loadInvoices();
  }, [userId, loadInvoices]);

  return {
    invoices, loading, loadInvoices, createInvoice,
    getInvoice, getLastInvoice, updateInvoiceStatus,
  };
}

function mapRowToInvoice(row: any): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    series: row.series,
    number: row.number,
    invoiceNumber: row.invoice_number,
    issueDate: row.issue_date,
    operationDate: row.operation_date,
    description: row.description,
    taxBase: row.tax_base,
    totalVat: row.total_vat,
    totalAmount: row.total_amount,
    status: row.status,
    hash: row.hash,
    previousHash: row.previous_hash,
    fingerprint: row.fingerprint,
    verifactuQr: row.verifactu_qr,
    aeatResponseCode: row.aeat_response_code,
    aeatResponseMessage: row.aeat_response_message,
    sentToAeatAt: row.sent_to_aeat_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name,
    clientNif: row.client_nif,
  };
}

function mapRowToLine(row: any): InvoiceLine {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    productId: row.product_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    vatRate: row.vat_rate,
    subtotal: row.subtotal,
    vatAmount: row.vat_amount,
    total: row.total,
  };
}

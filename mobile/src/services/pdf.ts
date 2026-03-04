import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Invoice } from '../models/Invoice';
import { formatCurrency, formatDate } from '../utils/formatters';
import { INVOICE_STATUS_LABELS } from '../utils/constants';

interface CompanyData {
  nif: string;
  company_name: string;
  trade_name?: string;
  address: string;
  city: string;
  postal_code: string;
  province: string;
  phone?: string;
  email?: string;
}

export async function generateInvoicePdf(
  invoice: Invoice,
  company: CompanyData,
): Promise<string> {
  const html = buildInvoiceHtml(invoice, company);

  const options = {
    html,
    fileName: `factura_${invoice.invoiceNumber.replace(/\//g, '-')}`,
    directory: 'Documents',
    base64: false,
  };

  const pdf = await RNHTMLtoPDF.convert(options);

  if (!pdf.filePath) {
    throw new Error('No se pudo generar el PDF');
  }

  return pdf.filePath;
}

function buildInvoiceHtml(invoice: Invoice, company: CompanyData): string {
  const linesHtml = (invoice.lines || [])
    .map(
      (line, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(line.description)}</td>
        <td class="right">${line.quantity}</td>
        <td class="right">${formatCurrency(line.unitPrice)}</td>
        <td class="right">${line.discount > 0 ? line.discount + '%' : '-'}</td>
        <td class="right">${line.vatRate}%</td>
        <td class="right">${formatCurrency(line.subtotal)}</td>
        <td class="right">${formatCurrency(line.vatAmount)}</td>
        <td class="right bold">${formatCurrency(line.total)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #1a1a2e;
      padding: 40px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 3px solid #1A4B8C;
      padding-bottom: 20px;
    }
    .company-info { flex: 1; }
    .invoice-info {
      text-align: right;
      flex: 1;
    }
    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: #1A4B8C;
      margin-bottom: 4px;
    }
    .company-detail {
      font-size: 11px;
      color: #6b7280;
    }
    .invoice-title {
      font-size: 28px;
      font-weight: 800;
      color: #1A4B8C;
      letter-spacing: 1px;
    }
    .invoice-number {
      font-size: 16px;
      font-weight: 600;
      margin-top: 4px;
    }
    .invoice-date {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
    .status {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 6px;
      background: #e8f5e9;
      color: #388e3c;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .party {
      width: 48%;
      background: #f5f7fa;
      border-radius: 8px;
      padding: 16px;
    }
    .party-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 600;
    }
    .party-detail {
      font-size: 11px;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #1A4B8C;
      color: white;
      padding: 8px 10px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    th.right, td.right { text-align: right; }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
    }
    tr:nth-child(even) { background: #f9fafb; }
    .bold { font-weight: 600; }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
    }
    .totals-row.grand {
      border-top: 2px solid #1A4B8C;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #1A4B8C;
    }
    .verifactu {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .verifactu-qr {
      text-align: center;
      min-width: 140px;
    }
    .verifactu-qr img {
      width: 120px;
      height: 120px;
    }
    .verifactu-info {
      flex: 1;
    }
    .verifactu-title {
      font-size: 13px;
      font-weight: 700;
      color: #1A4B8C;
      margin-bottom: 6px;
    }
    .verifactu-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #9ca3af;
      margin-top: 6px;
    }
    .verifactu-value {
      font-size: 9px;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      color: #6b7280;
    }
    .verifactu-url {
      font-size: 8px;
      color: #9ca3af;
      word-break: break-all;
      margin-top: 8px;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="company-info">
      <div class="company-name">${escapeHtml(company.company_name)}</div>
      ${company.trade_name ? `<div class="company-detail">${escapeHtml(company.trade_name)}</div>` : ''}
      <div class="company-detail">NIF: ${escapeHtml(company.nif)}</div>
      <div class="company-detail">${escapeHtml(company.address)}</div>
      <div class="company-detail">${escapeHtml(company.postal_code)} ${escapeHtml(company.city)}, ${escapeHtml(company.province)}</div>
      ${company.phone ? `<div class="company-detail">Tel: ${escapeHtml(company.phone)}</div>` : ''}
      ${company.email ? `<div class="company-detail">${escapeHtml(company.email)}</div>` : ''}
    </div>
    <div class="invoice-info">
      <div class="invoice-title">FACTURA</div>
      <div class="invoice-number">${escapeHtml(invoice.invoiceNumber)}</div>
      <div class="invoice-date">Fecha: ${formatDate(invoice.issueDate)}</div>
      <div class="status">${INVOICE_STATUS_LABELS[invoice.status] || invoice.status}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Emisor</div>
      <div class="party-name">${escapeHtml(company.company_name)}</div>
      <div class="party-detail">NIF: ${escapeHtml(company.nif)}</div>
      <div class="party-detail">${escapeHtml(company.address)}</div>
      <div class="party-detail">${escapeHtml(company.postal_code)} ${escapeHtml(company.city)}</div>
    </div>
    <div class="party">
      <div class="party-label">Cliente</div>
      <div class="party-name">${escapeHtml(invoice.clientName || '')}</div>
      <div class="party-detail">NIF: ${escapeHtml(invoice.clientNif || '')}</div>
    </div>
  </div>

  ${invoice.description ? `<p style="margin-bottom:16px;color:#6b7280;"><strong>Concepto:</strong> ${escapeHtml(invoice.description)}</p>` : ''}

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Descripción</th>
        <th class="right">Cant.</th>
        <th class="right">Precio</th>
        <th class="right">Dto.</th>
        <th class="right">IVA</th>
        <th class="right">Subtotal</th>
        <th class="right">Cuota IVA</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${linesHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row">
        <span>Base imponible</span>
        <span class="bold">${formatCurrency(invoice.taxBase)}</span>
      </div>
      <div class="totals-row">
        <span>IVA</span>
        <span class="bold">${formatCurrency(invoice.totalVat)}</span>
      </div>
      <div class="totals-row grand">
        <span>TOTAL</span>
        <span>${formatCurrency(invoice.totalAmount)}</span>
      </div>
    </div>
  </div>

  <div class="verifactu">
    <div class="verifactu-qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(invoice.verifactuQr)}" alt="QR Verifactu" />
      <div style="font-size:9px;color:#9ca3af;margin-top:4px;">QR Verifactu</div>
    </div>
    <div class="verifactu-info">
      <div class="verifactu-title">Registro Verifactu</div>
      <div class="verifactu-label">Hash SHA-256</div>
      <div class="verifactu-value">${escapeHtml(invoice.hash)}</div>
      <div class="verifactu-label">Huella</div>
      <div class="verifactu-value">${escapeHtml(invoice.fingerprint)}</div>
      <div class="verifactu-url">${escapeHtml(invoice.verifactuQr)}</div>
    </div>
  </div>

  <div class="footer">
    Factura generada por Verifactu &mdash; Sistema de facturación electrónica conforme al Real Decreto 1007/2023
  </div>

</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

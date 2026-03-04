import CryptoJS from 'crypto-js';
import { Invoice } from '../models/Invoice';

/**
 * Generates a SHA-256 hash for a Verifactu invoice record.
 * The hash chains to the previous invoice's hash to ensure
 * integrity and traceability (Real Decreto 1007/2023).
 *
 * Fields included in hash calculation:
 * - NIF emisor
 * - Número de factura
 * - Fecha de expedición
 * - Tipo factura
 * - Base imponible
 * - Total factura
 * - Hash de la factura anterior
 */
export function generateInvoiceHash(
  emitterNif: string,
  invoiceNumber: string,
  issueDate: string,
  taxBase: number,
  totalAmount: number,
  previousHash: string,
): string {
  const dataToHash = [
    emitterNif,
    invoiceNumber,
    issueDate,
    taxBase.toFixed(2),
    totalAmount.toFixed(2),
    previousHash,
  ].join('|');

  return CryptoJS.SHA256(dataToHash).toString();
}

/**
 * Generates a fingerprint for the invoice record.
 * This is a unique identifier for verification purposes.
 */
export function generateFingerprint(
  emitterNif: string,
  invoiceNumber: string,
  issueDate: string,
  hash: string,
): string {
  const data = `${emitterNif}|${invoiceNumber}|${issueDate}|${hash}`;
  return CryptoJS.SHA256(data).toString().substring(0, 16).toUpperCase();
}

/**
 * Gets the last invoice hash for chaining.
 * Returns empty string if this is the first invoice.
 */
export async function getLastInvoiceHash(
  getLastInvoiceFn: () => Promise<Invoice | null>,
): Promise<string> {
  const lastInvoice = await getLastInvoiceFn();
  return lastInvoice?.hash ?? '';
}

/**
 * Generates a Verifactu QR code URL for invoice verification.
 */
export function generateVerifactuQRUrl(
  nif: string,
  invoiceNumber: string,
  issueDate: string,
  totalAmount: number,
): string {
  const params = new URLSearchParams({
    nif,
    numserie: invoiceNumber,
    fecha: issueDate,
    importe: totalAmount.toFixed(2),
  });
  return `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?${params.toString()}`;
}

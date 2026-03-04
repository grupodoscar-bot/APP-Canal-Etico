import CryptoJS from 'crypto-js';

/**
 * Generates a SHA-256 hash for a Verifactu invoice record.
 * Algorithm: SHA256(previous_hash + series + number + date + total)
 *
 * The hash chains to the previous invoice's hash to ensure
 * integrity and traceability (Real Decreto 1007/2023).
 */
export function generateInvoiceHash(
  previousHash: string,
  series: string,
  number: number,
  issueDate: string,
  totalAmount: number,
): string {
  const dataToHash = `${previousHash}${series}${number}${issueDate}${totalAmount.toFixed(2)}`;
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
 * Generates a Verifactu QR code URL for invoice verification at AEAT.
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

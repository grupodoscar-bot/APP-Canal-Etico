import crypto from 'crypto';

/**
 * Verifactu hash encadenado.
 * hash = SHA256(previous_hash + series + number + date + total)
 */
export function generateInvoiceHash(
  previousHash: string,
  series: string,
  number: number,
  issueDate: string,
  totalAmount: number,
): string {
  const data = `${previousHash}${series}${number}${issueDate}${totalAmount.toFixed(2)}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateFingerprint(
  emitterNif: string,
  invoiceNumber: string,
  issueDate: string,
  hash: string,
): string {
  const data = `${emitterNif}|${invoiceNumber}|${issueDate}|${hash}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16).toUpperCase();
}

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

export function formatInvoiceNumber(series: string, number: number): string {
  return `${series}-${String(number).padStart(6, '0')}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatInvoiceNumber(series: string, number: number): string {
  return `${series}-${String(number).padStart(6, '0')}`;
}

export function formatNIF(nif: string): string {
  return nif.toUpperCase().trim();
}

export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimestampISO(): string {
  return new Date().toISOString();
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

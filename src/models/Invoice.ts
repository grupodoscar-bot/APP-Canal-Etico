export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected';

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface Invoice {
  id: number;
  userId: number;
  clientId: number;
  series: string;
  number: number;
  invoiceNumber: string;
  issueDate: string;
  operationDate?: string;
  description?: string;
  taxBase: number;
  totalVat: number;
  totalAmount: number;
  status: InvoiceStatus;
  hash: string;
  previousHash: string;
  fingerprint: string;
  aeatResponseCode?: string;
  aeatResponseMessage?: string;
  sentToAeatAt?: string;
  createdAt: string;
  updatedAt: string;
  lines?: InvoiceLine[];
  clientName?: string;
  clientNif?: string;
}

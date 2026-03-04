export type VatRate = 21 | 10 | 4 | 0;

export interface Product {
  id: number;
  userId: number;
  code: string;
  description: string;
  unitPrice: number;
  vatRate: VatRate;
  category?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

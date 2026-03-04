export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface CompanySettings {
  id: number;
  userId: number;
  nif: string;
  companyName: string;
  tradeName?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone?: string;
  email?: string;
  invoiceSeries: string;
  nextInvoiceNumber: number;
  logoBase64?: string;
}

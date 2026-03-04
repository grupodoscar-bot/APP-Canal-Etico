export interface Client {
  id: number;
  userId: number;
  nif: string;
  name: string;
  tradeName?: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

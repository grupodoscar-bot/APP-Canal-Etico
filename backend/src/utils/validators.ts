import { z } from 'zod';

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

function isValidNif(nif: string): boolean {
  if (!nif || nif.length !== 9) return false;
  const upper = nif.toUpperCase().trim();

  if (/^\d{8}[A-Z]$/.test(upper)) {
    return upper[8] === NIF_LETTERS[parseInt(upper.substring(0, 8), 10) % 23];
  }
  if (/^[XYZ]\d{7}[A-Z]$/.test(upper)) {
    const map: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    return upper[8] === NIF_LETTERS[parseInt(map[upper[0]] + upper.substring(1, 8), 10) % 23];
  }
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[\dA-J]$/.test(upper)) {
    return true;
  }
  return false;
}

const nif = z.string().min(9).max(9).refine(isValidNif, { message: 'NIF/CIF no válido' });

export const registerSchema = z.object({
  companyName: z.string().min(1, 'Razón social obligatoria'),
  nif: nif,
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal no válido'),
  province: z.string().min(1),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  name: z.string().min(1, 'Nombre obligatorio'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const clientSchema = z.object({
  nif: nif,
  name: z.string().min(1),
  tradeName: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{5}$/),
  province: z.string().min(1),
  country: z.string().default('ES'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  unitPrice: z.number().min(0),
  vatRate: z.number().refine(v => [0, 4, 10, 21].includes(v)),
  category: z.string().optional(),
});

export const invoiceLineSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  vatRate: z.number(),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'Al menos una línea'),
});

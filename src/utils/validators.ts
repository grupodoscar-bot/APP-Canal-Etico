const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function validateNIF(nif: string): boolean {
  if (!nif || nif.length !== 9) return false;

  const upper = nif.toUpperCase().trim();

  // DNI: 8 digits + letter
  if (/^\d{8}[A-Z]$/.test(upper)) {
    const num = parseInt(upper.substring(0, 8), 10);
    const expectedLetter = NIF_LETTERS[num % 23];
    return upper[8] === expectedLetter;
  }

  // NIE: X/Y/Z + 7 digits + letter
  if (/^[XYZ]\d{7}[A-Z]$/.test(upper)) {
    const prefixMap: Record<string, string> = { X: '0', Y: '1', Z: '2' };
    const num = parseInt(prefixMap[upper[0]] + upper.substring(1, 8), 10);
    const expectedLetter = NIF_LETTERS[num % 23];
    return upper[8] === expectedLetter;
  }

  // CIF: letter + 7 digits + control (digit or letter)
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[\dA-J]$/.test(upper)) {
    return true; // Simplified CIF validation
  }

  return false;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

export function validatePhone(phone: string): boolean {
  return /^(\+34)?[6-9]\d{8}$/.test(phone.replace(/\s/g, ''));
}

export function validateRequired(value: string): string | undefined {
  if (!value || value.trim().length === 0) {
    return 'Este campo es obligatorio';
  }
  return undefined;
}

export function validateNIFField(value: string): string | undefined {
  if (!value || value.trim().length === 0) {
    return 'El NIF/CIF es obligatorio';
  }
  if (!validateNIF(value)) {
    return 'NIF/CIF no válido';
  }
  return undefined;
}

export const APP_NAME = 'Verifactu';
export const APP_VERSION = '1.0.0';

export const DB_NAME = 'verifactu.db';

export const VAT_RATES = [
  { label: '21% (General)', value: 21 },
  { label: '10% (Reducido)', value: 10 },
  { label: '4% (Superreducido)', value: 4 },
  { label: '0% (Exento)', value: 0 },
];

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

export const AEAT_ENDPOINTS = {
  production: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroFactEmitV1.wsdl',
  testing: 'https://prewww2.aeat.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroFactEmitV1.wsdl',
};

export const PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
  'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca',
  'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca',
  'Islas Baleares', 'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid',
  'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia', 'Las Palmas',
  'Pontevedra', 'La Rioja', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo',
  'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
];

export const DEFAULT_COUNTRY = 'ES';
export const DEFAULT_SERIES = 'F';

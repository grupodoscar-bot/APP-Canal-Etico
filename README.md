# VERIFACTU

Sistema de facturación electrónica compatible con **VERI*FACTU** de la AEAT (Real Decreto 1007/2023).

Sustituye al software DOSCAR.

**Dominio:** [verifactu.red](https://verifactu.red)

## Arquitectura

```
verifactu/
├── mobile/     # App móvil TPV (React Native)
├── backend/    # API y servicios (pendiente)
├── web/        # Panel web (pendiente)
└── docs/       # Documentación
```

## Mobile (App TPV)

App React Native + TypeScript para gestión de facturación desde dispositivos móviles.

### Funcionalidades implementadas

- Autenticación local con contraseñas encriptadas (SHA-256)
- Base de datos SQLite local
- Gestión de clientes con validación NIF/NIE/CIF
- Gestión de productos con tipos de IVA (21%, 10%, 4%, 0%)
- Creación de facturas con líneas, cálculo automático de totales
- Hash encadenado SHA-256: `SHA256(previous_hash + series + number + date + total)`
- Campo `verifactu_qr` persistido en BD con URL de verificación AEAT
- Código QR Verifactu en pantalla de detalle (react-native-qrcode-svg)
- Generación de PDF de factura (react-native-html-to-pdf)
- Generación XML SuministroLRFacturasEmitidas para AEAT
- Dashboard con resumen y estadísticas
- Navegación Tab + Stack con React Navigation

### Instalación

```bash
cd mobile
npm install
npx react-native run-android  # Android
npx react-native run-ios      # iOS
```

### Estructura mobile/

```
mobile/
├── App.tsx
├── package.json
├── src/
│   ├── navigation/     # Navegación (Tab + Stack)
│   ├── screens/        # auth, dashboard, invoices, clients, products, settings
│   ├── components/     # Button, Input, Card, InvoiceCard, VerifactuQR...
│   ├── services/       # database, auth, aeat, invoiceHash, pdf
│   ├── models/         # Invoice, Client, Product, User
│   ├── hooks/          # useInvoices, useClients, useProducts
│   ├── context/        # AuthContext
│   ├── utils/          # validators, formatters, constants
│   └── theme/          # Colores, tipografía, espaciado
```

## Cumplimiento Verifactu (RD 1007/2023)

- Encadenamiento hash SHA-256 entre facturas
- Huella (fingerprint) por registro
- QR de verificación con URL AEAT
- Formato XML SuministroLRFacturasEmitidas
- Validación de NIF/NIE/CIF español
- Numeración secuencial por serie
- Registros inmutables y trazables

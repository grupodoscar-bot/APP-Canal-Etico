# Verifactu - Facturación Electrónica

Aplicación móvil React Native para gestión completa de facturación electrónica, cumpliendo con la normativa española **VERI*FACTU** (Real Decreto 1007/2023).

## Características

- **Facturación electrónica**: Crea y gestiona facturas con cumplimiento Verifactu
- **Hash SHA-256 encadenado**: Integridad y trazabilidad de registros de facturación
- **Comunicación AEAT**: Envío de registros al sistema de la Agencia Tributaria
- **Gestión de clientes**: CRUD completo con validación de NIF/CIF español
- **Gestión de productos**: Catálogo con tipos de IVA (21%, 10%, 4%, 0%)
- **Dashboard**: Panel de control con resumen y estadísticas
- **Almacenamiento local**: SQLite para persistencia de datos
- **Autenticación**: Login y registro con contraseñas encriptadas

## Tecnologías

- React Native 0.73
- TypeScript
- React Navigation
- SQLite (react-native-sqlite-storage)
- CryptoJS (SHA-256)
- React Native Paper

## Instalación

```bash
npm install
npx react-native run-android  # Android
npx react-native run-ios      # iOS
```

## Estructura

```
src/
├── navigation/     # Navegación (Tab + Stack)
├── screens/        # Pantallas (auth, dashboard, invoices, clients, products, settings)
├── components/     # Componentes reutilizables
├── services/       # Base de datos, autenticación, AEAT, hash
├── models/         # Tipos TypeScript
├── hooks/          # Custom hooks
├── context/        # Context de autenticación
├── utils/          # Utilidades (validadores, formateadores, constantes)
└── theme/          # Tema visual
```

## Cumplimiento Verifactu

- Encadenamiento hash SHA-256 entre facturas
- Generación de huella (fingerprint) por registro
- Formato XML SuministroLRFacturasEmitidas para AEAT
- Validación de NIF/CIF español
- Numeración secuencial de facturas por serie

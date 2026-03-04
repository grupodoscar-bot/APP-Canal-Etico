import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import productRoutes from './routes/products';
import invoiceRoutes from './routes/invoices';
import tenantRoutes from './routes/tenants';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','),
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'verifactu-api', version: '1.0.0' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tenant', tenantRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(env.port, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   VERIFACTU API - api.verifactu.red  ║
  ║   Puerto: ${env.port}                        ║
  ║   Entorno: ${env.nodeEnv.padEnd(23)}║
  ╚══════════════════════════════════════╝
  `);
});

export default app;

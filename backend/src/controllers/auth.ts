import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { query, transaction } from '../config/database';
import { registerSchema, loginSchema } from '../utils/validators';
import { AuthPayload } from '../types';

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
  }

  const { companyName, nif, address, city, postalCode, province, email, password, name } = parsed.data;

  try {
    const result = await transaction(async (client) => {
      // Check if tenant NIF already exists
      const existing = await client.query('SELECT id FROM tenants WHERE nif = $1', [nif.toUpperCase()]);
      if (existing.rows.length > 0) {
        throw new Error('Ya existe una empresa con este NIF');
      }

      // Create tenant
      const tenant = await client.query(
        `INSERT INTO tenants (nif, company_name, address, city, postal_code, province)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [nif.toUpperCase(), companyName, address, city, postalCode, province],
      );
      const tenantId = tenant.rows[0].id;

      // Create admin user
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await client.query(
        `INSERT INTO users (tenant_id, email, name, password_hash, role)
         VALUES ($1, $2, $3, $4, 'admin') RETURNING id, role`,
        [tenantId, email.toLowerCase(), name, passwordHash],
      );

      return { tenantId, userId: user.rows[0].id, role: user.rows[0].role };
    });

    const payload: AuthPayload = {
      userId: result.userId,
      tenantId: result.tenantId,
      email: email.toLowerCase(),
      role: result.role,
    };

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    res.status(201).json({
      success: true,
      data: { token, user: { id: result.userId, email, name, role: result.role }, tenantId: result.tenantId },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
  }

  const { email, password } = parsed.data;

  try {
    const result = await query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.password_hash, u.role, u.active
       FROM users u WHERE u.email = $1`,
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos' });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Cuenta desactivada' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Email o contraseña incorrectos' });
    }

    const payload: AuthPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        tenantId: user.tenant_id,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
}

export async function me(req: any, res: Response) {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, t.company_name, t.nif, t.id as tenant_id
       FROM users u JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.auth.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Error interno' });
  }
}

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Middleware that ensures all database queries are scoped to the authenticated user's tenant.
 * The tenant_id is extracted from the JWT and injected into req.auth.
 * Controllers must use req.auth.tenantId in all queries.
 */
export function requireTenant(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth?.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'No se ha identificado la empresa. Inicie sesión de nuevo.',
    });
  }
  next();
}

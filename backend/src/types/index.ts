import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  auth?: AuthPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

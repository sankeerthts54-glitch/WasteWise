import { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase';
import { AppError } from '../lib/errors';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('UNAUTHENTICATED', 'Missing or invalid Authorization header')
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError('UNAUTHENTICATED', 'Token is empty'));
  }

  try {
    const { data, error } = await supabaseClient.auth.getUser(token);

    if (error || !data?.user) {
      return next(
        new AppError(
          'UNAUTHENTICATED',
          error?.message || 'Invalid or expired authentication token'
        )
      );
    }

    req.user = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next();
  }

  try {
    const { data } = await supabaseClient.auth.getUser(token);
    if (data?.user) {
      req.user = data.user;
    }
    next();
  } catch {
    // Optional auth silently proceeds unauthenticated on failure
    next();
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth } from './auth';
import { supabaseClient } from '../lib/supabase';
import { AppError } from '../lib/errors';
import type { User, AuthError } from '@supabase/supabase-js';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = vi.fn();
    vi.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('calls next with UNAUTHENTICATED error when authorization header is missing', async () => {
      await requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = vi.mocked(next).mock.calls[0][0] as unknown as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('UNAUTHENTICATED');
      expect(err.statusCode).toBe(401);
    });

    it('calls next with UNAUTHENTICATED error when authorization header is not Bearer', async () => {
      req.headers = { authorization: 'Basic 12345' };

      await requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = vi.mocked(next).mock.calls[0][0] as unknown as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('UNAUTHENTICATED');
    });

    it('calls next with UNAUTHENTICATED error when Bearer token is empty', async () => {
      req.headers = { authorization: 'Bearer   ' };

      await requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = vi.mocked(next).mock.calls[0][0] as unknown as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('UNAUTHENTICATED');
    });

    it('calls next with UNAUTHENTICATED error when token verification fails', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthApiError', message: 'Token expired', status: 401 } as unknown as AuthError,
      });

      await requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = vi.mocked(next).mock.calls[0][0] as unknown as AppError;
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe('UNAUTHENTICATED');
      expect(err.message).toBe('Token expired');
    });

    it('attaches user to req and calls next with no arguments on valid token', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      const mockUser: User = {
        id: 'usr-123',
        app_metadata: {},
        user_metadata: { display_name: 'Green Resident' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'resident@example.com',
      };

      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(vi.mocked(next).mock.calls[0][0]).toBeUndefined();
      expect(req.user).toEqual(mockUser);
    });
  });

  describe('optionalAuth', () => {
    it('proceeds without setting user when header is absent', async () => {
      await optionalAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeUndefined();
    });

    it('sets user when valid Bearer token is provided', async () => {
      req.headers = { authorization: 'Bearer valid-token' };
      const mockUser: User = {
        id: 'usr-456',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com',
      };

      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await optionalAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual(mockUser);
    });

    it('proceeds without error when token verification fails', async () => {
      req.headers = { authorization: 'Bearer bad-token' };
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: { name: 'AuthApiError', message: 'Bad token', status: 401 } as unknown as AuthError,
      });

      await optionalAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(vi.mocked(next).mock.calls[0][0]).toBeUndefined();
      expect(req.user).toBeUndefined();
    });
  });
});

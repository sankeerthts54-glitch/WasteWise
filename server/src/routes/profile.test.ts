import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../app';
import { supabaseClient, supabaseAdmin } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, ApiSuccess, ApiError } from 'wastewise-shared';

describe('Profile Routes (/api/me and /api/auth/me)', () => {
  let server: Server;
  let baseUrl: string;

  const mockUser: User = {
    id: 'user-uuid-1234',
    app_metadata: {},
    user_metadata: {
      displayName: 'Eco Pioneer',
      preferences: { notifications: true, theme: 'light' },
    },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'eco@example.com',
  };

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/me', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/me`);
      expect(res.status).toBe(401);

      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 200 with user profile when authenticated', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/me`, {
        headers: {
          Authorization: 'Bearer valid-jwt-token',
        },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<UserProfile>;
      expect(body.success).toBe(true);
      expect(body.data).toEqual({
        id: 'user-uuid-1234',
        displayName: 'Eco Pioneer',
        email: 'eco@example.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        preferences: { notifications: true, theme: 'light' },
      });
    });

    it('works identically via /api/auth/me alias', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer valid-jwt-token',
        },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<UserProfile>;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('user-uuid-1234');
    });
  });

  describe('PATCH /api/me', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: 'New Name' }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 400 when body has unexpected extra fields or invalid types', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/me`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-jwt-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: '', // min(1) violation
          unknownField: 'disallowed-by-strict',
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details && body.error.details.length > 0).toBe(true);
    });

    it('returns 200 and updated profile on valid update', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const updatedUser: User = {
        ...mockUser,
        user_metadata: {
          displayName: 'Updated Name',
          display_name: 'Updated Name',
          preferences: { notifications: false, theme: 'dark' },
        },
      };

      vi.spyOn(supabaseAdmin.auth.admin, 'updateUserById').mockResolvedValue({
        data: { user: updatedUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/me`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-jwt-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: 'Updated Name',
          preferences: { notifications: false, theme: 'dark' },
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<UserProfile>;
      expect(body.success).toBe(true);
      expect(body.data.displayName).toBe('Updated Name');
      expect(body.data.preferences).toEqual({ notifications: false, theme: 'dark' });
    });
  });
});

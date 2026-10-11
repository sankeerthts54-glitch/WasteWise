import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './apiClient';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn();
  });

  it('attaches Bearer JWT header when session token exists', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'fake-jwt-token' } },
    });

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await apiClient<{ success: boolean }>('/health');

    const expectedUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '') + '/health';
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );

    const callHeaders = (globalThis.fetch as any).mock.calls[0][1].headers as Headers;
    expect(callHeaders.get('Authorization')).toBe('Bearer fake-jwt-token');
    expect(result).toEqual({ success: true });
  });

  it('throws ApiError when response is not ok', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Resource not found' }),
    });

    await expect(apiClient('/missing')).rejects.toThrow(ApiError);
  });
});

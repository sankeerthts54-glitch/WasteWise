import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Server } from 'http';
import { AddressInfo } from 'net';
import type { User } from '@supabase/supabase-js';
import type {
  Advisory,
  AdvisoryRecord,
  ApiSuccess,
  ApiError,
  PaginatedList,
} from 'wastewise-shared';
import { createApp } from '../app';
import { supabaseClient } from '../lib/supabase';
import { advisoryAiService } from '../services/ai/advisoryAiService';
import { advisoryRepository } from '../repositories/advisoryRepository';

describe('Advisories Routes (/api/advisories)', () => {
  let server: Server;
  let baseUrl: string;

  const mockUser: User = {
    id: 'user-uuid-1234',
    app_metadata: {},
    user_metadata: { displayName: 'Green Citizen' },
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    email: 'citizen@example.com',
  };

  const sampleAdvisoryOutput: Advisory = {
    title: 'Solar Installation Strategy',
    summary: 'Rooftop solar potential analysis for residential house in Rajasthan.',
    keyInsights: ['3kW system optimal', 'Payback within 4 years'],
    recommendations: [
      {
        title: 'Apply for PM Surya Ghar',
        rationale: 'Avail up to ₹78,000 central subsidy.',
        priority: 'high',
        estimatedEffort: 'low',
      },
      {
        title: 'Net Metering Application',
        rationale: 'Grid export credits via state DISCOM.',
        priority: 'high',
        estimatedEffort: 'medium',
      },
    ],
    risks: [],
    actionPlan: [
      { step: 1, action: 'Register on National Portal', timeframe: 'Day 1' },
      { step: 2, action: 'DISCOM feasibility approval', timeframe: 'Week 2' },
    ],
    resources: [],
    disclaimer: 'Verify current DISCOM net metering guidelines before procurement.',
    confidence: { score: 0.92, explanation: 'Clear rooftop dimensions and electricity bill.' },
  };

  const sampleRecord: AdvisoryRecord = {
    id: 'adv-solar-001',
    userId: 'user-uuid-1234',
    domainSlug: 'solar-energy',
    title: 'Solar Installation Strategy',
    inputs: {
      location: 'Rajasthan',
      propertyType: 'independent_house',
      rooftopAreaSqFt: 500,
      monthlyBillRs: 3500,
      ownership: 'owned',
      shadingIssues: 'none',
    },
    output: sampleAdvisoryOutput,
    style: 'concise',
    language: 'en',
    status: 'completed',
    model: 'gemini-2.5-flash',
    latencyMs: 1100,
    feedbackRating: null,
    feedbackComment: null,
    feedbackAt: null,
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
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

  const authHeader = { Authorization: 'Bearer valid-jwt-token' };

  describe('POST /api/advisories', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const res = await fetch(`${baseUrl}/api/advisories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainSlug: 'solar-energy',
          inputs: {},
        }),
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 400 when body fails Zod schema validation', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/advisories`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainSlug: '', // invalid
          inputs: 'not-an-object', // invalid
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when domainSlug does not exist', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/advisories`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainSlug: 'non-existent-domain',
          inputs: {},
          style: 'concise',
          language: 'en',
        }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('non-existent-domain');
    });

    it('generates advisory, persists to Supabase, and returns 201', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      vi.spyOn(advisoryAiService, 'generateAdvisory').mockResolvedValue(
        sampleAdvisoryOutput
      );
      vi.spyOn(advisoryRepository, 'create').mockResolvedValue(sampleRecord);

      const res = await fetch(`${baseUrl}/api/advisories`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainSlug: 'solar-energy',
          inputs: { rooftopAreaSqFt: 500, monthlyBillRs: 3500 },
          style: 'concise',
          language: 'en',
        }),
      });

      expect(res.status).toBe(201);
      const body = (await res.json()) as ApiSuccess<AdvisoryRecord>;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('adv-solar-001');
      expect(body.data.title).toBe('Solar Installation Strategy');
      expect(advisoryAiService.generateAdvisory).toHaveBeenCalled();
      expect(advisoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          domainSlug: 'solar-energy',
          title: sampleAdvisoryOutput.title,
        })
      );
    });
  });

  describe('GET /api/advisories', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/advisories`);
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid query params', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/advisories?pageSize=100`, {
        headers: authHeader,
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 200 and paginated advisories for the user', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const paginatedResult: PaginatedList<AdvisoryRecord> = {
        items: [sampleRecord],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(advisoryRepository, 'list').mockResolvedValue(paginatedResult);

      const res = await fetch(
        `${baseUrl}/api/advisories?page=1&pageSize=10&domain=solar-energy&sort=newest`,
        { headers: authHeader }
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<PaginatedList<AdvisoryRecord>>;
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.total).toBe(1);
      expect(advisoryRepository.list).toHaveBeenCalledWith({
        userId: mockUser.id,
        page: 1,
        pageSize: 10,
        domain: 'solar-energy',
        sort: 'newest',
      });
    });
  });

  describe('GET /api/advisories/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`);
      expect(res.status).toBe(401);
    });

    it('returns 404 when advisory not found', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(null);

      const res = await fetch(`${baseUrl}/api/advisories/adv-missing`, {
        headers: authHeader,
      });

      expect(res.status).toBe(404);
      const body = (await res.json()) as ApiError;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 when advisory belongs to another user', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue({
        ...sampleRecord,
        userId: 'other-user-9999',
      });

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        headers: authHeader,
      });

      expect(res.status).toBe(403);
      const body = (await res.json()) as ApiError;
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('returns 200 with advisory detail when owned by user', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(sampleRecord);

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        headers: authHeader,
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<AdvisoryRecord>;
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('adv-solar-001');
      expect(body.data.output).toEqual(sampleAdvisoryOutput);
    });
  });

  describe('PATCH /api/advisories/:id', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid title', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        method: 'PATCH',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: '' }),
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when advisory not found', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(null);

      const res = await fetch(`${baseUrl}/api/advisories/adv-missing`, {
        method: 'PATCH',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Renamed Strategy' }),
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when owned by another user', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue({
        ...sampleRecord,
        userId: 'other-user',
      });

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        method: 'PATCH',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Renamed Strategy' }),
      });

      expect(res.status).toBe(403);
    });

    it('updates title and returns 200 with updated advisory', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      const updatedRecord = { ...sampleRecord, title: 'Renamed Strategy' };
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(sampleRecord);
      vi.spyOn(advisoryRepository, 'updateTitle').mockResolvedValue(updatedRecord);

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001`, {
        method: 'PATCH',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Renamed Strategy' }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<AdvisoryRecord>;
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Renamed Strategy');
      expect(advisoryRepository.updateTitle).toHaveBeenCalledWith(
        'adv-solar-001',
        mockUser.id,
        'Renamed Strategy'
      );
    });
  });

  describe('POST /api/advisories/:id/feedback', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 1 }),
      });
      expect(res.status).toBe(401);
    });

    it('returns 400 on invalid rating', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001/feedback`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: 0 }), // must be 1 or -1
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as ApiError;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when advisory not found', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(null);

      const res = await fetch(`${baseUrl}/api/advisories/adv-missing/feedback`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: 1 }),
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when advisory belongs to another user', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue({
        ...sampleRecord,
        userId: 'other-user',
      });

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001/feedback`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating: 1 }),
      });

      expect(res.status).toBe(403);
    });

    it('saves feedback and returns 200 with updated advisory', async () => {
      vi.spyOn(supabaseClient.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      const feedbackRecord = {
        ...sampleRecord,
        feedbackRating: 1,
        feedbackComment: 'Extremely thorough plan!',
        feedbackAt: '2026-10-11T12:00:00.000Z',
      };
      vi.spyOn(advisoryRepository, 'getById').mockResolvedValue(sampleRecord);
      vi.spyOn(advisoryRepository, 'saveFeedback').mockResolvedValue(feedbackRecord);

      const res = await fetch(`${baseUrl}/api/advisories/adv-solar-001/feedback`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 1,
          comment: 'Extremely thorough plan!',
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as ApiSuccess<AdvisoryRecord>;
      expect(body.success).toBe(true);
      expect(body.data.feedbackRating).toBe(1);
      expect(body.data.feedbackComment).toBe('Extremely thorough plan!');
      expect(advisoryRepository.saveFeedback).toHaveBeenCalledWith(
        'adv-solar-001',
        mockUser.id,
        { rating: 1, comment: 'Extremely thorough plan!' }
      );
    });
  });
});

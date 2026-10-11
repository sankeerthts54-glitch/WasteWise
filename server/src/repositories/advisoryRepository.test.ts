import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AdvisoryRepository,
  AdvisoryDbRow,
  mapRowToRecord,
} from './advisoryRepository';
import { AppError } from '../lib/errors';

describe('AdvisoryRepository', () => {
  const sampleRow: AdvisoryDbRow = {
    id: 'advisory-123',
    user_id: 'user-abc',
    domain_slug: 'waste-segregation',
    title: 'Custom Waste Segregation Plan',
    inputs: { location: 'Bengaluru', settingType: 'household' },
    output: {
      title: 'Custom Waste Segregation Plan',
      summary: 'A detailed plan for household waste management.',
      keyInsights: ['Insight 1', 'Insight 2'],
      recommendations: [
        {
          title: 'Rec 1',
          rationale: 'Rationale 1',
          priority: 'high',
          estimatedEffort: 'low',
        },
        {
          title: 'Rec 2',
          rationale: 'Rationale 2',
          priority: 'medium',
          estimatedEffort: 'medium',
        },
      ],
      risks: [],
      actionPlan: [
        { step: 1, action: 'Step 1', timeframe: 'Day 1' },
        { step: 2, action: 'Step 2', timeframe: 'Day 2' },
      ],
      resources: [],
      disclaimer: 'General advisory disclaimer note.',
      confidence: { score: 0.95, explanation: 'High confidence based on input.' },
    },
    style: 'concise',
    language: 'en',
    status: 'completed',
    error_message: null,
    model: 'gemini-2.5-flash',
    latency_ms: 1200,
    feedback_rating: null,
    feedback_comment: null,
    feedback_at: null,
    created_at: '2026-10-11T10:00:00.000Z',
    updated_at: '2026-10-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapRowToRecord', () => {
    it('correctly maps snake_case DB row to camelCase AdvisoryRecord', () => {
      const record = mapRowToRecord(sampleRow);
      expect(record.id).toBe(sampleRow.id);
      expect(record.userId).toBe(sampleRow.user_id);
      expect(record.domainSlug).toBe(sampleRow.domain_slug);
      expect(record.latencyMs).toBe(1200);
      expect(record.errorMessage).toBeNull();
      expect(record.feedbackRating).toBeNull();
    });
  });

  describe('create', () => {
    it('persists a new advisory and returns mapped record', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: sampleRow, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      const fromMock = vi.fn().mockReturnValue({ insert: insertMock });

      const mockClient = { from: fromMock } as unknown as SupabaseClient;
      const repo = new AdvisoryRepository(mockClient);

      const result = await repo.create({
        userId: 'user-abc',
        domainSlug: 'waste-segregation',
        title: sampleRow.title,
        inputs: sampleRow.inputs,
        output: sampleRow.output,
        style: 'concise',
        language: 'en',
        status: 'completed',
        latencyMs: 1200,
        model: 'gemini-2.5-flash',
      });

      expect(fromMock).toHaveBeenCalledWith('advisories');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-abc',
          domain_slug: 'waste-segregation',
          title: sampleRow.title,
          latency_ms: 1200,
          model: 'gemini-2.5-flash',
        })
      );
      expect(result.id).toBe('advisory-123');
      expect(result.userId).toBe('user-abc');
    });

    it('throws AppError when Supabase returns an error', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB connection error' },
      });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      const fromMock = vi.fn().mockReturnValue({ insert: insertMock });

      const mockClient = { from: fromMock } as unknown as SupabaseClient;
      const repo = new AdvisoryRepository(mockClient);

      await expect(
        repo.create({
          userId: 'user-abc',
          domainSlug: 'waste-segregation',
          title: 'Plan',
          inputs: {},
          output: null,
          style: 'concise',
          language: 'en',
          status: 'completed',
        })
      ).rejects.toThrow(AppError);
    });
  });

  interface MockQueryBuilder {
    eq: ReturnType<typeof vi.fn>;
    ilike?: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    range: ReturnType<typeof vi.fn>;
  }

  describe('list', () => {
    it('queries advisories with pagination, filtering, and ordering', async () => {
      const queryMock: MockQueryBuilder = {
        eq: vi.fn(),
        ilike: vi.fn(),
        order: vi.fn(),
        range: vi.fn().mockResolvedValue({
          data: [sampleRow],
          error: null,
          count: 1,
        }),
      };
      queryMock.eq.mockReturnValue(queryMock);
      queryMock.ilike?.mockReturnValue(queryMock);
      queryMock.order.mockReturnValue(queryMock);

      const selectMock = vi.fn().mockReturnValue(queryMock);
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const mockClient = { from: fromMock } as unknown as SupabaseClient;
      const repo = new AdvisoryRepository(mockClient);

      const result = await repo.list({
        userId: 'user-abc',
        page: 2,
        pageSize: 5,
        domain: 'waste-segregation',
        q: 'Custom',
        sort: 'oldest',
      });

      expect(fromMock).toHaveBeenCalledWith('advisories');
      expect(selectMock).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(queryMock.eq).toHaveBeenCalledWith('user_id', 'user-abc');
      expect(queryMock.eq).toHaveBeenCalledWith('domain_slug', 'waste-segregation');
      expect(queryMock.ilike).toHaveBeenCalledWith('title', '%Custom%');
      expect(queryMock.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(queryMock.range).toHaveBeenCalledWith(5, 9);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(1);
    });

    it('orders by title when sort is "title"', async () => {
      const queryMock: MockQueryBuilder = {
        eq: vi.fn(),
        order: vi.fn(),
        range: vi.fn().mockResolvedValue({
          data: [sampleRow],
          error: null,
          count: 1,
        }),
      };
      queryMock.eq.mockReturnValue(queryMock);
      queryMock.order.mockReturnValue(queryMock);

      const selectMock = vi.fn().mockReturnValue(queryMock);
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      await repo.list({
        userId: 'user-abc',
        sort: 'title',
      });

      expect(queryMock.order).toHaveBeenCalledWith('title', { ascending: true });
    });

    it('throws AppError when query execution fails', async () => {
      const queryMock: MockQueryBuilder = {
        eq: vi.fn(),
        order: vi.fn(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database query timeout' },
        }),
      };
      queryMock.eq.mockReturnValue(queryMock);
      queryMock.order.mockReturnValue(queryMock);

      const selectMock = vi.fn().mockReturnValue(queryMock);
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      await expect(
        repo.list({ userId: 'user-abc' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('returns record when found by ID', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: sampleRow,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.getById('advisory-123');

      expect(fromMock).toHaveBeenCalledWith('advisories');
      expect(eqMock).toHaveBeenCalledWith('id', 'advisory-123');
      expect(result?.id).toBe('advisory-123');
    });

    it('filters by userId when provided', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: sampleRow,
        error: null,
      });
      const eqUserMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.getById('advisory-123', 'user-abc');

      expect(eqIdMock).toHaveBeenCalledWith('id', 'advisory-123');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-abc');
      expect(result?.id).toBe('advisory-123');
    });

    it('returns null when record not found', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.getById('non-existent');
      expect(result).toBeNull();
    });

    it('throws AppError when Supabase returns an error', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database failure' },
      });
      const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      await expect(repo.getById('advisory-123')).rejects.toThrow(AppError);
    });
  });

  describe('updateTitle', () => {
    it('updates title and returns updated record', async () => {
      const updatedRow = { ...sampleRow, title: 'Renamed Plan' };
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: updatedRow,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const fromMock = vi.fn().mockReturnValue({ update: updateMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.updateTitle('advisory-123', 'user-abc', 'Renamed Plan');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Renamed Plan' })
      );
      expect(eqIdMock).toHaveBeenCalledWith('id', 'advisory-123');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-abc');
      expect(result?.title).toBe('Renamed Plan');
    });

    it('returns null if record not found for user', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const fromMock = vi.fn().mockReturnValue({ update: updateMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.updateTitle('advisory-123', 'other-user', 'Renamed Plan');
      expect(result).toBeNull();
    });
  });

  describe('saveFeedback', () => {
    it('saves user rating and comment and returns updated record', async () => {
      const feedbackRow = {
        ...sampleRow,
        feedback_rating: 1,
        feedback_comment: 'Very helpful advice!',
        feedback_at: '2026-10-11T12:00:00.000Z',
      };
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: feedbackRow,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const fromMock = vi.fn().mockReturnValue({ update: updateMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.saveFeedback('advisory-123', 'user-abc', {
        rating: 1,
        comment: 'Very helpful advice!',
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_rating: 1,
          feedback_comment: 'Very helpful advice!',
        })
      );
      expect(result?.feedbackRating).toBe(1);
      expect(result?.feedbackComment).toBe('Very helpful advice!');
    });

    it('handles feedback without comment (null default)', async () => {
      const feedbackRow = {
        ...sampleRow,
        feedback_rating: -1,
        feedback_comment: null,
        feedback_at: '2026-10-11T12:00:00.000Z',
      };
      const maybeSingleMock = vi.fn().mockResolvedValue({
        data: feedbackRow,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqUserMock = vi.fn().mockReturnValue({ select: selectMock });
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqIdMock });
      const fromMock = vi.fn().mockReturnValue({ update: updateMock });

      const repo = new AdvisoryRepository({ from: fromMock } as unknown as SupabaseClient);

      const result = await repo.saveFeedback('advisory-123', 'user-abc', {
        rating: -1,
      });

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback_rating: -1,
          feedback_comment: null,
        })
      );
      expect(result?.feedbackRating).toBe(-1);
    });
  });
});

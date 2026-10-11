import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import type { Advisory, AdvisoryRecord } from 'wastewise-shared';
import { AdvisoriesController } from './advisoriesController';
import { AppError } from '../lib/errors';
import type { AdvisoryRepository } from '../repositories/advisoryRepository';
import type { AdvisoryAiService } from '../services/ai/advisoryAiService';

describe('AdvisoriesController', () => {
  let repoCreateMock: ReturnType<typeof vi.fn>;
  let repoListMock: ReturnType<typeof vi.fn>;
  let repoGetByIdMock: ReturnType<typeof vi.fn>;
  let repoUpdateTitleMock: ReturnType<typeof vi.fn>;
  let repoSaveFeedbackMock: ReturnType<typeof vi.fn>;
  let aiGenerateAdvisoryMock: ReturnType<typeof vi.fn>;

  let mockRepo: Partial<AdvisoryRepository>;
  let mockAiService: Partial<AdvisoryAiService>;
  let controller: AdvisoriesController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const sampleAdvisoryOutput: Advisory = {
    title: 'E-Waste Recycling Plan',
    summary: 'Clear step-by-step guidance on safely recycling smartphones.',
    keyInsights: ['Insight 1', 'Insight 2'],
    recommendations: [
      {
        title: 'Authorised Recycler',
        rationale: 'Complies with E-Waste Rules 2022.',
        priority: 'high',
        estimatedEffort: 'low',
      },
      {
        title: 'Factory Reset',
        rationale: 'Protect private user data.',
        priority: 'high',
        estimatedEffort: 'low',
      },
    ],
    risks: [],
    actionPlan: [
      { step: 1, action: 'Backup data', timeframe: 'Day 1' },
      { step: 2, action: 'Locate drop-off point', timeframe: 'Day 2' },
    ],
    resources: [],
    disclaimer: 'Always verify certified e-waste recycler credentials.',
    confidence: { score: 0.9, explanation: 'Well-specified phone inputs.' },
  };

  const sampleRecord: AdvisoryRecord = {
    id: 'advisory-456',
    userId: 'user-123',
    domainSlug: 'ewaste-disposal',
    title: 'E-Waste Recycling Plan',
    inputs: { deviceTypes: ['smartphones'] },
    output: sampleAdvisoryOutput,
    style: 'concise',
    language: 'en',
    status: 'completed',
    model: 'gemini-2.5-flash',
    latencyMs: 800,
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    repoCreateMock = vi.fn();
    repoListMock = vi.fn();
    repoGetByIdMock = vi.fn();
    repoUpdateTitleMock = vi.fn();
    repoSaveFeedbackMock = vi.fn();
    aiGenerateAdvisoryMock = vi.fn();

    mockRepo = {
      create: repoCreateMock,
      list: repoListMock,
      getById: repoGetByIdMock,
      updateTitle: repoUpdateTitleMock,
      saveFeedback: repoSaveFeedbackMock,
    };

    mockAiService = {
      generateAdvisory: aiGenerateAdvisoryMock,
    };

    controller = new AdvisoriesController(
      mockRepo as AdvisoryRepository,
      mockAiService as AdvisoryAiService
    );

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('create', () => {
    it('returns UNAUTHENTICATED error when req.user is missing', async () => {
      mockReq = { body: {} };
      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHENTICATED' })
      );
    });

    it('returns VALIDATION_ERROR on malformed request body', async () => {
      mockReq = {
        user: mockUser,
        body: { domainSlug: '' }, // empty slug violates min(1)
      };

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('returns VALIDATION_ERROR when domainSlug is not a recognized domain', async () => {
      mockReq = {
        user: mockUser,
        body: {
          domainSlug: 'unknown-alien-domain',
          inputs: {},
          style: 'concise',
          language: 'en',
        },
      };

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('unknown-alien-domain'),
        })
      );
    });

    it('generates advisory, persists record, and returns 201 on success', async () => {
      mockReq = {
        user: mockUser,
        body: {
          domainSlug: 'ewaste-disposal',
          inputs: { deviceTypes: ['smartphones'] },
          style: 'concise',
          language: 'en',
        },
      };

      aiGenerateAdvisoryMock.mockResolvedValue(sampleAdvisoryOutput);
      repoCreateMock.mockResolvedValue(sampleRecord);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(aiGenerateAdvisoryMock).toHaveBeenCalledWith({
        domainSlug: 'ewaste-disposal',
        inputs: { deviceTypes: ['smartphones'] },
        style: 'concise',
        language: 'en',
      });

      expect(repoCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          domainSlug: 'ewaste-disposal',
          title: sampleAdvisoryOutput.title,
          output: sampleAdvisoryOutput,
          status: 'completed',
        })
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: sampleRecord,
      });
    });

    it('forwards error to next if AI generation throws', async () => {
      mockReq = {
        user: mockUser,
        body: {
          domainSlug: 'ewaste-disposal',
          inputs: {},
          style: 'concise',
          language: 'en',
        },
      };

      const aiError = new AppError('AI_UNAVAILABLE', 'Gemini down');
      aiGenerateAdvisoryMock.mockRejectedValue(aiError);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(aiError);
    });
  });

  describe('list', () => {
    it('returns UNAUTHENTICATED error when req.user is missing', async () => {
      mockReq = { query: {} };
      await controller.list(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHENTICATED' })
      );
    });

    it('returns VALIDATION_ERROR on invalid query params', async () => {
      mockReq = {
        user: mockUser,
        query: { pageSize: '9999' }, // max is 50
      };

      await controller.list(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('returns paginated list when query is valid', async () => {
      mockReq = {
        user: mockUser,
        query: { page: '1', pageSize: '10', sort: 'newest' },
      };

      const mockPaginated = {
        items: [sampleRecord],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      repoListMock.mockResolvedValue(mockPaginated);

      await controller.list(mockReq as Request, mockRes as Response, mockNext);

      expect(repoListMock).toHaveBeenCalledWith({
        userId: 'user-123',
        page: 1,
        pageSize: 10,
        sort: 'newest',
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPaginated,
      });
    });
  });

  describe('getById', () => {
    it('returns UNAUTHENTICATED when req.user is missing', async () => {
      mockReq = { params: { id: 'advisory-456' } };
      await controller.getById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHENTICATED' })
      );
    });

    it('returns NOT_FOUND if advisory does not exist', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'non-existent' },
      };

      repoGetByIdMock.mockResolvedValue(null);

      await controller.getById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOT_FOUND' })
      );
    });

    it('returns FORBIDDEN if advisory belongs to a different user', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
      };

      repoGetByIdMock.mockResolvedValue({
        ...sampleRecord,
        userId: 'different-user-999',
      });

      await controller.getById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FORBIDDEN' })
      );
    });

    it('returns 200 with record when owned by user', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
      };

      repoGetByIdMock.mockResolvedValue(sampleRecord);

      await controller.getById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: sampleRecord,
      });
    });
  });

  describe('update', () => {
    it('returns UNAUTHENTICATED when req.user is missing', async () => {
      mockReq = { params: { id: 'advisory-456' }, body: { title: 'New' } };
      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHENTICATED' })
      );
    });

    it('returns VALIDATION_ERROR on empty or missing title', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { title: '' },
      };

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('returns NOT_FOUND if advisory does not exist', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'non-existent' },
        body: { title: 'New Title' },
      };

      repoGetByIdMock.mockResolvedValue(null);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOT_FOUND' })
      );
    });

    it('returns FORBIDDEN if owned by different user', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { title: 'New Title' },
      };

      repoGetByIdMock.mockResolvedValue({
        ...sampleRecord,
        userId: 'other-user',
      });

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FORBIDDEN' })
      );
    });

    it('updates title and returns 200 with updated record', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { title: 'Updated Plan Title' },
      };

      const updatedRecord = { ...sampleRecord, title: 'Updated Plan Title' };
      repoGetByIdMock.mockResolvedValue(sampleRecord);
      repoUpdateTitleMock.mockResolvedValue(updatedRecord);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(repoUpdateTitleMock).toHaveBeenCalledWith(
        'advisory-456',
        'user-123',
        'Updated Plan Title'
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedRecord,
      });
    });
  });

  describe('saveFeedback', () => {
    it('returns UNAUTHENTICATED when req.user is missing', async () => {
      mockReq = { params: { id: 'advisory-456' }, body: { rating: 1 } };
      await controller.saveFeedback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'UNAUTHENTICATED' })
      );
    });

    it('returns VALIDATION_ERROR on invalid rating value', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { rating: 5 }, // must be 1 or -1
      };

      await controller.saveFeedback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'VALIDATION_ERROR' })
      );
    });

    it('returns NOT_FOUND if advisory does not exist', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'non-existent' },
        body: { rating: 1 },
      };

      repoGetByIdMock.mockResolvedValue(null);

      await controller.saveFeedback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOT_FOUND' })
      );
    });

    it('returns FORBIDDEN if advisory belongs to someone else', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { rating: 1 },
      };

      repoGetByIdMock.mockResolvedValue({
        ...sampleRecord,
        userId: 'someone-else',
      });

      await controller.saveFeedback(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'FORBIDDEN' })
      );
    });

    it('saves feedback and returns 200 with updated record', async () => {
      mockReq = {
        user: mockUser,
        params: { id: 'advisory-456' },
        body: { rating: 1, comment: 'Great job!' },
      };

      const withFeedback = {
        ...sampleRecord,
        feedbackRating: 1,
        feedbackComment: 'Great job!',
        feedbackAt: '2026-10-11T12:00:00.000Z',
      };

      repoGetByIdMock.mockResolvedValue(sampleRecord);
      repoSaveFeedbackMock.mockResolvedValue(withFeedback);

      await controller.saveFeedback(mockReq as Request, mockRes as Response, mockNext);

      expect(repoSaveFeedbackMock).toHaveBeenCalledWith('advisory-456', 'user-123', {
        rating: 1,
        comment: 'Great job!',
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: withFeedback,
      });
    });
  });
});

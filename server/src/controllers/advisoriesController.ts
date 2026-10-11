import { Request, Response, NextFunction } from 'express';
import {
  CreateAdvisoryRequestSchema,
  ListAdvisoriesQuerySchema,
  UpdateAdvisoryRequestSchema,
  FeedbackRequestSchema,
  getDomainBySlug,
} from 'wastewise-shared';
import { AppError } from '../lib/errors';
import { AdvisoryRepository, advisoryRepository } from '../repositories/advisoryRepository';
import { AdvisoryAiService, advisoryAiService } from '../services/ai/advisoryAiService';

export class AdvisoriesController {
  constructor(
    private repo: AdvisoryRepository = advisoryRepository,
    private aiService: AdvisoryAiService = advisoryAiService
  ) {}

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    const parseResult = CreateAdvisoryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const details = parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(
        new AppError('VALIDATION_ERROR', 'Invalid advisory request data', details)
      );
    }

    const { domainSlug, inputs, style, language } = parseResult.data;

    // Validate domain existence
    const domain = getDomainBySlug(domainSlug);
    if (!domain) {
      return next(
        new AppError('VALIDATION_ERROR', `Domain "${domainSlug}" does not exist`, [
          { path: 'domainSlug', message: `Unknown domain "${domainSlug}"` },
        ])
      );
    }

    try {
      const startTime = Date.now();
      const advisory = await this.aiService.generateAdvisory({
        domainSlug,
        inputs,
        style,
        language,
      });
      const latencyMs = Date.now() - startTime;

      const record = await this.repo.create({
        userId: req.user.id,
        domainSlug,
        title: advisory.title,
        inputs,
        output: advisory,
        style,
        language,
        status: 'completed',
        latencyMs,
        model: 'gemini-2.5-flash',
      });

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  };

  public list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    const parseResult = ListAdvisoriesQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const details = parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(
        new AppError('VALIDATION_ERROR', 'Invalid query parameters', details)
      );
    }

    try {
      const result = await this.repo.list({
        userId: req.user.id,
        ...parseResult.data,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    const id = String(req.params.id);

    try {
      const record = await this.repo.getById(id);
      if (!record) {
        return next(new AppError('NOT_FOUND', 'Advisory not found'));
      }

      if (record.userId !== req.user.id) {
        return next(
          new AppError('FORBIDDEN', 'You do not have access to this advisory')
        );
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  };

  public update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    const id = String(req.params.id);

    const parseResult = UpdateAdvisoryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const details = parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(
        new AppError('VALIDATION_ERROR', 'Invalid advisory update data', details)
      );
    }

    try {
      const existing = await this.repo.getById(id);
      if (!existing) {
        return next(new AppError('NOT_FOUND', 'Advisory not found'));
      }

      if (existing.userId !== req.user.id) {
        return next(
          new AppError('FORBIDDEN', 'You do not have access to update this advisory')
        );
      }

      const updated = await this.repo.updateTitle(
        id,
        req.user.id,
        parseResult.data.title
      );

      if (!updated) {
        return next(new AppError('NOT_FOUND', 'Advisory not found'));
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  public saveFeedback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('UNAUTHENTICATED', 'User is not authenticated'));
    }

    const id = String(req.params.id);

    const parseResult = FeedbackRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const details = parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(
        new AppError('VALIDATION_ERROR', 'Invalid feedback data', details)
      );
    }

    try {
      const existing = await this.repo.getById(id);
      if (!existing) {
        return next(new AppError('NOT_FOUND', 'Advisory not found'));
      }

      if (existing.userId !== req.user.id) {
        return next(
          new AppError(
            'FORBIDDEN',
            'You do not have access to provide feedback for this advisory'
          )
        );
      }

      const updated = await this.repo.saveFeedback(
        id,
        req.user.id,
        parseResult.data
      );

      if (!updated) {
        return next(new AppError('NOT_FOUND', 'Advisory not found'));
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const advisoriesController = new AdvisoriesController();

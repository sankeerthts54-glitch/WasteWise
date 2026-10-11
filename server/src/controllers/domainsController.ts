import { Request, Response, NextFunction } from 'express';
import { DOMAINS, getDomainBySlug } from 'wastewise-shared';
import { AppError } from '../lib/errors';

export function listDomains(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: DOMAINS,
  });
}

export function getDomain(req: Request, res: Response, next: NextFunction): void {
  const slug = String(req.params.slug);
  const domain = getDomainBySlug(slug);

  if (!domain) {
    return next(new AppError('NOT_FOUND', `Domain '${slug}' not found`));
  }

  res.json({
    success: true,
    data: domain,
  });
}

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Advisory,
  AdvisoryRecord,
  AdvisoryStatus,
  AdvisoryStyle,
  PaginatedList,
} from 'wastewise-shared';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export interface AdvisoryDbRow {
  id: string;
  user_id: string;
  domain_slug: string;
  title: string;
  inputs: Record<string, unknown>;
  output: Record<string, unknown> | null;
  style: AdvisoryStyle;
  language: string;
  status: AdvisoryStatus;
  error_message: string | null;
  model: string | null;
  latency_ms: number | null;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdvisoryParams {
  userId: string;
  domainSlug: string;
  title: string;
  inputs: Record<string, unknown>;
  output: Advisory | Record<string, unknown> | null;
  style: AdvisoryStyle;
  language: string;
  status: AdvisoryStatus;
  errorMessage?: string | null;
  model?: string | null;
  latencyMs?: number | null;
}

export interface ListAdvisoriesParams {
  userId: string;
  page?: number;
  pageSize?: number;
  q?: string;
  domain?: string;
  sort?: 'newest' | 'oldest' | 'title';
}

export interface SaveFeedbackParams {
  rating: 1 | -1;
  comment?: string;
}

export function mapRowToRecord(row: AdvisoryDbRow): AdvisoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    domainSlug: row.domain_slug,
    title: row.title,
    inputs: row.inputs,
    output: (row.output as Advisory | null) ?? null,
    style: row.style,
    language: row.language,
    status: row.status,
    errorMessage: row.error_message,
    model: row.model,
    latencyMs: row.latency_ms,
    feedbackRating: row.feedback_rating,
    feedbackComment: row.feedback_comment,
    feedbackAt: row.feedback_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AdvisoryRepository {
  constructor(private client: SupabaseClient = supabaseAdmin) {}

  public async create(params: CreateAdvisoryParams): Promise<AdvisoryRecord> {
    const { data, error } = await this.client
      .from('advisories')
      .insert({
        user_id: params.userId,
        domain_slug: params.domainSlug,
        title: params.title,
        inputs: params.inputs,
        output: params.output,
        style: params.style,
        language: params.language,
        status: params.status,
        error_message: params.errorMessage ?? null,
        model: params.model ?? null,
        latency_ms: params.latencyMs ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      logger.error({ error, userId: params.userId }, 'Failed to insert advisory record');
      throw new AppError('INTERNAL', error?.message || 'Failed to create advisory record');
    }

    return mapRowToRecord(data as AdvisoryDbRow);
  }

  public async list(params: ListAdvisoriesParams): Promise<PaginatedList<AdvisoryRecord>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.client
      .from('advisories')
      .select('*', { count: 'exact' })
      .eq('user_id', params.userId);

    if (params.domain) {
      query = query.eq('domain_slug', params.domain);
    }

    if (params.q && params.q.trim()) {
      query = query.ilike('title', `%${params.q.trim()}%`);
    }

    switch (params.sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'title':
        query = query.order('title', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({ error, userId: params.userId }, 'Failed to list advisories');
      throw new AppError('INTERNAL', error.message || 'Failed to retrieve advisories');
    }

    const items = ((data as AdvisoryDbRow[]) || []).map(mapRowToRecord);
    const total = count ?? items.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public async getById(id: string, userId?: string): Promise<AdvisoryRecord | null> {
    let query = this.client.from('advisories').select('*').eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      logger.error({ error, id, userId }, 'Failed to fetch advisory by ID');
      throw new AppError('INTERNAL', error.message || 'Failed to fetch advisory');
    }

    if (!data) {
      return null;
    }

    return mapRowToRecord(data as AdvisoryDbRow);
  }

  public async updateTitle(
    id: string,
    userId: string,
    title: string
  ): Promise<AdvisoryRecord | null> {
    const { data, error } = await this.client
      .from('advisories')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error({ error, id, userId }, 'Failed to update advisory title');
      throw new AppError('INTERNAL', error.message || 'Failed to update advisory title');
    }

    if (!data) {
      return null;
    }

    return mapRowToRecord(data as AdvisoryDbRow);
  }

  public async saveFeedback(
    id: string,
    userId: string,
    feedback: SaveFeedbackParams
  ): Promise<AdvisoryRecord | null> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('advisories')
      .update({
        feedback_rating: feedback.rating,
        feedback_comment: feedback.comment ?? null,
        feedback_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      logger.error({ error, id, userId }, 'Failed to save advisory feedback');
      throw new AppError('INTERNAL', error.message || 'Failed to save advisory feedback');
    }

    if (!data) {
      return null;
    }

    return mapRowToRecord(data as AdvisoryDbRow);
  }
}

export const advisoryRepository = new AdvisoryRepository();

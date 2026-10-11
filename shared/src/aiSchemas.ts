import { z } from 'zod';

// ============ ADVISORY OUTPUT SCHEMA ============
export const AdvisorySchema = z.object({
  title: z.string().min(3).max(120),
  summary: z.string().min(20).max(1200),
  keyInsights: z.array(z.string().min(5).max(300)).min(2).max(8),
  recommendations: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        rationale: z.string().min(10).max(600),
        priority: z.enum(['high', 'medium', 'low']),
        estimatedEffort: z.enum(['low', 'medium', 'high']),
      })
    )
    .min(2)
    .max(8),
  risks: z
    .array(
      z.object({
        description: z.string().min(5).max(400),
        severity: z.enum(['low', 'medium', 'high']),
        mitigation: z.string().min(5).max(400),
      })
    )
    .max(8),
  actionPlan: z
    .array(
      z.object({
        step: z.number().int().min(1),
        action: z.string().min(5).max(300),
        timeframe: z.string().min(2).max(60),
      })
    )
    .min(2)
    .max(12),
  resources: z
    .array(
      z.object({
        name: z.string().min(2).max(120),
        description: z.string().min(5).max(250),
      })
    )
    .max(6),
  disclaimer: z.string().min(10).max(400),
  confidence: z.object({
    score: z.number().min(0).max(1),
    explanation: z.string().min(5).max(300),
  }),
});

export type Advisory = z.infer<typeof AdvisorySchema>;

// ============ API REQUEST/RESPONSE SCHEMAS ============
export const CreateAdvisoryRequestSchema = z
  .object({
    domainSlug: z.string().min(1),
    inputs: z.record(z.unknown()),
    style: z.enum(['concise', 'detailed']).default('concise'),
    language: z.string().default('en'),
  })
  .strict();

export type CreateAdvisoryRequest = z.infer<typeof CreateAdvisoryRequestSchema>;

export const ListAdvisoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().max(100).optional(),
  domain: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'title']).default('newest'),
});

export type ListAdvisoriesQuery = z.infer<typeof ListAdvisoriesQuerySchema>;

export const UpdateAdvisoryRequestSchema = z
  .object({
    title: z.string().min(1).max(200),
  })
  .strict();

export type UpdateAdvisoryRequest = z.infer<typeof UpdateAdvisoryRequestSchema>;

export const UpdateProfileRequestSchema = z
  .object({
    displayName: z.string().min(1).max(80).optional(),
    preferences: z.record(z.unknown()).optional(),
  })
  .strict();

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const FeedbackRequestSchema = z
  .object({
    rating: z.union([z.literal(1), z.literal(-1)]),
    comment: z.string().max(1000).optional(),
  })
  .strict();

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

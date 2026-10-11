import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { AppError } from '../../lib/errors';
import { Advisory, AdvisorySchema } from 'wastewise-shared';
import { BuiltPrompt } from './promptBuilder';

/**
 * Gemini response schema definition matching AdvisorySchema from wastewise-shared.
 */
export const geminiAdvisoryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    keyInsights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          rationale: { type: Type.STRING },
          priority: {
            type: Type.STRING,
            enum: ['high', 'medium', 'low'],
          },
          estimatedEffort: {
            type: Type.STRING,
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['title', 'rationale', 'priority', 'estimatedEffort'],
      },
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: ['low', 'medium', 'high'],
          },
          mitigation: { type: Type.STRING },
        },
        required: ['description', 'severity', 'mitigation'],
      },
    },
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          action: { type: Type.STRING },
          timeframe: { type: Type.STRING },
        },
        required: ['step', 'action', 'timeframe'],
      },
    },
    resources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['name', 'description'],
      },
    },
    disclaimer: { type: Type.STRING },
    confidence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        explanation: { type: Type.STRING },
      },
      required: ['score', 'explanation'],
    },
  },
  required: [
    'title',
    'summary',
    'keyInsights',
    'recommendations',
    'risks',
    'actionPlan',
    'resources',
    'disclaimer',
    'confidence',
  ],
};

export interface GeminiClientOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
}

export class GeminiClient {
  private client: GoogleGenAI;
  private model: string;
  private timeoutMs: number;
  private maxRetries: number;
  private baseDelayMs: number;

  constructor(options: GeminiClientOptions = {}) {
    const apiKey = options.apiKey || env.GEMINI_API_KEY;
    this.client = new GoogleGenAI({ apiKey });
    this.model = options.model || env.GEMINI_MODEL;
    this.timeoutMs = options.timeoutMs ?? env.GEMINI_TIMEOUT_MS;
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
  }

  /**
   * Helper to execute promise with timeout.
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new AppError('AI_UNAVAILABLE', `Gemini API request timed out after ${ms}ms`));
      }, ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Exponential backoff sleep with jitter.
   */
  private async sleepWithJitter(attempt: number): Promise<void> {
    const backoff = this.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 200;
    const delay = backoff + jitter;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Checks if an error is retryable (transient 429, 503, network disconnect).
   */
  private isRetryableError(error: unknown): boolean {
    if (!error) return false;
    const err = error as { status?: number; statusCode?: number; message?: string };
    const status = err.status || err.statusCode;
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    const message = (err.message || '').toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('resource exhausted') ||
      message.includes('unavailable') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('etimedout')
    );
  }

  /**
   * Generates structured advisory using Gemini with exponential backoff and schema validation.
   */
  public async generateStructuredAdvisory(prompt: BuiltPrompt): Promise<Advisory> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug({ attempt, model: this.model }, 'Calling Gemini API for advisory generation');

        const callPromise = this.client.models.generateContent({
          model: this.model,
          contents: prompt.userPrompt,
          config: {
            systemInstruction: prompt.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: geminiAdvisoryResponseSchema,
            temperature: 0.2,
          },
        });

        const response = await this.withTimeout(callPromise, this.timeoutMs);
        const text = typeof response.text === 'function' ? (response.text as () => string)() : response.text;

        if (!text) {
          throw new AppError('AI_INVALID_OUTPUT', 'Gemini returned empty response text');
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(text);
        } catch (jsonErr) {
          logger.error({ err: jsonErr, rawText: text }, 'Failed to parse Gemini response as JSON');
          throw new AppError('AI_INVALID_OUTPUT', 'Gemini response was not valid JSON');
        }

        const parseResult = AdvisorySchema.safeParse(parsedJson);
        if (!parseResult.success) {
          logger.error(
            { errors: parseResult.error.flatten().fieldErrors, parsedJson },
            'Gemini response failed AdvisorySchema validation'
          );
          throw new AppError(
            'AI_INVALID_OUTPUT',
            'AI generated an advisory that does not conform to the schema specifications',
            parseResult.error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            }))
          );
        }

        return parseResult.data;
      } catch (err) {
        lastError = err;

        // If it's already an AppError that is AI_INVALID_OUTPUT, don't retry (model produced bad schema)
        if (err instanceof AppError && err.code === 'AI_INVALID_OUTPUT') {
          throw err;
        }

        const isRetryable = this.isRetryableError(err);
        if (attempt < this.maxRetries && isRetryable) {
          logger.warn(
            { attempt, err: (err as Error).message },
            'Transient Gemini error encountered; retrying with backoff'
          );
          await this.sleepWithJitter(attempt);
          continue;
        }

        break;
      }
    }

    if (lastError instanceof AppError) {
      throw lastError;
    }

    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
    logger.error({ err: lastError }, 'Gemini advisory generation failed permanently');
    throw new AppError('AI_UNAVAILABLE', `AI service error: ${errorMsg}`);
  }
}

// Export default singleton instance
export const geminiClient = new GeminiClient();

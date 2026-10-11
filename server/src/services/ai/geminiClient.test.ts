import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from './geminiClient';
import { BuiltPrompt } from './promptBuilder';
import { Advisory } from 'wastewise-shared';

const mockValidAdvisory: Advisory = {
  title: 'Urban Household Waste Segregation Action Plan',
  summary: 'A step-by-step strategy for sorting household wet, dry, and sanitary waste in Bengaluru.',
  keyInsights: [
    'BBMP mandates 3-way segregation at source under Solid Waste Management Rules 2016.',
    'Wet waste accounts for ~60% of household volume and is ideal for home composting.',
  ],
  recommendations: [
    {
      title: 'Setup 2-bin 1-bag segregation station',
      rationale: 'Provides clear visual cues for green (wet), red (sanitary), and bag (dry recyclables).',
      priority: 'high',
      estimatedEffort: 'low',
    },
    {
      title: 'Partner with local dry waste collection centre',
      rationale: 'Ensures plastics and cardboard reach authorized aggregators instead of landfills.',
      priority: 'medium',
      estimatedEffort: 'medium',
    },
  ],
  risks: [
    {
      description: 'Mixed waste rejected by municipal collection vehicle',
      severity: 'medium',
      mitigation: 'Inspect bins daily before morning doorstep collection.',
    },
  ],
  actionPlan: [
    {
      step: 1,
      action: 'Procure color-coded bins and compostable liners',
      timeframe: 'Day 1-2',
    },
    {
      step: 2,
      action: 'Brief family members on segregating kitchen peelings from plastic wraps',
      timeframe: 'Day 3',
    },
  ],
  resources: [
    {
      name: 'Hasiru Dala Dry Waste Collection',
      description: 'Bengaluru-based waste picker collective handling dry recyclables.',
    },
  ],
  disclaimer: 'Advisory provided for planning purposes. Follow prevailing local municipal waste bylaws.',
  confidence: {
    score: 0.95,
    explanation: 'High confidence due to complete household location and waste volume inputs.',
  },
};

const samplePrompt: BuiltPrompt = {
  systemInstruction: 'WasteWise System Instruction',
  userPrompt: 'Domain: Waste Segregation',
};

describe('GeminiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully generates and parses valid advisory', async () => {
    const client = new GeminiClient({ apiKey: 'fake-key', maxRetries: 1 });

    const generateContentMock = vi.fn().mockResolvedValue({
      text: () => JSON.stringify(mockValidAdvisory),
    });

    // Mock internal client models.generateContent
    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    const result = await client.generateStructuredAdvisory(samplePrompt);
    expect(result.title).toBe(mockValidAdvisory.title);
    expect(result.recommendations).toHaveLength(2);
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('handles response.text as direct property or getter string', async () => {
    const client = new GeminiClient({ apiKey: 'fake-key', maxRetries: 1 });

    const generateContentMock = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockValidAdvisory),
    });

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    const result = await client.generateStructuredAdvisory(samplePrompt);
    expect(result.title).toBe(mockValidAdvisory.title);
  });

  it('throws AI_INVALID_OUTPUT when model response is empty', async () => {
    const client = new GeminiClient({ apiKey: 'fake-key', maxRetries: 1 });

    const generateContentMock = vi.fn().mockResolvedValue({
      text: () => '',
    });

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    await expect(client.generateStructuredAdvisory(samplePrompt)).rejects.toMatchObject({
      code: 'AI_INVALID_OUTPUT',
      message: expect.stringContaining('empty response text'),
    });
  });

  it('throws AI_INVALID_OUTPUT when JSON fails AdvisorySchema validation', async () => {
    const client = new GeminiClient({ apiKey: 'fake-key', maxRetries: 1 });

    const invalidAdvisory = {
      title: 'Bad', // too short (<3 chars)
      summary: 'Too short',
    };

    const generateContentMock = vi.fn().mockResolvedValue({
      text: () => JSON.stringify(invalidAdvisory),
    });

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    await expect(client.generateStructuredAdvisory(samplePrompt)).rejects.toMatchObject({
      code: 'AI_INVALID_OUTPUT',
    });
  });

  it('retries on retryable transient error (e.g. rate limit 429) and succeeds', async () => {
    const client = new GeminiClient({
      apiKey: 'fake-key',
      maxRetries: 2,
      baseDelayMs: 10,
    });

    const error429 = new Error('Resource exhausted / 429 rate limit');
    (error429 as unknown as { status: number }).status = 429;

    const generateContentMock = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({
        text: () => JSON.stringify(mockValidAdvisory),
      });

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    const result = await client.generateStructuredAdvisory(samplePrompt);
    expect(result.title).toBe(mockValidAdvisory.title);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
  });

  it('throws AI_UNAVAILABLE when retries are exhausted', async () => {
    const client = new GeminiClient({
      apiKey: 'fake-key',
      maxRetries: 1,
      baseDelayMs: 5,
    });

    const serverError = new Error('503 Service Unavailable');
    (serverError as unknown as { status: number }).status = 503;

    const generateContentMock = vi.fn().mockRejectedValue(serverError);

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    await expect(client.generateStructuredAdvisory(samplePrompt)).rejects.toMatchObject({
      code: 'AI_UNAVAILABLE',
    });
    expect(generateContentMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('enforces timeout and throws AI_UNAVAILABLE', async () => {
    const client = new GeminiClient({
      apiKey: 'fake-key',
      timeoutMs: 50,
      maxRetries: 0,
      baseDelayMs: 5,
    });

    const hangingPromise = new Promise<{ text: () => string }>((resolve) => {
      setTimeout(() => resolve({ text: () => JSON.stringify(mockValidAdvisory) }), 200);
    });

    const generateContentMock = vi.fn().mockReturnValue(hangingPromise);

    (client as unknown as { client: { models: { generateContent: typeof generateContentMock } } }).client = {
      models: { generateContent: generateContentMock },
    };

    await expect(client.generateStructuredAdvisory(samplePrompt)).rejects.toMatchObject({
      code: 'AI_UNAVAILABLE',
      message: expect.stringContaining('timed out after 50ms'),
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { AdvisoryAiService } from './advisoryAiService';
import { GeminiClient } from './geminiClient';
import { Advisory, CreateAdvisoryRequest } from 'wastewise-shared';

const sampleAdvisory: Advisory = {
  title: 'Solar Rooftop Optimization Plan',
  summary: 'Feasibility analysis and subsidy roadmap for PM Surya Ghar in Gujarat.',
  keyInsights: [
    '500 sq ft provides sufficient unobstructed space for a ~4 kW grid-tied solar system.',
    'Gujarat DGVCL provides net metering support with 30-day turnaround for domestic consumers.',
  ],
  recommendations: [
    {
      title: 'Apply via PM Surya Ghar National Portal',
      rationale: 'Eligible for direct subsidy up to ₹78,000 for residential systems up to 3 kW.',
      priority: 'high',
      estimatedEffort: 'low',
    },
    {
      title: 'Select empaneled DISCOM vendor',
      rationale: 'Mandatory requirement to release central financial assistance directly into bank account.',
      priority: 'high',
      estimatedEffort: 'medium',
    },
  ],
  risks: [
    {
      description: 'Shadowing from neighboring water tanks during winter months',
      severity: 'medium',
      mitigation: 'Elevate mounting structure by 1.5 meters during installer civil inspection.',
    },
  ],
  actionPlan: [
    {
      step: 1,
      action: 'Register consumer CA number on pmsuryaghar.gov.in',
      timeframe: 'Day 1',
    },
    {
      step: 2,
      action: 'Invite DISCOM empaneled vendor for site survey',
      timeframe: 'Week 1',
    },
  ],
  resources: [
    {
      name: 'PM Surya Ghar Portal',
      description: 'National portal for rooftop solar applications and subsidies.',
    },
  ],
  disclaimer: 'Estimates are indicative. Actual generation depends on irradiance and panel quality.',
  confidence: {
    score: 0.9,
    explanation: 'Calculated using exact rooftop area and billing inputs provided.',
  },
};

describe('AdvisoryAiService', () => {
  it('orchestrates prompt building and calls gemini client to generate advisory', async () => {
    const mockGeminiClient = {
      generateStructuredAdvisory: vi.fn().mockResolvedValue(sampleAdvisory),
    } as unknown as GeminiClient;

    const service = new AdvisoryAiService(mockGeminiClient);

    const request: CreateAdvisoryRequest = {
      domainSlug: 'solar-energy',
      inputs: {
        location: 'Gujarat',
        rooftopAreaSqFt: 500,
        monthlyBillRs: 3500,
      },
      style: 'detailed',
      language: 'en',
    };

    const result = await service.generateAdvisory(request);

    expect(result).toEqual(sampleAdvisory);
    expect(mockGeminiClient.generateStructuredAdvisory).toHaveBeenCalledTimes(1);

    const calledPrompt = (mockGeminiClient.generateStructuredAdvisory as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(calledPrompt.systemInstruction).toContain('WasteWise');
    expect(calledPrompt.userPrompt).toContain('Rooftop Solar & Energy');
    expect(calledPrompt.userPrompt).toContain('Gujarat');
  });
});

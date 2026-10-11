import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvisoryHeader } from './AdvisoryHeader';
import { AdvisorySummary } from './AdvisorySummary';
import { AdvisoryRecommendations } from './AdvisoryRecommendations';
import { AdvisoryActionPlan } from './AdvisoryActionPlan';
import { AdvisoryRisks } from './AdvisoryRisks';
import { AdvisoryResources } from './AdvisoryResources';
import { AdvisoryInputDrawer } from './AdvisoryInputDrawer';
import { AdvisoryFeedback } from './AdvisoryFeedback';
import * as apiClientModule from '../../lib/apiClient';
import type { AdvisoryRecord, Advisory } from 'wastewise-shared';

const mockAdvisoryData: Advisory = {
  title: 'Urban Segregation Plan',
  summary: 'Comprehensive waste segregation blueprint for apartment dwellers in Bengaluru.',
  keyInsights: [
    'Color-coded bins reduce contamination by 75%',
    'Wet waste composting operates effectively in balcony spaces',
  ],
  recommendations: [
    {
      title: 'Deploy Dual Bins in Kitchen',
      rationale: 'Separating green and blue waste at source ensures BBMP compliance.',
      priority: 'high',
      estimatedEffort: 'low',
    },
    {
      title: 'Engage Local Kabadiwala',
      rationale: 'Selling dry cardboard and plastic generates monthly savings.',
      priority: 'medium',
      estimatedEffort: 'medium',
    },
  ],
  risks: [
    {
      description: 'Mixed hazardous batteries in general dry waste',
      severity: 'high',
      mitigation: 'Store dry cells in a sealed jar and deposit at authorised e-waste drop-offs.',
    },
  ],
  actionPlan: [
    {
      step: 1,
      action: 'Purchase two 15-litre bins with lids.',
      timeframe: 'Day 1',
    },
    {
      step: 2,
      action: 'Place bin liner made of compostable starch material.',
      timeframe: 'Day 2',
    },
  ],
  resources: [
    {
      name: 'BBMP Solid Waste Rules 2020',
      description: 'Official municipal guidelines for Bengaluru residents.',
    },
  ],
  disclaimer: 'Advisories are based on national SWM Rules 2016. Check local ward notifications.',
  confidence: {
    score: 0.94,
    explanation: 'High confidence based on standard Bengaluru municipal segregation norms.',
  },
};

const mockRecord: AdvisoryRecord = {
  id: 'adv-12345678-abcd',
  userId: 'user-1',
  domainSlug: 'waste-segregation',
  title: 'Urban Segregation Plan',
  inputs: {
    location: 'Bengaluru',
    settingType: 'household',
    dailyWasteKg: 2.5,
  },
  output: mockAdvisoryData,
  style: 'concise',
  language: 'en',
  status: 'completed',
  latencyMs: 1450,
  model: 'gemini-2.5-flash',
  feedbackRating: 1,
  feedbackComment: 'Very practical advice!',
  feedbackAt: '2026-10-11T12:00:00Z',
  createdAt: '2026-10-11T10:00:00Z',
  updatedAt: '2026-10-11T10:00:00Z',
};

describe('Phase 7 Advisory UI Components', () => {
  describe('AdvisoryHeader', () => {
    it('renders title, domain meta, latency, and feedback badge', () => {
      const onTitleUpdate = vi.fn();
      const onExportMarkdown = vi.fn();
      const onExportJson = vi.fn();

      render(
        <AdvisoryHeader
          advisory={mockRecord}
          onTitleUpdate={onTitleUpdate}
          onExportMarkdown={onExportMarkdown}
          onExportJson={onExportJson}
        />
      );

      expect(screen.getByText('Urban Segregation Plan')).toBeInTheDocument();
      expect(screen.getByText('Waste Segregation')).toBeInTheDocument();
      expect(screen.getByText(/generation/i)).toBeInTheDocument();
      expect(screen.getByText('gemini-2.5-flash')).toBeInTheDocument();
      expect(screen.getByText('Rated Helpful')).toBeInTheDocument();
    });

    it('allows entering title edit mode and triggering update', async () => {
      const onTitleUpdate = vi.fn().mockResolvedValue(undefined);
      const onExportMarkdown = vi.fn();
      const onExportJson = vi.fn();

      render(
        <AdvisoryHeader
          advisory={mockRecord}
          onTitleUpdate={onTitleUpdate}
          onExportMarkdown={onExportMarkdown}
          onExportJson={onExportJson}
        />
      );

      const editBtn = screen.getByTitle('Edit Title');
      fireEvent.click(editBtn);

      const input = screen.getByDisplayValue('Urban Segregation Plan');
      fireEvent.change(input, { target: { value: 'Updated Title Plan' } });

      const saveBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onTitleUpdate).toHaveBeenCalledWith('Updated Title Plan');
      });
    });

    it('triggers export callbacks on button clicks', () => {
      const onTitleUpdate = vi.fn();
      const onExportMarkdown = vi.fn();
      const onExportJson = vi.fn();

      render(
        <AdvisoryHeader
          advisory={mockRecord}
          onTitleUpdate={onTitleUpdate}
          onExportMarkdown={onExportMarkdown}
          onExportJson={onExportJson}
        />
      );

      const mdBtn = screen.getByTitle('Download as Markdown file');
      fireEvent.click(mdBtn);
      expect(onExportMarkdown).toHaveBeenCalledTimes(1);

      const jsonBtn = screen.getByTitle('Export raw JSON');
      fireEvent.click(jsonBtn);
      expect(onExportJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('AdvisorySummary', () => {
    it('renders executive summary, confidence score, and key insights', () => {
      render(
        <AdvisorySummary
          summary={mockAdvisoryData.summary}
          confidence={mockAdvisoryData.confidence}
          keyInsights={mockAdvisoryData.keyInsights}
        />
      );

      expect(screen.getByText(mockAdvisoryData.summary)).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText(/High \(94%\)/)).toBeInTheDocument();
      expect(
        screen.getByText('Color-coded bins reduce contamination by 75%')
      ).toBeInTheDocument();
    });
  });

  describe('AdvisoryRecommendations', () => {
    it('renders recommendations with priority and effort indicators', () => {
      render(
        <AdvisoryRecommendations
          recommendations={mockAdvisoryData.recommendations}
        />
      );

      expect(screen.getByText('Deploy Dual Bins in Kitchen')).toBeInTheDocument();
      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.getByText('Quick Win')).toBeInTheDocument();
      expect(screen.getByText('Engage Local Kabadiwala')).toBeInTheDocument();
      expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    });
  });

  describe('AdvisoryActionPlan', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('renders step sequence and tracks step completion toggles', () => {
      render(
        <AdvisoryActionPlan
          advisoryId={mockRecord.id}
          actionPlan={mockAdvisoryData.actionPlan}
        />
      );

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Purchase two 15-litre bins with lids.')).toBeInTheDocument();
      expect(screen.getByText('0 of 2 completed (0%)')).toBeInTheDocument();

      // Toggle first step
      const toggleBtn = screen.getByLabelText('Toggle step 1');
      fireEvent.click(toggleBtn);

      expect(screen.getByText('1 of 2 completed (50%)')).toBeInTheDocument();
    });

    it('supports mark all done and reset actions', () => {
      render(
        <AdvisoryActionPlan
          advisoryId={mockRecord.id}
          actionPlan={mockAdvisoryData.actionPlan}
        />
      );

      const markAllBtn = screen.getByRole('button', { name: /mark all done/i });
      fireEvent.click(markAllBtn);

      expect(screen.getByText('2 of 2 completed (100%)')).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText('0 of 2 completed (0%)')).toBeInTheDocument();
    });
  });

  describe('AdvisoryRisks', () => {
    it('renders hazards, severity badges, and mitigations', () => {
      render(<AdvisoryRisks risks={mockAdvisoryData.risks} />);

      expect(
        screen.getByText('Mixed hazardous batteries in general dry waste')
      ).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
      expect(
        screen.getByText(/Store dry cells in a sealed jar/)
      ).toBeInTheDocument();
    });
  });

  describe('AdvisoryResources', () => {
    it('renders resource cards and statutory disclaimer notice', () => {
      render(
        <AdvisoryResources
          resources={mockAdvisoryData.resources}
          disclaimer={mockAdvisoryData.disclaimer}
        />
      );

      expect(screen.getByText('BBMP Solid Waste Rules 2020')).toBeInTheDocument();
      expect(
        screen.getByText('Official municipal guidelines for Bengaluru residents.')
      ).toBeInTheDocument();
      expect(screen.getByText(/Advisories are based on national SWM Rules 2016/)).toBeInTheDocument();
    });
  });

  describe('AdvisoryInputDrawer', () => {
    it('expands on toggle to show submitted intake inputs', () => {
      render(
        <AdvisoryInputDrawer
          inputs={mockRecord.inputs}
          domainSlug={mockRecord.domainSlug}
        />
      );

      expect(
        screen.getByText('Intake Context & Parameters')
      ).toBeInTheDocument();

      // Click accordion trigger
      const trigger = screen.getByRole('button', {
        name: /Intake Context & Parameters/i,
      });
      fireEvent.click(trigger);

      expect(screen.getByText('City / Town')).toBeInTheDocument();
      expect(screen.getByText('Bengaluru')).toBeInTheDocument();
      expect(screen.getByText('Setting')).toBeInTheDocument();
      expect(screen.getByText('household')).toBeInTheDocument();
    });
  });

  describe('AdvisoryFeedback', () => {
    it('submits rating and comment to API endpoint', async () => {
      const apiClientSpy = vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue({
        ...mockRecord,
        feedbackRating: 1,
        feedbackComment: 'Great practical recommendations!',
      });
      const onFeedbackSaved = vi.fn();

      render(
        <AdvisoryFeedback
          advisoryId={mockRecord.id}
          onFeedbackSaved={onFeedbackSaved}
        />
      );

      const helpfulBtn = screen.getByRole('button', { name: /helpful/i });
      fireEvent.click(helpfulBtn);

      const textarea = screen.getByPlaceholderText(/Share any details/i);
      fireEvent.change(textarea, {
        target: { value: 'Great practical recommendations!' },
      });

      const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(apiClientSpy).toHaveBeenCalledWith(
          `/advisories/${mockRecord.id}/feedback`,
          {
            method: 'POST',
            body: JSON.stringify({
              rating: 1,
              comment: 'Great practical recommendations!',
            }),
          }
        );
        expect(onFeedbackSaved).toHaveBeenCalled();
      });
    });
  });
});

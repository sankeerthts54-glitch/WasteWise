import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdvisoriesPage } from './AdvisoriesPage';
import { AdvisoryDetailPage } from './AdvisoryDetailPage';
import * as apiClientModule from '../lib/apiClient';
import type { AdvisoryRecord, Advisory, PaginatedList } from 'wastewise-shared';

const mockAdvisoryData: Advisory = {
  title: 'Rooftop Solar Plan',
  summary: 'Solar PV system sizing and net metering guidance for independent house.',
  keyInsights: ['Saves up to 80% on daytime electricity tariff.'],
  recommendations: [
    {
      title: 'Apply for PM Surya Ghar subsidy',
      rationale: 'Receive direct benefit transfer of up to ₹78,000.',
      priority: 'high',
      estimatedEffort: 'medium',
    },
  ],
  risks: [
    {
      description: 'Shading from adjacent trees',
      severity: 'medium',
      mitigation: 'Prune overhanging branches or use micro-inverters.',
    },
  ],
  actionPlan: [
    {
      step: 1,
      action: 'Register on national portal for rooftop solar.',
      timeframe: 'Day 1',
    },
  ],
  resources: [
    {
      name: 'PM Surya Ghar Portal',
      description: 'National portal for rooftop solar subsidy scheme.',
    },
  ],
  disclaimer: 'DISCOM net metering approvals are subject to transformer capacity.',
  confidence: {
    score: 0.92,
    explanation: 'Solar irradiance models for region indicate strong feasibility.',
  },
};

const mockRecord: AdvisoryRecord = {
  id: 'adv-solar-1234',
  userId: 'user-1',
  domainSlug: 'solar-energy',
  title: 'Rooftop Solar Plan',
  inputs: {
    location: 'Ahmedabad',
    propertyType: 'independent_house',
    rooftopAreaSqFt: 500,
    monthlyBillRs: 4500,
  },
  output: mockAdvisoryData,
  style: 'concise',
  language: 'en',
  status: 'completed',
  latencyMs: 1200,
  model: 'gemini-2.5-flash',
  feedbackRating: 1,
  feedbackComment: 'Super clear!',
  feedbackAt: '2026-10-11T12:00:00Z',
  createdAt: '2026-10-11T10:00:00Z',
  updatedAt: '2026-10-11T10:00:00Z',
};

const mockPaginatedList: PaginatedList<AdvisoryRecord> = {
  items: [mockRecord],
  total: 1,
  page: 1,
  pageSize: 9,
  totalPages: 1,
};

describe('Advisories & Advisory Detail Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdvisoriesPage', () => {
    it('fetches and displays list of advisories with filter options', async () => {
      vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue(mockPaginatedList);

      render(
        <MemoryRouter>
          <AdvisoriesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Rooftop Solar Plan')).toBeInTheDocument();
        expect(screen.getAllByText('Rooftop Solar & Energy').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('1 total')).toBeInTheDocument();
      });

      // Check search input exists
      const searchInput = screen.getByPlaceholderText(/search advisories/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('displays empty state when no advisories found', async () => {
      vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 9,
        totalPages: 0,
      });

      render(
        <MemoryRouter>
          <AdvisoriesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no advisories generated yet/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /explore domains/i })).toBeInTheDocument();
      });
    });
  });

  describe('AdvisoryDetailPage', () => {
    it('fetches and renders complete advisory detail view', async () => {
      vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue(mockRecord);

      render(
        <MemoryRouter initialEntries={['/advisories/adv-solar-1234']}>
          <Routes>
            <Route path="/advisories/:id" element={<AdvisoryDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Rooftop Solar Plan')).toBeInTheDocument();
        expect(
          screen.getByText(/Solar PV system sizing and net metering guidance/)
        ).toBeInTheDocument();
        expect(screen.getByText('Apply for PM Surya Ghar subsidy')).toBeInTheDocument();
        expect(screen.getByText('PM Surya Ghar Portal')).toBeInTheDocument();
      });
    });

    it('renders error state on API failure', async () => {
      vi.spyOn(apiClientModule, 'apiClient').mockRejectedValue(
        new Error('Advisory not found')
      );

      render(
        <MemoryRouter initialEntries={['/advisories/adv-solar-1234']}>
          <Routes>
            <Route path="/advisories/:id" element={<AdvisoryDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Advisory not found/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });
});

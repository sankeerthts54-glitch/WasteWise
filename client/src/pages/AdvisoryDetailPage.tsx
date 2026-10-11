import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PlusCircle, Compass, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { apiClient } from '../lib/apiClient';
import {
  AdvisoryHeader,
  AdvisorySummary,
  AdvisoryRecommendations,
  AdvisoryActionPlan,
  AdvisoryRisks,
  AdvisoryResources,
  AdvisoryInputDrawer,
  AdvisoryFeedback,
} from '../components/advisory';
import { formatAdvisoryMarkdown, downloadTextFile } from '../lib/advisoryExport';
import type { AdvisoryRecord, Advisory } from 'wastewise-shared';

export const AdvisoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [advisory, setAdvisory] = useState<AdvisoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvisory = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient<AdvisoryRecord>(`/advisories/${id}`);
      setAdvisory(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load advisory record';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAdvisory();
  }, [fetchAdvisory]);

  const handleUpdateTitle = async (newTitle: string) => {
    if (!id || !advisory) return;
    const updated = await apiClient<AdvisoryRecord>(`/advisories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: newTitle }),
    });
    setAdvisory((prev) => (prev ? { ...prev, title: updated.title } : updated));
  };

  const handleExportMarkdown = () => {
    if (!advisory) return;
    const md = formatAdvisoryMarkdown(advisory);
    const filename = `wastewise-${advisory.domainSlug}-${advisory.id.slice(0, 8)}.md`;
    downloadTextFile(filename, md, 'text/markdown');
  };

  const handleExportJson = () => {
    if (!advisory) return;
    const json = JSON.stringify(advisory, null, 2);
    const filename = `wastewise-${advisory.domainSlug}-${advisory.id.slice(0, 8)}.json`;
    downloadTextFile(filename, json, 'application/json');
  };

  const handleFeedbackSaved = (updated: AdvisoryRecord) => {
    setAdvisory((prev) =>
      prev
        ? {
            ...prev,
            feedbackRating: updated.feedbackRating,
            feedbackComment: updated.feedbackComment,
            feedbackAt: updated.feedbackAt,
          }
        : updated
    );
  };

  if (isLoading) {
    return (
      <div
        className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8"
        aria-busy="true"
        aria-label="Loading advisory"
      >
        {/* Back button skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32 hidden sm:block" />
        </div>
        {/* Header card skeleton */}
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-3/4" rounded="lg" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
        {/* Summary card skeleton */}
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 p-6 space-y-4">
          <Skeleton className="h-6 w-48" rounded="lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
        {/* Recommendations skeleton */}
        <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 p-6 space-y-3">
          <Skeleton className="h-6 w-40" rounded="lg" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  if (error || !advisory) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Alert variant="error" className="mb-6 text-left">
          {error || 'Advisory record not found'}
        </Alert>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/advisories')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Advisories</span>
          </Button>
          <Button variant="primary" onClick={fetchAdvisory} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  const output = (advisory.output as Advisory | null) || null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/advisories"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Advisories</span>
        </Link>

        <span className="text-[11px] font-mono text-gray-400 dark:text-gray-600 hidden sm:inline">
          ID: {advisory.id.slice(0, 13)}...
        </span>
      </div>

      {/* Advisory Header with Title Editing and Exports */}
      <AdvisoryHeader
        advisory={advisory}
        onTitleUpdate={handleUpdateTitle}
        onExportMarkdown={handleExportMarkdown}
        onExportJson={handleExportJson}
      />

      {/* Executive Summary, Confidence Score & Key Insights */}
      {output && (
        <AdvisorySummary
          summary={output.summary}
          confidence={output.confidence}
          keyInsights={output.keyInsights}
        />
      )}

      {/* Prioritized Recommendations */}
      {output && output.recommendations && (
        <AdvisoryRecommendations recommendations={output.recommendations} />
      )}

      {/* Implementation Roadmap / Action Plan */}
      {output && output.actionPlan && (
        <AdvisoryActionPlan advisoryId={advisory.id} actionPlan={output.actionPlan} />
      )}

      {/* Hazards and Mitigations */}
      {output && output.risks && <AdvisoryRisks risks={output.risks} />}

      {/* Authorized Resources & Regulatory Disclaimer */}
      {output && (
        <AdvisoryResources
          resources={output.resources}
          disclaimer={output.disclaimer}
        />
      )}

      {/* Submitted Context Drawer */}
      <AdvisoryInputDrawer
        inputs={advisory.inputs}
        domainSlug={advisory.domainSlug}
      />

      {/* User Feedback Module */}
      <AdvisoryFeedback
        advisoryId={advisory.id}
        initialRating={advisory.feedbackRating}
        initialComment={advisory.feedbackComment}
        initialFeedbackAt={advisory.feedbackAt}
        onFeedbackSaved={handleFeedbackSaved}
      />

      {/* Next Step Navigation Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200/80 pt-6 dark:border-gray-800/80"
      >
        <Button
          variant="outline"
          onClick={() => navigate('/advisories')}
          className="gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All Advisories</span>
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="ghost"
            onClick={() => navigate('/domains')}
            className="gap-2 text-xs"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Other Domains</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate(`/domains/${advisory.domainSlug}`)}
            className="gap-2 text-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Generate New in this Domain</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

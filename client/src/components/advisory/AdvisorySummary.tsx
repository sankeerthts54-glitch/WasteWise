import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AdvisorySummaryProps {
  summary: string;
  confidence: {
    score: number;
    explanation: string;
  };
  keyInsights: string[];
}

export const AdvisorySummary: React.FC<AdvisorySummaryProps> = ({
  summary,
  confidence,
  keyInsights,
}) => {
  const confidencePercent = Math.round(confidence.score * 100);
  const confidenceLevel =
    confidence.score >= 0.85 ? 'High' : confidence.score >= 0.65 ? 'Medium' : 'Caution';

  return (
    <div className="space-y-6">
      {/* Executive Summary & Confidence Callout */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="relative overflow-hidden border-brand-200/60 bg-gradient-to-br from-brand-50/70 via-white to-emerald-50/40 p-6 sm:p-8 dark:border-brand-900/50 dark:from-brand-950/30 dark:via-gray-900 dark:to-emerald-950/20 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Executive Summary
              </h2>
            </div>

            {/* Confidence Metric Gauge */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  AI Confidence
                </span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {confidenceLevel} ({confidencePercent}%)
                </span>
              </div>
              <Badge
                variant={
                  confidence.score >= 0.85
                    ? 'success'
                    : confidence.score >= 0.65
                    ? 'brand'
                    : 'warning'
                }
                className="gap-1 px-2.5 py-1"
                title={confidence.explanation}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{confidencePercent}%</span>
              </Badge>
            </div>
          </div>

          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
            {summary}
          </p>

          {/* Confidence Explanation Subtext */}
          {confidence.explanation && (
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-brand-100/80 pt-3 dark:border-brand-900/30">
              <span className="font-semibold text-brand-700 dark:text-brand-300">Model Grounding:</span>
              <span>{confidence.explanation}</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Key Insights Grid */}
      {keyInsights && keyInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Key Strategic Insights
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyInsights.map((insight, idx) => (
              <Card
                key={idx}
                className="p-4 flex items-start gap-3 bg-white/60 dark:bg-gray-900/60 hover:border-brand-400/50 transition-colors"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-normal">
                  {insight}
                </p>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

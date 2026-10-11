import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListOrdered, CheckCircle, Circle, Clock, CheckCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Advisory } from 'wastewise-shared';

interface AdvisoryActionPlanProps {
  advisoryId: string;
  actionPlan: Advisory['actionPlan'];
}

export const AdvisoryActionPlan: React.FC<AdvisoryActionPlanProps> = ({
  advisoryId,
  actionPlan,
}) => {
  const storageKey = `wastewise_actions_${advisoryId}`;

  // Initialize checked steps from localStorage
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedSteps));
    } catch {
      // ignore
    }
  }, [completedSteps, storageKey]);

  if (!actionPlan || actionPlan.length === 0) return null;

  const totalSteps = actionPlan.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleResetProgress = () => {
    setCompletedSteps({});
  };

  const handleMarkAllComplete = () => {
    const allDone: Record<number, boolean> = {};
    actionPlan.forEach((s) => {
      allDone[s.step] = true;
    });
    setCompletedSteps(allDone);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <ListOrdered className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Implementation Roadmap
          </h2>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetProgress}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white h-7 px-2"
            >
              Reset
            </Button>
          )}
          {completedCount < totalSteps && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllComplete}
              className="text-xs h-7 px-2.5 gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>Mark all done</span>
            </Button>
          )}
        </div>
      </div>

      {/* Progress tracker bar */}
      <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-4 shadow-sm dark:border-gray-800/80 dark:bg-gray-900/70">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            Action Items Execution
          </span>
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {completedCount} of {totalSteps} completed ({progressPercent}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3 relative">
        {actionPlan.map((stepItem, index) => {
          const isDone = Boolean(completedSteps[stepItem.step]);

          return (
            <motion.div
              key={stepItem.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card
                className={`p-4 transition-all duration-200 cursor-pointer select-none border ${
                  isDone
                    ? 'border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20 opacity-80'
                    : 'border-gray-200/80 bg-white/80 hover:border-brand-400/60 dark:border-gray-800/80 dark:bg-gray-900/80'
                }`}
                onClick={() => toggleStep(stepItem.step)}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(stepItem.step);
                    }}
                    className="mt-0.5 shrink-0 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors focus:outline-none"
                    aria-label={`Toggle step ${stepItem.step}`}
                  >
                    {isDone ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-brand-500" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Step {stepItem.step}
                      </span>
                      <Badge variant="neutral" size="sm" className="gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{stepItem.timeframe}</span>
                      </Badge>
                    </div>

                    <p
                      className={`text-sm leading-relaxed transition-all ${
                        isDone
                          ? 'text-gray-500 line-through dark:text-gray-400'
                          : 'text-gray-800 font-medium dark:text-gray-200'
                      }`}
                    >
                      {stepItem.action}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

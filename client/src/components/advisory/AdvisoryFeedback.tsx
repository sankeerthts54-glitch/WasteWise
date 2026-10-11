import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageSquare, Check, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/apiClient';
import type { AdvisoryRecord } from 'wastewise-shared';

interface AdvisoryFeedbackProps {
  advisoryId: string;
  initialRating?: number | null;
  initialComment?: string | null;
  initialFeedbackAt?: string | null;
  onFeedbackSaved?: (updated: AdvisoryRecord) => void;
}

export const AdvisoryFeedback: React.FC<AdvisoryFeedbackProps> = ({
  advisoryId,
  initialRating,
  initialComment,
  initialFeedbackAt,
  onFeedbackSaved,
}) => {
  const [rating, setRating] = useState<1 | -1 | null>(
    initialRating === 1 || initialRating === -1 ? (initialRating as 1 | -1) : null
  );
  const [comment, setComment] = useState(initialComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialFeedbackAt ? 'Feedback recorded' : null
  );
  const [showCommentInput, setShowCommentInput] = useState(Boolean(initialRating || initialComment));

  const handleSelectRating = (selected: 1 | -1) => {
    setRating(selected);
    setShowCommentInput(true);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient<AdvisoryRecord>(`/advisories/${advisoryId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      setSuccessMessage('Thank you for rating! Your feedback refines future advisories.');
      if (onFeedbackSaved) {
        onFeedbackSaved(res);
      }
    } catch {
      setSuccessMessage('Failed to save feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white/90 via-gray-50/70 to-brand-50/30 dark:from-gray-900/90 dark:via-gray-850/70 dark:to-brand-950/20 border-gray-200/80 dark:border-gray-800/80 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Was this advisory helpful?
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Help calibrate WasteWise environmental recommendations for your city
          </p>
        </div>

        {/* Rating Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={rating === 1 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleSelectRating(1)}
            className={`gap-1.5 transition-all ${
              rating === 1 ? 'shadow-md shadow-emerald-500/20' : ''
            }`}
            disabled={isSubmitting}
            aria-label="Helpful"
          >
            <ThumbsUp className={`h-4 w-4 ${rating === 1 ? 'text-white' : 'text-emerald-600'}`} />
            <span>Helpful</span>
          </Button>

          <Button
            type="button"
            variant={rating === -1 ? 'danger' : 'outline'}
            size="sm"
            onClick={() => handleSelectRating(-1)}
            className={`gap-1.5 transition-all ${
              rating === -1 ? 'shadow-md shadow-rose-500/20' : ''
            }`}
            disabled={isSubmitting}
            aria-label="Needs Improvement"
          >
            <ThumbsDown className={`h-4 w-4 ${rating === -1 ? 'text-white' : 'text-rose-500'}`} />
            <span>Could be better</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showCommentInput && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800"
          >
            <div className="relative">
              <MessageSquare className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any details, missing municipal rules, or local nuances (optional)..."
                maxLength={500}
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 backdrop-blur focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">
                {comment.length}/500 characters
              </span>

              <div className="flex items-center gap-2">
                {successMessage && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    <span>{successMessage}</span>
                  </span>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || rating === null}
                  className="gap-1.5 h-8 text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Card>
  );
};

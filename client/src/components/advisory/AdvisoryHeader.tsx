import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Cpu,
  Edit2,
  Check,
  X,
  Share2,
  Printer,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getDomainMeta } from '../../lib/domainMeta';
import type { AdvisoryRecord } from 'wastewise-shared';

interface AdvisoryHeaderProps {
  advisory: AdvisoryRecord;
  onTitleUpdate: (newTitle: string) => Promise<void>;
  onExportMarkdown: () => void;
  onExportJson: () => void;
}

export const AdvisoryHeader: React.FC<AdvisoryHeaderProps> = ({
  advisory,
  onTitleUpdate,
  onExportMarkdown,
  onExportJson,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(advisory.title);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const meta = getDomainMeta(advisory.domainSlug);
  const formattedDate = new Date(advisory.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue.trim() === advisory.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      setIsSaving(true);
      await onTitleUpdate(titleValue.trim());
      setIsEditingTitle(false);
    } catch {
      // Revert if error
      setTitleValue(advisory.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/80 p-6 sm:p-8 shadow-xl backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/80"
    >
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />

      {/* Meta Pills Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="brand" className="gap-1 px-3 py-1 text-xs font-bold">
          <span>{meta?.icon || '🌱'}</span>
          <span>{meta?.name || advisory.domainSlug}</span>
        </Badge>

        <Badge variant="neutral" className="gap-1 text-xs">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span>{formattedDate}</span>
        </Badge>

        {advisory.latencyMs ? (
          <Badge variant="neutral" className="gap-1 text-xs">
            <Clock className="h-3 w-3 text-emerald-500" />
            <span>{(advisory.latencyMs / 1000).toFixed(1)}s generation</span>
          </Badge>
        ) : null}

        {advisory.model ? (
          <Badge variant="neutral" className="gap-1 text-xs hidden sm:inline-flex">
            <Cpu className="h-3 w-3 text-cyan-500" />
            <span>{advisory.model}</span>
          </Badge>
        ) : null}

        <Badge variant="neutral" className="text-xs uppercase">
          {advisory.style}
        </Badge>

        {advisory.feedbackRating ? (
          <Badge
            variant={advisory.feedbackRating === 1 ? 'success' : 'warning'}
            className="gap-1 text-xs ml-auto"
          >
            {advisory.feedbackRating === 1 ? (
              <ThumbsUp className="h-3 w-3" />
            ) : (
              <ThumbsDown className="h-3 w-3" />
            )}
            <span>{advisory.feedbackRating === 1 ? 'Rated Helpful' : 'Needs Improvement'}</span>
          </Badge>
        ) : null}
      </div>

      {/* Title & Edit Actions */}
      <div className="mt-2">
        {isEditingTitle ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className="flex-1 rounded-xl border border-brand-500 bg-white px-4 py-2 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-gray-800 dark:text-white"
              autoFocus
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
            />
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveTitle}
                disabled={isSaving}
                className="gap-1"
              >
                <Check className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTitleValue(advisory.title);
                  setIsEditingTitle(false);
                }}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="group flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-snug">
              {advisory.title || 'Environmental Advisory'}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingTitle(true)}
              className="shrink-0 text-gray-400 hover:text-gray-900 dark:hover:text-white p-2"
              title="Edit Title"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportMarkdown}
            className="gap-1.5 text-xs"
            title="Download as Markdown file"
          >
            <Download className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Markdown</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportJson}
            className="gap-1.5 text-xs"
            title="Export raw JSON"
          >
            <Copy className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs hidden sm:inline-flex"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5 text-gray-500" />
            <span>Print / PDF</span>
          </Button>
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

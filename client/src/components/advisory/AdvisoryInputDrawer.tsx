import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Card } from '../ui/Card';
import { getDomainBySlug } from 'wastewise-shared';

interface AdvisoryInputDrawerProps {
  inputs: Record<string, unknown>;
  domainSlug: string;
}

export const AdvisoryInputDrawer: React.FC<AdvisoryInputDrawerProps> = ({
  inputs,
  domainSlug,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const domainConfig = getDomainBySlug(domainSlug);

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'Not specified';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const getLabel = (key: string): string => {
    const field = domainConfig?.fields.find((f) => f.name === key);
    return field ? field.label : key;
  };

  const entries = Object.entries(inputs || {});
  if (entries.length === 0) return null;

  return (
    <Card className="overflow-hidden border-gray-200/80 bg-white/60 dark:border-gray-800/80 dark:bg-gray-900/60">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Intake Context &amp; Parameters
          </span>
          <span className="text-xs text-gray-400">({entries.length} fields)</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50/40 dark:bg-gray-950/20">
              {entries.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-gray-100 bg-white p-3 shadow-xs dark:border-gray-800 dark:bg-gray-900"
                >
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate mb-1">
                    {getLabel(key)}
                  </span>
                  <span className="block text-xs font-medium text-gray-800 dark:text-gray-200 break-words">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Advisory } from 'wastewise-shared';

interface AdvisoryResourcesProps {
  resources: Advisory['resources'];
  disclaimer: string;
}

export const AdvisoryResources: React.FC<AdvisoryResourcesProps> = ({
  resources,
  disclaimer,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35 }}
      className="space-y-6"
    >
      {/* Resources & Reference Frameworks */}
      {resources && resources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Authorized Resources &amp; Schemes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {resources.map((item, index) => (
              <Card
                key={index}
                className="p-4 bg-white/70 dark:bg-gray-900/70 border-gray-200/80 dark:border-gray-800/80 hover:border-cyan-500/40"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    {item.name}
                  </h4>
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Official Disclaimer */}
      {disclaimer && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4.5 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Statutory &amp; Municipal Notice:</span>
            <span>{disclaimer}</span>
          </div>
        </div>
      )}
    </motion.section>
  );
};

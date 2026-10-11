import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Advisory } from 'wastewise-shared';

interface AdvisoryRisksProps {
  risks: Advisory['risks'];
}

export const AdvisoryRisks: React.FC<AdvisoryRisksProps> = ({ risks }) => {
  if (!risks || risks.length === 0) return null;

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return (
          <Badge variant="danger" size="sm" className="font-bold">
            High Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="sm" className="font-bold">
            Moderate Risk
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="neutral" size="sm">
            Low Risk
          </Badge>
        );
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Potential Hazards &amp; Risk Mitigation
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((risk, index) => (
          <Card
            key={index}
            className="p-5 flex flex-col justify-between bg-white/70 dark:bg-gray-900/70 border-gray-200/80 dark:border-gray-800/80"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hazard #{index + 1}
                </span>
                {getSeverityBadge(risk.severity)}
              </div>

              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                {risk.description}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50/70 p-3 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Mitigation Strategy</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {risk.mitigation}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </motion.section>
  );
};

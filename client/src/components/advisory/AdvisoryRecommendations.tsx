import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Advisory } from 'wastewise-shared';

interface AdvisoryRecommendationsProps {
  recommendations: Advisory['recommendations'];
}

export const AdvisoryRecommendations: React.FC<AdvisoryRecommendationsProps> = ({
  recommendations,
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="danger" size="sm" className="gap-1 font-bold">
            <Zap className="h-3 w-3" />
            <span>High Priority</span>
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="sm" className="gap-1 font-bold">
            <span>Medium Priority</span>
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="neutral" size="sm" className="gap-1 font-semibold">
            <span>Low Priority</span>
          </Badge>
        );
    }
  };

  const getEffortBadge = (effort: 'low' | 'medium' | 'high') => {
    switch (effort) {
      case 'low':
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Quick Win</span>
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Moderate Effort</span>
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="neutral" size="sm" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>High Investment</span>
          </Badge>
        );
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Target className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Actionable Recommendations
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-400">
          {recommendations.length} recommendations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Card className="h-full flex flex-col justify-between p-5 bg-white/70 dark:bg-gray-900/70 border-gray-200/80 dark:border-gray-800/80 hover:border-brand-500/40">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {getPriorityBadge(rec.priority)}
                  {getEffortBadge(rec.estimatedEffort)}
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                  {rec.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {rec.rationale}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

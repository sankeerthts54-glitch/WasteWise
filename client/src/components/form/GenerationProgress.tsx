import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '../ui/Card';

export interface GenerationProgressProps {
  domainName: string;
  isGenerating: boolean;
  onCancel?: () => void;
}

const CHECKPOINTS = [
  { label: 'Analysing intake parameters & localized metrics', duration: 2500 },
  { label: 'Applying Indian municipal rules & environmental frameworks', duration: 4500 },
  { label: 'Synthesizing actionable steps & risk mitigations with Gemini', duration: 6000 },
  { label: 'Structuring verified resource citations & payback timelines', duration: 4000 },
];

const SUSTAINABILITY_TIPS = [
  'In India, wet organic waste constitutes ~50% of municipal solid waste and can be composted in-situ.',
  'Under E-Waste Management Rules 2022, authorized PROs must offer safe channelization and buyback.',
  'Rooftop solar under PM Surya Ghar can subsidize up to ₹78,000 for standard 3kW residential systems.',
  'Segregating at source prevents up to 85% of domestic waste from ending up in local landfills.',
];

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  domainName,
  isGenerating,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setActiveStep(0);
      setElapsedSec(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % SUSTAINABILITY_TIPS.length);
    }, 4500);

    // Progress simulation through checkpoints
    const t1 = setTimeout(() => setActiveStep(1), 2500);
    const t2 = setTimeout(() => setActiveStep(2), 6500);
    const t3 = setTimeout(() => setActiveStep(3), 11500);

    return () => {
      clearInterval(timer);
      clearInterval(tipInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <Card className="relative overflow-hidden border-emerald-500/30 bg-gray-950/80 p-8 shadow-2xl backdrop-blur-2xl">
      {/* Top ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative space-y-6 text-center">
        {/* Pulsing AI Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 8, ease: 'linear' }, scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
          >
            <Brain className="h-8 w-8 text-emerald-400" />
          </motion.div>
        </div>

        <div>
          <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Synthesizing {domainName} Advisory
          </h3>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Our Gemini AI model is formulating an actionable, policy-compliant strategy
          </p>
        </div>

        {/* Stopwatch & Live status */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3.5 py-1 text-xs font-mono text-emerald-400">
          <Clock className="h-3.5 w-3.5 animate-spin" />
          <span>Processing: {elapsedSec}s</span>
          <span className="text-gray-500">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> Grounded in Indian Regulations
          </span>
        </div>

        {/* Checkpoint list */}
        <div className="mx-auto max-w-md space-y-3 pt-2 text-left">
          {CHECKPOINTS.map((step, idx) => {
            const isDone = activeStep > idx;
            const isCurrent = activeStep === idx;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all duration-300 ${
                  isCurrent
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30'
                    : isDone
                    ? 'border-emerald-500/20 bg-gray-900/60 text-gray-300'
                    : 'border-gray-800/60 bg-gray-950/40 text-gray-500 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-emerald-400" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-gray-600" />
                )}
                <span className="text-xs font-medium leading-tight">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live rotating sustainability insight */}
        <div className="mx-auto max-w-lg rounded-xl border border-emerald-500/15 bg-emerald-950/20 p-3 text-left">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[11px] text-gray-300 leading-relaxed"
              >
                <strong className="text-emerald-400">Eco Fact: </strong>
                {SUSTAINABILITY_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Card>
  );
};

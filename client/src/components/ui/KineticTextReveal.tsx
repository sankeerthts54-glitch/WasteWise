import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

interface KineticTextRevealProps {
  text: string;
  className?: string;
  wordClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  delay?: number;
  stagger?: number;
  highlightWords?: string[];
  highlightClassName?: string;
}

export const KineticTextReveal: React.FC<KineticTextRevealProps> = ({
  text,
  className = '',
  wordClassName = '',
  as: Component = 'h1',
  delay = 0,
  stagger = 0.05,
  highlightWords = [],
  highlightClassName = 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_36px_rgba(52,211,153,0.4)]',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  const containerVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 0 : 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: {
      y: shouldReduceMotion ? 0 : '115%',
      opacity: shouldReduceMotion ? 0 : 0.001,
      rotateX: shouldReduceMotion ? 0 : -35,
      filter: shouldReduceMotion ? 'none' : 'blur(4px)',
    },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.72,
        ease: [0.16, 1, 0.3, 1], // Smooth bespoke ease-out curve
      },
    },
  };

  return (
    <Component className={cn('inline-block leading-tight', className)}>
      <motion.span
        className="inline flex-wrap"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ perspective: 1000 }}
      >
        {words.map((word, index) => {
          // Normalize comparison without trailing punctuation
          const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase();
          const isHighlighted = highlightWords.some(
            (hw) => hw.toLowerCase() === cleanWord
          );

          return (
            <span
              key={`${word}-${index}`}
              className="inline-block overflow-hidden align-top py-1 pr-[0.3em] last:pr-0"
              style={{
                verticalAlign: 'top',
                lineHeight: 'inherit',
              }}
            >
              <motion.span
                className={cn(
                  'inline-block will-change-transform transform-gpu origin-bottom-left',
                  wordClassName,
                  isHighlighted && highlightClassName
                )}
                variants={wordVariants}
              >
                {word}
              </motion.span>
            </span>
          );
        })}
      </motion.span>
    </Component>
  );
};

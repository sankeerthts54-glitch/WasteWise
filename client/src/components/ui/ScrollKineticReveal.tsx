import React from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ScrollKineticRevealProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
  as?: 'h2' | 'h3' | 'h4' | 'div' | 'p';
  delay?: number;
  highlightWords?: string[];
  highlightClassName?: string;
}

export const ScrollKineticReveal: React.FC<ScrollKineticRevealProps> = ({
  children,
  text,
  className = '',
  as: Component = 'h2',
  delay = 0,
  highlightWords = [],
  highlightClassName = 'bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (text) {
    const words = text.split(/\s+/).filter(Boolean);

    const containerVariants: Variants = {
      hidden: { opacity: shouldReduceMotion ? 0 : 1 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: shouldReduceMotion ? 0 : 0.045,
          delayChildren: delay,
        },
      },
    };

    const wordVariants: Variants = {
      hidden: {
        y: shouldReduceMotion ? 0 : '110%',
        opacity: shouldReduceMotion ? 0 : 0.001,
        rotateX: shouldReduceMotion ? 0 : -25,
      },
      visible: {
        y: '0%',
        opacity: 1,
        rotateX: 0,
        transition: {
          duration: shouldReduceMotion ? 0.2 : 0.65,
          ease: [0.16, 1, 0.3, 1],
        },
      },
    };

    return (
      <Component className={cn('overflow-visible', className)}>
        <motion.span
          className="inline-block"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{ perspective: 1000 }}
        >
          {words.map((word, idx) => {
            const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase();
            const isHighlighted = highlightWords.some(
              (hw) => hw.toLowerCase() === cleanWord
            );

            return (
              <span
                key={`${word}-${idx}`}
                className="inline-block overflow-hidden align-top py-0.5 pr-[0.28em] last:pr-0"
              >
                <motion.span
                  className={cn(
                    'inline-block will-change-transform transform-gpu origin-bottom-left',
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
  }

  // Fallback for custom children block reveal
  const blockVariants: Variants = {
    hidden: {
      y: shouldReduceMotion ? 0 : 36,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.65,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <Component className={cn('overflow-hidden', className)}>
      <motion.div
        variants={blockVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        {children}
      </motion.div>
    </Component>
  );
};

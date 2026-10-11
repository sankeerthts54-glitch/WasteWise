import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              type="button"
              key={opt.value}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(opt.value)}
              className={cn(
                'group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                isSelected
                  ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'border-emerald-500/20 bg-gray-950/60 text-gray-300 hover:border-emerald-500/40 hover:bg-gray-950/80'
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-emerald-500 bg-transparent'
                    : 'border-gray-600 bg-gray-900 group-hover:border-gray-500'
                )}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug">{opt.label}</p>
                {opt.description && (
                  <p className="mt-0.5 text-[11px] text-gray-400">{opt.description}</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
};

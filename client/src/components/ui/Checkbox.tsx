import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps {
  label: string;
  description?: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  checked,
  onChange,
  id,
  disabled,
  className,
}) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <div className={cn('text-left space-y-1', className)}>
      <motion.label
        htmlFor={checkboxId}
        whileHover={{ scale: disabled ? 1 : 1.01 }}
        whileTap={{ scale: disabled ? 1 : 0.99 }}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all duration-200',
          checked
            ? 'border-emerald-500/80 bg-emerald-950/30 ring-1 ring-emerald-500/50'
            : 'border-emerald-500/20 bg-gray-950/60 hover:border-emerald-500/40 hover:bg-gray-950/80',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="relative mt-0.5 flex items-center">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-md border transition-colors',
              checked
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-600 bg-gray-900'
            )}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-gray-200">
            {label}
          </span>
          {description && (
            <p className="mt-0.5 text-[11px] text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </motion.label>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 pl-1">{error}</p>
      )}
    </div>
  );
};

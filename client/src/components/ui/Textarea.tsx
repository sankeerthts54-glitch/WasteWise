import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, maxLength, value, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              {label}
            </label>
          )}
          {maxLength && (
            <span className="text-[11px] text-gray-400">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <div className="relative rounded-xl shadow-sm">
          <textarea
            id={textareaId}
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={cn(
              'block w-full min-h-[90px] rounded-xl border border-emerald-500/25 bg-gray-950/75 p-3 text-sm text-gray-100 placeholder-gray-500 backdrop-blur-xl transition-all duration-200 resize-y',
              'hover:border-emerald-400/50 focus:border-emerald-400 focus:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/25',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

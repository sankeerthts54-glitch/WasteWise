import React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  className,
  label,
  error,
  helperText,
  min,
  max,
  step = 1,
  value,
  unit = '',
  onChange,
  id,
  disabled,
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
          {value} {unit}
        </span>
      </div>

      <div className="relative flex items-center py-1">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            background: `linear-gradient(to right, rgb(16 185 129) 0%, rgb(16 185 129) ${percentage}%, rgb(31 41 55) ${percentage}%, rgb(31 41 55) 100%)`,
          }}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-lg accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'accent-rose-500'
          )}
        />
      </div>

      <div className="flex justify-between text-[11px] font-mono text-gray-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
};

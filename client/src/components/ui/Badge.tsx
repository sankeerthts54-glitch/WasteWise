import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  pulse = false,
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30 shadow-emerald-950/50',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
    info: 'bg-sky-950/70 text-sky-300 border-sky-500/30',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-500/30',
    neutral: 'bg-gray-900/70 text-gray-300 border-white/10',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-sm font-semibold tracking-wide transition-all select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};

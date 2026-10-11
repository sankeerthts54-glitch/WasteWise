import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  onDismiss,
  children,
  ...props
}) => {
  const configs = {
    info: {
      container: 'border-sky-500/30 bg-sky-950/60 text-sky-200 backdrop-blur-xl',
      icon: <Info className="h-5 w-5 text-sky-400" />,
    },
    success: {
      container: 'border-emerald-500/30 bg-emerald-950/60 text-emerald-200 backdrop-blur-xl',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    },
    warning: {
      container: 'border-amber-500/30 bg-amber-950/60 text-amber-200 backdrop-blur-xl',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    },
    error: {
      container: 'border-rose-500/30 bg-rose-950/60 text-rose-200 backdrop-blur-xl',
      icon: <AlertCircle className="h-5 w-5 text-rose-400" />,
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3.5 rounded-2xl border p-4 shadow-sm backdrop-blur transition-all',
        current.container,
        className
      )}
      {...props}
    >
      <div className="shrink-0">{current.icon}</div>
      <div className="flex-1 text-sm">
        {title && <h5 className="mb-1 font-semibold leading-none tracking-tight">{title}</h5>}
        <div className="text-opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

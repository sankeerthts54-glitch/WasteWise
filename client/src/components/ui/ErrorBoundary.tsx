import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in development; swap for a monitoring service in production
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 ring-1 ring-rose-500/20">
            <AlertTriangle className="h-10 w-10 text-rose-500" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              className="gap-2"
              onClick={this.handleReset}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => (window.location.href = '/')}
            >
              Go home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

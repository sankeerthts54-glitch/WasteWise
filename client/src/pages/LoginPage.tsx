import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Recycle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/domains';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your client/.env.local (or client/.env) file and restart the dev server.'
      );
      return;
    }

    if (!email) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isOtpMode && !password) {
      setErrorMessage('Please enter your password or choose Magic Link OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, isOtpMode ? undefined : password);
      if (error) {
        if (error.message === 'Failed to fetch') {
          setErrorMessage(
            'Failed to connect to Supabase ("Failed to fetch"). Please verify that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are valid in client/.env.local and that your network is connected.'
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        if (isOtpMode) {
          setInfoMessage('Magic link sent to your email! Click it to sign in instantly.');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md"
      >
        <Card className="border-emerald-500/25 bg-gray-950/80 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/25 mb-3">
              <Recycle className="h-6 w-6" />
            </Link>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Welcome Back
            </h2>
            <p className="mt-1 text-xs text-gray-300">
              Sign in to manage and view your sustainability advisories
            </p>
          </div>

          {!isSupabaseConfigured && (
            <Alert variant="warning" className="mb-4">
              Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>client/.env.local</code> (or <code>client/.env</code>) and restart your dev server.
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="error" className="mb-4" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {infoMessage && (
            <Alert variant="success" className="mb-4" onDismiss={() => setInfoMessage(null)}>
              {infoMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />

            {!isOtpMode && (
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
            )}

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOtpMode(!isOtpMode);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
              >
                {isOtpMode ? 'Switch to Password Sign In' : 'Sign in with Magic Link OTP'}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full gap-2 mt-2"
              isLoading={isLoading}
            >
              <span>{isOtpMode ? 'Send Magic Link' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400">
              Sign up free
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

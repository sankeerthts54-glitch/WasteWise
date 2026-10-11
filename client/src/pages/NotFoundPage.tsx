import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recycle, Home, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <main
      id="main-content"
      className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-4 py-20 text-center"
      aria-labelledby="not-found-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-500/10 ring-1 ring-brand-500/20"
      >
        <Recycle className="h-16 w-16 text-brand-500 opacity-60" aria-hidden="true" />
        <span className="absolute text-5xl font-black text-brand-600/80 dark:text-brand-400/80 select-none">
          404
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="space-y-3"
      >
        <h1
          id="not-found-title"
          className="text-4xl font-black tracking-tight text-gray-900 dark:text-white"
        >
          Page not found
        </h1>
        <p className="max-w-md text-base text-gray-500 dark:text-gray-400">
          This page doesn't exist or may have been moved. Let's get you back on track with your waste and energy journey.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-3"
      >
        <Button
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => (window.location.href = '/')}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Go Home
        </Button>
        <Link to="/domains">
          <Button variant="ghost" size="md" className="gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse Domains
          </Button>
        </Link>
      </motion.div>
    </main>
  );
};

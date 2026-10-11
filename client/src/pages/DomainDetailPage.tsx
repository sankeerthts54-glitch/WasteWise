import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, ShieldCheck } from 'lucide-react';
import { getDomainBySlug } from 'wastewise-shared';
import type { AdvisoryRecord, AdvisoryStyle } from 'wastewise-shared';
import { DOMAIN_METADATA } from '../lib/domainMeta';
import { DynamicForm, GenerationProgress } from '../components/form';
import { KineticTextReveal } from '../components/ui/KineticTextReveal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/useAuth';

export const DomainDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const domain = slug ? getDomainBySlug(slug) : undefined;
  const meta = DOMAIN_METADATA.find((d) => d.slug === slug);

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!domain || !meta) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Domain Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">The requested environmental domain does not exist.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/domains')}>
          Return to Domains
        </Button>
      </div>
    );
  }

  const handleFormSubmit = async (data: {
    inputs: Record<string, unknown>;
    style: AdvisoryStyle;
    language: string;
  }) => {
    if (!user) {
      // Redirect to login with state back to this page
      navigate('/login', { state: { from: { pathname: `/domains/${domain.slug}` } } });
      return;
    }

    setApiError(null);
    setIsGenerating(true);

    try {
      const response = await apiClient<AdvisoryRecord>('/advisories', {
        method: 'POST',
        body: JSON.stringify({
          domainSlug: domain.slug,
          inputs: data.inputs,
          style: data.style,
          language: data.language,
        }),
      });

      // Clear draft on successful creation
      localStorage.removeItem(`wastewise_draft_${domain.slug}`);

      // Navigate directly to the newly generated advisory detail
      navigate(`/advisories/${response.id}`);
    } catch (err: unknown) {
      setIsGenerating(false);
      const message =
        err instanceof Error ? err.message : 'An error occurred while generating the advisory. Please try again.';
      setApiError(message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Back button navigation */}
      <div>
        <Link
          to="/domains"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Domains</span>
        </Link>
      </div>

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gray-950/70 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-4xl shadow-inner ring-1 ring-emerald-500/20">
              {meta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <KineticTextReveal
                  text={domain.name}
                  as="h1"
                  className="text-2xl sm:text-3xl font-black tracking-tight text-white"
                />
                <Badge variant="brand" size="sm">
                  Active
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-400 max-w-xl">
                {domain.description}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>MoEFCC Grounded</span>
            </span>
          </div>
        </div>

        {/* Regulatory & Domain Context Strip */}
        <div className="mt-6 border-t border-emerald-500/15 pt-4 text-xs text-gray-400 flex items-start gap-2">
          <BookOpen className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-gray-300">Focus: </strong>
            {domain.promptFocus}
          </p>
        </div>
      </motion.div>

      {/* Main Form or Live Progress State */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <GenerationProgress
              domainName={domain.name}
              isGenerating={isGenerating}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {apiError && (
              <Alert variant="error" onDismiss={() => setApiError(null)}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{apiError}</span>
                </div>
              </Alert>
            )}

            {!user && (
              <Card className="border-emerald-500/30 bg-emerald-950/20 p-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      You can formulate your inputs below; you will be prompted to sign in to save your advisory report.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/login', { state: { from: { pathname: `/domains/${domain.slug}` } } })}
                  >
                    Sign In
                  </Button>
                </div>
              </Card>
            )}

            <Card className="border-emerald-500/20 bg-gray-950/70 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
              <DynamicForm
                domain={domain}
                onSubmit={handleFormSubmit}
                isSubmitting={isGenerating}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

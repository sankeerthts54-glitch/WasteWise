import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Filter,
  X,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ListOrdered,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Spinner';
import { KineticTextReveal } from '../components/ui/KineticTextReveal';
import { getDomainMeta } from '../lib/domainMeta';
import { apiClient } from '../lib/apiClient';
import { DOMAINS, type AdvisoryRecord, type PaginatedList, type Advisory } from 'wastewise-shared';

export const AdvisoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [advisories, setAdvisories] = useState<AdvisoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 9;

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filter or sort changes
  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    setPage(1);
  };

  const handleSortChange = (sort: 'newest' | 'oldest' | 'title') => {
    setSortOrder(sort);
    setPage(1);
  };

  // Fetch advisories
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('pageSize', String(pageSize));
    queryParams.set('sort', sortOrder);

    if (selectedDomain !== 'all') {
      queryParams.set('domain', selectedDomain);
    }
    if (debouncedQuery) {
      queryParams.set('q', debouncedQuery);
    }

    apiClient<PaginatedList<AdvisoryRecord>>(`/advisories?${queryParams.toString()}`)
      .then((data) => {
        if (isMounted) {
          setAdvisories(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotalItems(data.total || 0);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAdvisories([]);
          setTotalPages(1);
          setTotalItems(0);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, selectedDomain, debouncedQuery, sortOrder]);

  const hasActiveFilters = selectedDomain !== 'all' || debouncedQuery.length > 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedDomain('all');
    setSortOrder('newest');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header with Kinetic Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6 dark:border-gray-800/60">
        <div>
          <div className="flex items-center gap-3">
            <KineticTextReveal
              text="Advisory Records"
              as="h1"
              className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white"
              highlightWords={['Records']}
            />
            {totalItems > 0 && (
              <Badge variant="brand" className="text-xs px-2.5 py-0.5">
                {totalItems} total
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revisit, manage, and track your personalized environmental action plans
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/domains')}
          className="gap-2 shadow-lg shadow-brand-500/25 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Advisory</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search advisories by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 backdrop-blur focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Domain Filter Select */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-52">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white/80 pl-8.5 pr-8 py-2.5 text-xs font-semibold text-gray-800 backdrop-blur focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-100 appearance-none"
            >
              <option value="all">All Domains</option>
              {DOMAINS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 md:w-44">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select
              value={sortOrder}
              onChange={(e) =>
                handleSortChange(e.target.value as 'newest' | 'oldest' | 'title')
              }
              className="w-full rounded-xl border border-gray-200 bg-white/80 pl-8.5 pr-8 py-2.5 text-xs font-semibold text-gray-800 backdrop-blur focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-100 appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advisory Content Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-busy="true"
          aria-label="Loading advisories"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-full" rounded="lg" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : advisories.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-white/40 dark:bg-gray-900/40">
          <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {hasActiveFilters ? 'No Matching Advisories' : 'No Advisories Generated Yet'}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try modifying your search keywords or switching domain filters.'
              : 'Create your first actionable environmental advisory tailored to your city and requirements.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate('/domains')}
            >
              <Sparkles className="h-4 w-4" />
              <span>Explore Domains</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {advisories.map((advisory, idx) => {
                const meta = getDomainMeta(advisory.domainSlug);
                const output = advisory.output as Advisory | null;
                const formattedDate = new Date(advisory.createdAt).toLocaleDateString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                );

                const stepCount = output?.actionPlan?.length || 0;
                const recCount = output?.recommendations?.length || 0;

                return (
                  <motion.div
                    key={advisory.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    <Card
                      interactive
                      onClick={() => navigate(`/advisories/${advisory.id}`)}
                      className="h-full flex flex-col justify-between p-6 bg-white/80 dark:bg-gray-900/80 hover:border-brand-500/50 hover:shadow-xl transition-all"
                    >
                      <div>
                        {/* Domain & Date Pill */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="brand" size="sm" className="gap-1 font-bold">
                            <span>{meta?.icon || '🌱'}</span>
                            <span>{meta?.name || advisory.domainSlug}</span>
                          </Badge>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                          {advisory.title || 'Untitled Advisory'}
                        </h3>

                        {/* Summary Excerpt */}
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                          {output?.summary ||
                            'Tailored environmental action plan generated via Gemini.'}
                        </p>
                      </div>

                      {/* Footer Metadata & CTA */}
                      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {stepCount > 0 && (
                            <Badge variant="neutral" size="sm" className="gap-1">
                              <ListOrdered className="h-3 w-3 text-brand-500" />
                              <span>{stepCount} steps</span>
                            </Badge>
                          )}

                          {recCount > 0 && (
                            <Badge variant="neutral" size="sm" className="gap-1">
                              <span>{recCount} tips</span>
                            </Badge>
                          )}

                          {advisory.latencyMs ? (
                            <Badge variant="neutral" size="sm" className="gap-1">
                              <Clock className="h-3 w-3 text-emerald-500" />
                              <span>{(advisory.latencyMs / 1000).toFixed(1)}s</span>
                            </Badge>
                          ) : null}

                          {advisory.feedbackRating ? (
                            <Badge
                              variant={advisory.feedbackRating === 1 ? 'success' : 'warning'}
                              size="sm"
                              className="gap-1 ml-auto"
                            >
                              {advisory.feedbackRating === 1 ? (
                                <ThumbsUp className="h-3 w-3" />
                              ) : (
                                <ThumbsDown className="h-3 w-3" />
                              )}
                              <span>{advisory.feedbackRating === 1 ? 'Helpful' : 'Review'}</span>
                            </Badge>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 pt-1">
                          <span>View Full Advisory</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200/60 pt-6 dark:border-gray-800/60">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {(page - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {Math.min(page * pageSize, totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalItems}
                </span>{' '}
                advisories
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                        p === page
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

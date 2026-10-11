import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Save,
  BarChart3,
  LogOut,
  Layers,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Spinner';
import { apiClient } from '../lib/apiClient';
import type { PaginatedList, AdvisoryRecord } from 'wastewise-shared';
import { DOMAINS } from 'wastewise-shared';

interface DomainStat {
  slug: string;
  name: string;
  count: number;
}

export const ProfilePage: React.FC = () => {
  const { user, signOut, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advisory stats
  const [totalAdvisories, setTotalAdvisories] = useState<number | null>(null);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [memberSince, setMemberSince] = useState<string | null>(null);

  // Sign out confirmation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    // Derive member since from user created_at
    const createdAt = user?.created_at;
    if (createdAt) {
      setMemberSince(
        new Date(createdAt).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    }

    // Load advisory stats concurrently per domain
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        // Fetch total count first
        const total = await apiClient<PaginatedList<AdvisoryRecord>>(
          '/advisories?limit=1&page=1'
        );
        setTotalAdvisories(total.total);

        // Per-domain counts
        const domainCounts = await Promise.all(
          DOMAINS.map(async (d) => {
            try {
              const res = await apiClient<PaginatedList<AdvisoryRecord>>(
                `/advisories?limit=1&page=1&domain=${d.slug}`
              );
              return { slug: d.slug, name: d.name, count: res.total };
            } catch {
              return { slug: d.slug, name: d.name, count: 0 };
            }
          })
        );
        setDomainStats(domainCounts.filter((d) => d.count > 0));
      } catch {
        setTotalAdvisories(0);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiClient('/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullName }),
      });
      await refreshSession();
      setSuccessMessage('Profile updated successfully!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const avatarColor = 'bg-gradient-to-br from-brand-500 to-emerald-400';
  const displayName = fullName || user?.user_metadata?.full_name || 'WasteWise Member';
  const initial = (displayName[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8"
      aria-labelledby="profile-heading"
    >
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1
          id="profile-heading"
          className="text-3xl font-black tracking-tight text-gray-900 dark:text-white"
        >
          Profile &amp; Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account information and preferences
        </p>
      </motion.div>

      {/* Alerts */}
      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Profile Editor */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card className="p-8">
          <form onSubmit={handleSave} className="space-y-6" aria-label="Edit profile">
            {/* Avatar + name header */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div
                className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${avatarColor} text-2xl font-black text-white shadow-lg shadow-brand-500/30 ring-2 ring-brand-500/20`}
                aria-hidden="true"
              >
                {initial}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {displayName}
                </h2>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                {memberSince && (
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Member since {memberSince}
                  </p>
                )}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={user?.email || ''}
                disabled
                leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                helperText="Managed by Supabase Auth — cannot be changed here"
              />

              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
                aria-required="false"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="gap-2"
                isLoading={isSaving}
                aria-busy={isSaving}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Save Changes</span>
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Advisory Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Your Advisory Stats
            </h2>
          </div>

          {statsLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading stats">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : (
            <>
              {/* Total count */}
              <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Advisories Generated
                </span>
                <span className="text-3xl font-black text-brand-600 dark:text-brand-400">
                  {totalAdvisories ?? 0}
                </span>
              </div>

              {/* Per-domain breakdown */}
              {domainStats.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    By Domain
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {domainStats.map((ds) => (
                      <div
                        key={ds.slug}
                        className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                            {ds.name}
                          </span>
                        </div>
                        <Badge variant="brand" className="text-xs font-bold">
                          {ds.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                totalAdvisories === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No advisories yet.{' '}
                    <a href="/domains" className="text-brand-500 hover:underline">
                      Generate your first one →
                    </a>
                  </p>
                )
              )}
            </>
          )}
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="p-6 border border-rose-200/60 dark:border-rose-900/40">
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="h-5 w-5 text-rose-500" aria-hidden="true" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Session
            </h2>
          </div>

          {!showSignOutConfirm ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign out of your WasteWise account on this device.
              </p>
              <Button
                variant="danger"
                size="sm"
                className="flex-shrink-0 gap-2"
                onClick={() => setShowSignOutConfirm(true)}
                aria-haspopup="true"
                aria-expanded={showSignOutConfirm}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div
              role="alertdialog"
              aria-modal="false"
              aria-labelledby="signout-confirm-label"
              className="flex flex-col gap-3"
            >
              <p
                id="signout-confirm-label"
                className="text-sm font-medium text-rose-700 dark:text-rose-400"
              >
                Are you sure you want to sign out?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="sm"
                  className="gap-2"
                  onClick={handleSignOut}
                  autoFocus
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Yes, Sign Out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </main>
  );
};

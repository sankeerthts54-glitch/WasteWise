import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Recycle, 
  Layers, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { DOMAIN_METADATA } from '../../lib/domainMeta';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [domainsDropdownOpen, setDomainsDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });

  // GSAP entrance: slide down from above on first mount
  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.4)', delay: 0.1 }
    );
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U';

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full border-b border-emerald-500/15 bg-gray-950/75 backdrop-blur-2xl transition-colors shadow-lg shadow-black/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-lg shadow-brand-500/20"
          >
            <Recycle className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-gray-900 group-hover:text-brand-600 transition-colors dark:text-white dark:group-hover:text-brand-400">
              WasteWise
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 -mt-1">
              AI Waste &amp; Energy
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {/* Domains Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDomainsDropdownOpen(!domainsDropdownOpen)}
              onBlur={() => setTimeout(() => setDomainsDropdownOpen(false), 200)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <Layers className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span>Domains</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${domainsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {domainsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-72 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95"
                >
                  <Link
                    to="/domains"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/50"
                  >
                    View All Domains →
                  </Link>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                  {DOMAIN_METADATA.map((domain) => (
                    <Link
                      key={domain.slug}
                      to={`/domains/${domain.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">{domain.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-gray-900 group-hover:text-brand-600 dark:text-gray-100 dark:group-hover:text-brand-400">
                          {domain.name}
                        </div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 dark:text-gray-400">
                          {domain.description}
                        </div>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink
            to="/advisories"
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              }`
            }
          >
            <FileText className="h-4 w-4" />
            <span>Advisories</span>
          </NavLink>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {user ? (
            /* User Avatar Menu */
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                onBlur={() => setTimeout(() => setProfileDropdownOpen(false), 200)}
                className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/60 p-1 pr-3 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-800"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 font-bold text-xs text-white uppercase shadow-sm">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-gray-700 max-w-[100px] truncate dark:text-gray-200">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95"
                  >
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {user.user_metadata?.full_name || 'WasteWise User'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span>Profile &amp; Settings</span>
                    </Link>
                    <Link
                      to="/advisories"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span>My Advisories</span>
                    </Link>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Guest Auth Buttons */
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/signup')}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Get Started</span>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white/60 text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200/80 bg-white/95 px-4 pt-3 pb-6 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95"
          >
            <div className="space-y-1">
              <Link
                to="/domains"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Layers className="h-4 w-4 text-brand-600" />
                <span>Browse Domains</span>
              </Link>
              <div className="pl-6 space-y-1 py-1">
                {DOMAIN_METADATA.map((d) => (
                  <Link
                    key={d.slug}
                    to={`/domains/${d.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    <span>{d.icon}</span>
                    <span>{d.name}</span>
                  </Link>
                ))}
              </div>

              <Link
                to="/advisories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <FileText className="h-4 w-4 text-brand-600" />
                <span>Advisories</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <UserIcon className="h-4 w-4 text-brand-600" />
                    <span>Profile ({user.email})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="pt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                  >
                    Get Started Free
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

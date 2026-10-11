import React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { DOMAIN_METADATA } from '../../lib/domainMeta';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-emerald-500/15 bg-gray-950/75 backdrop-blur-2xl transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-md shadow-emerald-500/20">
                <Recycle className="h-4 w-4" />
              </div>
              <span className="text-base font-black tracking-tight text-white">
                WasteWise
              </span>
            </Link>
            <p className="text-xs text-gray-300 leading-relaxed">
              AI-driven environmental guidance tailored for Indian households, societies, and businesses. Compliant with SWM Rules 2016 and PM Surya Ghar.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Zero-knowledge client security</span>
            </div>
          </div>

          {/* Environmental Domains */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Advisory Domains
            </h4>
            <ul className="mt-3 space-y-2">
              {DOMAIN_METADATA.map((d) => (
                <li key={d.slug}>
                  <Link
                    to={`/domains/${d.slug}`}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
                  >
                    <span>{d.icon}</span>
                    <span>{d.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Platform
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/domains" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  All Domains
                </Link>
              </li>
              <li>
                <Link to="/advisories" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  My Advisories
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  User Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Regulatory & Tech Notice */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
              Grounding &amp; AI
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed dark:text-gray-400">
              Powered by Google Gemini with deterministic JSON structured outputs. Hosted on AWS App Runner &amp; AWS Amplify.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300">
              <Sparkles className="h-3 w-3" />
              <span>SWM 2016 Compliant</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200/60 pt-8 sm:flex-row dark:border-gray-800/60">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} WasteWise. Built for environmental impact.
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Engineered with</span>
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            <span>for green sustainability</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

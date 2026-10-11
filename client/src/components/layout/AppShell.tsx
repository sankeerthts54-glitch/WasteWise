import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LiveBackground } from './LiveBackground';
import { CustomCursor } from './CustomCursor';
import { ScrollProgressBar } from './ScrollProgressBar';

export const AppShell: React.FC = () => {
  return (
    <div className="relative flex min-h-screen flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Custom magnetic cursor (desktop only) */}
      <CustomCursor />

      {/* Scroll progress indicator */}
      <ScrollProgressBar />

      {/* Premium animated live mesh background */}
      <LiveBackground />

      {/* Sticky frosted glass header navigation */}
      <Navbar />

      {/* Main view container */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

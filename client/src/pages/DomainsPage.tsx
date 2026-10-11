import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Layers, ArrowRight } from 'lucide-react';
import { DOMAIN_METADATA } from '../lib/domainMeta';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

export const DomainsPage: React.FC = () => {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
        );
      }

      // Cards: ScrollTrigger stagger
      if (gridRef.current) {
        gsap.fromTo(
          gridRef.current.querySelectorAll('.domain-card'),
          { y: 70, opacity: 0, scale: 0.93 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.13,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div ref={headerRef} className="text-center max-w-3xl mx-auto" style={{ opacity: 0 }}>
        <Badge variant="brand" size="md" className="mb-3">
          <Layers className="h-3.5 w-3.5" />
          <span>Track 03 — Waste &amp; Energy</span>
        </Badge>
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl text-white">
          Explore Advisory Domains
        </h1>
        <p className="mt-4 text-base text-gray-300">
          Select an environmental domain below to launch the advisory formulation studio.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DOMAIN_METADATA.map((domain) => (
          <div key={domain.slug} className="domain-card" style={{ opacity: 0 }}>
            <motion.div whileHover={{ y: -6 }} className="h-full">
              <Card
                interactive
                onClick={() => navigate(`/domains/${domain.slug}`)}
                className="h-full flex flex-col justify-between p-8 border-emerald-500/25 bg-gray-950/75 backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-emerald-400/60 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-3xl shadow-inner group-hover:scale-110 group-hover:border-emerald-400/60 transition-transform">
                      {domain.icon}
                    </div>
                    <Badge variant="brand" size="sm">
                      {domain.inputCount} input fields
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    {domain.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                    {domain.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-emerald-500/15 pt-5">
                  <span className="text-xs font-semibold text-emerald-400">
                    Ready to formulate
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/domains/${domain.slug}`);
                    }}
                    className="gap-1.5"
                  >
                    <span>Launch Advisor</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

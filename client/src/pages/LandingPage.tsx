import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, ArrowDown, Sparkles, CheckCircle2,
  ChevronRight, Zap, Shield, Cpu,
} from 'lucide-react';
import { DOMAIN_METADATA } from '../lib/domainMeta';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { KineticTextReveal } from '../components/ui/KineticTextReveal';
import { ScrollKineticReveal } from '../components/ui/ScrollKineticReveal';

gsap.registerPlugin(ScrollTrigger);

// Distributed floating domain preview cards (desktop right side)
const FLOAT_POSITIONS = [
  { top: '9%',  right: '3%',  rotation:  4 },
  { top: '36%', right: '30%', rotation: -6 },
  { top: '58%', right: '2%',  rotation:  3 },
  { top: '76%', right: '25%', rotation: -4 },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const heroRef       = useRef<HTMLElement>(null);
  const cardsRef      = useRef<HTMLDivElement>(null);
  const featuresRef   = useRef<HTMLDivElement>(null);
  const floatingRef   = useRef<HTMLDivElement>(null);
  const glowRef       = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  // GSAP for scroll-driven reveals & parallax orchestration
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      // ── Floating domain cards: entrance + continuous subtle drift ─────────
      if (floatingRef.current) {
        const wrappers = floatingRef.current.querySelectorAll<HTMLElement>('.float-wrapper');
        const drifts   = floatingRef.current.querySelectorAll<HTMLElement>('.float-drift');

        FLOAT_POSITIONS.forEach((pos, i) => {
          if (wrappers[i]) gsap.set(wrappers[i], { rotation: pos.rotation });
        });

        if (!shouldReduceMotion) {
          gsap.fromTo(
            wrappers,
            { opacity: 0, scale: 0.65, y: 40 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              stagger: 0.14,
              duration: 0.85,
              ease: 'power3.out',
              delay: 0.45,
            }
          );

          // Subtle organic drift
          drifts.forEach((el, i) => {
            const s = i * 97.3;
            gsap.to(el, {
              y: Math.sin(s) * 16,
              x: Math.cos(s) * 10,
              duration: 3.8 + i * 0.8,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          });
        } else {
          gsap.set(wrappers, { opacity: 1, scale: 1, y: 0 });
        }
      }

      // ── Scroll hint bounce ────────────────────────────────────────────────
      if (scrollHintRef.current && !shouldReduceMotion) {
        gsap.to(scrollHintRef.current, {
          y: 8,
          duration: 0.9,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      }

      // ── Domain grid: ScrollTrigger stagger with depth ─────────────────────
      if (cardsRef.current) {
        if (!shouldReduceMotion) {
          gsap.fromTo(
            cardsRef.current.querySelectorAll('.domain-card'),
            { y: 65, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              stagger: 0.1,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: cardsRef.current,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
            }
          );
        } else {
          gsap.set(cardsRef.current.querySelectorAll('.domain-card'), {
            opacity: 1,
            y: 0,
            scale: 1,
          });
        }
      }

      // ── Features section: ScrollTrigger reveal ────────────────────────────
      if (featuresRef.current) {
        if (!shouldReduceMotion) {
          featuresRef.current
            .querySelectorAll<HTMLElement>('.feature-item')
            .forEach((item, i) => {
              gsap.fromTo(
                item,
                { x: i % 2 === 0 ? -45 : 45, opacity: 0 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 0.65,
                  ease: 'power3.out',
                  scrollTrigger: {
                    trigger: item,
                    start: 'top 86%',
                    toggleActions: 'play none none none',
                  },
                }
              );
            });
        } else {
          gsap.set(featuresRef.current.querySelectorAll('.feature-item'), {
            opacity: 1,
            x: 0,
          });
        }
      }
    }, hero);

    // ── Mouse-driven subtle depth parallax ──────────────────────────────────
    let onMouseMove: ((e: MouseEvent) => void) | undefined;
    let onMouseLeave: (() => void) | undefined;

    if (!shouldReduceMotion && floatingRef.current) {
      const wrappers = Array.from(
        floatingRef.current.querySelectorAll<HTMLElement>('.float-wrapper')
      );
      const xFns = wrappers.map((el) =>
        gsap.quickTo(el, 'x', { duration: 0.75, ease: 'power3.out' })
      );
      const yFns = wrappers.map((el) =>
        gsap.quickTo(el, 'y', { duration: 0.75, ease: 'power3.out' })
      );

      onMouseMove = (e: MouseEvent) => {
        const rect = hero.getBoundingClientRect();
        const xN = (e.clientX - rect.left) / rect.width - 0.5;
        const yN = (e.clientY - rect.top) / rect.height - 0.5;

        wrappers.forEach((_, i) => {
          const depth = 18 + i * 12;
          xFns[i](xN * depth);
          yFns[i](yN * depth);
        });

        if (glowRef.current) {
          gsap.to(glowRef.current, {
            left: e.clientX - rect.left,
            top: e.clientY - rect.top,
            duration: 0.55,
            ease: 'power2.out',
            overwrite: true,
          });
        }
      };

      onMouseLeave = () => {
        wrappers.forEach((_, i) => {
          xFns[i](0);
          yFns[i](0);
        });
      };

      hero.addEventListener('mousemove', onMouseMove);
      hero.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      ctx.revert();
      if (onMouseMove) hero.removeEventListener('mousemove', onMouseMove);
      if (onMouseLeave) hero.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [shouldReduceMotion]);

  // Framer Motion sequenced timing variants
  const badgeVariants: Variants = {
    hidden: { opacity: 0, y: -16, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const subtitleVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        delay: shouldReduceMotion ? 0.1 : 0.65,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const ctaGroupVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: shouldReduceMotion ? 0.15 : 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const trustContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0.2 : 1.05,
      },
    },
  };

  const trustItemVariants: Variants = {
    hidden: { opacity: 0, y: 14, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="overflow-x-hidden selection:bg-brand-500/30 selection:text-brand-200">
      {/* ═══════════════════════════════════════════════════════
          HERO  —  Full-screen editorial split
          Left: Kinetic typography & sequenced CTAs
          Right: Interactive floating domain modules with 3D depth
      ═══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] lg:min-h-screen flex items-center overflow-hidden"
      >
        {/* Dynamic cursor-following atmospheric light */}
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[130px]"
          style={{ left: '30%', top: '48%' }}
        />
        {/* Secondary atmospheric gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[400px] rounded-full bg-teal-500/6 blur-[120px]"
        />

        {/* ── LEFT: Typography & action column ───────────────── */}
        <div className="relative z-10 w-full lg:w-[48%] px-6 sm:px-12 lg:pl-16 xl:pl-24 lg:pr-6 py-28 lg:py-0">
          {/* Eyebrow badge */}
          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
          >
            <Badge
              variant="brand"
              pulse
              size="md"
              className="mb-6 cursor-pointer hover:scale-105 transition-transform bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/60"
            >
              <Sparkles className="h-3 w-3" />
              <span>Next-Gen Ecological Intelligence for India</span>
            </Badge>
          </motion.div>

          {/* ── Main Kinetic Headline ─────────────────────────── */}
          {/* Restrained scale-in container for drama without layout shift */}
          <motion.div
            initial={{ scale: shouldReduceMotion ? 1 : 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl xl:text-[68px] text-white leading-[1.08]">
              {/* Line 1: Word-by-word masked reveal */}
              <KineticTextReveal
                text="Smarter Waste Management."
                as="span"
                className="block text-white"
                delay={0.12}
                stagger={0.055}
              />

              {/* Line 2: Gradient highlighted kinetic reveal */}
              <KineticTextReveal
                text="Clean Energy Guidance."
                as="span"
                className="block mt-1"
                delay={0.32}
                stagger={0.06}
                highlightWords={['Clean', 'Energy', 'Guidance']}
                highlightClassName="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_36px_rgba(52,211,153,0.45)]"
              />
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[480px] text-base sm:text-lg text-gray-300 leading-relaxed font-normal"
          >
            Actionable step-by-step segregation, authorized e-waste disposal,
            upcycling blueprints, and rooftop solar economics — grounded in Indian
            municipal guidelines and regulatory frameworks.
          </motion.p>

          {/* Sequenced CTA action buttons */}
          <motion.div
            variants={ctaGroupVariants}
            initial="hidden"
            animate="visible"
            className="mt-9 flex flex-wrap gap-4 items-center"
          >
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/domains')}
              className="gap-2 text-base px-8 py-3.5 shadow-xl shadow-emerald-500/30"
            >
              <span>Explore Advisory Domains</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/signup')}
              className="text-base px-8 py-3.5"
            >
              Get Free Account
            </Button>
          </motion.div>

          {/* Sequenced trust badges */}
          <motion.div
            variants={trustContainerVariants}
            initial="hidden"
            animate="visible"
            className="mt-9 flex flex-wrap gap-2.5"
          >
            {[
              'SWM Rules 2016 Compliant',
              'PM Surya Ghar Net Metering',
              'Zero Hallucination Schema',
            ].map((label) => (
              <motion.div
                key={label}
                variants={trustItemVariants}
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-gray-950/60 px-3.5 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-md shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── RIGHT: Interactive floating domain preview cards ─── */}
        <div
          ref={floatingRef}
          className="hidden lg:block absolute inset-y-0 right-0 w-[52%]"
        >
          {/* Decorative spinning concentric orbital rings */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{ top: '50%', left: '38%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="h-[430px] w-[430px] rounded-full border border-emerald-500/8 animate-[spin_50s_linear_infinite]" />
            <div className="absolute inset-0 m-14 rounded-full border border-teal-500/10 animate-[spin_32s_linear_infinite_reverse]" />
            <div className="absolute inset-0 m-28 rounded-full border border-cyan-500/8 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 m-[105px] flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-emerald-400/35 shadow-[0_0_16px_4px_rgba(52,211,153,0.3)] animate-pulse" />
            </div>
          </div>

          {/* Interactive domain cards */}
          {DOMAIN_METADATA.map((domain, i) => (
            <div
              key={domain.slug}
              className="float-wrapper absolute w-60 pointer-events-auto"
              style={{
                top: FLOAT_POSITIONS[i].top,
                right: FLOAT_POSITIONS[i].right,
                opacity: 0,
              }}
            >
              <div className="float-drift">
                <button
                  type="button"
                  onClick={() => navigate(`/domains/${domain.slug}`)}
                  className="w-full rounded-2xl border border-emerald-500/30 bg-gray-950/85 p-4 backdrop-blur-xl shadow-2xl shadow-black/70 hover:border-emerald-400/70 hover:shadow-emerald-500/25 hover:bg-gray-900/90 hover:scale-105 active:scale-[0.98] transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-500/25 text-2xl group-hover:scale-110 group-hover:border-emerald-400/50 transition-transform">
                      {domain.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                        {domain.name}
                      </div>
                      <div className="text-[11px] text-emerald-400/80 font-semibold mt-0.5">
                        {domain.inputCount} parameters
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {domain.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <span>Launch advisor</span>
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Animated subtle scroll indicator */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-10 left-8 lg:left-16 xl:left-24 flex items-center gap-2 text-emerald-400/60"
        >
          <ArrowDown className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
            Scroll to explore
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DOMAIN CARDS — Scroll-triggered typography & staggered cards
      ═══════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <Badge
              variant="neutral"
              size="sm"
              className="mb-3 bg-gray-900/80 border-white/10 text-gray-300"
            >
              Specialized Modules
            </Badge>

            {/* Scroll-triggered headline reveal */}
            <ScrollKineticReveal
              text="Four Pillars of Sustainable Impact"
              as="h2"
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white"
              highlightWords={['Sustainable', 'Impact']}
            />

            <ScrollKineticReveal as="p" delay={0.2} className="mt-4">
              <span className="text-base text-gray-400 max-w-lg mx-auto inline-block">
                Select a specialized environmental vertical to formulate your custom advisory
              </span>
            </ScrollKineticReveal>
          </div>

          <div
            ref={cardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {DOMAIN_METADATA.map((domain) => (
              <div key={domain.slug} className="domain-card" style={{ opacity: 0 }}>
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { y: -10, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="h-full"
                >
                  <Card
                    interactive
                    onClick={() => navigate(`/domains/${domain.slug}`)}
                    className="h-full flex flex-col justify-between border-emerald-500/25 bg-gray-950/75 backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-emerald-400/60 hover:shadow-emerald-500/15 hover:shadow-2xl transition-all duration-300 group"
                  >
                    <div>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-2xl group-hover:scale-110 group-hover:border-emerald-400/60 transition-transform shadow-inner">
                        {domain.icon}
                      </div>
                      <CardHeader className="p-0 mb-3">
                        <CardTitle className="text-lg group-hover:text-emerald-300 transition-colors">
                          {domain.name}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3 text-gray-300">
                          {domain.description}
                        </CardDescription>
                      </CardHeader>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-emerald-500/15 pt-4">
                      <span className="text-xs font-semibold text-emerald-400">
                        {domain.inputCount} parameters
                      </span>
                      <div className="flex items-center text-xs font-bold text-gray-300 group-hover:text-emerald-300 transition-colors">
                        <span>Generate</span>
                        <ChevronRight className="h-4 w-4 ml-1 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PLATFORM FEATURES — Full-bleed bento panel
      ═══════════════════════════════════════════════════════ */}
      <section className="pb-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-gray-950/90 via-gray-900/60 to-emerald-950/20 p-10 sm:p-16 shadow-2xl backdrop-blur-2xl overflow-hidden relative">
            <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/8 blur-[80px]" />

            <div
              ref={featuresRef}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              {[
                {
                  icon: <Cpu className="h-5 w-5" />,
                  title: 'Gemini 2.5 Structured Output',
                  desc: 'Real-time AI reasoning constrained strictly to typed Zod schemas. Zero markdown formatting breaks.',
                },
                {
                  icon: <Zap className="h-5 w-5" />,
                  title: 'Live Indian Localized Guidance',
                  desc: 'Customized for BBMP, BMC, MCD color coding, kabadiwala collection networks, and DISCOM net metering.',
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: 'Enterprise Cloud Foundation',
                  desc: 'Stateless backend running on AWS App Runner with frontend deployment via AWS Amplify.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="feature-item flex items-start gap-5"
                  style={{ opacity: 0 }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-inner">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{f.title}</h4>
                    <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

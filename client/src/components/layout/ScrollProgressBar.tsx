import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollProgressBar — thin emerald bar fixed at top of the viewport.
 * Width is driven by ScrollTrigger scroll progress (0 → 100%).
 */
export const ScrollProgressBar: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const st = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress, transformOrigin: 'left center' });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9997] h-[3px] w-full origin-left"
    >
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
};

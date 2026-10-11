import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * CustomCursor — magnetic dot + trailing ring
 * - Hides the system cursor on desktop
 * - Dot snaps immediately; ring follows with lag
 * - Scales up on hover over interactive elements (a, button, [data-cursor-grow])
 * - Changes tint to emerald when over .cursor-emerald elements
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  // Track raw position for the dot
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only activate on pointer-capable devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;

    // Hide native cursor globally
    document.documentElement.style.cursor = 'none';

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };

      // Dot snaps instantly
      gsap.set(dot, { x: pos.current.x, y: pos.current.y });

      // Ring follows with a smooth lag
      gsap.to(ring, {
        x: pos.current.x,
        y: pos.current.y,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    // --- Hover grow/shrink ---
    const growTargets = 'a, button, [role="button"], input, select, textarea, [data-cursor-grow]';

    const onEnterInteractive = () => {
      gsap.to(ring, { scale: 2.2, opacity: 0.5, duration: 0.3, ease: 'power2.out' });
      gsap.to(dot, { scale: 0.5, duration: 0.2, ease: 'power2.out' });
    };

    const onLeaveInteractive = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(dot, { scale: 1, duration: 0.2, ease: 'power2.out' });
    };

    // Delegate via document-level listeners
    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(growTargets)) onEnterInteractive();
    };
    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest(growTargets)) onLeaveInteractive();
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return (
    <>
      {/* Dot — snaps instantly */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2"
        style={{ willChange: 'transform' }}
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.7)]" />
      </div>

      {/* Ring — lags behind */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2"
        style={{ willChange: 'transform' }}
      >
        <div className="h-9 w-9 rounded-full border-2 border-emerald-400/70 opacity-80" />
      </div>
    </>
  );
};

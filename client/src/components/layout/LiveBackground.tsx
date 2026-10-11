import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import UnicornScene from 'unicornstudio-react';

/**
 * LiveBackground — UnicornStudio premium scene + GSAP eco particles layered above.
 */
export const LiveBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const particles = [
    { size: 12, left: '15%', top: '25%', duration: 12, delay: 0 },
    { size: 16, left: '80%', top: '15%', duration: 15, delay: 1 },
    { size: 8,  left: '45%', top: '65%', duration: 10, delay: 2 },
    { size: 14, left: '70%', top: '75%', duration: 14, delay: 0.5 },
    { size: 10, left: '25%', top: '85%', duration: 11, delay: 1.5 },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      containerRef.current
        ?.querySelectorAll<HTMLElement>('.gsap-particle')
        .forEach((el, i) => {
          const p = particles[i];
          gsap.set(el, { opacity: 0.3, scale: 1 });
          gsap.to(el, {
            y: -35,
            x: 20,
            opacity: 0.8,
            scale: 1.3,
            duration: p.duration / 2,
            delay: p.delay,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            repeatDelay: 0.2,
          });
        });
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* UnicornStudio premium interactive scene */}
      <div className="absolute inset-0 h-full w-full">
        <UnicornScene
          jsonFilePath="/scenes/circuits.json"
          width="100%"
          height="100%"
          scale={1}
          dpi={1.5}
          production={true}
        />
      </div>

      {/* GSAP eco particles layered above */}
      {particles.map((p, idx) => (
        <div
          key={idx}
          className="gsap-particle absolute rounded-full bg-brand-500/30 dark:bg-brand-400/25 backdrop-blur-sm"
          style={{ width: p.size, height: p.size, left: p.left, top: p.top }}
        />
      ))}
    </div>
  );
};

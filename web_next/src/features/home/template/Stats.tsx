'use client';

import { useRef } from 'react';
import { STATS } from './content';
import { useSeen } from './reveal';

/**
 * The design's figures on navy. They count up (ease-out, 1.5 s) once 40% of
 * the band is on screen, as the design does — but the HTML carries the final
 * numbers, and a band already on screen, reduced motion or no JS just shows
 * them, where the design would sit at 0 until its script ran.
 */
export function Stats() {
  const nums = useRef<(HTMLSpanElement | null)[]>([]);

  const ref = useSeen<HTMLElement>((_, animated) => {
    if (!animated || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 1500, 1);
      STATS.forEach((stat, n) => {
        const el = nums.current[n];
        if (el) el.textContent = String(Math.round(stat.value * (1 - (1 - p) ** 3)));
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, 0.4);

  return (
    <section
      ref={ref}
      data-section="stats"
      aria-label="In numbers"
      className="grid h-[19vw] grid-cols-2 items-center bg-navy-800 text-center text-white max-lg:h-auto max-lg:gap-y-8 max-lg:py-12 lg:grid-cols-4"
    >
      {STATS.map((stat, n) => (
        <div key={stat.label} className="transition-transform duration-300 hover:-translate-y-1">
          <div className="text-[3.3vw] font-semibold leading-none max-lg:text-[2.25rem]">
            <span ref={(el) => void (nums.current[n] = el)}>{stat.value}</span>
            <span className="text-cyan-500">+</span>
          </div>
          <div className="mt-[0.3vw] whitespace-pre-line text-[1.3vw] leading-[1.15] max-lg:text-[0.75rem]">{stat.label}</div>
        </div>
      ))}
    </section>
  );
}

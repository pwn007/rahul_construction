'use client';

import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '@/constants/site';
import { useInView, usePrefersReducedMotion } from '@/hooks';

/**
 * The figures — 80+ projects, 30+ years, 10+ professionals, 98% satisfaction —
 * as a section of their own, between the projects map and the written reviews
 * ("What our clients say"). At the foot of the home page, after the client
 * stories and above the footer, until the user moved them up on 29 Oct 2026.
 *
 * They sat under the hero's lede until the client had them hidden (Oct 2026;
 * the markup is still there, commented out, in Hero.tsx). On 27 Oct 2026 the
 * client asked for them back at the foot of the page: first as a photograph's
 * chapter, then as a navy band joined to the footer, and finally — the same
 * day — as this: the numbers only, in a navy card on the page's own ground,
 * so they read as a section and not as the top of the footer.
 *
 * The card is the footer's navy (`--c-night`, grain and blueprint grid), with
 * the page's mist all round it. On a phone the section is one screen with the
 * card centred — a stop of its own for the section engine (lib/section-nav),
 * which counts a screen-tall `min-height` as one; under half a screen it would
 * travel with a neighbour's stop. A touch tablet gives it a screen too, for
 * the same reason. Four across from `md` and on a phone held
 * sideways, two by two upright, with hairlines between the figures
 * (globals.css, "Achievements").
 *
 * The figures are code only, as in the hero (constants/site.ts, where the
 * About page reads them too); the section has no admin row.
 */
export function AchievementsBanner() {
  return (
    <section id="achievements" data-section="achievements" aria-label="Our track record" className="achievements">
      <div className="container">
        <div className="achievements__card on-dark grain relative overflow-hidden bg-[rgb(var(--c-night))] text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <dl className="achievements__grid relative">
            {ACHIEVEMENTS.map((stat) => (
              <div className="achievements__item" key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                  <FigureCount value={stat.value} />
                  <span className="achievements__suffix">{stat.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

const DURATION = 1470;
const out2 = (t: number) => 1 - (1 - t) * (1 - t);

/**
 * A figure that counts up once, as it comes on screen: a big number from
 * nearby (80 from 44), a small one from zero — the hero's rule (`HeroCount` in
 * Hero.tsx). The server render and reduced motion show the final value, so
 * crawlers and screen readers get "80+", never "0+" (the shared `Counter`
 * starts at zero). It starts on the first pixel in view, before the figure can
 * be read at its final value.
 */
function FigureCount({ value }: { value: number }) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0, rootMargin: '0px' });
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
    const from =
      value > 20 ? Math.min(value - 1, Math.max(Math.ceil(value * 0.55), 10 ** (String(Math.round(value)).length - 1))) : 0;
    setShown(from);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setShown(Math.round(from + (value - from) * out2(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}

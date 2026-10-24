'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { VirtualScrollData } from 'lenis';
import { Quote, Star } from 'lucide-react';
import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { useProjects } from '@/features/projects/useProjects';
import { usePrefersReducedMotion } from '@/hooks';
import { claimLenisScroll, getLenis, scrollToTarget } from '@/hooks/useLenis';
import { getSectionNav } from '@/hooks/useSectionNav';
import { cn } from '@/lib/cn';
import type { Testimonial } from '@/types/domain';

/**
 * What our clients say — one review at a time, on the home page.
 *
 * ── The client's brief ──────────────────────────────────────────────────────
 * From the client's own prototype (Oct 2026, "single scroll complete
 * dissolve"): the heading stands still, one review is on screen, and each
 * scroll dissolves it away completely before the next comes in. Its behaviour
 * was taken, not its colours — the band keeps the house surface and cyan. It
 * replaced the sticky-note pile on this page; /about keeps the pile
 * (components/common/TestimonialBand).
 *
 * Three things in the prototype could not come across as written. It took
 * every wheel event over the card and wrapped from the last review to the
 * first, so on a page a visitor with the pointer there could never scroll
 * past. It ran its own swipe handler, which on a phone would fire alongside
 * the section engine's: one swipe, and both the page and the review would
 * move. And it took the arrow keys from the whole page.
 *
 * ── One mechanism: a held stage over a stop per review ──────────────────────
 * The band is as many screens tall as it has reviews. The stage — heading,
 * review, dots — is `position: sticky` for the length of it, and under it each
 * review has an empty, screen-tall stop. Which review shows is simply which
 * stop the page is nearest: read from the scroll position, never driving it.
 * So whatever moves the page moves the reviews, and the way out is always the
 * page's own — after the last review, the next scroll is the next section.
 *
 * - Phones and tablets: the stops carry `data-section`, so the section engine
 *   makes each its own stop — one swipe, one review — and hands over to the
 *   next band after the last, as it does out of a chapter stack (the same
 *   arrangement as ChapterStack: a plain wrapper, the parts are the stops).
 *   Nothing here listens to touch.
 * - Desktop: Lenis would carry one wheel gesture through several stops, so
 *   `useReviewSteps` claims each gesture while the stage is held and glides
 *   the page exactly one stop.
 * - The scrollbar, the keys, find-in-page: they move the page, and the review
 *   follows.
 * - Reduced motion: no hold and no dissolve; the reviews are a list
 *   (globals.css, "Client reviews").
 *
 * Every review stays in the document, stacked in one grid cell, so the stack
 * is as tall as the longest quote whichever is showing and nothing jumps; the
 * ones not showing are `inert`.
 */
export function ClientReviews({
  overline,
  title,
  lead,
  items,
}: {
  overline: string;
  title: string;
  lead?: string;
  items: Testimonial[];
}) {
  const stopsRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const active = useNearestStop(stopsRef, count);
  const still = usePrefersReducedMotion();
  const projects = useProjects();
  useReviewSteps(stopsRef, count);

  if (!count) return null;

  const show = (i: number) => {
    const stop = stopsRef.current?.children[i];
    if (!(stop instanceof HTMLElement)) return;
    const nav = getSectionNav();
    const lenis = getLenis();
    if (nav?.active) nav.goTo(stop);
    // `force`: a step's glide locks Lenis, and a dot pressed during one should still be obeyed
    else if (lenis) lenis.scrollTo(stop, { duration: STEP_S, force: true });
    else scrollToTarget(stop, 0);
  };

  return (
    <section className="bg-[rgb(var(--c-surface-2))]">
      <div className="review-stage">
        {/* `my-auto`, not centring on the stage: a stage too short for its review (a phone held
            sideways) starts it at the top instead of pushing its heading up under the header. */}
        <div className="container my-auto grid w-full gap-8 md:grid-cols-12 md:items-center md:gap-x-12 lg:gap-x-16">
          <div className="md:col-span-5">
            <Reveal>
              <p className="overline">{overline}</p>
            </Reveal>
            <h2 className="mt-4 text-display-sm">
              <SplitText text={title} />
            </h2>
            <Reveal delay={0.1}>
              <span className="mt-6 block h-0.5 w-14 rounded-full bg-cyan-500" aria-hidden />
            </Reveal>
            {lead && (
              <Reveal delay={0.15}>
                <p className="review-lead mt-6 max-w-lead text-muted">{lead}</p>
              </Reveal>
            )}
          </div>

          <div className="review-body relative md:col-span-7 md:pr-14">
            <div className="flex">
              {/* The prototype's rule down the side of the quote. It stands still while the reviews
                  change beside it, which is half of what makes the change read as a dissolve. */}
              <span className="mr-5 w-[3px] shrink-0 rounded-full bg-cyan-500 md:mr-8" aria-hidden />
              <div className="review-stack min-w-0 flex-1">
                {items.map((t, i) => {
                  const on = i === active;
                  const project = t.projectId ? projects.find((p) => p.id === t.projectId) : undefined;
                  return (
                    <figure key={t.id} data-on={on ? '' : undefined} inert={!still && !on}>
                      <Quote className="review-mark h-7 w-7 text-cyan-500/40" aria-hidden />
                      <blockquote
                        className={cn(
                          'review-text mt-3 text-heading-md leading-normal text-[rgb(var(--c-text))]',
                          t.language === 'hi' && 'font-deva',
                        )}
                      >
                        {t.quote}
                      </blockquote>
                      <div className="mt-5 flex items-center gap-1" aria-label={`${t.rating} out of 5 stars`}>
                        {Array.from({ length: t.rating }).map((_, s) => (
                          <Star key={s} className="h-4 w-4 fill-warning text-warning" aria-hidden />
                        ))}
                      </div>
                      <figcaption className="mt-4 flex items-center gap-3">
                        {t.avatar && (
                          <img src={t.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{t.name}</p>
                          <p className="truncate text-caption text-subtle">{t.locality}</p>
                        </div>
                      </figcaption>
                      {/* As on TestimonialCard: the visitor can go and check the claim. */}
                      {project && (
                        <CtaLink href={ROUTES.project(project.slug)} size="sm" className="mt-4">
                          See the project · {project.title}
                        </CtaLink>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>

            {count > 1 && (
              <div
                className="review-dots mt-6 flex items-center gap-0.5 md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2 md:flex-col"
                role="group"
                aria-label="Reviews"
              >
                {items.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    className="review-dot"
                    aria-label={`Review ${i + 1} of ${count}: ${t.name}`}
                    aria-current={i === active ? 'true' : undefined}
                    onClick={() => show(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The stops: a screen each, pulled up under the stage (globals.css). */}
      <div ref={stopsRef} className="review-stops" aria-hidden>
        {items.map((t) => (
          <div key={t.id} data-section="testimonials" />
        ))}
      </div>
    </section>
  );
}

/** Seconds a step's glide takes. The stage holds still through it, so this is mostly how long Lenis stays locked. */
const STEP_S = 0.9;
/* The prototype's cooldown, near enough (it waited 920 ms): a new gesture this soon after a step is absorbed,
   so each review gets its complete dissolve — out over 420 ms, then in over 480 ms from 380 ms (globals.css). */
const STEP_GAP = 800;

/** The review to show: the stop the page is nearest, by what is drawn — so the engine's stage transform counts. */
function useNearestStop(stopsRef: RefObject<HTMLDivElement | null>, count: number): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const stops = stopsRef.current;
    if (!stops || count < 2) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const first = stops.firstElementChild;
      // no height under reduced motion, where the stops are not drawn and every review shows
      if (!(first instanceof HTMLElement) || !first.offsetHeight) return;
      const at = Math.round(-first.getBoundingClientRect().top / first.offsetHeight);
      setActive(Math.min(count - 1, Math.max(0, at)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [stopsRef, count]);

  return Math.min(active, Math.max(0, count - 1));
}

type WheelGesture = { t0: number; t: number; s: number; peak: number; low: number; lastAdy: number; falling: boolean; mine: boolean };

/**
 * Desktop: one review per wheel gesture while the stage is held.
 *
 * Each gesture is claimed from Lenis (`claimLenisScroll`) and answered with a
 * glide of exactly one stop; the rest of it — a trackpad's inertia runs on for
 * a second or two — is absorbed. A gesture that would go past the first or
 * last review is not claimed, and Lenis takes the page on, out of the band.
 *
 * One more claim on the way in: a gesture from outside that would carry the
 * page past the band's near edge is stopped there, so a flick down from the
 * projects lands on the first review rather than three screens in.
 *
 * Gestures are told apart by the section engine's rules (`wheel` in
 * lib/section-nav/engine.ts). With no Lenis — touch, where the engine has the
 * wheel, or reduced motion — nothing is claimed.
 */
function useReviewSteps(stopsRef: RefObject<HTMLDivElement | null>, count: number) {
  useEffect(() => {
    const stops = stopsRef.current;
    if (!stops || count < 2) return;
    let g: WheelGesture | null = null;
    let target = 0; // the stop the last step glided to
    let stepT = -1e9; // when it started

    const step = (k: number, top: number, unit: number) => {
      target = k;
      stepT = performance.now();
      getLenis()?.scrollTo(top + k * unit, { duration: STEP_S, lock: true, force: true });
    };

    return claimLenisScroll(({ deltaX, deltaY, event }: VirtualScrollData) => {
      const lenis = getLenis();
      if (!lenis || event.type !== 'wheel' || event.ctrlKey) return false; // ctrl+wheel is a pinch-zoom
      if (Math.abs(deltaX) > Math.abs(deltaY)) return false;
      const ady = Math.abs(deltaY);
      const s = Math.sign(deltaY);
      if (!s) return !!g?.mine;
      const now = performance.now();
      // A new gesture: after a pause, on a change of direction, when the deltas climb well clear of a
      // trackpad's fading inertia, or a mouse wheel's notches a beat apart.
      const rise = !!g && g.falling && now - g.t0 > 120 && ady > Math.max(g.low * 2.5, g.low + 18);
      const notch = !!g && now - g.t > 90 && ady >= 50 && g.lastAdy >= 50;
      const fresh = !g || now - g.t > 180 || s !== g.s || rise || notch;
      if (!g || fresh) {
        g = { t0: now, t: now, s, peak: ady, low: ady, lastAdy: ady, falling: false, mine: false };
      } else {
        g.t = now;
        if (ady < g.peak * 0.6) g.falling = true;
        g.peak = Math.max(g.peak, ady);
        g.low = g.falling ? Math.min(g.low, ady) : ady;
        g.lastAdy = ady;
        if (g.mine) return true; // the rest of a gesture that has had its step
      }

      const first = stops.firstElementChild;
      if (!(first instanceof HTMLElement) || !first.offsetHeight) return false;
      const unit = first.offsetHeight;
      const top = first.getBoundingClientRect().top + window.scrollY;
      const last = top + (count - 1) * unit;
      // where the page is headed: the stop a step is still gliding to, or wherever Lenis is taking it
      const y = now - stepT < STEP_S * 1000 + 100 ? top + target * unit : lenis.targetScroll;

      if (y >= top - 2 && y <= last + 2) {
        if (!fresh) return false; // a gesture already on its way out
        const next = Math.round((y - top) / unit) + s;
        if (next < 0 || next >= count) return false; // the way out
        g.mine = true;
        if (now - stepT >= STEP_GAP) step(next, top, unit);
        return true;
      }
      // Arriving: stop at the near edge rather than coast through.
      if (s > 0 && y < top && lenis.targetScroll + deltaY > top) {
        g.mine = true;
        step(0, top, unit);
        return true;
      }
      if (s < 0 && y > last && lenis.targetScroll + deltaY < last) {
        g.mine = true;
        step(count - 1, top, unit);
        return true;
      }
      return false;
    });
  }, [stopsRef, count]);
}

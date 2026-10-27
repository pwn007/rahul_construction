'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react';
import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { useProjects } from '@/features/projects/useProjects';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks';
import { scrollToTarget } from '@/hooks/useLenis';
import { getSectionNav } from '@/hooks/useSectionNav';
import { cn } from '@/lib/cn';
import type { Testimonial } from '@/types/domain';

/**
 * What our clients say — one review at a time, on the home page.
 *
 * ── The client's brief ──────────────────────────────────────────────────────
 * From the client's own prototype (Oct 2026, "single scroll complete
 * dissolve"): the heading stands still, one review is on screen, and each
 * review dissolves away completely before the next comes in. Its behaviour
 * was taken, not its colours — the band keeps the house surface and cyan. It
 * replaced the sticky-note pile on this page; /about keeps the pile
 * (components/common/TestimonialBand).
 *
 * ── Phones and tablets: a held stage over a stop per review ─────────────────
 * On a touch-first device the band is as many screens tall as it has reviews.
 * The stage — heading, review, dots — is `position: sticky` for the length of
 * it, and under it each review has an empty, screen-tall stop carrying
 * `data-section`, so the section engine makes each its own stop: one swipe,
 * one review, and after the last the next band (the same arrangement as
 * ChapterStack). Which review shows is simply which stop the page is nearest,
 * read from the scroll position, never driving it.
 *
 * ── Desktop: one screen, turned by arrows ───────────────────────────────────
 * With a mouse or trackpad the band is one screen like any other, and the page
 * scrolls over all of it as it does everywhere else. The reviews turn only by
 * hand: the arrows under the review, or the dots beside it (client, 27 Oct
 * 2026) — no autoplay. Nothing here takes a scroll or moves the page.
 * Before: the phones' held stage, every gesture turned into a review (until
 * 25 Oct); then the band split in two halves, a scroll over the reviews'
 * half turning one review while the page held (25–27 Oct). Both read as the
 * page stopping under the visitor, and the client asked for arrows instead.
 *
 * Reduced motion, either way: no hold, no dissolve, no arrows; the reviews are
 * a list (globals.css, "Client reviews").
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
  const still = usePrefersReducedMotion();
  // the section engine's own test: touch-first devices scroll by stops, everything else turns by hand
  const touch = useMediaQuery(TOUCH_FIRST);
  const scrolled = useNearestStop(stopsRef, count, touch);
  const [picked, setPicked] = useState(0);
  const projects = useProjects();

  if (!count) return null;

  const active = touch ? scrolled : Math.min(picked, count - 1);

  const show = (i: number) => {
    if (!touch) {
      setPicked(Math.min(count - 1, Math.max(0, i)));
      return;
    }
    const stop = stopsRef.current?.children[i];
    if (!(stop instanceof HTMLElement)) return;
    const nav = getSectionNav();
    if (nav?.active) nav.goTo(stop);
    else scrollToTarget(stop, 0);
  };

  return (
    <section className="bg-[rgb(var(--c-surface-2))]" aria-roledescription={touch ? undefined : 'carousel'}>
      <div className="review-stage">
        {/* `my-auto`, not centring on the stage: a stage too short for its review (a phone held
            sideways) starts it at the top instead of pushing its heading up under the header. */}
        <div className="container my-auto grid w-full gap-8 md:grid-cols-12 md:items-center md:gap-x-12 lg:gap-x-16">
          <div className="md:col-span-5">
            <Reveal>
              <p className="overline">{overline}</p>
            </Reveal>
            {/* `display-md` from tablet up, like the page's other section headings (25 Oct 2026; it
                was a size smaller). Phones keep `display-sm`: the band is one screen there, and
                its quote needs the room. */}
            <h2 className="mt-4 text-display-sm md:text-display-md">
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
              <div className="min-w-0 flex-1">
                {/* On desktop a review changes only when the visitor asks (the arrows, the dots): read it out. */}
                <div className="review-stack" aria-live={touch ? undefined : 'polite'}>
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
                          {/* amber-700 on a light ground: `warning` (#D97706) is 2.8:1 on the band's
                              mist-2, under the 3:1 a graphic needs; amber-700 is 4.4:1. */}
                          {Array.from({ length: t.rating }).map((_, s) => (
                            <Star
                              key={s}
                              className="h-4 w-4 fill-amber-700 text-amber-700 dark:fill-warning dark:text-warning"
                              aria-hidden
                            />
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
            </div>

            {/* Desktop only (globals.css): the band's way to the next review, under it and in line with
                the quote (the rule's width and gap in). The round arrows of the client videos' deck just
                below, so the two bands read as one family. At either end the way on is closed. */}
            {count > 1 && (
              <div className="review-arrows pl-[calc(3px+1.25rem)] md:pl-[calc(3px+2rem)]" role="group" aria-label="Review controls">
                <button
                  type="button"
                  className="cs-arrow"
                  onClick={() => show(active - 1)}
                  disabled={active === 0}
                  aria-label="Previous review"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  className="cs-arrow"
                  onClick={() => show(active + 1)}
                  disabled={active === count - 1}
                  aria-label="Next review"
                >
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}

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

      {/* The stops (touch only): a screen each, pulled up under the stage (globals.css). */}
      <div ref={stopsRef} className="review-stops" aria-hidden>
        {items.map((t) => (
          <div key={t.id} data-section="testimonials" />
        ))}
      </div>
    </section>
  );
}


/** The section engine's test for a touch-first device (lib/section-nav/engine.ts). */
const TOUCH_FIRST = '(hover: none) and (pointer: coarse)';

/** Touch: the review to show is the stop the page is nearest, by what is drawn — so the engine's stage transform counts. */
function useNearestStop(stopsRef: RefObject<HTMLDivElement | null>, count: number, enabled: boolean): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const stops = stopsRef.current;
    if (!enabled || !stops || count < 2) return;
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
  }, [stopsRef, count, enabled]);

  return Math.min(active, Math.max(0, count - 1));
}

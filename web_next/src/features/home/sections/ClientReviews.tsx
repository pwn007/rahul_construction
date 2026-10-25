'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { VirtualScrollData } from 'lenis';
import { Quote, Star } from 'lucide-react';
import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { useProjects } from '@/features/projects/useProjects';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks';
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
 * ── Desktop: one screen, in two halves ──────────────────────────────────────
 * With a mouse or trackpad the band is one screen like any other, split down
 * the gutter (client's idea, 25 Oct 2026; `useReviewWheel`):
 * - over the heading's half the page scrolls as it does everywhere else;
 * - over the reviews' half a scroll turns one review and the page holds, like
 *   a list scrolling inside the page; after the last review (or before the
 *   first) the scroll is the page's again.
 * The dots turn them too. There is no held stage and nothing ever scrolls the
 * page for the visitor: desktop used the phones' held stage until 25 Oct, with
 * every gesture claimed and turned into a review, and every way of easing out
 * of it — a skip over the heading's half, glides, holds — read as the page
 * freezing or scrolling by itself; an autoplaying carousel with arrows that
 * followed was not what the client wanted either.
 *
 * Reduced motion, either way: no hold, no dissolve, no wheel; the reviews are
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
  const bandRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const still = usePrefersReducedMotion();
  // the section engine's own test: touch-first devices scroll by stops, everything else is split in two
  const touch = useMediaQuery(TOUCH_FIRST);
  const scrolled = useNearestStop(stopsRef, count, touch);
  const [picked, jump] = useReviewWheel(bandRef, headRef, bodyRef, count, !touch && !still);
  const projects = useProjects();

  if (!count) return null;

  const active = touch ? scrolled : picked;

  const show = (i: number) => {
    if (!touch) {
      jump(i);
      return;
    }
    const stop = stopsRef.current?.children[i];
    if (!(stop instanceof HTMLElement)) return;
    const nav = getSectionNav();
    if (nav?.active) nav.goTo(stop);
    else scrollToTarget(stop, 0);
  };

  return (
    <section ref={bandRef} className="bg-[rgb(var(--c-surface-2))]" aria-roledescription={touch ? undefined : 'carousel'}>
      <div className="review-stage">
        {/* `my-auto`, not centring on the stage: a stage too short for its review (a phone held
            sideways) starts it at the top instead of pushing its heading up under the header. */}
        <div className="container my-auto grid w-full gap-8 md:grid-cols-12 md:items-center md:gap-x-12 lg:gap-x-16">
          <div ref={headRef} className="md:col-span-5">
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

          <div ref={bodyRef} className="review-body relative md:col-span-7 md:pr-14">
            <div className="flex">
              {/* The prototype's rule down the side of the quote. It stands still while the reviews
                  change beside it, which is half of what makes the change read as a dissolve. */}
              <span className="mr-5 w-[3px] shrink-0 rounded-full bg-cyan-500 md:mr-8" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="review-stack">
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
/**
 * Desktop: the least time between two turns of the review. A turn asked for sooner is not dropped; it
 * waits its turn, so the wheel never goes dead. Roughly the dissolve's out-and-most-of-the-way-in.
 */
const TURN_GAP = 500;
/**
 * Desktop: a wheel kept going over the reviews (a mouse wheel spun on, a hand kept moving on a trackpad,
 * not a trackpad's coasting) turns another review once it has gone this much further, this long after
 * the last — and after the last review it hands the page back, so a long spin is never held.
 */
const PUSH_PX = 300;
const PUSH_GAP = 900;
/**
 * Desktop: a trackpad's coasting eases off within about this long of the swipe starting to fall away;
 * deltas still coming after it are a hand still moving. (Coasting cannot be told apart from a hand
 * by its deltas alone — the browser merges wheel events, so even a fading tail ticks up now and then.)
 */
const TAIL_MS = 1500;
/**
 * Desktop: a scroll that is the page's stays the page's until the wheel has rested this long or turns
 * round — the browser's own latching for a wheel without phases. So a page scroll that runs on into the
 * reviews' half is never caught there; the visitor pauses, and the next scroll is the reviews'.
 */
const LATCH_MS = 500;
/**
 * Desktop: the reviews take a scroll only while the band is on the screen — covering it, where the page
 * is headed, but for this share of the viewport at the top or the bottom. A band still being scrolled
 * towards is the page's.
 */
const SEAT = 0.12;

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

type WheelGesture = {
  t0: number;
  t: number;
  s: number;
  peak: number;
  low: number;
  lastAdy: number;
  falling: boolean;
  /** Who the gesture belongs to, settled when it starts. */
  owner: 'page' | 'reviews';
  /** When the deltas started falling away (a trackpad coasting, or a hand easing off). */
  fallT: number;
  /** Travel since the gesture last turned a review, while it was still being pushed. */
  push: number;
  pushT: number;
};

/**
 * Desktop: the band in two halves. The heading's half is the page's — every scroll there is Lenis's,
 * untouched. The reviews' half is like a list that scrolls inside the page: a scroll that starts there,
 * with the band on the screen, turns one review and the page holds still; at the first or the last
 * review the scroll is the page's again.
 *
 * Which half a scroll belongs to is settled when it starts, the rule a browser's own nested scrolling
 * follows ("latching"): a page scroll that drifts over the reviews carries on moving the page until the
 * wheel rests (`LATCH_MS`), so the page never stops under the visitor mid-scroll. Over the reviews each
 * gesture — a notch, a swipe — turns one review, and a trackpad's coasting after it is held, unless
 * the gesture is kept going (`PUSH_PX`, `TAIL_MS`). A turn asked for within `TURN_GAP` of the last waits
 * for it rather than being lost, and while turns are waiting the way out waits too.
 *
 * Nothing here moves the page or locks Lenis: the reviews' half only keeps its gestures from Lenis
 * (`claimLenisScroll`). When the band goes off the screen the review resets, so the visitor meets the
 * first coming down to it and the last coming back up. Gestures are told apart by the section engine's
 * rules (`wheel` in lib/section-nav/engine.ts). The dots go through `jump`.
 */
function useReviewWheel(
  bandRef: RefObject<HTMLElement | null>,
  headRef: RefObject<HTMLElement | null>,
  bodyRef: RefObject<HTMLElement | null>,
  count: number,
  enabled: boolean,
): [number, (i: number) => void] {
  const [picked, setPicked] = useState(0);
  // the review showing, the turns still waiting (signed), when the last turn was, and the wait's timer
  const st = useRef({ at: 0, pending: 0, lastTurn: -1e9, timer: 0 });

  const jump = useCallback((i: number, settle = true) => {
    const s = st.current;
    window.clearTimeout(s.timer);
    s.timer = 0;
    s.pending = 0;
    s.at = i;
    if (settle) s.lastTurn = performance.now();
    setPicked(i);
  }, []);

  // off the screen: the first review for a visitor coming back down to the band, the last for one coming back up
  useEffect(() => {
    const band = bandRef.current;
    if (!enabled || !band || count < 2) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) jump(e.boundingClientRect.top > 0 ? 0 : count - 1, false);
    });
    io.observe(band);
    return () => io.disconnect();
  }, [bandRef, count, enabled, jump]);

  useEffect(() => {
    const band = bandRef.current;
    if (!enabled || !band || count < 2) return;
    const s = st.current;
    let g: WheelGesture | null = null;

    const turnNow = (to: number) => {
      s.at = to;
      s.lastTurn = performance.now();
      setPicked(to);
    };
    const drain = () => {
      s.timer = 0;
      if (!s.pending) return;
      const by = Math.sign(s.pending);
      s.pending -= by;
      turnNow(s.at + by);
      if (s.pending) s.timer = window.setTimeout(drain, TURN_GAP);
    };
    /** One more review that way: now, or once the last turn has had its time. False when there is none. */
    const ask = (dir: number): boolean => {
      const goal = s.at + s.pending + dir;
      if (goal < 0 || goal >= count) return false;
      const wait = s.lastTurn + TURN_GAP - performance.now();
      if (!s.pending && wait <= 0) {
        turnNow(goal);
      } else {
        s.pending += dir;
        if (!s.timer) s.timer = window.setTimeout(drain, Math.max(0, wait));
      }
      return true;
    };
    /** A gesture of the reviews' asks for a review: true keeps it from the page, false hands it over. */
    const take = (gesture: WheelGesture): boolean => {
      if (ask(gesture.s)) return true;
      // none that way — but while turns are still waiting the visitor has not yet seen where they are
      if (s.pending) return true;
      gesture.owner = 'page';
      return false;
    };

    /** The band covers the screen, near enough, where the page is headed (Lenis may still be on its way). */
    const seated = (targetScroll: number) => {
      const r = band.getBoundingClientRect();
      const ahead = targetScroll - window.scrollY;
      const vh = window.innerHeight;
      return r.top - ahead <= vh * SEAT && r.bottom - ahead >= vh * (1 - SEAT);
    };
    /** The pointer is over the reviews' half: beyond the middle of the gutter (or, stacked, below the heading). */
    const overReviews = (e: WheelEvent) => {
      const head = headRef.current?.getBoundingClientRect();
      const body = bodyRef.current?.getBoundingClientRect();
      const r = band.getBoundingClientRect();
      if (!head || !body || e.clientY < r.top || e.clientY > r.bottom) return false;
      if (body.left >= head.right - 1) return e.clientX >= (head.right + body.left) / 2;
      return e.clientY >= (head.bottom + body.top) / 2;
    };

    return claimLenisScroll(({ deltaX, deltaY, event }: VirtualScrollData) => {
      const lenis = getLenis();
      if (!lenis || event.type !== 'wheel' || event.ctrlKey) return false; // ctrl+wheel is a pinch-zoom
      const now = performance.now();
      const ady = Math.abs(deltaY);
      const dir = Math.sign(deltaY);
      // sideways or empty: kept only inside a gesture of the reviews', so it cannot nudge the page
      if (!dir || Math.abs(deltaX) > ady) return g?.owner === 'reviews' && now - g.t <= 180;

      // A new gesture: after a pause, on a change of direction, when the deltas climb well clear of a
      // trackpad's fading inertia, or a mouse wheel's notches a beat apart.
      const rise = !!g && g.falling && now - g.t0 > 120 && ady > Math.max(g.low * 2.5, g.low + 18);
      const notch = !!g && now - g.t > 90 && ady >= 50 && g.lastAdy >= 50;
      if (!g || now - g.t > 180 || dir !== g.s || rise || notch) {
        // the page's scroll goes on being the page's until the wheel rests or turns round
        const latched = !!g && g.owner === 'page' && dir === g.s && now - g.t < LATCH_MS;
        const mine = !latched && overReviews(event as WheelEvent) && seated(lenis.targetScroll);
        g = { t0: now, t: now, s: dir, peak: ady, low: ady, lastAdy: ady, falling: false, fallT: 0, owner: mine ? 'reviews' : 'page', push: 0, pushT: now };
        return mine && take(g);
      }

      // pushed: before the deltas fall away, or long after — when a trackpad's coasting would have eased off
      const pushed = !g.falling || (now - g.fallT >= TAIL_MS && ady >= 4);
      g.t = now;
      if (!g.falling && ady < g.peak * 0.6) {
        g.falling = true;
        g.fallT = now;
      }
      g.peak = Math.max(g.peak, ady);
      g.low = g.falling ? Math.min(g.low, ady) : ady;
      g.lastAdy = ady;
      if (g.owner === 'page') return false;
      // kept going, not coasting: another review, or out to the page after the last — so a scroll that
      // never pauses is never held for long
      if (pushed) {
        g.push += ady;
        if (g.push >= PUSH_PX && now - g.pushT >= PUSH_GAP) {
          g.push = 0;
          g.pushT = now;
          return take(g);
        }
      }
      return true;
    });
  }, [bandRef, headRef, bodyRef, count, enabled]);

  useEffect(() => () => window.clearTimeout(st.current.timer), []);

  return [Math.min(picked, Math.max(0, count - 1)), jump];
}

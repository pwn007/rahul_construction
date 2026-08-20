import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { SYSTEMS, SYSTEM_ORDER } from '@/data/mepf';
import { useInView, useIsDesktop, useIsoLayoutEffect, usePrefersReducedMotion } from '@/hooks';
import { HouseIso } from './scene/HouseIso';
import type { MoverKey, Reg } from './scene/refs';
import {
  AIR_MS,
  AIR_SPACING,
  FAN_MS,
  HAZE_MS,
  LIT_MS,
  VOLT_MS,
  VOLT_SPACING,
  WASTE_MS,
  WATER_MS,
  WATER_SPACING,
  standbyAt,
  travel,
} from './scene/loops';
import { SYSTEM_STYLES } from './scene/systems';
import { SystemList } from './SystemList';
import { useMepfScene } from './useMepfScene';

/*
  three.js is ~150 KB gzipped, so it is imported exactly here and nowhere else.
  Rollup follows the dynamic import and gives it its own chunk: the entry bundle
  does not move, and neither `/` nor `/services/mepf-consultancy` — which show
  the flat house through `MepfTeaser` — ever download a byte of it.
*/
const HouseThree = lazy(() => import('./scene/HouseThree'));

/**
 * Can this browser draw the house at all?
 *
 * Asked once, cheaply, and the probe context is thrown away immediately —
 * holding it open would waste one of the handful a browser will give a page.
 * Anything that says no (old hardware, a locked-down enterprise build, a
 * headless crawler) keeps the flat drawing, which is a complete answer on its
 * own rather than a placeholder for a better one.
 */
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    (gl.getExtension('WEBGL_lose_context') as { loseContext(): void } | null)?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * The house, and the four things running through it.
 *
 * ── Two clocks, kept apart ──────────────────────────────────────────────────
 *   · React handles everything *discrete* — which system is selected, which are
 *     switched off. That changes a handful of times per visit, so a re-render is
 *     the right tool and framer-motion can tween between the states.
 *   · One `requestAnimationFrame` loop handles everything *continuous* — air,
 *     water, charge, the fan, the detector blink. It writes attributes straight
 *     to thirteen registered nodes and never calls `setState`, which is the same
 *     arrangement the hero uses for the same reason: React should draw a scene
 *     of this size once.
 *
 * ── Not scroll-driven, on purpose ───────────────────────────────────────────
 * The version this replaces was a five-chapter scrollytelling sequence pinned to
 * a sticky graphic, and it was 4,100px of scroll to deliver four facts. The
 * facts are the deliverable; the scroll was the packaging. Everything is on one
 * screen now and the page is a third of the height.
 */
export function MepfTwin({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0, rootMargin: '0px' });
  const { focus, setFocus, off, toggle, restore, anyOff, message } = useMepfScene();
  const [webgl, setWebgl] = useState(false);
  useEffect(() => setWebgl(hasWebGL()), []);

  // ── The registry: the house calls ref={reg('water')} and the loop looks it up.
  const nodes = useRef(new Map<string, SVGGraphicsElement>());
  const reg = useCallback<Reg>(
    (key) => (el) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );
  const get = (key: MoverKey) => nodes.current.get(key);

  /*
    The compact composition drops labels and furniture, so the node set changes
    with the breakpoint — clear the registry *during* render. Refs attach at
    commit, which is after render and before layout effects, so clearing any
    later would wipe the nodes React has just handed us.
  */
  useMemo(() => {
    nodes.current.clear();
  }, [isDesktop]);

  const offRef = useRef(off);
  offRef.current = off;

  /** One frame. The only function in this file allowed to touch the DOM. */
  const apply = useCallback((now: number) => {
    const dead = offRef.current;

    for (let i = 0; i < 2; i += 1) {
      get(`air${i}` as MoverKey)?.setAttribute('stroke-dashoffset', (-travel(now, AIR_MS, AIR_SPACING)).toFixed(2));
      get(`volt${i}` as MoverKey)?.setAttribute('stroke-dashoffset', (-travel(now, VOLT_MS, VOLT_SPACING)).toFixed(2));
    }
    get('water')?.setAttribute('stroke-dashoffset', (-travel(now, WATER_MS, WATER_SPACING)).toFixed(2));
    get('waste')?.setAttribute('stroke-dashoffset', (-travel(now, WASTE_MS, WATER_SPACING)).toFixed(2));

    // The fan carries its own pivot, and `rotate(deg cx cy)` avoids transform-box,
    // which Safari still argues about.
    const fan = get('fan');
    if (fan) {
      const spin = dead.hvac ? 0 : ((now / FAN_MS) % 1) * 360;
      fan.setAttribute('transform', `rotate(${spin.toFixed(1)} ${fan.dataset.pivot ?? '0 0'})`);
    }

    for (let i = 0; i < 4; i += 1) {
      const lit = get(`lit${i}` as MoverKey);
      if (!lit) continue;
      lit.setAttribute('opacity', dead.electrical ? '0' : (0.36 + 0.08 * Math.sin(now / LIT_MS + i * 1.7)).toFixed(3));
    }

    get('standby')?.setAttribute('opacity', dead.fire ? '0' : (standbyAt(now) * 0.45).toFixed(3));
    get('haze')?.setAttribute('opacity', dead.hvac ? (0.7 + 0.3 * Math.sin(now / HAZE_MS)).toFixed(3) : '0');
  }, []);

  /**
   * The static frame — the *fullest* reading, not frame zero.
   *
   * Under reduced motion the loop never runs, so this is the only thing that
   * ever writes to the house: lights on, detector lit, heat showing if the
   * visitor has switched the air off. A frozen first frame would be a dark, dead
   * house, which argues the opposite of the page.
   */
  useIsoLayoutEffect(() => {
    if (!reduced) return;
    for (let i = 0; i < 4; i += 1) get(`lit${i}` as MoverKey)?.setAttribute('opacity', off.electrical ? '0' : '0.42');
    const fan = get('fan');
    if (fan) fan.setAttribute('transform', `rotate(0 ${fan.dataset.pivot ?? '0 0'})`);
    get('standby')?.setAttribute('opacity', off.fire ? '0' : '0.45');
    get('haze')?.setAttribute('opacity', off.hvac ? '0.85' : '0');
  }, [reduced, isDesktop, off]);

  useEffect(() => {
    if (reduced || !inView) return;
    let frame = 0;
    const step = (now: number) => {
      apply(now);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduced, inView, apply]);

  const Poster = useCallback(
    () => (
      <svg
        key={isDesktop ? 'full' : 'compact'}
        viewBox="-307 -464 1150 948"
        preserveAspectRatio="xMidYMid meet"
        className="relative block h-auto w-full"
        role="img"
        aria-label={
          focus
            ? `Cutaway of a two-storey house with the ${SYSTEMS[focus].name.toLowerCase()} system highlighted. ${SYSTEMS[focus].where}`
            : 'Cutaway of a two-storey house showing where air, water, power and fire safety run through it.'
        }
        focusable="false"
      >
        <HouseIso reg={reg} focus={focus} off={off} live reduced={reduced} compact={!isDesktop} />
      </svg>
    ),
    [isDesktop, focus, off, reduced, reg],
  );

  return (
    <section className={cn('section-sm', className)} aria-labelledby="mepf-twin-heading">
      <div className="container">
        <h2 id="mepf-twin-heading" className="sr-only">
          Where MEPF is in a house, and what happens without it
        </h2>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ── The house. Sticky beside the list on desktop only: the list is
                 taller than the drawing, and reading a row about the bathroom
                 while the bathroom has scrolled off screen defeats the point. */}
          <div ref={viewRef} className="lg:col-span-7 lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)] lg:self-start">
            <div className="relative overflow-hidden rounded-xl border bg-[rgb(var(--c-surface-2))] shadow-sm">
              <div
                className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm dark:bg-grid-blueprint dark:opacity-[0.09]"
                aria-hidden
              />
              {/*
                The flat house paints on the first frame; the 3D one replaces it
                once three.js has arrived. Not a spinner and not a blank box —
                the poster is the same house, already answering the question, so
                a slow connection costs a visitor nothing but the ability to turn
                it. If WebGL is missing the poster simply stays for good.
              */}
              {webgl ? (
                <Suspense fallback={<Poster />}>
                  <HouseThree focus={focus} off={off} reduced={reduced} inView={inView} className="relative" />
                </Suspense>
              ) : (
                <Poster />
              )}

              {/* The key, inside the frame with the thing it explains. It also
                  carries the switch state, because colour must never be the only
                  channel — "the blue one went grey" is no use to a reader who
                  could not tell which one was blue. */}
              <div className="relative flex flex-wrap gap-x-5 gap-y-1.5 border-t bg-[rgb(var(--c-surface))]/60 px-4 py-3 sm:px-5">
                {SYSTEM_ORDER.map((key) => (
                  <span key={key} className="inline-flex items-center gap-2 text-caption">
                    <span
                      className="h-2.5 w-2.5 rounded-full transition-colors"
                      style={{ backgroundColor: off[key] ? 'rgb(var(--c-text-subtle))' : SYSTEM_STYLES[key].colour }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        off[key] ? 'text-subtle line-through' : 'text-muted',
                        focus === key && 'font-semibold text-[rgb(var(--c-text))]',
                      )}
                    >
                      {SYSTEMS[key].legend}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <SystemList
            className="lg:col-span-5"
            focus={focus}
            setFocus={setFocus}
            off={off}
            toggle={toggle}
            restore={restore}
            anyOff={anyOff}
          />
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </section>
  );
}

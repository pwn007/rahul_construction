import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useScroll } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useInView, useIsDesktop, useIsoLayoutEffect, usePrefersReducedMotion } from '@/hooks';
import {
  clamp01,
  CLOUD_MS,
  CRANE_SLEW_MS,
  ENTRANCE_MS,
  GLOW_MS,
  glintAt,
  GRAVEL_MS,
  hoistAt,
  planAt,
  TROLLEY_MS,
} from './hero-scene/loops';
import { SceneNarrow } from './hero-scene/SceneNarrow';
import { SceneWide } from './hero-scene/SceneWide';
import type { MoverKey, Reg } from './hero-scene/refs';

/**
 * The home hero: one construction site, read left to right.
 *
 *   WE DESIGN   architects over a blueprint on a board
 *   WE BUILD    a frame going up, with a crane, scaffold and a crew
 *   WE DELIVER  a finished, lit home — and the keys changing hands
 *
 * ── Why it is a picture and not a sequence ──────────────────────────────────
 * All three are on screen at once, always. A hero that plays a story once is a
 * story most visitors miss, so the message lives in the *composition*: whenever
 * anyone looks, the whole of design → build → deliver is legible. Motion only
 * keeps it alive.
 *
 * ── Why it is filled and not stroked ────────────────────────────────────────
 * Two earlier versions drew this site in thin navy line-work and both were
 * rejected, the second because the drawing board was read as a slingshot. An
 * outline is only a thing to someone who already expected that thing. Solid
 * shape, hi-vis orange and hard hats are what make an illustration legible
 * before anyone has decided to look properly — see `hero-scene/palette.ts`.
 *
 * ── Rendering ───────────────────────────────────────────────────────────────
 * The scene is ~200 filled shapes and React draws them exactly once. A single
 * rAF loop then writes attributes straight to the dozen nodes registered
 * through `reg` — see `hero-scene/refs.ts`. There is no per-frame `setState`
 * anywhere in this component, which is what keeps a scene this dense inside a
 * frame budget on a mid-range phone.
 */
export const HeroScene = memo(function HeroScene({
  sectionRef,
  className,
}: {
  sectionRef: React.RefObject<HTMLElement>;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0, rootMargin: '0px' });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });

  const nodes = useRef(new Map<string, SVGGraphicsElement>());
  const reg = useCallback<Reg>(
    (key) => (el) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );
  const get = (key: MoverKey) => nodes.current.get(key);

  // The composition swaps wholesale between breakpoints, so the registry has to
  // be emptied *during render* — refs attach at commit, which is after render
  // and before layout effects, so clearing any later would wipe the nodes just
  // handed to us.
  useMemo(() => {
    nodes.current.clear();
  }, [isDesktop]);

  const entranceDone = useRef(false);

  /**
   * The handful of numbers the loop needs that differ between compositions —
   * where the jib pivots, how far the trolley runs, how deep the hook drops.
   * Hard-coding the wide scene's values and scaling them was tried and drifts:
   * the narrow scene is a different drawing, not a smaller one.
   */
  const rig = useMemo(
    () =>
      isDesktop
        ? { pivot: '762 70', trolley: [660, 90], hook: [230, 114], slew: 3.2, span: 1260 }
        : { pivot: '344 50', trolley: [288, 62], hook: [150, 74], slew: 2.6, span: 690 },
    [isDesktop],
  );

  /** One frame. The only function in this file allowed to touch the DOM. */
  const apply = useCallback(
    (now: number, elapsed: number) => {
      /*
        ── The entrance ────────────────────────────────────────────────────
        The stations fade up left to right over 1.2s on first paint, and then
        never again. It is a flourish, not the story — a visitor who misses it
        has missed nothing, because the story is the layout — so once it is done
        the block drops out of the loop for good.
      */
      const sweep = reduced ? 1 : clamp01(elapsed / ENTRANCE_MS);
      if (sweep < 1 || !entranceDone.current) {
        entranceDone.current = sweep >= 1;
        get('back')?.setAttribute('opacity', clamp01(sweep / 0.5).toFixed(3));
        get('mid')?.setAttribute('opacity', clamp01((sweep - 0.15) / 0.5).toFixed(3));
        get('front')?.setAttribute('opacity', clamp01((sweep - 0.35) / 0.5).toFixed(3));
      }

      // Depth. The three layers move at different rates against scroll, which is
      // the whole reason the scene reads as a place rather than as a diagram —
      // a front layer that moves faster than a back one *is* parallax.
      const p = reduced ? 0 : scrollYProgress.get();
      get('back')?.setAttribute('transform', `translate(0 ${(p * 14).toFixed(1)})`);
      get('mid')?.setAttribute('transform', `translate(0 ${(p * 30).toFixed(1)})`);
      get('front')?.setAttribute('transform', `translate(0 ${(p * 52).toFixed(1)})`);

      if (reduced) {
        // The static frame is the fullest reading of every station, not the
        // first frame of each loop: a finished plan on the board, the hook at
        // rest, the windows lit.
        for (let i = 0; i < 4; i += 1) get(`plan${i}` as MoverKey)?.setAttribute('stroke-dashoffset', '0');
        for (let i = 0; i < 3; i += 1) get(`glow${i}` as MoverKey)?.setAttribute('opacity', '0.92');
        get('trolley')?.setAttribute('transform', `translate(${rig.trolley[0]! + rig.trolley[1]! / 2} 0)`);
        get('hook')?.setAttribute('transform', `translate(0 ${rig.hook[0]! - rig.hook[1]!})`);
        get('gravel')?.setAttribute('transform', 'translate(0 0)');
        return;
      }

      // ── The crane ────────────────────────────────────────────────────────
      // Slew, trolley and hoist run on 9s, 15s and 12s — no two related, so the
      // crane never visibly repeats even though each of its parts does.
      const slew = Math.sin(now / CRANE_SLEW_MS) * rig.slew;
      get('jib')?.setAttribute('transform', `rotate(${slew.toFixed(3)} ${rig.pivot})`);

      const tx = rig.trolley[0]! + ((1 - Math.cos((now / TROLLEY_MS) * Math.PI * 2)) / 2) * rig.trolley[1]!;
      get('trolley')?.setAttribute('transform', `translate(${tx.toFixed(1)} 0)`);
      get('hook')?.setAttribute('transform', `translate(0 ${(rig.hook[0]! - hoistAt(now) * rig.hook[1]!).toFixed(1)})`);

      // ── The board ────────────────────────────────────────────────────────
      const plan = planAt(now);
      for (let i = 0; i < 4; i += 1) {
        // Each line takes its own slice of the cycle, so the plan assembles in a
        // plausible order — walls, then the partition, then the door swing.
        const t = clamp01((plan - i * 0.16) / 0.34);
        get(`plan${i}` as MoverKey)?.setAttribute('stroke-dashoffset', (1 - t).toFixed(4));
      }

      // ── The delivered home ───────────────────────────────────────────────
      for (let i = 0; i < 3; i += 1) {
        const breathe = 0.88 + 0.12 * Math.sin(now / GLOW_MS + i * 1.9);
        get(`glow${i}` as MoverKey)?.setAttribute('opacity', breathe.toFixed(3));
      }
      get('glint')?.setAttribute('opacity', glintAt(now).toFixed(3));

      // ── The tipper ───────────────────────────────────────────────────────
      // Travel equals the gap between pebbles, so the stream is seamless: the
      // frame where it wraps is identical to the one before it.
      get('gravel')?.setAttribute('transform', `translate(0 ${(((now / GRAVEL_MS) % 1) * 14).toFixed(2)})`);

      // ── Sky ──────────────────────────────────────────────────────────────
      for (let i = 0; i < 3; i += 1) {
        const drift = ((now / CLOUD_MS + i * 0.37) % 1) * (rig.span + 400) - 200;
        get(`cloud${i}` as MoverKey)?.setAttribute('transform', `translate(${drift.toFixed(1)} 0)`);
      }
    },
    [reduced, scrollYProgress, rig],
  );

  useIsoLayoutEffect(() => {
    entranceDone.current = false;
    apply(0, reduced ? ENTRANCE_MS : 0);
  }, [apply, reduced, isDesktop]);

  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || !inView) return;
    let frame = 0;
    const step = (now: number) => {
      startedAt.current ??= now;
      apply(now, now - startedAt.current);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduced, inView, apply]);

  return (
    <div ref={viewRef} className={cn('pointer-events-none select-none', className)} aria-hidden>
      <svg
        key={isDesktop ? 'wide' : 'narrow'}
        viewBox={isDesktop ? '0 0 1260 420' : '0 0 690 300'}
        /*
          `meet`, never `slice`. `slice` scales to cover, so a container
          proportionally wider than the scene overflows vertically and — being
          bottom-anchored — crops from the top, which takes the crane's head off.
          `meet` fits the whole thing; the ground band absorbs what it costs.
        */
        preserveAspectRatio="xMidYMax meet"
        className="h-full w-full"
        focusable="false"
      >
        {isDesktop ? <SceneWide reg={reg} /> : <SceneNarrow reg={reg} />}
      </svg>
    </div>
  );
});

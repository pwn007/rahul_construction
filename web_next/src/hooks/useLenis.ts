'use client';

import { useEffect } from 'react';
import Lenis, { type VirtualScrollData } from 'lenis';
import { usePrefersReducedMotion } from './index';

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

type ScrollClaim = (data: VirtualScrollData) => boolean;
const claims = new Set<ScrollClaim>();

/**
 * Take wheel events away from Lenis. Each claim sees every event Lenis would
 * smooth and returns true to keep it: Lenis then leaves it alone, and the
 * browser's own scroll is cancelled here, since Lenis only cancels the events
 * it handles. A claim is module-level, so it outlives Lenis standing down and
 * starting again (a pointer change). Returns the release.
 *
 * The home page's client reviews use it on desktop to keep a gesture over the
 * reviews' half from the page, turning one review instead
 * (features/home/sections/ClientReviews.tsx).
 */
export function claimLenisScroll(claim: ScrollClaim): () => void {
  claims.add(claim);
  return () => {
    claims.delete(claim);
  };
}

function unclaimed(data: VirtualScrollData): boolean {
  for (const claim of claims) {
    if (claim(data)) {
      if (data.event.cancelable) data.event.preventDefault();
      return false;
    }
  }
  return true;
}

/**
 * Weighted inertia scroll — the "single continuous surface" feel of award-winning sites.
 * Disabled entirely for reduced-motion users and touch devices (native momentum is better there).
 *
 * The touch check follows the device live, not just at mount: on the home page a
 * touch-first device hands its scrolling to the section engine
 * (lib/section-nav), and the two must never run together — Lenis would take the
 * wheel and overwrite the engine's scroll position. So when a desktop switches
 * to touch (devtools device mode, a convertible folding over) Lenis stands down,
 * and comes back when it switches back.
 */
export function useLenisScroll() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const coarse = window.matchMedia('(pointer: coarse)');
    let lenis: Lenis | null = null;
    let rafId = 0;

    const start = () => {
      if (lenis) return;
      const l = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        virtualScroll: unclaimed,
      });
      lenis = l;
      lenisInstance = l;
      const raf = (time: number) => {
        l.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    };
    const stop = () => {
      if (!lenis) return;
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenis = null;
      lenisInstance = null;
    };
    const sync = () => (coarse.matches ? stop() : start());

    sync();
    coarse.addEventListener('change', sync);
    return () => {
      coarse.removeEventListener('change', sync);
      stop();
    };
  }, [reduced]);
}

/** Programmatic scroll that works with or without Lenis. */
export function scrollToTarget(target: string | HTMLElement | number, offset = -80) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.2 });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el instanceof HTMLElement) {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
  }
}

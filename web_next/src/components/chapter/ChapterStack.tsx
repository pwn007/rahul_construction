'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { scrollToTarget } from '@/hooks/useLenis';
import { cn } from '@/lib/cn';

/**
 * A chapter and the chapters that are its parts — "What we do" and its
 * services, MEPF and its four systems — as one pile.
 *
 * Inside the stack each chapter holds still while the next one slides up over
 * it; after the last, the pile leaves as one and whatever follows arrives the
 * ordinary way. So a visitor sees which chapters belong together from how the
 * page moves, and reads it off the plate they all share ("MEPF" and a
 * tick per part — `plate.parts` / `plate.part` on Chapter).
 *
 *   <ChapterStack>
 *     <Chapter id="mepf" plate={{ label: 'MEPF', parts: 4 }}>…</Chapter>
 *     <Chapter id="mepf-hvac" plate={{ label: 'MEPF', parts: 4, part: 1 }}>…</Chapter>
 *     …
 *   </ChapterStack>
 *
 * ── Scrolling is untouched ───────────────────────────────────────────────────
 * The holding still is `position: sticky` (globals.css, "Chapter stack") and
 * nothing else: no box moves in the flow, the page is exactly as long as it
 * was, and every chapter is the same stop for the section engine at the same
 * scroll position. The engine measures its stops unstuck (`inFlow` in
 * lib/section-nav/engine.ts), because a stuck box reports where it is stuck.
 * This wrapper must stay a plain box for that to hold — no `data-section`
 * (the chapters are the stops), and no overflow, transform or containment,
 * any of which would give the chapters something other than the page to stick
 * to. With reduced motion the chapters are not sticky and scroll as they did.
 *
 * The component does the two things CSS cannot:
 *
 * - **Hands each chapter its own height** (`--chapter-h`). A chapter that fits
 *   the screen sticks at its top; one that runs longer — a phone held
 *   sideways, a long admin heading — must stick at its foot instead, or the
 *   next chapter would cover the part nobody had scrolled to yet. Until the
 *   height arrives the chapters are not stuck at all.
 * - **Brings a covered chapter back for the keyboard.** Shift+Tab can put
 *   focus on a link in a chapter that is underneath the pile; the browser
 *   counts it as on screen and does not scroll. The page goes back to that
 *   chapter instead.
 */
export function ChapterStack({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stack = ref.current;
    if (!stack) return;
    const chapters = () => Array.from(stack.children) as HTMLElement[];

    /* Read every height before writing any: the property inherits, so each write restyles a chapter. */
    const measure = () => {
      const els = chapters();
      const heights = els.map((el) => `${el.offsetHeight}px`);
      els.forEach((el, i) => {
        if (el.style.getPropertyValue('--chapter-h') !== heights[i]) el.style.setProperty('--chapter-h', heights[i]);
      });
    };
    const ro = new ResizeObserver(measure);
    /* The services arrive from the API after the first render, and can change: follow the DOM. */
    const watch = () => {
      ro.disconnect();
      chapters().forEach((el) => ro.observe(el));
    };
    const mo = new MutationObserver(watch);
    mo.observe(stack, { childList: true });
    watch();

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return; // the keyboard only
      const els = chapters();
      const i = els.findIndex((el) => el.contains(target));
      const next = els[i + 1];
      if (i < 0 || !next || getComputedStyle(els[i]).position !== 'sticky') return;
      const at = target.getBoundingClientRect();
      if (next.getBoundingClientRect().top >= at.bottom) return; // not covered
      /* Where the chapter sits in the flow: the stack is not sticky, and the chapters before it have no gaps. */
      const flowTop =
        stack.getBoundingClientRect().top + window.scrollY + els.slice(0, i).reduce((h, el) => h + el.offsetHeight, 0);
      /* Its top; in a chapter longer than the screen, far enough in to show the link. */
      const inside = at.top - els[i].getBoundingClientRect().top - window.innerHeight * 0.3;
      const room = Math.max(0, els[i].offsetHeight - window.innerHeight);
      scrollToTarget(Math.round(flowTop + Math.min(Math.max(inside, 0), room)), 0);
    };
    stack.addEventListener('focusin', onFocusIn);

    return () => {
      ro.disconnect();
      mo.disconnect();
      stack.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  return (
    <div ref={ref} className={cn('chapter-stack', className)}>
      {children}
    </div>
  );
}

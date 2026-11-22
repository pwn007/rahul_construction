'use client';

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { usePreloaderDone } from '@/components/common/Chrome';
import { cn } from '@/lib/cn';

/**
 * Calls `onIn` once the element is on screen: at once if it already is when
 * the page appears (`animated` false), otherwise when it scrolls in. Under the
 * preloader it waits for the curtain to lift, so what it covered still plays.
 */
export function useSeen<T extends HTMLElement>(onIn: (el: T, animated: boolean) => void, threshold = 0.12) {
  const ref = useRef<T>(null);
  const lifted = usePreloaderDone();
  const done = useRef(false);
  const onInRef = useRef(onIn);
  onInRef.current = onIn;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || done.current) return;
    const fire = (animated: boolean) => {
      done.current = true;
      onInRef.current(el, animated);
    };
    const html = document.documentElement;
    const curtain = !html.classList.contains('preloader-skip') && !html.classList.contains('preloader-done');
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      if (curtain) return; // runs again when it lifts
      /* At mount the page root has no `data-motion` yet (its effect runs after
         this one), so nothing was hidden and nothing plays. */
      fire(Boolean(el.closest('[data-motion]')));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fire(true);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lifted, threshold]);

  return ref;
}

/**
 * The client's `Reveal`: a wrapper that fades up 26px when it comes into view,
 * `delay` ms after its neighbours (globals.css, "HOME TEMPLATE"). Theirs starts
 * hidden; this one only hides after hydration, so the exported HTML and a
 * visitor without JS see the page.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useSeen<HTMLDivElement>((el) => el.classList.add('in'));
  return (
    <div ref={ref} style={{ '--d': `${delay}ms` } as CSSProperties} className={cn('ht-reveal', className)}>
      {children}
    </div>
  );
}

/** The client's section label: a short cyan rule, then the words. Their class has
    no phone size (1.05vw is 4px on a phone); 12px is their other small labels'. */
export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={cn(
        'flex items-center gap-1 font-[Poppins] text-[1.05vw] tracking-[0.15em] text-navy-800 min-[1500px]:text-[16px] max-lg:text-xs',
        light && 'font-light',
      )}
    >
      <span className="inline-block h-px w-3 bg-cyan-500" />
      {children}
    </p>
  );
}

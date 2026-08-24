'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

/** SSR-safe layout effect. */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * `useSyncExternalStore`, not `useState` + effect.
 *
 * Reading `matchMedia` in a `useState` initialiser is fine in a client-only app
 * and wrong under SSR: the server has no viewport and returns `false`, the
 * desktop client returns `true` on its very first render, and React throws the
 * whole tree away and re-renders it. That is what it was doing — the hero SVG
 * was server-rendered at its narrow viewBox and the MEPF house as its poster,
 * then both were discarded on hydration.
 *
 * The server snapshot below is the contract: first paint everywhere is the
 * mobile branch, and the desktop branch arrives one commit later. Every consumer
 * already renders correctly at `false`, since that is what a real phone gets.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Single global gate for all motion decisions. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useHasFinePointer(): boolean {
  return useMediaQuery('(pointer: fine)');
}

/** Scroll position + direction, rAF-throttled. */
export function useScrollInfo() {
  const [state, setState] = useState({ y: 0, direction: 'down' as 'up' | 'down', atTop: true });
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setState({
          y,
          direction: y > lastY.current ? 'down' : 'up',
          atTop: y < 12,
        });
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return state;
}

/** Locks body scroll while `locked` is true. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export function useOnClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);
  return ref;
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** IntersectionObserver "has entered viewport" flag. */
export function useInView<T extends HTMLElement>(options?: { threshold?: number; once?: boolean; rootMargin?: string }) {
  const { threshold = 0.15, once = true, rootMargin = '0px 0px -8% 0px' } = options ?? {};
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, inView };
}

/** Copy-to-clipboard with a transient `copied` flag. */
export function useCopy(resetAfter = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), resetAfter);
      } catch {
        setCopied(false);
      }
    },
    [resetAfter],
  );
  return { copied, copy };
}

/** Keyboard shortcut, e.g. useHotkey('k', true, fn) for ⌘K / Ctrl+K. */
export function useHotkey(key: string, withMeta: boolean, handler: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const metaOk = withMeta ? e.metaKey || e.ctrlKey : true;
      if (metaOk && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [key, withMeta, handler]);
}

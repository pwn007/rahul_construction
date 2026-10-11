'use client';

import { useEffect } from 'react';
import { createSectionNav } from '@/lib/section-nav';

/**
 * One section per swipe on phones and tablets, for as long as the calling page
 * is mounted (the home page — the only page drawn as screens).
 *
 * The engine decides for itself whether to run: touch-first devices with
 * motion allowed, following changes live. Everywhere else this hook costs two
 * media-query listeners and the page scrolls as it always has. See
 * lib/section-nav/engine.ts for the behaviour and what marks a stop.
 *
 * `?navdebug` in the URL exposes the engine's state as `window.__nav` for the
 * touch tests.
 */
export function useSectionNav() {
  useEffect(() => {
    const nav = createSectionNav({ debug: /[?&]navdebug\b/.test(window.location.search) });
    return () => nav.destroy();
  }, []);
}

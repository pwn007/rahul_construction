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
 * touch tests, and puts its meter in the corner of the screen: what the last
 * few drags and glides cost on the device in hand.
 *
 * `?navstage=1` moves the page with a transform instead of the scroll position
 * (engine.ts, "The stage") — off unless asked for, until it has been compared
 * with the present way on an iPhone. The two go together:
 * `/?navdebug&navstage=1` against `/?navdebug`.
 */
export function useSectionNav() {
  useEffect(() => {
    const q = window.location.search;
    const nav = createSectionNav({ debug: /[?&]navdebug\b/.test(q), stage: /[?&]navstage=1\b/.test(q) });
    return () => nav.destroy();
  }, []);
}

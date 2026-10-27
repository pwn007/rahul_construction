'use client';

import { useEffect } from 'react';
import { loadAnalytics } from '@/lib/analytics';
import { getAttribution } from '@/lib/attribution';
import { watchBuildFreshness } from '@/lib/build-freshness';

/**
 * Boot side-effects, in this order.
 *
 * In the Vite build these ran in `main.tsx` before React mounted, because
 * attribution reads the campaign parameters off the landing URL and the router
 * rewrote it the moment it mounted. The App Router does not rewrite the URL on
 * mount, so the first effect of the first client component is early enough — and
 * it is the earliest point that exists, since neither can run on the server.
 *
 * Both are inert without NEXT_PUBLIC_GTM_ID and a tagged URL respectively.
 *
 * Last, the stale-release watch: a tab running an older build reloads itself
 * (`lib/build-freshness.ts`). Inert outside a production build.
 */
export function Boot() {
  useEffect(() => {
    loadAnalytics();
    getAttribution();
    return watchBuildFreshness();
  }, []);

  return null;
}

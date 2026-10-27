/**
 * Reload a tab that is running an older release than the one on the server.
 *
 * The server always sends the current HTML (`no-cache`), but a browser does not
 * always ask: a tab left open for weeks, a tab Chrome restores after a restart
 * or a memory-saver discard, and a Back/Forward step can all show the copy they
 * already hold. On 26 Oct 2026 the client saw the 23 Sep home page that way,
 * fully working, because a deploy only overwrites and every old chunk was still
 * on the server.
 *
 * Every build bakes in its id (`NEXT_PUBLIC_BUILD_ID`, set in next.config.mjs)
 * and publishes the same id at /version.json (`app/version.json/route.ts`,
 * `no-store` in .htaccess). When the two disagree, the page reloads once.
 *
 * When it checks:
 *   - on boot — covers restored tabs, discarded tabs and history from the cache;
 *   - on `pageshow` from the back/forward cache;
 *   - when a tab comes back after being hidden for HIDDEN_LONG_MS. A quick switch
 *     to WhatsApp mid-estimator never reloads; a tab parked overnight does.
 *
 * Admin pages check on boot only, so an unsaved form there is never thrown away.
 *
 * Builds made before this file existed cannot check themselves; their chunks are
 * replaced with a reload stub instead (`scripts/retire-old-builds.mjs`).
 */

import { readStore, writeStore, STORAGE_KEYS } from './storage';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID;
const HIDDEN_LONG_MS = 10 * 60 * 1000;

async function check(): Promise<void> {
  let live: string | undefined;
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return;
    live = ((await res.json()) as { build?: string }).build;
  } catch {
    return; /* offline, or mid-deploy — try again next time */
  }
  if (!live || live === BUILD_ID) return;

  /* One reload per new build. If the reload still lands on this build, the
     cache won the second time too; stay put rather than loop. */
  if (readStore<string | null>(STORAGE_KEYS.buildReload, null, 'session') === live) return;
  writeStore(STORAGE_KEYS.buildReload, live, 'session');
  window.location.reload();
}

/** Start watching. Returns the cleanup for a `useEffect`. */
export function watchBuildFreshness(): () => void {
  if (process.env.NODE_ENV !== 'production' || !BUILD_ID) return () => {};

  void check();
  if (window.location.pathname.startsWith('/admin')) return () => {};

  let hiddenAt = 0;
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt >= HIDDEN_LONG_MS) {
      void check();
    }
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) void check();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pageshow', onPageShow);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pageshow', onPageShow);
  };
}

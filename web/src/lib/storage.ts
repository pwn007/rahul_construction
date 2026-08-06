/** SSR/private-mode-safe storage helpers. */

type Store = 'local' | 'session';

function backing(kind: Store): Storage | null {
  try {
    const s = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__probe__';
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readStore<T>(key: string, fallback: T, kind: Store = 'local'): T {
  const s = backing(kind);
  if (!s) return fallback;
  try {
    const raw = s.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T, kind: Store = 'local'): void {
  const s = backing(kind);
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function removeStore(key: string, kind: Store = 'local'): void {
  backing(kind)?.removeItem(key);
}

export const STORAGE_KEYS = {
  theme: 'archstone.theme',
  estimator: 'archstone.estimator.draft',
  preloaderSeen: 'archstone.preloader.seen',
  portalUser: 'archstone.portal.user',
  adminUser: 'archstone.admin.user',
  adminOverrides: 'archstone.admin.overrides',
  exitIntent: 'archstone.exitintent.seen',
} as const;

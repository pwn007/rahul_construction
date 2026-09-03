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
  portalUser: 'archstone.portal.user',
  /**
   * The admin's JWT, verbatim.
   *
   * Replaces `admin.unlocked` (a boolean the old passcode gate wrote) and
   * `admin.user` (declared, never used anywhere). The token is the whole
   * session: present → try it against /api/auth/me; absent or rejected → the
   * login gate. Nothing else about the signed-in state is stored client-side.
   */
  adminToken: 'archstone.admin.token',
  adminOverrides: 'archstone.admin.overrides',
  /**
   * Whether this browser has already given us a phone number.
   *
   * The one thing that stops the idle popup — there is no frequency cap to
   * store, because it reopens on every pause by design. Clearing this key is
   * how you get the popup back while testing. See `features/lead/useLeadOffer`.
   */
  leadOffer: 'archstone.leadoffer',
  /**
   * The visitor's first name, for the greeting. Expires after 30 days.
   *
   * Separate from `leadOffer` on purpose — that flag must never expire, or the
   * popup would return to someone who has already given us their number. Same
   * event, two different lifetimes. See `lib/visitor.ts`.
   */
  visitor: 'archstone.visitor',
  /** First-touch campaign attribution, held for the length of the visit. */
  attribution: 'archstone.attribution',
} as const;

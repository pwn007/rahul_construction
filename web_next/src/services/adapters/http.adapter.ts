import type { ApiAdapter } from './types';
import { ApiError } from './types';
import { readStore, STORAGE_KEYS } from '@/lib/storage';

/**
 * HTTP transport — talks to the Laravel API in `../backend`.
 *
 * Enabled with NEXT_PUBLIC_API_MODE=http. The API returns exactly the routes and
 * shapes `mockAdapter` does, so nothing above this layer changes.
 */
export function httpAdapter(baseUrl: string): ApiAdapter {
  /*
   * The API URL may be relative (`/api`), which needs an origin to resolve
   * against. `window.location` is the right one in a browser and does not exist
   * during the static export build, so the configured site URL stands in.
   */
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

  async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`, origin);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }

    /* The admin's JWT rides along on every request when one is stored.
       Attached here, in the transport, rather than in each caller — so the day
       the admin's CRUD flips from mock to http, it is already authenticated.
       For a signed-out visitor the key is empty and the header is simply absent,
       which is exactly the anonymous request public reads expect.

       No `credentials: 'include'`: auth is this header, not a cookie. Keeping
       credentials on would also drag in CORS's allow-credentials rules for the
       dev origins (:3000 → :8000) for nothing. */
    const token = readStore(STORAGE_KEYS.adminToken, '');

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText);
      throw new ApiError(message || res.statusText, res.status, path);
    }

    if (res.status === 204) return undefined as T;

    const json = (await res.json()) as { data?: T } | T;
    return (json as { data?: T }).data ?? (json as T);
  }

  return {
    get: (path, params) => request('GET', path, undefined, params),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
  };
}

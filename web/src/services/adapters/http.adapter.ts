import type { ApiAdapter } from './types';
import { ApiError } from './types';

/**
 * Phase 2 transport. Already written and wired — enabling it is a single env var:
 *
 *   VITE_API_MODE=http
 *   VITE_API_URL=http://localhost:4000/api
 *
 * The Express server in `/server` implements exactly these routes with exactly
 * the shapes the mock adapter returns, so nothing above this layer changes.
 */
export function httpAdapter(baseUrl: string): ApiAdapter {
  async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`, window.location.origin);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        url.searchParams.set(k, String(v));
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
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

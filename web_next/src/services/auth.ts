import { httpAdapter } from './adapters/http.adapter';
import { ApiError } from './adapters/types';
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '@/lib/storage';
import type { User } from '@/types/domain';

/**
 * Admin authentication — the one part of the app that talks to Laravel even
 * while everything else is still on the mock adapter.
 *
 * Deliberately bound to `httpAdapter` directly rather than to the mode-switched
 * `api` from ./client: a mock login would be the old passcode gate wearing a
 * different shirt. Auth is real or it is nothing — while content and leads flip
 * to `http` in a later phase.
 *
 * The token is a JWT from POST /api/auth/login, held in localStorage under
 * STORAGE_KEYS.adminToken. `httpAdapter` reads the same key and attaches it as
 * a Bearer header to every request, so when the admin's CRUD does move to
 * `http` mode, it is already authenticated without another line changing.
 */
const api = httpAdapter(process.env.NEXT_PUBLIC_API_URL ?? '/api');

export function getAdminToken(): string {
  return readStore(STORAGE_KEYS.adminToken, '');
}

export function isSignedIn(): boolean {
  return getAdminToken() !== '';
}

function clearToken(): void {
  removeStore(STORAGE_KEYS.adminToken);
}

/**
 * The API's error body is JSON (`{"message":"Wrong email or password."}`), but
 * `ApiError.message` carries it as raw text. One place unwraps it so every
 * caller gets a sentence, not a JSON string.
 */
function messageOf(err: unknown): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      /* not JSON — fall through */
    }
    if (err.status === 429) return 'Too many attempts. Wait a minute and try again.';
  }
  return 'Could not reach the server. Is the API running?';
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    try {
      const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      writeStore(STORAGE_KEYS.adminToken, token);
      return user;
    } catch (err) {
      throw new Error(messageOf(err));
    }
  },

  /** Who does the stored token belong to? Rejects (and clears) a stale one. */
  async me(): Promise<User> {
    try {
      return await api.get<User>('/auth/me');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) clearToken();
      throw new Error(messageOf(err));
    }
  },

  /**
   * Blacklists the token server-side, then forgets it locally. The local half
   * runs even if the network call fails — a sign-out that leaves you signed in
   * because the wifi dropped is worse than a token that dies at its TTL.
   */
  async signOut(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      /* token may already be expired — local clear is what matters */
    } finally {
      clearToken();
    }
  },
};

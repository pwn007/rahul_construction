import { readStore, STORAGE_KEYS } from '@/lib/storage';
import type { MediaAsset } from '@/types/domain';

/**
 * Photo upload — multipart, so it bypasses `httpAdapter` (which is JSON-only)
 * and talks to the API directly, the same way `services/auth.ts` does. Always
 * the real API, even in mock mode: a file has to land on a disk somewhere, and
 * localStorage is not a disk.
 */
export async function uploadImage(file: File): Promise<MediaAsset> {
  const body = new FormData();
  body.append('file', file);

  const token = readStore(STORAGE_KEYS.adminToken, '');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/media/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const json = (await res.json().catch(() => null)) as { data?: MediaAsset; message?: string } | null;

  if (!res.ok || !json?.data) {
    /* The server's own sentence — a 422 names the actual rule that failed
       ("must not be greater than 8192 kilobytes"), which beats anything
       invented here. */
    throw new Error(json?.message ?? `Upload failed (${res.status}).`);
  }

  return json.data;
}

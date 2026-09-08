/**
 * Indian states + cities for the estimator's lead form.
 *
 * Served from our own origin as static JSON (`public/geo/`), not from a
 * third-party geo API. The lead dialog is the single point where a visitor
 * becomes a lead — the one page that must never depend on someone else's
 * uptime, API key or rate limit. City lists also barely change, so a live
 * API bought nothing the export doesn't.
 *
 * The files are a one-time extract of India from dr5hn's open
 * countries-states-cities-database (ODbL 1.0 — credited in
 * docs/image-credits.md): 36 states/UTs, 4,198 cities. `states.json` is
 * ~1.2KB; each state's city list loads only when that state is chosen.
 *
 * `staleTime: Infinity` — the files change only with a deploy, and a deploy
 * ships new HTML anyway.
 */
import { useQuery } from '@tanstack/react-query';

export interface GeoState {
  code: string;
  name: string;
}

/** Stored on the lead when the visitor's city is missing from the list. */
export const CITY_OTHER = 'Other';

/** The default selection — where most visitors actually are today. */
export const DEFAULT_STATE_CODE = 'RJ';
export const DEFAULT_CITY = 'Jaipur';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useStates() {
  return useQuery({
    queryKey: ['geo', 'states'],
    queryFn: () => fetchJson<GeoState[]>('/geo/states.json'),
    staleTime: Infinity,
  });
}

export function useCities(stateCode: string) {
  return useQuery({
    queryKey: ['geo', 'cities', stateCode],
    queryFn: () => fetchJson<string[]>(`/geo/cities/${stateCode}.json`),
    staleTime: Infinity,
    enabled: /^[A-Z]{2}$/.test(stateCode),
  });
}

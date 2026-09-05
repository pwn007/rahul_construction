'use client';

import { useQuery } from '@tanstack/react-query';
import { projects as baked } from '@/data/projects';
import { projectsService } from '@/services';
import type { Project } from '@/types/domain';

/**
 * The hybrid read that makes projects admin-configurable.
 *
 * `initialData` is the compiled-in seed, so the very first render — including
 * the static-export pass that writes the HTML crawlers and WhatsApp previews
 * see — is exactly what it was before this hook existed. On mount the query
 * refetches from the API unconditionally (`refetchOnMount: 'always'`), so an
 * edit made in /admin is on the public site at the next visit, with no rebuild.
 *
 * One query feeds everything — the listing, the detail page's prev/next, the
 * home page's featured six, related-project strips, both atlases, the ⌘K
 * palette and the admin dashboard's counters — so a page never fires more than
 * one request however many of those it composes, and they can never disagree
 * with each other.
 *
 * In dev (`NEXT_PUBLIC_API_MODE=mock`) the service resolves to the mock
 * adapter and this is a no-op refetch of the same data. In production the
 * Laravel API answers, already filtered to `status = 'published'` — which is
 * what makes the admin's draft→publish workflow real on the way out.
 */
export function useProjectsQuery(options?: { enabled?: boolean }) {
  return useQuery<Project[]>({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: options?.enabled ?? true,
  });
}

/** The list, never undefined — for consumers with no loading state of their own. */
export function useProjects(): Project[] {
  return useProjectsQuery().data ?? baked;
}

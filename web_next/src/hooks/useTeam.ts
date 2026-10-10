'use client';

import { useQuery } from '@tanstack/react-query';
import { team as baked } from '@/data/people';
import { teamService } from '@/services';
import type { TeamMember } from '@/types/domain';

/** Team — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useTeam(): TeamMember[] {
  const { data } = useQuery<TeamMember[]>({
    queryKey: ['team', 'all'],
    queryFn: () => teamService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

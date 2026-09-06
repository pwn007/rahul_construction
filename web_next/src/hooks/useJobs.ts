'use client';

import { useQuery } from '@tanstack/react-query';
import { jobs as baked } from '@/data/content';
import { careersService } from '@/services';
import type { Job } from '@/types/domain';

/** Job openings — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useJobs(): Job[] {
  const { data } = useQuery<Job[]>({
    queryKey: ['careers', 'all'],
    queryFn: () => careersService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

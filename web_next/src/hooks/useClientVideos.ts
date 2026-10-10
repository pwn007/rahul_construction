'use client';

import { useQuery } from '@tanstack/react-query';
import { clientVideos as baked } from '@/data/people';
import { clientVideosService } from '@/services';
import type { ClientVideo } from '@/types/domain';

/** Recorded client testimonials for the home page's `ClientVideos` rail —
    hybrid read; recipe reasoning in features/projects/useProjects.ts. */
export function useClientVideos(): ClientVideo[] {
  const { data } = useQuery<ClientVideo[]>({
    queryKey: ['client-videos', 'all'],
    queryFn: () => clientVideosService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

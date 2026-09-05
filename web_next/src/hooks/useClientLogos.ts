'use client';

import { useQuery } from '@tanstack/react-query';
import { clientLogos as baked } from '@/data/people';
import { clientLogosService } from '@/services';
import type { ClientLogo } from '@/types/domain';

/** Client logos — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useClientLogos(): ClientLogo[] {
  const { data } = useQuery<ClientLogo[]>({
    queryKey: ['client-logos', 'all'],
    queryFn: () => clientLogosService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

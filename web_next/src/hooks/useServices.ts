'use client';

import { useQuery } from '@tanstack/react-query';
import { services as baked } from '@/data/services';
import { servicesService } from '@/services';
import type { Service } from '@/types/domain';

/**
 * Services, the hybrid way — the recipe and its reasoning live in
 * features/projects/useProjects.ts. The one service-specific note: the navbar
 * and footer links do NOT come from here (they are constants), so an edit
 * changes the pages but never the menu labels, and a fifth service will not
 * appear in the menu without a code change. That is a recorded limit, not an
 * oversight — menu wiring is its own round.
 */
export function useServices(): Service[] {
  const { data } = useQuery<Service[]>({
    queryKey: ['services', 'all'],
    queryFn: () => servicesService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

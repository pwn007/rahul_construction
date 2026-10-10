'use client';

import { useQuery } from '@tanstack/react-query';
import { navItems as baked } from '@/data/ops';
import { navbarService } from '@/services';
import type { NavItem } from '@/types/domain';

/** Navbar rows — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors (drafting a row hides it). */
export function useNavItems(): NavItem[] {
  const { data } = useQuery<NavItem[]>({
    queryKey: ['navbar', 'all'],
    queryFn: () => navbarService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

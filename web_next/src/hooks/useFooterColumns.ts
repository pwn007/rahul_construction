'use client';

import { useQuery } from '@tanstack/react-query';
import { footerColumns as baked } from '@/data/ops';
import { footerService } from '@/services';
import type { FooterColumn } from '@/types/domain';

/** Footer link columns — hybrid read; the full recipe and its reasoning live
    in features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useFooterColumns(): FooterColumn[] {
  const { data } = useQuery<FooterColumn[]>({
    queryKey: ['footer', 'all'],
    queryFn: () => footerService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

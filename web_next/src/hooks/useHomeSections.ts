'use client';

import { useQuery } from '@tanstack/react-query';
import { homeSections as baked } from '@/data/ops';
import { homeSectionsService } from '@/services';
import type { HomeSection } from '@/types/domain';

/** Home page section rows — hybrid read; recipe reasoning in
    features/projects/useProjects.ts. One row per band on the home page:
    `enabled` gates the band, heading/subheading flow into the sections built
    on SectionHeader. See the seed block in data/ops.ts for the row-per-band
    map. */
export function useHomeSections(): HomeSection[] {
  const { data } = useQuery<HomeSection[]>({
    queryKey: ['home-sections', 'all'],
    queryFn: () => homeSectionsService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

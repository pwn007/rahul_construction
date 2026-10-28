'use client';

import { useQuery } from '@tanstack/react-query';
import { banners as baked } from '@/data/ops';
import { bannersService } from '@/services';
import type { Banner } from '@/types/domain';

const heroOf = (rows: Banner[]): Banner | undefined =>
  rows
    .filter((b) => b.placement === 'home-hero')
    .sort((a, b) => a.order - b.order)[0];

/** The home hero's copy — the `home-hero` row of the banners resource
    (admin module: Hero & banners), hybrid-read like every other hook here;
    recipe reasoning in features/projects/useProjects.ts. The anonymous API
    already filters drafts, so drafting the row falls back to the baked copy
    rather than blanking the hero. Only title and subtitle render: the hero's
    photographs are its own, and its buttons are fixed in code — Design B's
    "Get free estimate" and the rest, the client's pick (28 Oct 2026; see
    sections/Hero.tsx) — so `ctaLabel`/`ctaHref`/`image` are inert for this
    placement. The baked row's "Start Your Project" must not replace them. */
export function useHeroBanner(): Banner | undefined {
  const { data } = useQuery<Banner[]>({
    queryKey: ['banners', 'all'],
    queryFn: () => bannersService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return heroOf(data ?? baked) ?? heroOf(baked);
}

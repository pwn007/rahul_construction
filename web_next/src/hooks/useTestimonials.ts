'use client';

import { useQuery } from '@tanstack/react-query';
import { testimonials as baked } from '@/data/people';
import { testimonialsService } from '@/services';
import type { Testimonial } from '@/types/domain';

/**
 * Testimonials, the hybrid way — same recipe as features/projects/useProjects,
 * and that file carries the full reasoning. Short version: `initialData` is the
 * compiled-in seed so the first paint (and the exported HTML) is unchanged, the
 * mount-time refetch makes an /admin edit live on the next visit, and the
 * published-only filter on the public API is what turns the panel's
 * draft→publish toggle into a real editorial workflow.
 *
 * Lives in hooks/ rather than a feature folder because its two consumers are
 * different features — the home page's band and the About page.
 */
export function useTestimonials(): Testimonial[] {
  const { data } = useQuery<Testimonial[]>({
    queryKey: ['testimonials', 'all'],
    queryFn: () => testimonialsService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

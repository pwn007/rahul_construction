'use client';

import { useQuery } from '@tanstack/react-query';
import { faqs as baked } from '@/data/content';
import { faqsService } from '@/services';
import type { Faq } from '@/types/domain';

/** FAQs — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useFaqs(): Faq[] {
  const { data } = useQuery<Faq[]>({
    queryKey: ['faqs', 'all'],
    queryFn: () => faqsService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

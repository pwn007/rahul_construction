'use client';

import { useQuery } from '@tanstack/react-query';
import { posts as baked } from '@/data/content';
import { blogsService } from '@/services';
import type { Post } from '@/types/domain';

/** Blog posts — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function usePosts(): Post[] {
  const { data } = useQuery<Post[]>({
    queryKey: ['blogs', 'all'],
    queryFn: () => blogsService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

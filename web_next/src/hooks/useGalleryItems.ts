'use client';

import { useQuery } from '@tanstack/react-query';
import { gallery as baked } from '@/data/content';
import { galleryService } from '@/services';
import type { GalleryItem } from '@/types/domain';

/** Gallery — hybrid read; the full recipe and its reasoning live in
    features/projects/useProjects.ts. Compiled-in first paint, API-fresh on
    mount, published-only for anonymous visitors. */
export function useGalleryItems(): GalleryItem[] {
  const { data } = useQuery<GalleryItem[]>({
    queryKey: ['gallery', 'all'],
    queryFn: () => galleryService.all(),
    initialData: baked,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return data ?? baked;
}

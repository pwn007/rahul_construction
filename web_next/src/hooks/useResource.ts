'use client';

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { ListQuery, Paginated } from '@/types/domain';
import type { ResourceService } from '@/services';

/**
 * TanStack Query bindings over a ResourceService.
 * Server state lives here; UI state never does.
 */

export function useResourceList<T extends { id: string }>(
  service: ResourceService<T>,
  query?: ListQuery,
  options?: Partial<UseQueryOptions<Paginated<T>>>,
) {
  return useQuery<Paginated<T>>({
    queryKey: [service.resource, 'list', query ?? {}],
    queryFn: () => service.list(query),
    staleTime: 60_000,
    ...options,
  });
}

export function useResourceAll<T extends { id: string }>(
  service: ResourceService<T>,
  query?: ListQuery,
  options?: Partial<UseQueryOptions<T[]>>,
) {
  return useQuery<T[]>({
    queryKey: [service.resource, 'all', query ?? {}],
    queryFn: () => service.all(query),
    staleTime: 60_000,
    ...options,
  });
}

export function useResourceItem<T extends { id: string }>(
  service: ResourceService<T>,
  key: string | undefined,
  options?: Partial<UseQueryOptions<T>>,
) {
  return useQuery<T>({
    queryKey: [service.resource, 'item', key],
    queryFn: () => service.byId(key as string),
    enabled: Boolean(key),
    staleTime: 60_000,
    ...options,
  });
}

export function useResourceMutations<T extends { id: string }>(service: ResourceService<T>) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [service.resource] });

  const create = useMutation({
    mutationFn: (dto: Partial<T>) => service.create(dto),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<T> }) => service.update(id, dto),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => service.remove(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, invalidate };
}

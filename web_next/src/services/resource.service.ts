import { api } from './client';
import type { ListQuery, Paginated } from '@/types/domain';

/**
 * A typed CRUD facade over a REST resource.
 *
 * Every resource in the app — public and admin — is exposed through one of these,
 * which is what makes the 28-module admin panel a set of *config objects* rather
 * than 28 hand-written data layers.
 */
export function createResourceService<T extends { id: string }>(resource: string) {
  const path = `/${resource}`;

  return {
    resource,
    list: (query?: ListQuery) => api.get<Paginated<T>>(path, query as Record<string, unknown>),
    all: async (query?: ListQuery) => {
      const res = await api.get<Paginated<T>>(path, { pageSize: 500, ...query } as Record<string, unknown>);
      return res.items;
    },
    byId: (id: string) => api.get<T>(`${path}/${id}`),
    bySlug: (slug: string) => api.get<T>(`${path}/${slug}`),
    create: (dto: Partial<T>) => api.post<T>(path, dto),
    update: (id: string, dto: Partial<T>) => api.put<T>(`${path}/${id}`, dto),
    remove: (id: string) => api.delete<{ id: string; deleted: boolean }>(`${path}/${id}`),
  };
}

export type ResourceService<T extends { id: string }> = ReturnType<typeof createResourceService<T>>;

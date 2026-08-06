/**
 * Server-side mirror of `web/src/types/domain.ts`.
 *
 * Phase 2 extracts this into a shared `packages/types` workspace so the contract
 * has exactly one definition. Kept duplicated in Phase 1 to avoid introducing a
 * monorepo tool before it earns its keep.
 */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export type EntityStatus = 'draft' | 'published' | 'archived';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: EntityStatus;
}

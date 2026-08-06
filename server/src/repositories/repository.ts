import type { ListQuery, Paginated } from '../types/domain.js';

/**
 * The swap point.
 *
 * Services and controllers are written against this interface only, so the ORM is
 * invisible above this line. Phase 1 binds it to JsonRepository; Phase 2 binds it
 * to PrismaRepository and nothing else in the codebase changes.
 */
export interface Repository<T extends { id: string }> {
  findMany(query?: ListQuery): Promise<Paginated<T>>;
  findOne(idOrSlug: string): Promise<T | null>;
  create(dto: Partial<T>): Promise<T>;
  update(id: string, dto: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

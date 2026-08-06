import type { Repository } from './repository.js';
import type { ListQuery, Paginated } from '../types/domain.js';

/**
 * Phase 2 implementation — written now so the migration is a one-line swap in
 * `registry.ts`, not a refactor.
 *
 * Intentionally *not* wired up: `@prisma/client` is not a Phase-1 dependency and
 * there is no database. The shape below matches the Prisma delegate API exactly,
 * so enabling it is:
 *
 *   1. npm i @prisma/client && npx prisma migrate dev
 *   2. import { PrismaClient } from '@prisma/client'
 *   3. registry.ts:  new PrismaRepository(prisma.project)
 */

/** Structural type for a Prisma model delegate — avoids depending on the client package. */
export interface PrismaDelegate<T> {
  findMany(args?: unknown): Promise<T[]>;
  count(args?: unknown): Promise<number>;
  findFirst(args?: unknown): Promise<T | null>;
  create(args: { data: unknown }): Promise<T>;
  update(args: { where: { id: string }; data: unknown }): Promise<T>;
  delete(args: { where: { id: string } }): Promise<T>;
}

export class PrismaRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly delegate: PrismaDelegate<T>,
    /** Fields included in `?search=` matching for this model. */
    private readonly searchFields: string[] = ['title', 'name'],
  ) {}

  private buildWhere(query: ListQuery) {
    const { page: _p, pageSize: _ps, search, sort: _s, order: _o, ...filters } = query;

    const where: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '' || value === 'all') continue;
      where[key] = value;
    }

    if (search) {
      where['OR'] = this.searchFields.map((field) => ({
        [field]: { contains: String(search), mode: 'insensitive' },
      }));
    }

    return where;
  }

  async findMany(query: ListQuery = {}): Promise<Paginated<T>> {
    const { page = 1, pageSize = 24, sort, order = 'asc' } = query;
    const where = this.buildWhere(query);

    const [items, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        ...(sort ? { orderBy: { [sort]: order } } : {}),
      }),
      this.delegate.count({ where }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.max(1, Math.ceil(total / Number(pageSize))),
    };
  }

  async findOne(idOrSlug: string): Promise<T | null> {
    return this.delegate.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  }

  async create(dto: Partial<T>): Promise<T> {
    return this.delegate.create({ data: dto });
  }

  async update(id: string, dto: Partial<T>): Promise<T | null> {
    return this.delegate.update({ where: { id }, data: dto });
  }

  async delete(id: string): Promise<boolean> {
    await this.delegate.delete({ where: { id } });
    return true;
  }
}

import { getRepository } from '../repositories/registry.js';
import { HttpError } from '../middleware/index.js';
import type { ListQuery, Paginated } from '../types/domain.js';

type Row = { id: string };

/**
 * Business logic layer. Knows about resources and rules — never about storage.
 * Swapping JsonRepository for PrismaRepository is invisible from here.
 */
export const resourceService = {
  async list(resource: string, query: ListQuery): Promise<Paginated<Row>> {
    const repo = getRepository(resource);
    if (!repo) throw new HttpError(`Unknown resource: ${resource}`, 404);
    return repo.findMany(query);
  },

  async get(resource: string, idOrSlug: string): Promise<Row> {
    const repo = getRepository(resource);
    if (!repo) throw new HttpError(`Unknown resource: ${resource}`, 404);

    const row = await repo.findOne(idOrSlug);
    if (!row) throw new HttpError(`${resource}/${idOrSlug} not found`, 404);
    return row;
  },

  async create(resource: string, dto: Record<string, unknown>): Promise<Row> {
    const repo = getRepository(resource);
    if (!repo) throw new HttpError(`Unknown resource: ${resource}`, 404);
    return repo.create(dto as Partial<Row>);
  },

  async update(resource: string, id: string, dto: Record<string, unknown>): Promise<Row> {
    const repo = getRepository(resource);
    if (!repo) throw new HttpError(`Unknown resource: ${resource}`, 404);

    const row = await repo.update(id, dto as Partial<Row>);
    if (!row) throw new HttpError(`${resource}/${id} not found`, 404);
    return row;
  },

  async remove(resource: string, id: string): Promise<void> {
    const repo = getRepository(resource);
    if (!repo) throw new HttpError(`Unknown resource: ${resource}`, 404);

    const deleted = await repo.delete(id);
    if (!deleted) throw new HttpError(`${resource}/${id} not found`, 404);
  },
};

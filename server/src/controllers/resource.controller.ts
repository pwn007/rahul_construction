import type { Request, Response } from 'express';
import { resourceService } from '../services/resource.service.js';
import { isResource } from '../repositories/registry.js';
import { HttpError } from '../middleware/index.js';
import type { ListQuery } from '../types/domain.js';

/** Coerces query-string values into the types the repository expects. */
function parseQuery(raw: Request['query']): ListQuery {
  const query: ListQuery = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string') continue;
    if (key === 'page' || key === 'pageSize') {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) query[key] = n;
      continue;
    }
    if (key === 'order') {
      query.order = value === 'desc' ? 'desc' : 'asc';
      continue;
    }
    query[key] = value;
  }

  return query;
}

function assertResource(name: string): string {
  if (!isResource(name)) throw new HttpError(`Unknown resource: ${name}`, 404);
  return name;
}

export const resourceController = {
  async list(req: Request, res: Response) {
    const resource = assertResource(req.params['resource'] as string);
    const result = await resourceService.list(resource, parseQuery(req.query));
    res.json({ data: result });
  },

  async get(req: Request, res: Response) {
    const resource = assertResource(req.params['resource'] as string);
    const row = await resourceService.get(resource, req.params['id'] as string);
    res.json({ data: row });
  },

  async create(req: Request, res: Response) {
    const resource = assertResource(req.params['resource'] as string);
    const row = await resourceService.create(resource, req.body as Record<string, unknown>);
    res.status(201).json({ data: row });
  },

  async update(req: Request, res: Response) {
    const resource = assertResource(req.params['resource'] as string);
    const row = await resourceService.update(resource, req.params['id'] as string, req.body as Record<string, unknown>);
    res.json({ data: row });
  },

  async remove(req: Request, res: Response) {
    const resource = assertResource(req.params['resource'] as string);
    await resourceService.remove(resource, req.params['id'] as string);
    res.status(204).end();
  },
};

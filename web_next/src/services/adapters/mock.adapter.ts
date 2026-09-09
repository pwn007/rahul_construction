import type { ApiAdapter } from './types';
import { ApiError } from './types';
import { createId } from '@/lib/id';
import { readStore, writeStore, STORAGE_KEYS } from '@/lib/storage';

import { projects } from '@/data/projects';
import { services } from '@/data/services';
import { testimonials, team, clientLogos } from '@/data/people';
import { posts, faqs, jobs, gallery, downloads } from '@/data/content';
import {
  applications,
  banners,
  enquiries,
  estimateRequests,
  footerColumns,
  homeSections,
  mediaAssets,
  navItems,
  roles,
  seoMeta,
  settings,
  users,
} from '@/data/ops';
import { portalProjects } from '@/data/portal';
import { BASE_RATES, ESTIMATOR_PRICES, ENHANCEMENT_RECORDS, LOCATION_RECORDS, MATERIAL_RECORDS } from '@/data/estimator-config';
import type { ListQuery, Paginated } from '@/types/domain';

type Row = Record<string, unknown> & { id: string };

/** Seed collections keyed by REST resource name. */
const SEED: Record<string, Row[]> = {
  projects: projects as unknown as Row[],
  services: services as unknown as Row[],
  testimonials: testimonials as unknown as Row[],
  team: team as unknown as Row[],
  'client-logos': clientLogos as unknown as Row[],
  blogs: posts as unknown as Row[],
  faqs: faqs as unknown as Row[],
  careers: jobs as unknown as Row[],
  gallery: gallery as unknown as Row[],
  downloads: downloads as unknown as Row[],
  applications: applications as unknown as Row[],
  enquiries: enquiries as unknown as Row[],
  estimates: estimateRequests as unknown as Row[],
  banners: banners as unknown as Row[],
  'home-sections': homeSections as unknown as Row[],
  navbar: navItems as unknown as Row[],
  footer: footerColumns as unknown as Row[],
  seo: seoMeta as unknown as Row[],
  settings: settings as unknown as Row[],
  users: users as unknown as Row[],
  roles: roles as unknown as Row[],
  media: mediaAssets as unknown as Row[],
  'portal-projects': portalProjects as unknown as Row[],
  'estimator-prices': ESTIMATOR_PRICES as unknown as Row[],
  'estimator-rates': BASE_RATES as unknown as Row[],
  'estimator-materials': MATERIAL_RECORDS as unknown as Row[],
  'estimator-locations': LOCATION_RECORDS as unknown as Row[],
  'estimator-enhancements': ENHANCEMENT_RECORDS as unknown as Row[],
};

/**
 * Admin mutations are persisted to localStorage as an overlay on the seed data,
 * so edits survive a refresh and the public site reflects them immediately —
 * which is how we prove the admin↔site contract without a database.
 */
type Overlay = Record<string, { upserts: Row[]; deletes: string[] }>;

function readOverlay(): Overlay {
  return readStore<Overlay>(STORAGE_KEYS.adminOverrides, {});
}

function writeOverlay(overlay: Overlay) {
  writeStore(STORAGE_KEYS.adminOverrides, overlay);
}

export function resetOverlay() {
  writeOverlay({});
}

function collection(resource: string): Row[] {
  const seed = SEED[resource];
  if (!seed) throw new ApiError(`Unknown resource "${resource}"`, 404, resource);

  const overlay = readOverlay()[resource];
  if (!overlay) return seed;

  const byId = new Map(seed.map((r) => [r.id, r]));
  for (const row of overlay.upserts) byId.set(row.id, row);
  for (const id of overlay.deletes) byId.delete(id);
  return [...byId.values()];
}

function mutate(resource: string, fn: (o: { upserts: Row[]; deletes: string[] }) => void) {
  const overlay = readOverlay();
  const current = overlay[resource] ?? { upserts: [], deletes: [] };
  fn(current);
  overlay[resource] = current;
  writeOverlay(overlay);
}

/* ------------------------------------------------------------------ */
/* Query engine — mirrors what the Laravel API does                     */
/* ------------------------------------------------------------------ */

const SEARCHABLE = ['title', 'name', 'question', 'label', 'heading', 'filename', 'email', 'key', 'excerpt', 'summary'];

function applyQuery(rows: Row[], query: ListQuery): Paginated<Row> {
  let out = [...rows];

  const { page = 1, pageSize = 24, search, sort, order = 'asc', ...filters } = query;

  if (search) {
    const q = String(search).toLowerCase();
    out = out.filter((row) =>
      SEARCHABLE.some((field) => {
        const v = row[field];
        return typeof v === 'string' && v.toLowerCase().includes(q);
      }),
    );
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    out = out.filter((row) => {
      const rowValue = row[key];
      if (Array.isArray(rowValue)) return rowValue.includes(value as never);
      if (typeof value === 'boolean') return rowValue === value;
      return String(rowValue) === String(value);
    });
  }

  if (sort) {
    out.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === 'number' && typeof bv === 'number') return order === 'asc' ? av - bv : bv - av;
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return order === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }

  const total = out.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return { items: out.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

/** Simulated latency so loading states are real during development. */
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

/** `/projects/:idOrSlug` → ['projects', 'idOrSlug'] */
function parse(path: string): { resource: string; key?: string } {
  const [resource, key] = path.replace(/^\/+/, '').split('/');
  return { resource: resource ?? '', key };
}

export function mockAdapter(): ApiAdapter {
  return {
    async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
      await delay();
      const { resource, key } = parse(path);
      const rows = collection(resource);

      if (key) {
        const found = rows.find((r) => r.id === key || r['slug'] === key || r['key'] === key || r['route'] === key);
        if (!found) throw new ApiError(`Not found: ${path}`, 404, path);
        return found as T;
      }

      return applyQuery(rows, (params ?? {}) as ListQuery) as T;
    },

    async post<T>(path: string, body?: unknown): Promise<T> {
      await delay(200);
      const { resource } = parse(path);
      collection(resource); // validates the resource exists
      const now = new Date().toISOString();
      const row: Row = {
        id: createId(),
        createdAt: now,
        updatedAt: now,
        status: 'published',
        ...(body as Record<string, unknown>),
      };
      mutate(resource, (o) => o.upserts.push(row));
      return row as T;
    },

    async put<T>(path: string, body?: unknown): Promise<T> {
      await delay(200);
      const { resource, key } = parse(path);
      const existing = collection(resource).find((r) => r.id === key);
      if (!existing) throw new ApiError(`Not found: ${path}`, 404, path);
      const row: Row = { ...existing, ...(body as Record<string, unknown>), id: existing.id, updatedAt: new Date().toISOString() };
      mutate(resource, (o) => {
        o.upserts = o.upserts.filter((r) => r.id !== row.id);
        o.upserts.push(row);
        o.deletes = o.deletes.filter((d) => d !== row.id);
      });
      return row as T;
    },

    async patch<T>(path: string, body?: unknown): Promise<T> {
      return this.put<T>(path, body);
    },

    async delete<T>(path: string): Promise<T> {
      await delay(180);
      const { resource, key } = parse(path);
      if (!key) throw new ApiError('Delete requires an id', 400, path);
      mutate(resource, (o) => {
        o.upserts = o.upserts.filter((r) => r.id !== key);
        if (!o.deletes.includes(key)) o.deletes.push(key);
      });
      return { id: key, deleted: true } as T;
    },
  };
}

import { JsonRepository } from './json.repository.js';
import type { Repository } from './repository.js';

/**
 * Resource → repository binding.
 *
 * Resource names match the frontend's `RESOURCES` registry exactly, so
 * `GET /api/projects` returns the same shape the mock adapter produces.
 *
 * ── Phase 2 migration ──────────────────────────────────────────────────
 * Replace the JsonRepository construction with:
 *
 *   import { PrismaClient } from '@prisma/client';
 *   import { PrismaRepository } from './prisma.repository.js';
 *   const prisma = new PrismaClient();
 *   projects: new PrismaRepository(prisma.project, ['title', 'locality', 'excerpt']),
 *
 * Nothing above this file changes.
 * ───────────────────────────────────────────────────────────────────────
 */

type AnyRow = { id: string };

export const RESOURCES = [
  'projects',
  'services',
  'testimonials',
  'team',
  'client-logos',
  'blogs',
  'faqs',
  'careers',
  'gallery',
  'downloads',
  'applications',
  'enquiries',
  'estimates',
  'banners',
  'home-sections',
  'navbar',
  'footer',
  'seo',
  'settings',
  'users',
  'roles',
  'media',
  'portal-projects',
  'estimator-rates',
  'estimator-quality',
  'estimator-locations',
  'estimator-enhancements',
] as const;

export type ResourceName = (typeof RESOURCES)[number];

const repositories = new Map<string, Repository<AnyRow>>(
  RESOURCES.map((name) => [name, new JsonRepository<AnyRow>(`${name}.json`)]),
);

export function getRepository(name: string): Repository<AnyRow> | undefined {
  return repositories.get(name);
}

export function isResource(name: string): name is ResourceName {
  return repositories.has(name);
}

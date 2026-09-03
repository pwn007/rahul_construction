/**
 * Dump the frontend's typed seed data as JSON for the Laravel seeder.
 *
 * `src/data/*.ts` is the authority for content in this project — 46 files import
 * it directly, and it is what `mockAdapter` has been serving all along. Rather
 * than retype ~180 records into PHP and let the two drift, the seeder reads what
 * this writes.
 *
 * This replaces `server/scripts/seed.ts`, which had rotted twice over: it
 * imported from `web/src/data/*` — a directory deleted in commit f0f4231 — and
 * pulled `QUALITY_RECORDS`, an export that no longer exists.
 *
 * Not part of `npm run build`. Run it when the seed data changes:
 *   npx tsx scripts/export-seed.mts
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { projects } from '../src/data/projects';
import { services } from '../src/data/services';
import { testimonials, team, clientLogos } from '../src/data/people';
import { posts, faqs, jobs, gallery, downloads } from '../src/data/content';
import {
  applications, banners, enquiries, estimateRequests, footerColumns,
  homeSections, mediaAssets, navItems, roles, seoMeta, settings, users,
} from '../src/data/ops';
import {
  BASE_RATES, ENHANCEMENT_RECORDS, LOCATION_RECORDS, MATERIAL_RECORDS,
} from '../src/data/estimator-config';

/**
 * Keyed by REST resource name, not by variable name.
 *
 * The two differ more often than not — `careers` is `jobs`, `blogs` is `posts`,
 * `estimates` is `estimateRequests` — and the resource name is what
 * `web_next/src/services/index.ts` publishes and what the API URLs say.
 *
 * `portal-projects` is deliberately absent: the portal feature has no route
 * (`src/app/portal/` does not exist) and is slated for deletion, so there is no
 * table behind it.
 */
const COLLECTIONS: Record<string, readonly unknown[]> = {
  projects,
  services,
  testimonials,
  team,
  'client-logos': clientLogos,
  blogs: posts,
  faqs,
  careers: jobs,
  gallery,
  downloads,
  applications,
  enquiries,
  estimates: estimateRequests,
  banners,
  'home-sections': homeSections,
  navbar: navItems,
  footer: footerColumns,
  seo: seoMeta,
  settings,
  users,
  roles,
  media: mediaAssets,
  'estimator-rates': BASE_RATES,
  'estimator-materials': MATERIAL_RECORDS,
  'estimator-locations': LOCATION_RECORDS,
  'estimator-enhancements': ENHANCEMENT_RECORDS,
};

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'backend', 'database', 'seeders', 'data');

await mkdir(OUT, { recursive: true });

let total = 0;

for (const [resource, rows] of Object.entries(COLLECTIONS)) {
  await writeFile(join(OUT, `${resource}.json`), `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  total += rows.length;
  console.log(`  ${resource.padEnd(24)} ${String(rows.length).padStart(3)}`);
}

console.log(`\n  ${Object.keys(COLLECTIONS).length} collections · ${total} records → backend/database/seeders/data/`);

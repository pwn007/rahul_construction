/**
 * Generates `server/src/data/*.json` from the *same typed modules* the frontend uses.
 *
 * This is deliberate: one authored source of seed data, two consumers. It guarantees
 * that `GET /api/projects` and the frontend mock adapter return identical records, so
 * flipping VITE_API_MODE=http cannot cause a shape mismatch.
 *
 * Run:  npm run seed
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { projects } from '../../web/src/data/projects.js';
import { services } from '../../web/src/data/services.js';
import { testimonials, team, clientLogos } from '../../web/src/data/people.js';
import { posts, faqs, jobs, gallery, downloads } from '../../web/src/data/content.js';
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
} from '../../web/src/data/ops.js';
import { portalProjects } from '../../web/src/data/portal.js';
import {
  BASE_RATES,
  ENHANCEMENT_RECORDS,
  LOCATION_RECORDS,
  QUALITY_RECORDS,
} from '../../web/src/data/estimator-config.js';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

const COLLECTIONS: Record<string, unknown[]> = {
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
  'portal-projects': portalProjects,
  'estimator-rates': BASE_RATES,
  'estimator-quality': QUALITY_RECORDS,
  'estimator-locations': LOCATION_RECORDS,
  'estimator-enhancements': ENHANCEMENT_RECORDS,
};

async function seed() {
  await mkdir(OUT_DIR, { recursive: true });

  let total = 0;
  for (const [name, rows] of Object.entries(COLLECTIONS)) {
    await writeFile(path.join(OUT_DIR, `${name}.json`), JSON.stringify(rows, null, 2), 'utf8');
    total += rows.length;
    console.log(`  ✓ ${name}.json`.padEnd(38) + `${rows.length} records`);
  }

  console.log(`\n  ${Object.keys(COLLECTIONS).length} collections · ${total} records written to src/data\n`);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

import type { MetadataRoute } from 'next';
import { SITE } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { services } from '@/data/services';
import { projects } from '@/data/projects';
import { posts, jobs } from '@/data/content';

/* The static export requires metadata routes to declare themselves static —
   they are (both are pure functions over compiled-in data), but under
   `output: 'export'` Next refuses to assume it. */
export const dynamic = 'force-static';

/**
 * The site's first sitemap — the Vite build shipped none.
 *
 * Built from the same data modules the pages render from, so a new service,
 * project, post or job appears here the moment it is added. `/privacy`,
 * `/terms`, `/admin` and `/portal` are left out: they are noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${SITE.url}${path}`;

  const landing: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    [ROUTES.home, 1.0, 'weekly'],
    [ROUTES.services, 0.9, 'monthly'],
    [ROUTES.projects, 0.9, 'weekly'],
    [ROUTES.estimator, 0.9, 'monthly'],
    [ROUTES.about, 0.7, 'yearly'],
    [ROUTES.realEstate, 0.7, 'monthly'],
    [ROUTES.vastu, 0.7, 'yearly'],
    [ROUTES.gallery, 0.7, 'weekly'],
    [ROUTES.blog, 0.7, 'weekly'],
    [ROUTES.careers, 0.6, 'weekly'],
    [ROUTES.downloads, 0.6, 'monthly'],
    [ROUTES.contact, 0.8, 'yearly'],
    [ROUTES.pricing, 0.5, 'monthly'],
  ];

  return [
    ...landing.map(([path, priority, changeFrequency]) => ({
      url: url(path),
      priority,
      changeFrequency,
    })),
    ...services.map((s) => ({ url: url(ROUTES.service(s.slug)), priority: 0.8, changeFrequency: 'monthly' as const })),
    ...projects.map((p) => ({ url: url(ROUTES.project(p.slug)), priority: 0.7, changeFrequency: 'monthly' as const })),
    ...posts.map((p) => ({
      url: url(ROUTES.post(p.slug)),
      lastModified: new Date(p.publishedAt),
      priority: 0.6,
      changeFrequency: 'yearly' as const,
    })),
    ...jobs.map((j) => ({
      url: url(ROUTES.career(j.slug)),
      lastModified: new Date(j.postedAt),
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    })),
  ];
}

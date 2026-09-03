import type { MetadataRoute } from 'next';
import { SITE } from '@/constants/site';

/* The static export requires metadata routes to declare themselves static —
   they are (both are pure functions over compiled-in data), but under
   `output: 'export'` Next refuses to assume it. */
export const dynamic = 'force-static';

/*
 * Replaces public/robots.txt, which read `Disallow: /` because the Vite build
 * was a staging deployment whose canonicals already pointed here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/portal'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

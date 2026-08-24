import type { MetadataRoute } from 'next';
import { SITE } from '@/constants/site';

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

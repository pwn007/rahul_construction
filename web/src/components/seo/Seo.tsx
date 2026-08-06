import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE } from '@/constants/site';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Lightweight head manager. Deliberately dependency-free — react-helmet is a
 * 12 KB dependency for what is 40 lines of DOM writes, and Phase 2 will move
 * this to SSR metadata anyway.
 */
export function Seo({ title, description, image, noIndex, type = 'website', jsonLd }: SeoProps) {
  const { pathname } = useLocation();

  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const desc = description ?? SITE.description;
  const url = `${SITE.url}${pathname}`;

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', 'name', 'description', desc);
    upsertMeta('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url);
    if (image) upsertMeta('meta[property="og:image"]', 'property', 'og:image', image);

    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [fullTitle, desc, image, noIndex, type, url]);

  useEffect(() => {
    const id = 'route-jsonld';
    document.getElementById(id)?.remove();
    if (!jsonLd) return;

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => document.getElementById(id)?.remove();
  }, [jsonLd]);

  return null;
}

/** Organization + LocalBusiness graph, injected once at app boot. */
export function OrganizationJsonLd() {
  useEffect(() => {
    const id = 'org-jsonld';
    if (document.getElementById(id)) return;

    const data = {
      '@context': 'https://schema.org',
      '@type': ['GeneralContractor', 'LocalBusiness'],
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      telephone: SITE.phoneRaw,
      email: SITE.email,
      slogan: SITE.tagline,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE.address.line1,
        addressLocality: SITE.address.city,
        addressRegion: SITE.address.state,
        addressCountry: 'IN',
      },
      geo: { '@type': 'GeoCoordinates', latitude: SITE.coordinates.lat, longitude: SITE.coordinates.lng },
      openingHours: 'Mo-Sa 10:00-19:00',
      areaServed: { '@type': 'City', name: 'Jaipur' },
      sameAs: Object.values(SITE.socials),
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '4', bestRating: '5' },
    };

    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }, []);

  return null;
}

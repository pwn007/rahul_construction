import type { Metadata } from 'next';
import { SITE } from '@/constants/site';

/**
 * The replacement for the old `<Seo>` component.
 *
 * `components/seo/Seo.tsx` wrote the whole head imperatively from a `useEffect`,
 * which meant a crawler fetching the page received `index.html`'s generic title
 * and nothing else — the reason for this migration. Metadata now leaves the
 * server already in the HTML.
 *
 * The prop shape is kept identical to the old component so every call site was a
 * mechanical move rather than a rewrite, and so the output cannot silently drift
 * from what the site published before.
 */
export interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article';
}

/**
 * @param path Route path, leading slash, no origin — e.g. `/services/interior-design`.
 *             Becomes the canonical, resolved against `metadataBase` in app/layout.tsx.
 */
export function buildMetadata({ title, description, image, noIndex, type = 'website' }: SeoProps, path: string): Metadata {
  /*
   * `title` is handed over bare so the template in the root layout can apply
   * "| Neetu Archstone" — but OG and Twitter take no template, so they need the
   * composed string. Same two forms the old component produced.
   */
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const desc = description ?? SITE.description;
  const url = `${SITE.url}${path}`;

  return {
    ...(title ? { title } : {}),
    description: desc,
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description: desc,
      type,
      url,
      siteName: SITE.name,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * JSON-LD as a real server-rendered <script>.
 *
 * The old component appended this to `document.head` after hydration; a crawler
 * that does not execute JavaScript never saw any of the seven page schemas.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

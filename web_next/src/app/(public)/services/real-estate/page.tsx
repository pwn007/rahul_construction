import type { Metadata } from 'next';
import { RealEstateView } from '@/features/realestate/RealEstateView';
import { REAL_ESTATE_COPY } from '@/features/realestate/copy';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { IMG } from '@/lib/media';

/*
 * A static segment, so the App Router ranks it above services/[slug] without
 * anything else being said. Real Estate is not a `services` data entry — the
 * shared detail page would find no matching slug for it.
 */
export const metadata: Metadata = buildMetadata(
  {
    title: REAL_ESTATE_COPY.title,
    description: REAL_ESTATE_COPY.summary,
    image: IMG.hero('service-real-estate'),
  },
  '/services/real-estate',
);

const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: REAL_ESTATE_COPY.title,
  description: REAL_ESTATE_COPY.summary,
  provider: { '@type': 'Organization', name: 'Neetu Archstone' },
  areaServed: { '@type': 'City', name: 'Jaipur' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={JSONLD} />
      <RealEstateView />
    </>
  );
}

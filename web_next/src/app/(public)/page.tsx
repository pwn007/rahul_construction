import type { Metadata } from 'next';
import { HomeView } from '@/features/home/HomeView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { SITE } from '@/constants/site';
import { IMG } from '@/lib/media';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Design & Construction Company',
    description: SITE.description,
    image: IMG.wide('og-home'),
  },
  '/',
);

const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE.url}/projects?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function Page() {
  return (
    <>
      <JsonLd data={JSONLD} />
      <HomeView />
    </>
  );
}

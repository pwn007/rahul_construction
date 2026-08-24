import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EstimatorView } from '@/features/estimator/EstimatorView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { IMG } from '@/lib/media';
import { Spinner } from '@/components/ui';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Construction Cost Estimator — Jaipur 2026',
    description:
      'Get an instant, itemised construction cost estimate for your plot in Jaipur. Head-wise breakdown, milestone payment schedule, estimated timeline and a downloadable PDF in under two minutes.',
    image: IMG.wide('og-estimator'),
  },
  '/estimator',
);

const JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Neetu Archstone Construction Cost Estimator',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={JSONLD} />
      {/*
       * The estimator reads its state out of the query string and a sessionStorage
       * draft, so it renders on the client — this boundary is what lets the rest of
       * the page stay statically prerendered, metadata and JSON-LD included.
       *
       * The spinner is the same fallback the Vite build showed while the estimator's
       * lazy chunk loaded, so first paint is unchanged.
       */}
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner className="h-7 w-7" />
          </div>
        }
      >
        <EstimatorView />
      </Suspense>
    </>
  );
}

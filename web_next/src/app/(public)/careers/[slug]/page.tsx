import type { Metadata } from 'next';
import { CareerDetailView } from '@/features/careers/CareerDetailView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { jobs } from '@/data/content';
import { ROUTES } from '@/constants/routes';

export function generateStaticParams() {
  return jobs.map((j) => ({ slug: j.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug);
  if (!job) return {};
  return buildMetadata({ title: `${job.title} — Careers`, description: job.summary }, ROUTES.career(slug));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = jobs.find((j) => j.slug === slug);

  return (
    <>
      {job && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'JobPosting',
            title: job.title,
            description: job.summary,
            datePosted: job.postedAt,
            employmentType: job.type.toUpperCase().replace('-', '_'),
            hiringOrganization: { '@type': 'Organization', name: 'Neetu Archstone' },
            jobLocation: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Jaipur',
                addressRegion: 'Rajasthan',
                addressCountry: 'IN',
              },
            },
          }}
        />
      )}
      <CareerDetailView slug={slug} />
    </>
  );
}

import type { Metadata } from 'next';
import { ServiceDetailView } from '@/features/services/ServiceDetailView';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { services } from '@/data/services';
import { ROUTES } from '@/constants/routes';

/* Every service is known at build time, so all of them are prerendered. */
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

/* Anything not in the list above is a real 404, not a redirect to /services. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return buildMetadata(
    { title: service.title, description: service.summary, image: service.heroImage },
    ROUTES.service(slug),
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  return (
    <>
      {service && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.title,
            description: service.summary,
            provider: { '@type': 'Organization', name: 'Neetu Archstone' },
            areaServed: { '@type': 'City', name: 'Jaipur' },
          }}
        />
      )}
      <ServiceDetailView slug={slug} />
    </>
  );
}

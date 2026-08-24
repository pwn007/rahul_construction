import type { Metadata } from 'next';
import { ServicesView } from '@/features/services/ServicesView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Services — Architecture, MEPF, Turnkey Construction & Interiors',
    description:
      'Four capabilities delivered as one accountable system: architectural design, MEPF consultancy, interior design and project management.',
  },
  '/services',
);

export default function Page() {
  return <ServicesView />;
}

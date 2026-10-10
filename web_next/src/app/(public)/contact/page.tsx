import type { Metadata } from 'next';
import { ContactView } from '@/features/contact/ContactView';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/constants/site';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Contact — Book a Free Consultation',
    description: `Talk to Neetu Archstone about your project. ${SITE.phone} · ${SITE.email} · ${SITE.address.full}. ${SITE.hours}.`,
  },
  '/contact',
);

export default function Page() {
  return <ContactView />;
}

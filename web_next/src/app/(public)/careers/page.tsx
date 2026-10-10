import type { Metadata } from 'next';
import { CareersView } from '@/features/careers/CareersView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Careers — Build With Us',
    description:
      'Join a small team where architects, engineers and site staff work together. Open roles in design, engineering and site execution in Jaipur.',
  },
  '/careers',
);

export default function Page() {
  return <CareersView />;
}

import type { Metadata } from 'next';
import { DownloadsView } from '@/features/downloads/DownloadsView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Downloads — Company Profile, Brochures & Rate Card',
    description:
      'Download the Neetu Archstone company profile, turnkey brochure, 2026 rate card, MEPF capability statement, pre-construction checklist and Vastu guide.',
  },
  '/downloads',
);

export default function Page() {
  return <DownloadsView />;
}

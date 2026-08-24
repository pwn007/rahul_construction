import type { Metadata } from 'next';
import { LegalView } from '@/features/legal/LegalView';
import { LEGAL_CONTENT } from '@/features/legal/content';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  { title: LEGAL_CONTENT.privacy.title, description: LEGAL_CONTENT.privacy.lead, noIndex: true },
  '/privacy',
);

export default function Page() {
  return <LegalView kind="privacy" />;
}

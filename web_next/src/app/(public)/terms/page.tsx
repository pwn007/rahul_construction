import type { Metadata } from 'next';
import { LegalView } from '@/features/legal/LegalView';
import { LEGAL_CONTENT } from '@/features/legal/content';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  { title: LEGAL_CONTENT.terms.title, description: LEGAL_CONTENT.terms.lead, noIndex: true },
  '/terms',
);

export default function Page() {
  return <LegalView kind="terms" />;
}

import type { Metadata } from 'next';
import { VastuView } from '@/features/vastu/VastuView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Vastu-Aligned Planning — Right Direction, Happy Living',
    description:
      'Vastu resolved at concept stage, not patched afterwards. Direction-wise placement of entrance, kitchen, master bedroom and services designed into the plan itself.',
  },
  '/vastu',
);

export default function Page() {
  return <VastuView />;
}

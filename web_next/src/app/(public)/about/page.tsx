import type { Metadata } from 'next';
import { AboutView } from '@/features/about/AboutView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'About Us — Our Story, Values & Team',
    description:
      'Neetu Archstone combines architecture, engineering and execution into one accountable system. Meet the team behind 80+ delivered projects in Jaipur.',
  },
  '/about',
);

export default function Page() {
  return <AboutView />;
}

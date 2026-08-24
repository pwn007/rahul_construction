import type { Metadata } from 'next';
import { BlogView } from '@/features/blog/BlogView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Insights — Guides on Building in Jaipur',
    description:
      'Practical writing on construction costs, timelines, Vastu, MEPF and the decisions that actually change the outcome of your build.',
  },
  '/blog',
);

export default function Page() {
  return <BlogView />;
}

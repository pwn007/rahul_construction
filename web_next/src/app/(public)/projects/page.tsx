import type { Metadata } from 'next';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { buildMetadata } from '@/lib/seo';
import { IMG } from '@/lib/media';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Projects — Residential, Commercial & Interiors',
    description:
      'Completed and ongoing projects across Jaipur — Mansarovar, Jagatpura, Pratap Nagar, Sanganer, Malviya Nagar and Vaishali Nagar.',
    image: IMG.wide('og-projects'),
  },
  '/projects',
);

/*
 * Rendered per request rather than prerendered, because the filters live in the
 * query string and this is a page whose content must reach a crawler.
 *
 * The alternative — prerender plus a Suspense boundary — would have put a
 * loading fallback in the static HTML and rendered the grid entirely on the
 * client, which is the SPA behaviour this migration exists to remove. Rendering
 * on request means the server emits the real, correctly-filtered list for any
 * URL, including a shared deep link.
 */
export const dynamic = 'force-dynamic';

export default function Page() {
  return <ProjectsView />;
}

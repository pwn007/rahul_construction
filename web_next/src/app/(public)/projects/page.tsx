import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectsView } from '@/features/projects/ProjectsView';
import { Spinner } from '@/components/ui';
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

export default function Page() {
  return (
    /*
     * Prerendered behind a Suspense boundary — the same pattern as /estimator.
     *
     * This used to be `force-dynamic`, per-request SSR so crawlers received the
     * query-string-filtered list. The site now ships as a static export to PHP
     * shared hosting, where there is no server to render per request, and
     * `useSearchParams()` inside ProjectsView fails the export build without a
     * boundary above it. The trade: /projects?category=… renders its grid on
     * the client. The ten project detail pages — the URLs that actually rank
     * and get shared — remain fully prerendered, and this page's metadata
     * stays in its static HTML.
     */
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-7 w-7" />
        </div>
      }
    >
      <ProjectsView />
    </Suspense>
  );
}

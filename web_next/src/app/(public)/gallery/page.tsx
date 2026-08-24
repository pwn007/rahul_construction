import type { Metadata } from 'next';
import { GalleryView } from '@/features/gallery/GalleryView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Gallery — Photos, Video, Drone & 360° Walkthroughs',
    description:
      'Photography, video walkthroughs, drone footage and 360° views from completed and ongoing Neetu Archstone projects across Jaipur.',
  },
  '/gallery',
);

export default function Page() {
  return <GalleryView />;
}

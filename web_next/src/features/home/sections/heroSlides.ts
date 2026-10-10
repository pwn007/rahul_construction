/**
 * The homepage hero's photographs, in the order the arrows step through them.
 *
 * Each slide ships as two crops: `desktop` (landscape) and `mobile` (portrait,
 * used on portrait screens below `lg`). The hero shows its prev/next arrows and
 * the slide counter only once this list holds two or more entries — adding the
 * client's next project photo here is the whole change.
 */
export interface HeroSlide {
  desktop: string;
  mobile: string;
  /** Read out in place of the photo. */
  alt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    desktop: '/images/hero/villa-dusk-desktop.webp',
    mobile: '/images/hero/villa-dusk-mobile.webp',
    alt: 'A modern G+2 villa at dusk, its glazing lit from inside',
  },
];

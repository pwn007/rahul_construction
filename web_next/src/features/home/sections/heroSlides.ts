/**
 * The homepage hero's photographs, in the order the arrows step through them.
 * The carousel advances every five seconds (`AUTOPLAY_MS` in Hero.tsx) and can
 * be stepped by hand: arrows on desktop, a swipe or the dashes on phones.
 *
 * Each slide ships as two crops: `desktop` (landscape) and `mobile` (portrait,
 * used on portrait screens below `lg`). When `npm run images:variants` has made
 * sizes for `desktop` (scripts/image-variants.config.mjs), the hero serves those
 * instead — AVIF and WebP at every width, and the config's portrait crop on
 * phones — and `mobile` is only the fallback. The hero shows its prev/next
 * arrows and the slide counter only once this list holds two or more entries.
 */
export interface HeroSlide {
  desktop: string;
  mobile: string;
  /** Read out in place of the photo. */
  alt: string;
  /** `object-position` of the landscape frame. */
  position?: string;
  /**
   * How much help the copy needs from the photograph:
   * - `deep` grades a bright photograph into the navy and darkens the side the
   *   headline sits on, as `tone="deep"` does for chapters — for a light frame
   *   behind the headline;
   * - `shaded` darkens the same areas without grading, for a photograph whose
   *   colour is right but whose middle is too bright for the lede and pills.
   * Left out, the plain hero scrim. Choose by measuring (svc/contrast.py).
   */
  tone?: 'deep' | 'shaded';
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    /* The client's own design (10 Oct 2026), and the only photograph in their
       folder that arrived at 4K — sharp on a Retina laptop and a 3× phone. The
       white facade sits right behind the headline, so the slide is graded deep:
       measured, the headline goes from 1.1:1 to 6.5:1 against it. */
    desktop: '/images/v/elevation-g2-white-4k-1920.webp',
    mobile: '/images/v/elevation-g2-white-4k-portrait-1215.webp',
    alt: 'Design render of a modern three-storey house: a white frame, timber soffits and palms along the street',
    position: '50% 60%',
    tone: 'deep',
  },
  {
    /* The hero's photograph before the client's renders arrived (stock, 1800 px
       landscape and a 1000 px portrait crop), kept as the second slide at the
       client's request. */
    desktop: '/images/hero/villa-dusk-desktop.webp',
    mobile: '/images/hero/villa-dusk-mobile.webp',
    alt: 'A modern G+2 villa at dusk, its glazing lit from inside',
    position: '50% 40%',
    /* Its lit glazing sits behind the lede on phones: with the plain scrim the
       lede measured 3.75:1, shaded it is 5.7:1, and the dusk colour stays. */
    tone: 'shaded',
  },
];

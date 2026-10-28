/**
 * Which photographs get responsive variants, and how they are cropped.
 *
 * Read by scripts/build-image-variants.mjs (`npm run images:variants`).
 *
 *  · `source`   — the original in `sourceDir`, ideally 2400 px or more on the long
 *                 edge. Originals are not committed (see .gitignore).
 *  · `key`      — the path components already use for this photo (the `src` a
 *                 `ResponsiveImage` is given). The manifest is keyed by it, so
 *                 swapping in a better original needs no component change.
 *  · `portrait` — optional: a crop for phones and portrait tablets. `focus` is the
 *                 point to keep in frame, as fractions of width and height.
 *
 * The list starts empty. Add a line per photograph as the client's own
 * photography arrives, for example:
 *
 *   { source: 'villa-dusk.jpg', key: '/images/hero/villa-dusk-desktop.webp',
 *     portrait: { focus: [0.58, 0.5] } },
 */
export default {
  sourceDir: 'assets/photos',
  outDir: 'public/images/v',
  manifest: 'src/data/image-variants.json',
  /* Widths the browser chooses between. Nothing is ever enlarged: widths above
     the original's are skipped, and the original's own width is added instead. */
  widths: [640, 960, 1280, 1920, 2560],
  portraitWidths: [640, 960, 1280],
  /* Portrait crops are 9:16, the shape of a phone held upright. */
  portraitAspect: 9 / 16,
  quality: { avif: 52, webp: 74 },
  photos: [
    /* The client's own design renders (10 Oct 2026), from the "Interior and
       Elevations" folder they shared. Only the hero's arrived at 4K; the other
       two are WhatsApp copies (1536 and 1280 px), so their largest variant is
       their own width. Replace the source with the original export when it
       arrives and re-run — the keys, and so the components, stay the same.
       Those two take a 3:4 portrait crop rather than 9:16: from a 1024 px tall
       original a 9:16 crop is only 576 px wide, which a portrait tablet would
       have to stretch, while a phone is limited by the height either way. */
    { source: 'elevation-g2-white-4k.jpg', key: '/images/v/elevation-g2-white-4k-1920.webp', portrait: { focus: [0.47, 0.5] } },
    { source: 'elevation-villa-timber.jpg', key: '/images/v/elevation-villa-timber-1536.webp', portrait: { focus: [0.555, 0.5], aspect: 3 / 4 } },
    { source: 'interior-living-lounge.jpg', key: '/images/v/interior-living-lounge-1280.webp', portrait: { focus: [0.466, 0.5], aspect: 3 / 4 } },
    /* The Services intro (11 Oct 2026). Stock, not the client's: a drawing
       compass on a navy blueprint, from Pexels (licence and author in
       public/images/ATTRIBUTION.md). The source here is the 4609 px original
       brought down to 3840, so its largest variant matches the hero's. The
       portrait crop sits left of centre: a phone shows only the middle of it,
       and there the compass's near leg is whole, with the far one coming in
       at the top — two legs read as a compass, one as a black bar. */
    { source: 'services-blueprint-compass.jpg', key: '/images/v/services-blueprint-compass-1920.webp', portrait: { focus: [0.37, 0.5] } },
    /* Project Management's photograph (28 Oct 2026): the same Pexels frame as
       service-pm-01 (licence in ATTRIBUTION.md), from its 6000 px original
       brought down to 3840, now that the home page sets it behind the words
       across a whole card. The portrait crop keeps the site supervisor and her
       tablet; the plain wall to her right is where a card's words sit. */
    { source: 'service-pm-site-tablet.jpg', key: '/images/v/service-pm-site-tablet-1920.webp', portrait: { focus: [0.46, 0.5] } },
  ],
};

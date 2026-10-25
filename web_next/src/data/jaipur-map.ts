/**
 * The home page's project map — frame, art and credit.
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with:  npm run build:map   (refetch: npm run build:map:fetch)
 * Editorial layer:  scripts/jaipur-map.config.mjs
 *
 * Source    OpenStreetMap, via the Overpass API
 * Licence   ODbL 1.0 — "© OpenStreetMap contributors" must stay VISIBLE on the map.
 * Snapshot  2026-10-25T18:10:21Z (retrieved 2026-10-25)
 */

/** Equirectangular, in metres about (lat0, lng0): x east, y south. See projectCity in lib/geo.ts. */
export const CITY_FRAME = { lat0: 26.88, lng0: 75.79, mx: 99359.996, my: 110801.651 } as const;

/** The art: fetched once and injected into the map's SVG. Its viewBox is the region, in frame metres. */
export const MAP_ART = {
  url: '/map/jaipur.df2614e2.svg',
  viewBox: [-78494, -74237, 154008, 149582],
  city: [-22853, -24376, 20866, 24376],
  bytes: 399613,
  gzBytes: 172858,
} as const;

/** The street patches, one per seeded project (frame metres). A project added since has no patch until the map is rebuilt. */
export const MAP_PATCHES = [
  { slug: 'jagatpura-terrace-residence', x: 5435, y: 7435, r: 1100 },
  { slug: 'pratap-nagar-slim-house', x: 4749, y: 10715, r: 1100 },
  { slug: 'mansarovar-courtyard-villa', x: -2703, y: 3269, r: 1100 },
  { slug: 'pratap-nagar-gaushala-residence', x: 3617, y: 11180, r: 1100 },
  { slug: 'sanganer-mixed-use-block', x: -89, y: 7003, r: 1100 },
  { slug: 'malviya-nagar-garden-house', x: 1938, y: 2936, r: 1100 },
  { slug: 'vaishali-nagar-apartment-interiors', x: -5018, y: -3590, r: 1100 },
  { slug: 'tonk-road-corporate-office', x: 1639, y: 3690, r: 1100 },
  { slug: 'ajmer-road-hospital-mepf', x: -7541, y: -3202, r: 1100 },
  { slug: 'jhotwara-row-housing', x: -4243, y: -7003, r: 1100 },
] as const;

export const OSM_SOURCE = {
  text: '© OpenStreetMap contributors',
  url: 'https://www.openstreetmap.org/copyright',
  licence: 'ODbL 1.0',
  retrieved: '2026-10-25',
  osmBase: '2026-10-25T18:10:21Z',
} as const;

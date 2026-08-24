import { IMAGE_POOLS, type ImagePool } from '@/data/image-catalogue';

/**
 * Media resolver.
 *
 * Every image on the site resolves through here, so swapping in the client's real
 * photography is a change to this one file — not to 40 components.
 *
 * ── Where the imagery comes from ────────────────────────────────────────────
 * Curated from Wikimedia Commons (including its Unsplash CC0 imports), verified to
 * load and to be ≥1400px, downsized to 1500px/q58, and committed to `public/images`.
 * Served from our own origin: no hotlinking, no third-party runtime dependency, and
 * no broken image if an upstream host changes. Licences: public/images/ATTRIBUTION.md
 *
 * ── Why seeds map to *pools* ────────────────────────────────────────────────
 * Each seed is routed to a contextual pool — a construction seed can never resolve to
 * an interior, a Jaipur seed never to a glass office tower. Within a pool the choice is
 * a deterministic hash, so a given seed always yields the same image across reloads,
 * builds and the PDF export.
 */

const BASE = '/images';

/* ------------------------------------------------------------------ */
/* Seed → pool routing                                                 */
/* ------------------------------------------------------------------ */

/**
 * Pinned assignments.
 *
 * Hashing distributes acceptably for incidental imagery, but the project covers and
 * page heroes are seen *side by side* — two cards showing the same photograph reads as
 * a bug. These are assigned by hand so every headline slot is visually distinct.
 */
const PINNED: Record<string, string> = {
  'hero-primary': 'residential-01.webp',

  // Project covers — the Projects grid compares these directly
  'jagatpura-cover': 'residential-02.webp',
  'pratapnagar-cover': 'residential-03.webp',
  'mansarovar-cover': 'residential-04.webp',
  'gaushala-cover': 'residential-05.webp',
  'malviya-cover': 'residential-06.webp',
  'jhotwara-cover': 'residential-07.webp',
  'sanganer-cover': 'residential-08.webp',
  'vaishali-cover': 'interior-01.webp',
  'tonk-cover': 'commercial-01.webp',
  'ajmer-cover': 'commercial-02.webp',

  // Page heroes
  'about-hero': 'residential-09.webp',
  'projects-hero': 'detail-01.webp',
  'services-hero': 'detail-02.webp',
  'careers-hero': 'construction-01.webp',
  'vastu-hero': 'jaipur-01.webp',
  'estimator-hero': 'detail-03.webp',
  'about-studio': 'detail-04.webp',
  'careers-team': 'construction-05.webp',
};

/** Explicit routes win. Ordered: first matching pattern decides. */
const ROUTES: [RegExp, ImagePool][] = [
  // Place & heritage — Vastu, Jaipur context
  [/^(vastu-|jaipur|og-home)/, 'jaipur'],

  // Commercial / office work
  [/^(tonk-|ajmer-|banner-commercial|og-pricing|service-pm)/, 'commercial'],

  // Interiors — fit-out projects, interior services, finished rooms
  [/^(vaishali-|service-interior|update-kitchen|update-ceiling|post-turnkey|dl-)/, 'interior'],

  // Live building work — process, site updates, before shots, camera feeds
  [/^(update-|process-|camera-feed|post-timeline|post-monsoon|post-cost)/, 'construction'],
  [/-before$/, 'construction'],

  // Building services
  [/^(service-mepf|post-mepf)/, 'mepf'],

  // Drawings, materials, abstract brand surfaces
  [/^(service-architecture|about-studio|banner-promo|og-estimator|post-vastu)/, 'detail'],

  // Everything else — completed residential work
  [/./, 'residential'],
];

function poolFor(seed: string): ImagePool {
  const s = seed.toLowerCase();
  for (const [pattern, pool] of ROUTES) if (pattern.test(s)) return pool;
  return 'residential';
}

/** FNV-1a — small, stable, and identical across builds. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Resolve a seed to a real, contextually-correct image.
 *
 * Width/height are accepted for call-site compatibility but no longer used to request
 * a remote render — the files are pre-sized and every consumer applies `object-cover`.
 */
export function img(seed: string, _width?: number, _height?: number): string {
  const pinned = PINNED[seed];
  if (pinned) return `${BASE}/${pinned}`;

  const pool = poolFor(seed);
  const files = IMAGE_POOLS[pool] as readonly string[];
  if (!files?.length) return `${BASE}/residential-01.webp`;
  return `${BASE}/${files[hash(seed) % files.length]}`;
}

/** Aspect presets — kept so existing call sites need no change. */
export const IMG = {
  hero: (seed: string) => img(seed),
  wide: (seed: string) => img(seed),
  card: (seed: string) => img(seed),
  portrait: (seed: string) => img(seed),
  square: (seed: string) => img(seed),
  thumb: (seed: string) => img(seed),
  avatar: (seed: string) => monogram(seed),
};

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const MONOGRAM_TONES = [
  ['#03094E', '#E6F9FE'],
  ['#027797', '#EEF1F9'],
  ['#12265C', '#F7F3EC'],
  ['#8A6241', '#FAF8F4'],
  ['#076179', '#E6F9FE'],
] as const;

/**
 * Initials avatar, rendered as an inline SVG data URI.
 *
 * Deliberately **not** a stock photograph of a stranger.
 *
 * The testimonials on this site are real, named clients from the company portfolio
 * (Dr. Ashok Verma, Uday Singh Chauhan, RaghuRaj Vijayvargiya, Dr. A. A. Pathan), and
 * the team roles are real roles. Attaching a random person's face to a real person's
 * name fabricates a likeness — it misrepresents identifiable individuals, and it is the
 * kind of detail that destroys trust precisely when a visitor starts checking.
 *
 * A designed monogram is honest, reads as intentional, and swaps out for a real
 * photograph the moment the client supplies one.
 */
export function monogram(nameOrSeed: string): string {
  const cleaned = nameOrSeed
    .replace(/^(avatar|team|portal)[-_]?/i, '')
    .replace(/[-_]/g, ' ')
    // Honorific + its trailing stop. Removing only the word left "Dr. Ashok" as ". Ashok",
    // so the full stop became the first initial.
    .replace(/\b(dr|mr|mrs|ms|prof)\b\.?/gi, '')
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim();

  const initials =
    cleaned
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '·';

  const tone = MONOGRAM_TONES[hash(nameOrSeed) % MONOGRAM_TONES.length] ?? MONOGRAM_TONES[0];
  const [fg, bg] = tone;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${initials}">
    <rect width="128" height="128" fill="${bg}"/>
    <text x="64" y="64" fill="${fg}" font-family="Outfit, Inter, system-ui, sans-serif" font-size="48"
          font-weight="600" letter-spacing="1" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' '))}`;
}

/* ------------------------------------------------------------------ */
/* Brand marks                                                         */
/* ------------------------------------------------------------------ */

/** Inline SVG wordmark for mock client/supplier logos — keeps the marquee dependency-free. */
export function logoMark(label: string, tone = '#03094E'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 56">
    <rect width="200" height="56" fill="none"/>
    <circle cx="22" cy="28" r="11" fill="${tone}" opacity="0.9"/>
    <rect x="38" y="20" width="10" height="16" fill="${tone}" opacity="0.55"/>
    <text x="58" y="35" font-family="Outfit, sans-serif" font-size="17" font-weight="600" fill="${tone}">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Material glyphs.
 *
 * Twenty-one hand-drawn icons rather than a library, because no library has them:
 * Lucide — which the rest of the product uses — has no cement bag, no rebar, no
 * tile, no transit mixer, no sanitaryware. The obvious fallback was the emoji
 * that used to sit on
 * the old catalogue (🔩 🧱 🏗️), but emoji render as different artwork on every
 * platform, cannot take the brand colour, and read as clip-art next to a premium
 * estimate.
 *
 * These follow Lucide's drawing grammar exactly — 24×24 box, 1.5 stroke,
 * `currentColor`, round caps and joins, no fills — so they sit consistently
 * beside the Lucide icons already on the page and inherit theme and dark mode for
 * free. The whole set is about 1 KB gzipped.
 *
 * They deliberately do not go in `lib/icons.tsx`: that registry exists so admin
 * users can reference an icon by name from a data record. These are structural to
 * the estimator and keyed by material, not editable content.
 */
import { cn } from '@/lib/cn';

/** Keyed by `MaterialLine.key`. */
const PATHS: Record<string, React.ReactNode> = {
  /* Cement — a bag with a folded top seam. */
  cement: (
    <>
      <path d="M6 8.5 8 4h8l2 4.5V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V8.5Z" />
      <path d="M6 8.5h12" />
      <path d="M10 4v4.5M14 4v4.5" />
    </>
  ),

  /* TMT Steel — a bundle of ribbed bars, end-on. */
  steel: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <circle cx="12" cy="16" r="3" />
    </>
  ),

  /* Sand — a heap. */
  sand: (
    <>
      <path d="M3 19h18" />
      <path d="M4 19c2.5-6 5-9 8-9s5.5 3 8 9" />
      <path d="M9.5 14.5h.01M13 12.5h.01M15 16h.01" />
    </>
  ),

  /* Aggregate — graded stones. */
  aggregate: (
    <>
      <path d="M3 14.5 6 10l4 3-2 5H4Z" />
      <path d="M10.5 8.5 14 5l4.5 4-2 4.5-5.5-1Z" />
      <path d="M13 19l1.5-4 5 1.5L19 20h-5.5Z" />
    </>
  ),

  /* Bricks & blocks — a stretcher-bond wall. */
  bricks: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9.7h18M3 14.3h18" />
      <path d="M9 5v4.7M15 9.7v4.6M9 14.3V19" />
    </>
  ),

  /* Ready-mix concrete — a transit mixer drum. */
  rmc: (
    <>
      <path d="M3 17h2" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
      <path d="M9.5 17.5h5.5" />
      <path d="M4 8h4l1 7" />
      <path d="M9 6.5 19 5l1.5 7-1.5 3.5" />
      <path d="M11 6.2 12 15M15 5.6 15.8 14.6" />
    </>
  ),

  /* Foundation stone — rubble masonry courses. */
  stone: (
    <>
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M3 5v14M21 5v14" />
      <path d="M9 5v4M14 9v6M8 15v4" />
    </>
  ),

  /* Bathroom fixtures — a basin with a mixer. */
  bathroom: (
    <>
      <path d="M12 4h1.5a2 2 0 0 1 2 2v3" />
      <path d="M9.5 4h5" />
      <path d="M4 12h16v1a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z" />
      <path d="M8 19v2M16 19v2" />
    </>
  ),

  /* Water tanks — an overhead tank on a stand. */
  'water-tank': (
    <>
      <path d="M6 4h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M6 7.5h12" />
      <path d="M9 13v3M15 13v3" />
      <path d="M7 20h10" />
      <path d="M9 16 7 20M15 16l2 4" />
    </>
  ),

  /* Waterproofing — a droplet under cover. */
  waterproofing: (
    <>
      <path d="M12 3 5 9.5a7 7 0 1 0 14 0Z" />
      <path d="M12 8.5c-1.6 1.6-2.5 2.9-2.5 4.2a2.5 2.5 0 0 0 5 0c0-1.3-.9-2.6-2.5-4.2Z" />
    </>
  ),

  /* Flooring & tiles — laid tiles in perspective. */
  flooring: (
    <>
      <path d="M3 20 8 6h8l5 14Z" />
      <path d="M6.2 13h11.6" />
      <path d="M11 6v14M14.5 13v7" />
    </>
  ),

  /* Wall finish & paint — a roller. */
  'wall-finish': (
    <>
      <rect x="3" y="4" width="13" height="5" rx="1" />
      <path d="M16 6.5h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7v2" />
      <rect x="10" y="13.5" width="4" height="6.5" rx="1" />
    </>
  ),

  /* Doors — panelled, with a handle. */
  doors: (
    <>
      <path d="M5 20V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v16" />
      <path d="M3 20h18" />
      <circle cx="14.5" cy="12" r=".9" />
    </>
  ),

  /* Windows — a two-light casement. */
  windows: (
    <>
      <rect x="3" y="4" width="18" height="15" rx="1" />
      <path d="M12 4v15M3 11.5h18" />
      <path d="M3 19h18" />
    </>
  ),

  /* Conduiting — a run of conduit with a bend. */
  conduiting: (
    <>
      <path d="M3 7h9a4 4 0 0 1 4 4v6" />
      <path d="M3 4.5v5M21 17h-10" />
      <path d="M19 14.5v5" />
    </>
  ),

  /* Electrical — a modular plate with a rocker. */
  electrical: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M13 7.5 9.8 12.6h4.4L11 16.5" />
    </>
  ),

  /* Plumbing & sanitaryware — a pillar tap. */
  plumbing: (
    <>
      <path d="M10 4h4v3h-4z" />
      <path d="M12 7v4" />
      <path d="M6 11h12a0 0 0 0 1 0 0v1a6 6 0 0 1-6 6 6 6 0 0 1-6-6v-1Z" />
      <path d="M12 18v3" />
    </>
  ),

  /* Modular kitchen — base units with a counter and hob. */
  kitchen: (
    <>
      <path d="M3 9h18" />
      <rect x="3" y="9" width="18" height="11" rx="1" />
      <path d="M12 9v11" />
      <path d="M7 13v2M17 13v2" />
      <path d="M6 6h5a2 2 0 0 1 2 2v1" />
    </>
  ),

  /* Wardrobes — a two-door unit. */
  wardrobes: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M12 3v18" />
      <path d="M10 11v2M14 11v2" />
    </>
  ),

  /* False ceiling & lighting — a cove with a pendant. */
  ceiling: (
    <>
      <path d="M3 5h18" />
      <path d="M5 5v2.5h14V5" />
      <path d="M12 7.5v4" />
      <path d="M8.5 17a3.5 3.5 0 0 1 7 0Z" />
      <path d="M7 17h10" />
    </>
  ),

  /* Railings — posts under a handrail. */
  railings: (
    <>
      <path d="M3 7h18" />
      <path d="M3 20h18" />
      <path d="M7 7v13M12 7v13M17 7v13" />
    </>
  ),
};

export function MaterialIcon({ name, className }: { name: string; className?: string }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      aria-hidden
      focusable="false"
    >
      {path}
    </svg>
  );
}

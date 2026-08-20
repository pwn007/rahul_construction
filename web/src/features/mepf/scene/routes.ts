import type { SystemKey } from '@/data/mepf';
import { HOUSE, type Pt } from './iso';

/**
 * Where every pipe, duct and cable actually goes.
 *
 * ── Why this is data and not drawing ────────────────────────────────────────
 * The house is now drawn twice: flat, as an axonometric SVG, and in 3D, as
 * geometry you can turn. Two renderers, one building. If each one carried its
 * own idea of where the water riser is, they would drift apart within a week and
 * nobody would notice until a visitor did.
 *
 * So the runs live here, as lists of points in house coordinates — x along the
 * length, y towards the front, z up — and both renderers read them. `HouseIso`
 * projects them to 2D paths; `build.ts` extrudes them into cylinders. Neither
 * has an opinion about the route.
 *
 * ── Two service zones ───────────────────────────────────────────────────────
 * Dry in the middle (air, power), wet at the far end by the kitchen and the
 * bathroom above it. That is real practice, not a drawing convenience — you do
 * not share a shaft between a water riser and a cable tray if you can help it —
 * and it is also why the four routes never have to cross.
 */

const { levels, ceil, roof, dry, wet } = HOUSE;

/** Ceiling height of each storey, which is where every horizontal run sits. */
export const CEIL = levels.map((z) => ceil(z));

export interface Route {
  /** The vertical run through the house. */
  riser: Pt[];
  /** One horizontal run per storey, along the ceiling. Power gets two. */
  branches: Pt[][];
  /** From the ceiling down to whatever a person actually touches. */
  drops: Pt[][];
}

export const ROUTES: Record<SystemKey, Route> = {
  hvac: {
    // Outdoor unit on the roof, straight down the dry zone.
    riser: [
      [dry.x, dry.y, roof + 0.2],
      [dry.x, dry.y, CEIL[0]!],
    ],
    branches: CEIL.map((c) => [
      [dry.x, dry.y, c],
      [3.2, dry.y, c],
    ]),
    // Down the wall to the indoor unit — the one part of any of this you see.
    drops: levels.map((z, i) => [
      [3.2, dry.y, CEIL[i]!],
      [3.2, 0.45, z + 2.55],
    ]),
  },
  plumbing: {
    riser: [
      [wet.x, wet.y, roof + 0.1],
      [wet.x, wet.y, 0.45],
    ],
    branches: CEIL.map((c) => [
      [wet.x, wet.y, c],
      [12.0, wet.y, c],
      [12.0, 2.6, c],
    ]),
    drops: levels.map((z, i) => [
      [12.0, 2.6, CEIL[i]!],
      [12.0, 2.6, z + 1.1],
    ]),
  },
  electrical: {
    // Up from the meter, not down from the roof: power arrives at the ground.
    riser: [
      [7.05, dry.y, 1.6],
      [7.05, dry.y, CEIL[1]!],
    ],
    branches: CEIL.flatMap((c) => [
      [
        [7.05, dry.y, c],
        [7.05, 2.4, c],
        [3.2, 2.4, c],
      ] as Pt[],
      [
        [7.05, 2.4, c],
        [10.0, 2.4, c],
      ] as Pt[],
    ]),
    drops: levels.flatMap((z, i) => [
      [
        [3.2, 2.4, CEIL[i]!],
        [3.2, 2.4, z + 2.74],
      ] as Pt[],
      [
        [10.0, 2.4, CEIL[i]!],
        [10.0, 2.4, z + 2.74],
      ] as Pt[],
    ]),
  },
  fire: {
    riser: [
      [10.4, dry.y, 0.55],
      [10.4, dry.y, CEIL[1]!],
    ],
    branches: CEIL.map((c) => [
      [10.4, dry.y, c],
      [10.4, 2.2, c],
      [6.9, 2.2, c],
    ]),
    drops: [],
  },
};

/** Dirty water leaves on its own stack and never shares a pipe with clean. */
export const WASTE: Pt[] = [
  [12.4, 2.6, levels[1]! + 0.95],
  [12.4, 2.6, 0.18],
  [12.4, 4.15, 0.18],
];

/** The supply from the street to the meter. */
export const INCOMING: Pt[] = [
  [7.05, dry.y, 1.6],
  [0.4, dry.y, 1.6],
  [0.4, 4.15, 1.6],
];

/** Power runs two circuits per storey; everything else runs one. */
export const perLevel = (key: SystemKey, index: number) =>
  key === 'electrical' ? ROUTES[key].branches.slice(index * 2, index * 2 + 2) : [ROUTES[key].branches[index]!];

export const perLevelDrops = (key: SystemKey, index: number) =>
  key === 'electrical' ? ROUTES[key].drops.slice(index * 2, index * 2 + 2) : ROUTES[key].drops.filter((_, i) => i === index);

/** Every run of one system, flattened — what the 3D builder wants. */
export const allRuns = (key: SystemKey): Pt[][] => [ROUTES[key].riser, ...ROUTES[key].branches, ...ROUTES[key].drops];

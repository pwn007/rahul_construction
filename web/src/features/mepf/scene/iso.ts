/**
 * The projection the house is drawn through, and the house's dimensions.
 *
 * ── Why every shape goes through one function ───────────────────────────────
 * The section drawing this replaces was authored in screen coordinates: every
 * pipe was a hand-typed `M254 138 H560`, which meant moving a floor by ten units
 * was a hunt through a hundred path strings. Here nothing is a screen
 * coordinate. Walls, slabs, pipes and fittings are written in *house* units —
 * roughly metres, x along the length, y towards the viewer, z up — and `iso()`
 * is the only thing that knows how they land on screen.
 *
 * ── The numbers below are not arbitrary, and getting them wrong is fatal ────
 * The first attempt used a 10×8 plan on a 2:1 projection and was unreadable:
 * one storey came out 95px tall on screen while the floor plate came out 208px
 * deep, so every slab comprehensively covered the room beneath it and the house
 * read as three stacked platters. **What you actually see of a storey is the
 * difference between those two numbers** — and that difference is the entire
 * drawing:
 *
 *     storey on screen  =  3.4 × H  =  204px
 *     plate depth       =  4.4 × U  =  114px
 *     ─────────────────────────────────────────
 *     open slice        =            =   90px   ← the room you can look into
 *
 * The second attempt got that slice to 23px, which is not a room, it is a gap.
 * Ninety is the number that makes a storey read as a space with a floor, a
 * ceiling and something happening between them.
 *
 * A shallow plan sounds like a compromise until you notice that a long narrow
 * house is what most Jaipur plots actually get built as — the firm's own "Slim
 * House" sits on twenty-five feet. The drawing is more honest this way, not
 * less.
 *
 * The 2.4:1 horizontal is flatter than true isometric's 1.73:1. True isometric
 * would put this house at nearly 1:1 on screen, which wastes half of a wide
 * panel; 2.4:1 lands it at about 4:3 and reads as the same drawing.
 *
 * ── Which walls exist ───────────────────────────────────────────────────────
 * The viewer is above and in front, so the corner at (X, Y) is nearest. The two
 * walls facing the viewer are the ones left out — that is the entire cutaway.
 * What is drawn is the far pair, at x = 0 and y = 0, which is also where every
 * fitting is mounted so it has something to sit against.
 */

/** Screen units per house unit along the ground plane. */
export const U = 26;
/** Screen units per house unit of height. Large on purpose — see the note above. */
export const H = 60;
/** Horizontal spread. 2.4 rather than isometric's 1.73, to fill a wide panel. */
const SPREAD = 2.4;

export type Pt = readonly [number, number, number];

/** House coordinates → screen coordinates. The only place the two meet. */
export function iso(x: number, y: number, z: number): [number, number] {
  return [(x - y) * SPREAD * U, (x + y) * U - z * H];
}

const fmt = ([sx, sy]: [number, number]) => `${sx.toFixed(1)} ${sy.toFixed(1)}`;

/** A closed face, for anything solid. */
export function face(...pts: Pt[]): string {
  return `M${pts.map((p) => fmt(iso(...p))).join(' L')} Z`;
}

/** An open polyline, for anything that is a run rather than a surface. */
export function run(...pts: Pt[]): string {
  return `M${pts.map((p) => fmt(iso(...p))).join(' L')}`;
}

/** A point, for anything that needs placing rather than drawing. */
export function at(p: Pt): { x: number; y: number } {
  const [x, y] = iso(...p);
  return { x, y };
}

/** A horizontal surface. */
export function slab(x0: number, x1: number, y0: number, y1: number, z: number): string {
  return face([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
}

/** A wall in the x = k plane. */
export function wallX(x: number, y0: number, y1: number, z0: number, z1: number): string {
  return face([x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]);
}

/** A wall in the y = k plane. */
export function wallY(y: number, x0: number, x1: number, z0: number, z1: number): string {
  return face([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);
}

/**
 * The three faces of a cuboid this viewpoint can see: the top and the two sides
 * facing the viewer. Returned separately so each can be shaded — a solid only
 * reads as solid if its faces disagree about how much light they get.
 */
export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) {
  return {
    top: slab(x0, x1, y0, y1, z1),
    right: face([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]),
    front: face([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]),
  };
}

/**
 * A floor slab with its cut edges showing.
 *
 * The top face alone is a flat diamond and reads as a sheet of paper; the two
 * exposed edges are what give it thickness, and thickness is what tells you it
 * is a concrete slab you are looking at the cut end of.
 */
export function floorSlab(x0: number, x1: number, y0: number, y1: number, z: number, d: number) {
  return box(x0, x1, y0, y1, z - d, z);
}

/* ─────────────────────────────────────────────────────────────────────────────
   The house.

   Long, narrow, two storeys, flat roof with a parapet — which is what an
   independent house on a Jaipur plot very often is, and it is also the roof
   that makes the argument, because the tank and the condenser sit on it in
   plain sight and everything else runs down from there.

   Two service zones rather than one: dry in the middle (air, power), wet at the
   far end by the kitchen and bathroom (water, fire). That is real practice, not
   a drawing convenience — you do not share a shaft between a water riser and a
   cable tray if you can help it — and it means the four routes never cross.
   ────────────────────────────────────────────────────────────────────────── */

export const HOUSE = {
  X: 13,
  Y: 4.4,
  /** Walking surface of each storey. */
  levels: [0, 3.4] as const,
  storey: 3.4,
  slabD: 0.22,
  /** Underside of the ceiling on a storey whose floor is at `z`. */
  ceil: (z: number) => z + 3.0,
  roof: 6.8,
  parapet: 7.2,
  /** Dry riser zone, mid-house: air and power. */
  dry: { x: 6.7, y: 0.75 },
  /** Wet riser zone, by the kitchen and the bathroom above it. */
  wet: { x: 9.8, y: 0.75 },
} as const;

/** Where each service ends up, on a storey whose floor is at `z`. */
export const TERMINALS = {
  /** Indoor unit, high on the long back wall. */
  ac: (z: number) => [3.2, 0.32, z + 2.42] as const,
  /** A pendant in each of the two rooms. */
  lightL: (z: number) => [3.2, 2.4, z + 2.72] as const,
  lightR: (z: number) => [10.0, 2.4, z + 2.72] as const,
  /** Sink below, basin above — both at the far end against the back wall. */
  fixture: (z: number) => [12.0, 2.6, z + 1.05] as const,
  /** Smoke detector on the ceiling, between the two rooms. */
  detector: (z: number) => [6.9, 2.2, z + 2.92] as const,
} as const;

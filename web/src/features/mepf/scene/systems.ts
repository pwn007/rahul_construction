import type { SystemKey } from '@/data/mepf';

/**
 * What each service looks like, independent of where it runs.
 *
 * ── Colour ──────────────────────────────────────────────────────────────────
 * Colour-coding by discipline is the convention on real MEP drawings, which is
 * why fire is warm against three blues rather than a fourth shade of cyan.
 * This is the only place the four colours are written down. The house is drawn
 * once and rendered in three places — the home page, the MEPF service page and
 * `/mepf` — so a duct is the same blue on all of them by construction rather
 * than by anybody remembering.
 *
 * It is never the *only* channel: every route is labelled, every route has its
 * own stroke weight, and every route can be isolated by hover, focus or tap.
 *
 * ── Weight ──────────────────────────────────────────────────────────────────
 * A duct is not a cable. Drawing them at the same thickness loses the one fact
 * that decides the coordination order — ducts go highest *because* they are
 * biggest — so the weights below are the ratio, not decoration.
 */
export interface SystemStyle {
  key: SystemKey;
  label: string;
  colour: string;
  /** Stroke weight in scene units, wide composition. Narrow scales by 0.8. */
  weight: number;
  /** Where this service sits in the ceiling void: 0 is tight under the slab. */
  lane: number;
}

export const SYSTEM_STYLES: Record<SystemKey, SystemStyle> = {
  hvac: { key: 'hvac', label: 'Mechanical · HVAC', colour: '#2B4491', weight: 7, lane: 0 },
  plumbing: { key: 'plumbing', label: 'Plumbing', colour: '#027797', weight: 4.4, lane: 1 },
  electrical: { key: 'electrical', label: 'Electrical', colour: '#00BBEE', weight: 3, lane: 2 },
  fire: { key: 'fire', label: 'Fire Fighting', colour: '#D97706', weight: 2.6, lane: 3 },
};

/**
 * The colour a switched-off service goes.
 *
 * Not red, and not invisible. A service that vanishes when you switch it off
 * says "this was never here", when the point being made is the opposite — it is
 * here, it was just never designed. Grey, still drawn, still in the way.
 */
export const DEAD = '#8C93A3';

/**
 * The house's own ground, so it reads identically in both themes.
 *
 * ── A shade ramp, not a set of beiges ───────────────────────────────────────
 * An isometric drawing has no outlines to fall back on: a surface is only
 * legible if its neighbours are a different value. The first pass had walls at
 * `#E4E0D6` against slabs at `#C9C4B8` and the house came out as one flat
 * biscuit-coloured mass. These five are ordered lightest to darkest and every
 * adjacent pair is far enough apart to survive a phone screen in daylight:
 *
 *     PAPER      ground you stand on, lightest
 *     WALL       the long back wall, catching most of the light
 *     SLAB       upper floor plates
 *     WALL_SIDE  the end wall, turned away
 *     SLAB_DARK  the cut edge of every slab, darkest
 */
export const PAPER = '#F5F3EE';
export const WALL = '#E9E5DB';
export const SLAB = '#DDD8CC';
export const WALL_SIDE = '#D2CCBE';
export const SLAB_DARK = '#BCB6A6';
export const INK = '#03094E';
export const FURNITURE = '#C6C0B1';
export const GLOW = '#FFCB6B';

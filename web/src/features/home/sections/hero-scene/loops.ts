/**
 * Every clock in the hero.
 *
 * ── Ambient, never a timeline ───────────────────────────────────────────────
 * An earlier hero told its story once, over about seven seconds, and then
 * stopped — so anyone who arrived late, changed tabs or simply looked away saw
 * a finished picture and none of the journey. A hero cannot know when it is
 * being looked at, so it must never depend on knowing.
 *
 * The story is therefore carried by the *layout*: three stations, all on screen,
 * always readable. Nothing here builds up and nothing resets. Every station is
 * a permanent state — the frame is always being built, the home is always
 * delivered — which is what removes the need to hide a loop point, because
 * there isn't one to hide.
 *
 * ── The rules ───────────────────────────────────────────────────────────────
 *  · Slow, and layered. None of these periods is a multiple of another, so the
 *    scene as a whole never visibly repeats even though each part of it does.
 *  · First and last frame identical, so nothing snaps. Everything is a sine or
 *    an explicit hold-at-both-ends cycle.
 *  · Not everything moves. The buildings, the board, the ground and the people's
 *    stance are all still; only ten or so nodes are ever written to.
 */

export const CRANE_SLEW_MS = 9000;
export const TROLLEY_MS = 15000;
export const HOIST_MS = 12000;
/** The plan on the board drawing itself, holding, and clearing. */
export const PLAN_MS = 11000;
export const GLOW_MS = 5000;
/** The key catching the light at the handover. */
export const GLINT_MS = 7000;
/**
 * Gravel running out of the tipper.
 *
 * The pebbles are spaced 14 units apart and travel exactly 14 before the cycle
 * restarts, so the last frame is identical to the first and the stream never
 * visibly resets. This is the fastest loop in the hero by an order of magnitude,
 * and it earns that: falling material is the one thing here that would look
 * wrong slowed down.
 */
export const GRAVEL_MS = 620;
export const CLOUD_MS = 90000;

/** The one-time entrance sweep, left to right. */
export const ENTRANCE_MS = 1200;

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Hook height on its lift cycle: 0 down at the ground, 1 up at the frame.
 *
 * The hold at the top is what stops it reading as a metronome — a hoist that
 * rises and falls on a pure sine is a pendulum, while a real one stops while
 * its load is landed.
 */
export function hoistAt(now: number) {
  const c = (now / HOIST_MS) % 1;
  if (c < 0.32) return smooth(c / 0.32);
  if (c < 0.5) return 1;
  if (c < 0.82) return 1 - smooth((c - 0.5) / 0.32);
  return 0;
}

/**
 * The plan being drawn on the board, 0 → 1.
 *
 * Draws over the first 55% of the cycle, holds finished for 25%, clears over the
 * last 20%. This is the only thing in the hero that resets, and it is the only
 * place where resetting is the point: the board is always a board, and designing
 * is never finished.
 */
export function planAt(now: number) {
  const c = (now / PLAN_MS) % 1;
  if (c < 0.55) return smooth(c / 0.55);
  if (c < 0.8) return 1;
  return 1 - smooth((c - 0.8) / 0.2);
}

/**
 * The key's glint: dark for most of the cycle, one short flare.
 *
 * Rare on purpose. A sparkle that fires every second is a decoration; one that
 * fires every seven seconds is the eye being pointed, once, at the single image
 * in this hero that means "delivered".
 */
export function glintAt(now: number) {
  const c = (now / GLINT_MS) % 1;
  if (c > 0.14) return 0;
  return Math.sin((c / 0.14) * Math.PI);
}

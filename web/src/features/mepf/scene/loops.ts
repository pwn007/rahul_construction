/**
 * Every clock in the MEPF scene.
 *
 * ── Ambient, never a timeline ───────────────────────────────────────────────
 * Same rule the hero settled on. Nothing here builds up and nothing resets, so
 * a visitor who arrives mid-loop, changes tab, or scrolls back up sees a
 * building that is simply running — which is the claim chapter three makes.
 *
 * ── The rules ───────────────────────────────────────────────────────────────
 *  · No period is a multiple of another, so the scene as a whole never visibly
 *    repeats even though every part of it does.
 *  · First frame identical to the last, so nothing snaps. Travelling things
 *    move exactly one spacing per cycle; everything else is a sine.
 *  · Not everything moves. The building, the furniture, the routes and the
 *    terminals are all still. Fourteen nodes are ever written to.
 *
 * ── Why these speeds ────────────────────────────────────────────────────────
 * The four systems run at genuinely different rates, and that is the point of
 * animating them at all. Electricity is close to instant, air moves at a few
 * metres a second, water falls, and fire protection does nothing at all until
 * the day it does everything. A visitor reads that hierarchy without being told
 * it — which is one more thing the drawing says that the copy does not have to.
 */

/** Charge along the electrical run. The fastest thing here, by an order of magnitude. */
export const VOLT_MS = 900;
/** Air to the diffusers. */
export const AIR_MS = 2600;
/** Supply down the riser. */
export const WATER_MS = 3400;
/** Waste leaving — slower, because it is gravity rather than a pump. */
export const WASTE_MS = 4300;
/** Condenser fans. */
export const FAN_MS = 1100;
/** Windows breathing. Long enough that it reads as occupancy, not as a pulse. */
export const LIT_MS = 7000;
/** The detector's standby blink: dark for most of the cycle, one short flare. */
export const STANDBY_MS = 5200;
/** Heat haze drifting, once HVAC is switched off. */
export const HAZE_MS = 6100;

/** Spacing between travelling marks, in scene units. Travel must equal this exactly. */
export const AIR_SPACING = 46;
export const WATER_SPACING = 38;
export const VOLT_SPACING = 54;

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
export const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The detector, waiting.
 *
 * Dark for 88% of the cycle and then one short flare. Rare on purpose: a light
 * that blinks every second is a decoration, while one that blinks every five
 * seconds is a system reporting that it is still there. It is also the only
 * thing in the scene that does nothing useful — which is exactly what fire
 * protection does, every day but one.
 */
export function standbyAt(now: number) {
  const c = (now / STANDBY_MS) % 1;
  if (c > 0.12) return 0;
  return Math.sin((c / 0.12) * Math.PI);
}

/** A travelling mark's offset within one spacing, 0 → spacing. */
export function travel(now: number, period: number, spacing: number) {
  return ((now / period) % 1) * spacing;
}

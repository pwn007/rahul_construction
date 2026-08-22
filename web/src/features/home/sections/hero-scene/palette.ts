/**
 * Every fill in the hero, named once.
 *
 * ── Why the scene is filled and not stroked ─────────────────────────────────
 * Two earlier heroes drew this site in thin navy outline, and both were rejected
 * for the same underlying reason: an outline of a person is a person only to
 * someone who already expected one. At 1.4px a figure is a squiggle, a drawing
 * board is a quadrilateral, and a visitor who has to *work out* what they are
 * looking at has already been lost — the drawing board was read as a slingshot.
 *
 * Solid shape is what makes an illustration legible at a glance, and in this
 * category two objects carry the entire reading on their own: a **hi-vis vest**
 * and a **hard hat**. Everything below exists to put those two on screen in the
 * firm's own colours.
 *
 * ── Why hi-vis is rationed ──────────────────────────────────────────────────
 * `HIVIS` is the one colour in this file that is not from the brand palette, and
 * it appears on vests and hard hats and nowhere else. It is the fastest "this is
 * a construction site" signal that exists, and it stays a signal only while
 * nothing else competes for it. Anything else that wants to be warm takes
 * `SAND`; anything that wants to be bright takes `CYAN`.
 */

/** Brand navies — structure, outlines, denim, night glazing. */
export const NAVY = {
  900: '#071338',
  800: '#03094E',
  700: '#12265C',
  600: '#1B3273',
  400: '#4F68B0',
  300: '#7F94CB',
  200: '#AFBEE1',
  100: '#D6DEF0',
  50: '#EEF1F9',
} as const;

/** Brand cyans — glazing, the crane, the mark, anything that should read new. */
export const CYAN = {
  700: '#027797',
  600: '#0096BF',
  500: '#00BBEE',
  300: '#4FD2F6',
  100: '#C2F0FC',
} as const;

/** Material warmth — ground, timber, brick, boots. */
export const SAND = {
  500: '#B99465',
  400: '#CDB48E',
  300: '#DFCFB6',
  200: '#EDE4D6',
} as const;

export const PAPER = '#F7F6F2';

/**
 * Hi-vis. Vests and hard hats only.
 *
 * Two shades rather than one so a crew does not look like a single figure
 * stamped three times — the deeper one for hats, the brighter for vests, and
 * they swap between characters.
 */
export const HIVIS = '#F4762A';
export const HIVIS_LIGHT = '#FF9147';
/** The retroreflective bands across a vest. Pale, never white — white on this
 *  pale hero ground disappears. */
export const BAND = '#EDF1F5';

/** Warm interior light, for the delivered home's windows. */
export const GLOW = '#F3C078';

/**
 * Skin tones.
 *
 * Three, assigned per figure rather than globally, because a site crew drawn in
 * one tone reads as clones of one person — which is both untrue of a real site
 * and the thing that makes cheap illustration look cheap.
 */
export const SKIN = ['#F0C09A', '#C98A5E', '#8B5E3C'] as const;
/** Hair, and the darker under-shadow on a skin tone. */
export const HAIR = ['#3A2A1E', '#241A12', '#1A1210'] as const;

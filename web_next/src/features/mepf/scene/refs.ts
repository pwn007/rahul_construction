'use client';

/**
 * How the frame loop reaches the handful of things that move.
 *
 * Same contract as the registry the old illustrated homepage hero used (removed
 * in Sep 2026 for the photo hero; see git history for `hero-scene/refs.ts`). It
 * was deliberately a separate copy rather than a shared import: the two scenes
 * had nothing in common but the technique, and a shared key union would have
 * made every key in one scene a legal typo in the other.
 *
 * The house takes `reg` and calls `ref={reg('water')}` on whatever the loop
 * needs to find. Everything discrete — which system is selected, which is
 * switched off — is React state applied in render, because it changes a handful
 * of times per visit rather than sixty times a second.
 */
export type Reg = (key: string) => (el: SVGGraphicsElement | null) => void;

/** Keys the frame loop writes to, listed so a typo is a compile error. */
export type MoverKey =
  /** Air travelling along each storey's duct to its indoor unit. */
  | 'air0'
  | 'air1'
  /** Supply descending the wet riser, and waste leaving under gravity. */
  | 'water'
  | 'waste'
  /** Charge along each storey's circuit. */
  | 'volt0'
  | 'volt1'
  /** The condenser fan on the roof. */
  | 'fan'
  /** Light pooling under each of the four pendants. */
  | 'lit0'
  | 'lit1'
  | 'lit2'
  | 'lit3'
  /** The detector's standby blink — the slowest thing in the scene. */
  | 'standby'
  /** Heat filling the rooms, shown only when the air is switched off. */
  | 'haze';

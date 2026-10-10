/**
 * The visitor's first name, once they have chosen to give it.
 *
 * Personalization is only welcome when the person knowingly handed the detail
 * over — the moment a site shows something they never supplied, recognition
 * reads as surveillance. Everything here comes from a form they filled in
 * seconds earlier, behind a consent checkbox. Nothing is inferred.
 *
 * Two rules hold the rest of the feature together:
 *
 *  1. **First name only.** The phone number is deliberately never written to
 *     the device. It adds nothing on screen and it is the field that turns a
 *     shared family laptop into a privacy problem.
 *  2. **The site must be complete without this.** Every consumer renders its
 *     normal, unpersonalized copy when `getVisitor()` returns null, which is
 *     the case for the large majority of visitors and for everyone on a first
 *     visit.
 */

import { useSyncExternalStore } from 'react';
import { readStore, writeStore, removeStore, STORAGE_KEYS } from './storage';

interface Visitor {
  firstName: string;
  /** Epoch ms. Read-time expiry — a tab is rarely open long enough for a timer. */
  savedAt: number;
}

/**
 * How long a name is remembered.
 *
 * Long enough to cover the research-and-decide window for a house, short
 * enough that a stale name does not greet a different person months later.
 * Held separately from the popup's `converted` flag, which never expires: one
 * record with two lifetimes would force one of them to be wrong.
 */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Keeps a long name from wrapping the navbar or crowding the hero. */
const MAX_LEN = 14;

/**
 * "ritu sharma" → "Ritu". "RAJKUMAR VENKATASUBRAMANIAN" → "RAJKUMARVENKAT".
 *
 * Capitalized only when the token is entirely lowercase. Anything else is left
 * exactly as typed: a name the person capitalized themselves is not ours to
 * correct, and blanket title-casing mangles the ones that carry internal
 * capitals.
 */
function firstNameOf(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] ?? '';
  const clipped = first.slice(0, MAX_LEN);
  if (!clipped) return '';
  return clipped === clipped.toLowerCase() ? clipped.charAt(0).toUpperCase() + clipped.slice(1) : clipped;
}

/* ------------------------------------------------------------------ */
/* Subscription                                                        */
/*                                                                     */
/* The greeting shows in several places at once, and clearing it from  */
/* the navbar has to remove it from the hero in the same tick — a      */
/* "Not you?" that leaves your name on screen until a reload is worse  */
/* than not offering it. Components read through `useVisitor()`.       */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

/**
 * `useSyncExternalStore` calls `getSnapshot` on every render and bails out only
 * when the result is referentially equal, so this must be a cache and not a
 * fresh `getVisitor()` — returning a new value each time is an infinite loop.
 */
let cached: string | null | undefined;

function emit(): void {
  cached = undefined;
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function snapshot(): string | null {
  if (cached === undefined) cached = getVisitor();
  return cached;
}

/** The first name to greet with, live. `null` for everyone else. */
export function useVisitor(): string | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** Called by each capture surface on a successful submit. */
export function rememberVisitor(fullName: string): void {
  const firstName = firstNameOf(fullName);
  if (!firstName) return;
  writeStore<Visitor>(STORAGE_KEYS.visitor, { firstName, savedAt: Date.now() });
  emit();
}

/** The first name to greet with, or `null` — which every caller must render cleanly. */
export function getVisitor(): string | null {
  const stored = readStore<Visitor | null>(STORAGE_KEYS.visitor, null);
  if (!stored?.firstName) return null;
  if (Date.now() - stored.savedAt > TTL_MS) {
    removeStore(STORAGE_KEYS.visitor);
    return null;
  }
  return stored.firstName;
}

/**
 * The "Not you?" control.
 *
 * Users consistently tell researchers "don't stereotype me — let me choose",
 * so a personalized site owes them a one-click way out. Deliberately does not
 * touch the lead record or the popup's suppression: clearing a greeting is not
 * a request to be asked for a phone number again.
 */
export function forgetVisitor(): void {
  removeStore(STORAGE_KEYS.visitor);
  emit();
}

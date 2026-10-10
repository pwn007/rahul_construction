import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The project's `fontSize` keys, mirrored from `tailwind.config.js`.
 *
 * ── Why this list has to exist ──────────────────────────────────────────────
 * tailwind-merge does not read `tailwind.config.js`. Its built-in `font-size`
 * group only recognises t-shirt sizes (`text-sm`, `text-lg`, `text-2xl`…), so a
 * custom key like `display-md` matches nothing there and falls through to the
 * catch-all `text-color` group — the same group as `text-white`. Last class
 * wins, and the size is deleted before it ever reaches the DOM:
 *
 *     cn('mt-4 text-display-md', 'text-white')  →  'mt-4 text-white'
 *
 * Every affected heading then fell back to Tailwind preflight's
 * `h1..h6 { font-size: inherit; font-weight: inherit }` and rendered at body
 * size. That silently shrank `SectionHeader` titles on dark sections, every
 * `SectionHeader` lead, `StatTile` values, and — worst — the `<h1>` of
 * `PageHero`, which is the page title on all thirteen interior pages: 56px/600
 * of intent rendering as 16px/400.
 *
 * ── If you add a size to tailwind.config.js ─────────────────────────────────
 * Add it here too. A key that is missing from this list is not a styling bug
 * you will see in the config — it is silently dropped at runtime, and only
 * whenever that class happens to share a `cn()` call with a text colour, which
 * is exactly the case that is easiest to miss in review.
 */
const FONT_SIZES = [
  'display-xl',
  'display-lg',
  'display-md',
  'display-sm',
  'heading-lg',
  'heading-md',
  'body-lg',
  'caption',
  'overline',
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // Extends rather than replaces, so `text-sm` vs `text-lg` still collapses.
      'font-size': [{ text: [...FONT_SIZES] }],
    },
  },
});

/** Merge conditional classNames with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

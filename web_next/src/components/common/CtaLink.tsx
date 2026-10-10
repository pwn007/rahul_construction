'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

/**
 * The in-content call to action.
 *
 * ── Why this replaced a bare underlined link ────────────────────────────────
 * These used to be `text-cyan-700 link-underline` — and `.link-underline` sets
 * `background-size: 0% 1px`, so there was no underline until hover. At rest the
 * link was distinguished from the paragraph beside it by colour alone, and
 * cyan-700 against the body-muted grey measures 1.52:1. WCAG 1.4.1 wants 3:1
 * before colour may be the only signal, so this was failing on the measurement
 * as well as on the client's eye.
 *
 * The pill fixes both at once: a border and a fill are non-colour cues, so the
 * contrast question no longer applies, and it is visible without being hovered.
 *
 * ── Why a pill and not a Button ─────────────────────────────────────────────
 * `Button`'s `primary` is solid navy and `accent` is solid cyan; those two carry
 * the page's real commitments ("Get Estimate", "Book a consultation"). A tinted
 * outline reads one tier below a solid fill, so these stay clearly secondary
 * instead of flattening the hierarchy — which is the usual cost of making every
 * link look important.
 */
export function CtaLink({
  href,
  children,
  tone = 'dark',
  size = 'md',
  as = 'link',
  className,
}: {
  href?: string;
  children: ReactNode;
  /** `dark` = dark text on a light ground. `light` = on navy/ink. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'md';
  /**
   * `span` for the one case that sits inside a parent `<Link>` (the featured
   * post card). An anchor or button nested in an anchor is invalid HTML and the
   * click would bubble to both.
   */
  as?: 'link' | 'span';
  className?: string;
}) {
  const classes = cn(
    'group/cta inline-flex items-center gap-2 rounded-full border font-semibold transition-all duration-300 ease-out-expo',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
    size === 'sm' ? 'px-3.5 py-1.5 text-caption' : 'px-4 py-2 text-sm',
    /*
     * These four numbers are measured, not chosen.
     *
     * The border is what identifies this as something you can press, so WCAG
     * 1.4.11 wants 3:1 against the page. cyan-600 only clears it at full
     * opacity — /30 reads 1.41:1, /80 still only 2.58:1 — which is why there is
     * no alpha on it.
     *
     * The fill pulls the other way: every step darker drags the cyan-700 label
     * closer to it. /07 leaves the text at 4.60:1; /10 already fails 4.5:1. So
     * the fill stays light and the hover deepens it only alongside a darker
     * cyan-800 label, which buys the headroom back (6.01:1).
     */
    tone === 'light'
      ? 'border-cyan-300/70 bg-cyan-300/[0.08] text-cyan-300 hover:border-cyan-300 hover:bg-cyan-300/[0.16]'
      : 'border-cyan-600 bg-cyan-500/[0.07] text-cyan-700 hover:border-cyan-700 hover:bg-cyan-500/[0.12] hover:text-cyan-800 hover:shadow-sm dark:border-cyan-400/70 dark:bg-cyan-400/[0.08] dark:text-cyan-400 dark:hover:border-cyan-400 dark:hover:bg-cyan-400/[0.16] dark:hover:text-cyan-300',
    className,
  );

  const content = (
    <>
      {children}
      {/* The arrow leaves in the direction it is pointing. `group/cta` is named
          because these sit inside cards that already claim `group`. */}
      <ArrowUpRight
        className="h-4 w-4 shrink-0 transition-transform duration-300 ease-out-expo group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
        aria-hidden
      />
    </>
  );

  if (as === 'span' || !href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

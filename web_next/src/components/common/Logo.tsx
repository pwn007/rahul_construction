'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { SITE } from '@/constants/site';

export type LogoTone = 'auto' | 'light' | 'dark';

/**
 * The mark's geometry, exported so it has exactly one definition.
 *
 * The hero's construction scene draws this same mark as *stroked* line-work on
 * the house it builds, and a second copy of the path data there would drift
 * from the brand the first time either changed. Both shapes are closed and
 * neither self-intersects, so they outline cleanly.
 *
 * ── Watch the artboard ──────────────────────────────────────────────────────
 * The ink bounding box is `4 4 30 36`, **not** the 44×44 viewBox — there are 10
 * units of slack on the right and 4 on the other three sides. Anything scaling
 * this by `size / 44` gets an undersized, off-centre mark with a phantom right
 * margin. Translate to the ink origin first.
 *
 * ── And the gutter ──────────────────────────────────────────────────────────
 * The two shapes are separated by a 4-unit vertical gutter and never touch.
 * That gutter is what reads as the abstract "N"; scaled down far enough with a
 * heavy stroke it closes up and the mark becomes a blob.
 */
export const MARK_PATHS = {
  leading: 'M4 4h13v20L4 30V4Z',
  trailing: 'M21 10h13v20a10 10 0 0 1-10 10h-3V10Z',
} as const;

/**
 * The mark from the portfolio cover: two offset parallelograms forming
 * an abstract "N" / building mass.
 *
 * The leading shape is always cyan (legible on any ground). The trailing shape
 * carries the tone — it must never be navy-on-dark, which is what made the
 * wordmark disappear over the dark hero.
 */
export function LogoMark({ className, tone = 'auto' }: { className?: string; tone?: LogoTone }) {
  const trailing =
    tone === 'light' ? 'text-white' : tone === 'dark' ? 'text-navy-800' : 'text-navy-800 dark:text-white';

  return (
    <svg viewBox="0 0 44 44" className={cn('h-9 w-9', className)} fill="none" aria-hidden>
      <path d={MARK_PATHS.leading} fill="currentColor" className="text-cyan-500" />
      <path d={MARK_PATHS.trailing} fill="currentColor" className={trailing} />
    </svg>
  );
}

export function Logo({
  className,
  compact,
  tone = 'auto',
}: {
  className?: string;
  compact?: boolean;
  tone?: LogoTone;
}) {
  const wordTone =
    tone === 'light' ? 'text-white' : tone === 'dark' ? 'text-navy-800' : 'text-navy-800 dark:text-white';

  return (
    <Link href="/" className={cn('group flex items-center gap-2.5', className)} aria-label={`${SITE.name} — home`}>
      <LogoMark
        tone={tone}
        className="h-9 w-9 shrink-0 transition-transform duration-500 ease-out-expo group-hover:rotate-[-6deg]"
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn('font-display text-[1.35rem] font-semibold tracking-tight transition-colors', wordTone)}>
            {SITE.wordmark.primary}
          </span>
          <span className="mt-0.5 font-display text-[0.6rem] font-medium tracking-[0.32em] text-cyan-500">
            {SITE.wordmark.secondary}
          </span>
        </span>
      )}
    </Link>
  );
}

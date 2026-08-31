'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui';
import { formatCurrencyCompact, formatNumber } from '@/lib/format';
import { workHeadsFor } from '@/constants/work-heads';
import type { PackageComparison } from '../model';

/**
 * One package, priced for this visitor, with the work it buys listed under it.
 *
 * Deliberately not `components/common/PackageCard`. That one renders the
 * *published band* (₹1,200–1,400/sq ft) on the marketing pages and links away to
 * this wizard; this one renders the visitor's own rupees for their own area and
 * is a control rather than a link. Teaching one component both jobs would give it
 * two mutually exclusive modes and let a change to the wizard break the homepage.
 *
 * The number is a range, not a point. Every calculator in this market that shows
 * a single fake-precise figure is setting up a dispute it will lose later, and
 * the ones that convert best — Livspace, Brick&Bolt — all show a band.
 */
export function PackagePriceCard({
  row,
  selected,
  popular,
  onSelect,
  /** Total work heads across all packages, so the "+N more" reads honestly. */
  maxHeads,
}: {
  row: PackageComparison;
  selected: boolean;
  popular?: boolean;
  onSelect: () => void;
  maxHeads: number;
}) {
  const heads = workHeadsFor(row.key);
  const priced = row.total > 0;

  /* Six is what fits above the fold on a phone without the card becoming a wall.
     The full list is one tap away in the comparison below, and the count says
     plainly how much is not being shown. */
  const shown = heads.slice(0, 6);
  const hidden = heads.length - shown.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex h-full w-[86vw] shrink-0 snap-center flex-col rounded-2xl border-2 p-6 text-left transition-all duration-300 sm:w-[20rem] lg:w-auto',
        selected
          ? 'border-cyan-500 bg-cyan-500/[0.06] shadow-glow'
          : 'surface border-[rgb(var(--c-border))] hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-md',
      )}
    >
      {popular && !selected && (
        <span className="absolute -top-3 left-6 rounded-full bg-navy-800 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-white dark:bg-cyan-500">
          Most chosen
        </span>
      )}
      {selected && (
        <span className="absolute -top-3 left-6">
          <Badge variant="brand" size="sm" className="bg-cyan-500 text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
            Selected
          </Badge>
        </span>
      )}

      <p className="text-caption uppercase tracking-wide text-subtle">{row.pkg.headline}</p>
      <h3 className="mt-1 font-display text-heading-lg font-semibold">{row.pkg.label}</h3>

      <p className="num mt-5 text-2xl font-semibold leading-none">
        {priced ? (
          <>
            {formatCurrencyCompact(row.result.min)}
            <span className="mx-1 font-normal text-subtle">–</span>
            {formatCurrencyCompact(row.result.max)}
          </>
        ) : (
          <span className="text-subtle">—</span>
        )}
      </p>
      <p className="num mt-1.5 text-caption text-muted">
        {priced ? (
          <>
            ₹{formatNumber(Math.round(row.perSqft))} / sq ft
            {row.delta > 0 && (
              <span className="text-subtle"> · {formatCurrencyCompact(row.delta)} more</span>
            )}
          </>
        ) : (
          'Enter your area to price this'
        )}
      </p>

      <p className="mt-4 text-caption leading-relaxed text-muted">{row.pkg.description}</p>

      <ul className="mt-5 flex-1 space-y-2.5 border-t pt-5">
        {shown.map((head) => (
          <li key={head.key} className="flex items-start gap-2.5 text-caption">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" strokeWidth={3} />
            <span className="min-w-0">
              <span className="block leading-snug">{head.label}</span>
              {head.hindi && <span className="block font-deva text-[0.6875rem] text-subtle">{head.hindi}</span>}
            </span>
          </li>
        ))}
        {hidden > 0 && (
          <li className="flex items-start gap-2.5 text-caption text-subtle">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} />
            and {hidden} more
          </li>
        )}
        {/* What it does NOT buy, named. A checklist of only ticks tells you
            nothing about the choice you are being asked to make. */}
        {heads.length < maxHeads && (
          <li className="flex items-start gap-2.5 pt-1 text-caption text-subtle">
            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {maxHeads - heads.length} things this does not include
          </li>
        )}
      </ul>

      {/* A span, not a Button. The whole card is the control — nesting a real
          button inside a button is invalid markup and gives the row two tab
          stops for one choice. */}
      <span
        className={cn(
          'mt-6 flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors',
          selected
            ? 'bg-cyan-500 text-white'
            : 'border bg-[rgb(var(--c-surface-2))] group-hover:border-cyan-500 group-hover:text-cyan-700 dark:group-hover:text-cyan-300',
        )}
      >
        {selected ? 'Selected' : 'Choose this'}
      </span>
    </button>
  );
}

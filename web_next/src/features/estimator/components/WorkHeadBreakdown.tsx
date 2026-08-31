'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COST_HEADS } from '@/constants/estimator';
import { QUANTITY_UNIT_LABEL } from '@/constants/materials';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { EstimateResult, WorkHeadResult } from '../model';

/**
 * "What the work includes" — the third view of the same total.
 *
 * The commercial split answers *what am I paying for* (materials, labour, design,
 * approvals). The donut answers *which trade* (structure, finishing, MEPF,
 * interiors). Neither answers the question the client actually gets asked, which
 * is *what will happen on my site* — is khudai included, who pays for the
 * shuttering, is the staircase in this number.
 *
 * It is a re-partition of `total`, not an addition to it: see `computeWorkHeads`.
 * That is why this is its own card with its own footer rather than a disclosure
 * inside the commercial split — the material breakdown there sums to the
 * *Materials head*, this sums to the *total*, and two different denominators
 * inside one panel is exactly the arithmetic-that-disagrees-with-itself failure
 * the estimator exists to avoid.
 *
 * Rows are collapsed by default. Nineteen open accordions is a wall of text, and
 * the competitor whose comparison table runs forty rows unfolded is the reason
 * this screen has a disclosure at all.
 */
export function WorkHeadBreakdown({ result }: { result: EstimateResult }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!result.workHeads.length) return null;

  /* Grouped by construction head so nineteen rows read as five sections. Order
     follows COST_HEADS, and any head with no work in this scope disappears. */
  const groups = COST_HEADS.map((cost) => ({
    ...cost,
    rows: result.workHeads.filter((h) => h.costHead === cost.key),
  })).filter((g) => g.rows.length > 0);

  const footTotal = result.workHeads.reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="surface rounded-xl border">
      <div className="border-b p-6">
        <h3 className="font-display text-heading-lg font-semibold">What the work includes</h3>
        <p className="mt-1.5 text-caption text-muted">
          Every stage of the build, from excavation to handover — tap any row to see what it covers and what it
          costs. These add up to the same total above, split a different way.
        </p>
      </div>

      <div className="divide-y">
        {groups.map((group) => {
          const subtotal = group.rows.reduce((sum, h) => sum + h.amount, 0);

          return (
            <div key={group.key}>
              <div className="flex items-baseline justify-between gap-3 bg-[rgb(var(--c-surface-2))] px-6 py-2.5">
                <p className="flex items-center gap-2 text-overline uppercase text-subtle">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} aria-hidden />
                  {group.label}
                </p>
                <p className="num text-caption font-medium text-muted">{formatCurrency(subtotal)}</p>
              </div>

              <div className="divide-y">
                {group.rows.map((head) => (
                  <WorkHeadRow
                    key={head.key}
                    head={head}
                    color={group.color}
                    open={open === head.key}
                    onToggle={() => setOpen(open === head.key ? null : head.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t px-6 py-4">
        <p className="text-[0.9375rem] font-semibold">Total</p>
        <p className="num font-semibold">{formatCurrency(footTotal)}</p>
      </div>
    </div>
  );
}

function WorkHeadRow({
  head,
  color,
  open,
  onToggle,
}: {
  head: WorkHeadResult;
  color: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[rgb(var(--c-surface-2))]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-medium leading-tight">{head.label}</span>
              {/*
                The Devanagari gloss, not a translation of the whole UI.
                "Excavation" and "plinth beam" are trade English; a homeowner in
                Jaipur reads "khudai" instantly and the English word slowly. Only
                the work names carry it — the rest of the site stays as it is.
              */}
              {head.hindi && (
                <span className="mt-0.5 block font-deva text-caption text-subtle">{head.hindi}</span>
              )}
            </span>
            <span className="num shrink-0 font-semibold">{formatCurrency(head.amount)}</span>
          </span>

          <span className="mt-2 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgb(var(--c-text))]/[0.07]">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, head.percent)}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
            <span className="num w-11 shrink-0 text-right text-caption text-subtle">
              {head.percent.toFixed(1)}%
            </span>
          </span>
        </span>

        <Plus className={cn('h-4 w-4 shrink-0 text-subtle transition-transform', open && 'rotate-45')} aria-hidden />
      </button>

      {open && (
        <div className="border-t bg-[rgb(var(--c-surface-2))] px-6 py-5">
          <p className="text-caption leading-relaxed text-muted">{head.blurb}.</p>

          {head.detail && (
            <ul className="mt-3 space-y-1.5">
              {head.detail.map((d) => (
                <li key={d} className="flex items-start gap-2 text-caption text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[rgb(var(--c-text-subtle))]" aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          )}

          {head.lines.length > 0 ? (
            <ul className="mt-4 divide-y divide-dashed border-t pt-1">
              {head.lines.map((line) => (
                <li key={line.key} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-caption font-medium">{line.label}</span>
                      <span className="text-caption text-subtle">
                        {line.spec}
                        {line.provisional && ' *'}
                      </span>
                    </span>
                    <span className="num block text-caption text-subtle">
                      {formatNumber(line.quantity)} {QUANTITY_UNIT_LABEL[line.unit]} @ ₹
                      {formatNumber(Math.round(line.unitRate))}
                    </span>
                  </span>
                  <span className="num shrink-0 text-caption font-medium">{formatCurrency(line.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            /*
              Said out loud, because an empty list and a forgotten list look the
              same. Excavation, plaster and the site overheads genuinely buy no
              branded product — their cost is labour, plant and time, and it is
              already inside this number rather than missing from it.
            */
            head.labourAndPlant && (
              <p className="mt-4 flex items-start gap-2 border-t pt-3 text-caption leading-relaxed text-subtle">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Labour, plant and time — this work buys no branded material, so there is nothing to itemise
                  against a brand. Its cost is carried in the labour and site heads of the total.
                </span>
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

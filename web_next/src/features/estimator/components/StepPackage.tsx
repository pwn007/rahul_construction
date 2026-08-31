'use client';

import { useMemo, useState } from 'react';
import { Check, Info, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Switch } from '@/components/ui';
import { WORK_HEADS, headInPackage } from '@/constants/work-heads';
import { PACKAGES, type PackageKey } from '@/constants/estimator';
import { track } from '@/lib/analytics';
import { comparePackages, packageDefaults, type EstimatorInput } from '../model';
import { PackagePriceCard } from './PackagePriceCard';
import { StepHeading } from './Steps';

type Patch = (patch: Partial<EstimatorInput>) => void;

/**
 * Which of the three are we building?
 *
 * The estimator used to derive this from the materials and never ask, on the
 * reasoning that "semi-furnished" is a contract term rather than a question a
 * homeowner can answer. That is true of the *word* and false of the *choice*:
 * nobody struggles to answer "do you want a house you can move into, or a
 * structure you will finish yourself" once the three are priced side by side.
 * What made it unanswerable was asking it as vocabulary, with no number attached.
 *
 * So the whole screen is three prices and what each one buys. There is no form
 * field on it — one tap and the visitor is through — and the three numbers are
 * this visitor's own, for their own area and locality, not a published band.
 */
export function StepPackage({
  input,
  patch,
  stepLabel,
}: {
  input: EstimatorInput;
  patch: Patch;
  stepLabel: string;
}) {
  const [differencesOnly, setDifferencesOnly] = useState(true);
  const rows = useMemo(() => comparePackages(input), [input]);

  const maxHeads = WORK_HEADS.length;

  const choose = (key: PackageKey) => {
    /*
     * Replace, never merge.
     *
     * Tap Fully Furnished, then tap Semi Furnished, and a merge would leave a
     * modular kitchen and a set of wardrobes silently priced inside an estimate
     * headed "Semi Furnished" — lakhs of rupees nobody agreed to, under a label
     * that says they are not there. Replacing is the only behaviour a visitor can
     * predict from the outside.
     */
    track('estimator_package_select', {
      package: key,
      switchedFrom: input.packageKey ?? 'none',
      perSqft: Math.round(rows.find((r) => r.key === key)?.perSqft ?? 0),
    });
    patch({ packageKey: key, materials: packageDefaults(key) });
  };

  /* Rows where all three packages agree tell the visitor nothing about the choice
     in front of them. The competitor whose comparison runs forty undifferentiated
     rows is exactly the failure this toggle exists to avoid. */
  const visibleHeads = differencesOnly ? WORK_HEADS.filter((h) => h.minPackage !== 'civil') : WORK_HEADS;

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="Which of these are we building?"
        lead="Three scopes, priced for your building. Pick one — you can change every material on the next screen."
      />

      {/*
        Desktop gets three columns; a phone gets a swipeable rail with snap points.

        Squeezing a three-column comparison into 360px is the most common mistake
        in this category — the numbers end up at 11px and the checklists wrap to
        six lines each. The rail is the same pattern the material strip already
        uses on the next step, so the gesture is one the visitor has just learned.
      */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 pt-3 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {rows.map((row) => (
          <PackagePriceCard
            key={row.key}
            row={row}
            selected={input.packageKey === row.key}
            popular={row.key === 'semi-furnished'}
            onSelect={() => choose(row.key)}
            maxHeads={maxHeads}
          />
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-caption leading-relaxed text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Each figure prices that package at our standard specification for your area and locality. Nothing here
          is a quotation — you will see the full breakdown, and can change every material, on the next screen.
        </span>
      </p>

      {/* ---- Comparison ---- */}
      <div className="surface mt-8 rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div className="min-w-0">
            <h3 className="font-display text-heading-md font-semibold">What changes between them</h3>
            <p className="mt-1 text-caption text-muted">
              {differencesOnly
                ? 'Only the work that differs. Everything hidden is in all three.'
                : 'Every stage of the build, across all three packages.'}
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-3 text-caption text-muted">
            Only what differs
            <Switch checked={differencesOnly} onChange={setDifferencesOnly} label="Show only differences" />
          </label>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3.5 pl-5 pr-4 text-left font-medium text-subtle">Work</th>
                {PACKAGES.map((p) => (
                  <th key={p.key} className="px-4 py-3.5 text-center">
                    <span
                      className={cn(
                        'block font-display text-[0.9375rem] font-semibold',
                        input.packageKey === p.key && 'text-cyan-700 dark:text-cyan-400',
                      )}
                    >
                      {p.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleHeads.map((head) => (
                <tr key={head.key} className="border-b last:border-0">
                  <td className="py-3 pl-5 pr-4">
                    <span className="block text-muted">{head.label}</span>
                    {head.hindi && <span className="block font-deva text-caption text-subtle">{head.hindi}</span>}
                  </td>
                  {PACKAGES.map((p) => (
                    <td key={p.key} className="px-4 py-3 text-center">
                      {headInPackage(head, p.key) ? (
                        <Check className="mx-auto h-4 w-4 text-cyan-500" strokeWidth={3} />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-[rgb(var(--c-text-subtle))]/40" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stacked equivalent for phones — the same source, never a squeezed table. */}
        <ul className="divide-y md:hidden">
          {visibleHeads.map((head) => (
            <li key={head.key} className="p-5">
              <p className="font-medium">{head.label}</p>
              {head.hindi && <p className="font-deva text-caption text-subtle">{head.hindi}</p>}
              <dl className="mt-3 space-y-2">
                {PACKAGES.map((p) => (
                  <div key={p.key} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-muted">{p.label}</dt>
                    <dd className="flex items-center gap-1.5 text-caption text-subtle">
                      {headInPackage(head, p.key) ? (
                        <>
                          <Check className="h-4 w-4 text-cyan-500" strokeWidth={3} />
                          Included
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-[rgb(var(--c-text-subtle))]/50" />
                          Not included
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

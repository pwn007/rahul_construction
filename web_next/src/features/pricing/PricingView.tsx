'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Check, Info, Minus, Plus } from 'lucide-react';
import { CtaBand, PackagePlans, PageHero, SectionHeader } from '@/components/common';
import { Accordion, Badge } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { COST_HEADS, PACKAGES, type PackageKey } from '@/constants/estimator';
import { WORK_HEADS, headInPackage, type WorkHead } from '@/constants/work-heads';
import { useFaqs } from '@/hooks/useFaqs';
import { formatNumber } from '@/lib/format';

/**
 * Generated from the estimator's work heads, plus the promises that have no price.
 *
 * This used to be a hand-written table of booleans, which meant the page telling
 * a visitor what each package contains and the calculator pricing those packages
 * were two independent sources of truth — and they had already drifted: premium
 * elevation and home automation were ticked here as scope while the estimator
 * priced them as optional extras, and loose furniture was ticked as included when
 * it is a paid opt-in. Driving the ticks from `WORK_HEADS` makes what is shown and
 * what is priced the same thing by construction.
 *
 * Three states, not two. A boolean cannot distinguish "in the package" from
 * "available, and priced separately", and collapsing those two was how the drift
 * above went unnoticed. `Minus` for excluded, `Check` for included, `Plus` for
 * available as an extra.
 */
type Cell = 'included' | 'optional' | 'excluded';

function CellMark({ state }: { state: Cell }) {
  if (state === 'included') return <Check className="mx-auto h-4 w-4 text-cyan-500" strokeWidth={3} />;
  if (state === 'optional') return <Plus className="mx-auto h-4 w-4 text-[rgb(var(--c-text-subtle))]" />;
  return <Minus className="mx-auto h-4 w-4 text-[rgb(var(--c-text-subtle))]/40" />;
}

const cellFor = (head: WorkHead, pkg: PackageKey): Cell =>
  headInPackage(head, pkg) ? 'included' : 'excluded';

/**
 * What the firm commits to on every package, with no rupee amount attached.
 *
 * Deliberately not work heads: supervision has a cost and a weight, but a
 * ten-year structural warranty is a promise, not a line in a BOQ. Forcing it into
 * the priced model to make this table symmetric would have put a number on
 * something that does not have one.
 */
const SERVICE_PROMISES = [
  'On-site supervision by a project engineer',
  'Live camera access and weekly progress reports',
  'Stage-wise quality sign-off before payment',
  'One year of free maintenance after handover',
];

/**
 * Optional extras, shown so the table cannot imply they are included.
 *
 * These are `ENHANCEMENTS` in the estimator — priced individually, on top of any
 * package. Loose furniture is the same shape and lives with them.
 */
const OPTIONAL_ROWS: { label: string; note: string }[] = [
  { label: 'Premium elevation treatment', note: 'Priced per sq ft as an extra' },
  { label: 'Home automation', note: 'Priced as an extra' },
  { label: 'Rooftop solar, lift, central HVAC', note: 'Priced individually as extras' },
  { label: 'Boundary wall, gate and landscaping', note: 'Priced per plot as an extra' },
  { label: 'Loose furniture, curtains and appliances', note: 'Allowance-based, on top of Fully Furnished' },
];

export function PricingView() {
  const faqs = useFaqs();
  const [model, setModel] = useState<'turnkey' | 'labour-only'>('turnkey');
  const pricingFaqs = faqs.filter((f) => f.category === 'pricing');

  return (
    <>
      <PageHero
        overline="Pricing"
        title="Published rates. No hidden costs."
        lead="Two service models, three packages each. Every rate below is the rate we quote — what changes is the specification, not the arithmetic."
        breadcrumbs={[{ label: 'Pricing' }]}
        aside={
          <div className="space-y-3">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.key}
                className="surface flex items-center justify-between gap-4 rounded-xl border p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-caption uppercase tracking-wide text-subtle">{pkg.headline}</p>
                  <p className="font-display text-heading-md font-semibold">{pkg.label}</p>
                </div>
                <p className="num shrink-0 text-right text-lg font-semibold text-navy-800 dark:text-white">
                  ₹{formatNumber(pkg.minRate)}–{formatNumber(pkg.maxRate)}
                  <span className="block text-caption font-normal text-subtle">per sq ft · turnkey</span>
                </p>
              </div>
            ))}
            <p className="pt-1 text-caption text-subtle">
              Labour-only rates start at ₹100/sq ft. Both models compared below.
            </p>
          </div>
        }
      />

      <section className="section-sm">
        <div className="container">
          <PackagePlans model={model} onModelChange={setModel} />

          <Reveal delay={0.2}>
            <div className="mt-8 flex items-start gap-3 rounded-lg border border-dashed p-5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
              <p className="text-caption leading-relaxed text-muted">
                {model === 'labour-only'
                  ? 'Labour-only rates cover execution and supervision. All materials are procured by you. '
                  : 'Turnkey rates are indicative and vary with site conditions, locality and specification. '}
                GST is charged as applicable and is not included. Government approvals, JDA and municipal
                development charges are excluded. Final cost is confirmed against approved drawings and a signed BOQ.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Inclusion matrix */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Compare" title="Exactly what is in each package" lead="Generated from the same work heads the estimator prices, so what is listed here is what the calculator charges for. A tick is included; a plus is available and priced separately." />

          {/*
            Two renderings of one source.

            A 640px minimum on a 360px phone means dragging sideways to answer
            "is MEPF included" — the one question this table exists for. Below
            `md` each scope item becomes a card with the three packages listed
            under it. `hidden`/`md:hidden` rather than CSS-only tricks, so only
            one of the two is ever in the accessibility tree.
          */}
          <div className="mt-10 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-4 pr-4 text-left font-medium text-subtle">Scope item</th>
                  {PACKAGES.map((p) => (
                    <th key={p.key} className="px-4 py-4 text-center">
                      <span className="block font-display text-heading-md font-semibold">{p.label}</span>
                      <span className="num mt-0.5 block text-caption font-normal text-subtle">
                        {model === 'turnkey' ? `₹${formatNumber(p.minRate)}–${formatNumber(p.maxRate)}` : `₹${p.labourOnlyRate}`}/sq ft
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COST_HEADS.map((cost) => {
                  const heads = WORK_HEADS.filter((h) => h.costHead === cost.key);
                  if (!heads.length) return null;
                  return (
                    <Fragment key={cost.key}>
                      <tr className="bg-[rgb(var(--c-text))]/[0.03]">
                        <td colSpan={4} className="px-1 py-2.5 text-overline uppercase text-subtle">
                          {cost.label}
                        </td>
                      </tr>
                      {heads.map((head) => (
                        <tr key={head.key} className="border-b last:border-0">
                          <td className="py-3.5 pr-4">
                            <span className="block text-muted">{head.label}</span>
                            {head.hindi && (
                              <span className="block font-deva text-caption text-subtle">{head.hindi}</span>
                            )}
                          </td>
                          {PACKAGES.map((p) => (
                            <td key={p.key} className="px-4 py-3.5 text-center">
                              <CellMark state={cellFor(head, p.key)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}

                <tr className="bg-[rgb(var(--c-text))]/[0.03]">
                  <td colSpan={4} className="px-1 py-2.5 text-overline uppercase text-subtle">
                    Service &amp; support
                  </td>
                </tr>
                {SERVICE_PROMISES.map((promise) => (
                  <tr key={promise} className="border-b last:border-0">
                    <td className="py-3.5 pr-4 text-muted">{promise}</td>
                    {PACKAGES.map((p) => (
                      <td key={p.key} className="px-4 py-3.5 text-center">
                        <CellMark state="included" />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-[rgb(var(--c-text))]/[0.03]">
                  <td colSpan={4} className="px-1 py-2.5 text-overline uppercase text-subtle">
                    Available on any package, priced separately
                  </td>
                </tr>
                {OPTIONAL_ROWS.map((row) => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-3.5 pr-4">
                      <span className="block text-muted">{row.label}</span>
                      <span className="block text-caption text-subtle">{row.note}</span>
                    </td>
                    {PACKAGES.map((p) => (
                      <td key={p.key} className="px-4 py-3.5 text-center">
                        <CellMark state="optional" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked equivalent, phones and small tablets. */}
          <div className="mt-8 space-y-6 md:hidden">
            {COST_HEADS.map((cost) => {
              const heads = WORK_HEADS.filter((h) => h.costHead === cost.key);
              if (!heads.length) return null;
              return (
                <div key={cost.key}>
                  <p className="text-overline uppercase text-subtle">{cost.label}</p>
                  <ul className="mt-3 space-y-3">
                    {heads.map((head) => (
                      <li key={head.key} className="surface rounded-xl border p-4 shadow-sm">
                        <p className="font-medium">{head.label}</p>
                        {head.hindi && <p className="font-deva text-caption text-subtle">{head.hindi}</p>}
                        <dl className="mt-3 space-y-2">
                          {PACKAGES.map((pkg) => (
                            <div key={pkg.key} className="flex items-center justify-between gap-3 text-sm">
                              <dt className="text-muted">{pkg.label}</dt>
                              <dd className="flex items-center gap-1.5">
                                <CellMark state={cellFor(head, pkg.key)} />
                                <span className="text-caption text-subtle">
                                  {cellFor(head, pkg.key) === 'included' ? 'Included' : 'Not included'}
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div>
              <p className="text-overline uppercase text-subtle">Service &amp; support</p>
              <ul className="mt-3 space-y-2">
                {SERVICE_PROMISES.map((promise) => (
                  <li key={promise} className="surface flex items-start gap-2.5 rounded-xl border p-4 text-sm shadow-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={3} />
                    <span className="text-muted">{promise} — on every package</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-overline uppercase text-subtle">Available on any package, priced separately</p>
              <ul className="mt-3 space-y-2">
                {OPTIONAL_ROWS.map((row) => (
                  <li key={row.label} className="surface flex items-start gap-2.5 rounded-xl border p-4 text-sm shadow-sm">
                    <Plus className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
                    <span className="min-w-0">
                      <span className="block text-muted">{row.label}</span>
                      <span className="block text-caption text-subtle">{row.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Which model chooser */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Decide" title="Which model is right for you?" align="center" />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Choose turnkey if…',
                tone: 'brand' as const,
                points: [
                  'Your time is worth more than the material margin',
                  'You live away from Jaipur, or travel often',
                  'You want one contract and one accountable party',
                  'You would rather not learn cement grades',
                  'You value a fixed programme over a lower unit rate',
                ],
              },
              {
                title: 'Choose labour-only if…',
                tone: 'default' as const,
                points: [
                  'You can visit site at least once a week, every week',
                  'Someone in the family understands materials',
                  'You have the cash flow to buy in bulk at the right moment',
                  'You have storage and can manage deliveries',
                  'The 8–12% saving genuinely matters to your budget',
                ],
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.1}>
                <div className="surface h-full rounded-xl border p-8 shadow-sm">
                  <Badge variant={card.tone} size="lg">
                    {card.title}
                  </Badge>
                  <ul className="mt-6 space-y-3">
                    {card.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={2.5} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.25}>
            <p className="mx-auto mt-8 max-w-lead text-center text-muted">
              The honest test: if you cannot commit one site visit a week for the full duration, take turnkey.
              The labour model does not save money for an absent owner.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-sm">
        <div className="container max-w-4xl">
          <SectionHeader overline="Questions" title="About pricing" align="center" />
          <div className="mt-10">
            <Accordion items={pricingFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
          <p className="mt-8 text-center text-caption text-subtle">
            Still unsure?{' '}
            <Link href={ROUTES.contact} className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">
              Ask us directly
            </Link>{' '}
            — we answer within one working day.
          </p>
        </div>
      </section>

      <CtaBand
        title="Get your number in two minutes"
        lead="The estimator uses these exact rates, adjusted for your plot, locality and specification."
        primary={{ label: 'Open the estimator', href: ROUTES.estimator }}
        secondary={{ label: 'Download rate card', href: ROUTES.downloads }}
      />
    </>
  );
}

import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, Minus } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { CtaBand, PackagePlans, PageHero, SectionHeader } from '@/components/common';
import { Accordion, Badge } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { PACKAGES } from '@/constants/estimator';
import { faqs } from '@/data/content';
import { formatNumber } from '@/lib/format';

/** Inclusion matrix — derived from the client's published packages (Port1.pdf p.14–15). */
const MATRIX: { group: string; rows: { label: string; civil: boolean; semi: boolean; full: boolean }[] }[] = [
  {
    group: 'Structure',
    rows: [
      { label: 'Excavation, foundation & footings', civil: true, semi: true, full: true },
      { label: 'RCC frame, columns, beams & slabs', civil: true, semi: true, full: true },
      { label: 'Brickwork & internal partitions', civil: true, semi: true, full: true },
      { label: 'Roofing & terrace slab', civil: true, semi: true, full: true },
      { label: 'Waterproofing (terrace & wet areas)', civil: false, semi: true, full: true },
    ],
  },
  {
    group: 'Finishes',
    rows: [
      { label: 'Internal & external plaster', civil: false, semi: true, full: true },
      { label: 'Flooring & wall tiling', civil: false, semi: true, full: true },
      { label: 'Doors, windows & frames', civil: false, semi: true, full: true },
      { label: 'Painting — internal & external', civil: false, semi: true, full: true },
      { label: 'Premium elevation treatment', civil: false, semi: false, full: true },
    ],
  },
  {
    group: 'Services (MEPF)',
    rows: [
      { label: 'Electrical conduiting & wiring', civil: false, semi: true, full: true },
      { label: 'Plumbing supply & drainage', civil: false, semi: true, full: true },
      { label: 'Sanitary ware & CP fittings', civil: false, semi: true, full: true },
      { label: 'Light fittings & fixtures', civil: false, semi: false, full: true },
      { label: 'Home automation readiness', civil: false, semi: false, full: true },
    ],
  },
  {
    group: 'Interiors',
    rows: [
      { label: 'Modular kitchen', civil: false, semi: false, full: true },
      { label: 'Designer wardrobes & joinery', civil: false, semi: false, full: true },
      { label: 'False ceiling & cove lighting', civil: false, semi: false, full: true },
      { label: 'Loose furniture & styling', civil: false, semi: false, full: true },
    ],
  },
  {
    group: 'Service & support',
    rows: [
      { label: 'On-site supervision by engineer', civil: true, semi: true, full: true },
      { label: 'Live camera access & weekly reports', civil: true, semi: true, full: true },
      { label: 'Stage-wise quality sign-off', civil: true, semi: true, full: true },
      { label: '1 year free maintenance', civil: true, semi: true, full: true },
    ],
  },
];

export default function PricingPage() {
  const [model, setModel] = useState<'turnkey' | 'labour-only'>('turnkey');
  const pricingFaqs = faqs.filter((f) => f.category === 'pricing');

  return (
    <>
      <Seo
        title="Pricing & Packages — Transparent Construction Rates"
        description="Labour-only and turnkey construction rates for Jaipur. Civil ₹1,200–1,400, semi-furnished ₹1,800–2,200 and fully furnished ₹2,500–3,000 per sq ft."
      />

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
          <SectionHeader overline="Compare" title="Exactly what is in each package" lead="No asterisks. If it is not ticked, it is not included." />

          <div className="mt-10 overflow-x-auto">
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
                {MATRIX.map((group) => (
                  <Fragment key={group.group}>
                    <tr className="bg-[rgb(var(--c-text))]/[0.03]">
                      <td colSpan={4} className="px-1 py-2.5 text-overline uppercase text-subtle">
                        {group.group}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="py-3.5 pr-4 text-muted">{row.label}</td>
                        {[row.civil, row.semi, row.full].map((included, i) => (
                          <td key={i} className="px-4 py-3.5 text-center">
                            {included ? (
                              <Check className="mx-auto h-4 w-4 text-cyan-500" strokeWidth={3} />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-[rgb(var(--c-text-subtle))]/40" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
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
            <Link to={ROUTES.contact} className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">
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

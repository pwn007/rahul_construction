'use client';

import { Compass, Check } from 'lucide-react';
import { CtaBand, PageHero, SectionHeader } from '@/components/common';
import { Accordion, Badge } from '@/components/ui';
import { MaskImage, Reveal, SplitText, StaggerGroup } from '@/components/motion';
import { SITE, VASTU_BENEFITS } from '@/constants/site';
import { faqs } from '@/data/content';
import { IMG } from '@/lib/media';

/** Direction-wise placement — the substance behind the differentiator. */
const DIRECTIONS = [
  { dir: 'North-East', hindi: 'ईशान', element: 'Water', place: 'Pooja room, water storage, main entrance (preferred)', avoid: 'Toilets, heavy storage, kitchen', angle: 45 },
  { dir: 'East', hindi: 'पूर्व', element: 'Air', place: 'Living room, main entrance, windows', avoid: 'Heavy mass, staircase', angle: 90 },
  { dir: 'South-East', hindi: 'आग्नेय', element: 'Fire', place: 'Kitchen, electrical panel, generator', avoid: 'Master bedroom, pooja room', angle: 135 },
  { dir: 'South', hindi: 'दक्षिण', element: 'Earth', place: 'Bedrooms, heavy walls, storage', avoid: 'Main entrance, open space', angle: 180 },
  { dir: 'South-West', hindi: 'नैऋत्य', element: 'Earth', place: 'Master bedroom, heaviest mass, overhead tank', avoid: 'Entrance, underground water, open courtyard', angle: 225 },
  { dir: 'West', hindi: 'पश्चिम', element: 'Water', place: 'Dining, children\'s bedroom, staircase', avoid: 'Kitchen, pooja room', angle: 270 },
  { dir: 'North-West', hindi: 'वायव्य', element: 'Air', place: 'Guest room, garage, toilets', avoid: 'Master bedroom, kitchen', angle: 315 },
  { dir: 'North', hindi: 'उत्तर', element: 'Water', place: 'Cash/locker, study, open space, windows', avoid: 'Toilets, heavy mass, staircase', angle: 0 },
];

export function VastuView() {
  const vastuFaqs = faqs.filter((f) => f.category === 'vastu' || f.id === 'faq_arch_2');

  return (
    <>
      <PageHero
        overline="Vastu"
        title={SITE.vastuLine}
        lead="We see design as more than construction — it is a balance of energy, space and functionality. Vastu-based planning aligns your space with positive energy, creating an environment that promotes peace, prosperity and a better quality of life."
        breadcrumbs={[{ label: 'Vastu Planning' }]}
        image={IMG.card('vastu-hero')}
      />

      {/* Principle */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal>
                <p className="overline">The principle</p>
              </Reveal>
              <h2 className="mt-4 text-display-md">
                <SplitText text="Plan it. Don't patch it." />
              </h2>
              <Reveal delay={0.15}>
                <div className="mt-6 space-y-4 text-body-lg leading-relaxed text-muted">
                  <p>
                    There is a version of Vastu that improves houses and a version that ruins them. The
                    difference is entirely about <em>when</em> it enters the process.
                  </p>
                  <p>
                    Treated as a constraint at concept stage, Vastu behaves like any other spatial rule — a
                    setback, a sun path, a structural grid. It shapes the plan and costs nothing.
                  </p>
                  <p className="text-[rgb(var(--c-text))]">
                    Applied after the drawings are frozen, the same rules become demolition. The kitchen moves,
                    so the plumbing stack moves, so the bathroom above moves, so the structure no longer works.
                    We have seen clients lose an entire bedroom to a change that would have been free eight
                    weeks earlier.
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <MaskImage src={IMG.card('vastu-plan')} alt="Vastu-aligned floor plan" ratio="aspect-[4/3]" className="rounded-xl" parallax />
              <Reveal delay={0.2}>
                <div className="mt-6 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.05] p-6">
                  <div className="flex items-start gap-3">
                    <Compass className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
                    <p className="text-sm leading-relaxed text-muted">
                      Vastu placement is resolved in our <span className="font-medium text-[rgb(var(--c-text))]">first planning cycle</span> —
                      before elevations, before structure, before anyone falls in love with a drawing. Where
                      something genuinely cannot be reconciled with the site, we say so and explain the
                      trade-off, rather than quietly moving a wall and hoping.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Direction compass */}
      <section className="on-dark grain relative overflow-hidden bg-ink-950 py-20 text-white md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
        <div className="container relative">
          <SectionHeader
            overline="The system"
            title="Direction by direction"
            lead="What belongs where, and what does not. This is the map we plan against."
            tone="light"
            align="center"
          />

          <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Compass diagram */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="relative mx-auto aspect-square w-full max-w-sm">
                  <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Vastu direction compass">
                    <circle cx="100" cy="100" r="92" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="66" fill="none" stroke="rgb(0 187 238 / 0.25)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="34" fill="rgb(0 187 238 / 0.07)" stroke="rgb(0 187 238 / 0.3)" strokeWidth="1" />

                    {DIRECTIONS.map((d) => {
                      const rad = ((d.angle - 90) * Math.PI) / 180;
                      const x1 = 100 + Math.cos(rad) * 34;
                      const y1 = 100 + Math.sin(rad) * 34;
                      const x2 = 100 + Math.cos(rad) * 92;
                      const y2 = 100 + Math.sin(rad) * 92;
                      const lx = 100 + Math.cos(rad) * 79;
                      const ly = 100 + Math.sin(rad) * 79;
                      return (
                        <g key={d.dir}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(255 255 255 / 0.09)" strokeWidth="0.8" />
                          <circle cx={lx} cy={ly} r="12" fill="rgb(5 7 13)" stroke="rgb(0 187 238 / 0.4)" strokeWidth="0.8" />
                          <text x={lx} y={ly + 3} textAnchor="middle" fill="rgb(0 187 238)" fontSize="8" fontFamily="JetBrains Mono, monospace">
                            {d.dir.split('-').map((p) => p[0]).join('')}
                          </text>
                        </g>
                      );
                    })}

                    <text x="100" y="96" textAnchor="middle" fill="white" fontSize="11" fontFamily="Outfit, sans-serif" fontWeight="600">
                      ब्रह्म
                    </text>
                    <text x="100" y="110" textAnchor="middle" fill="rgb(255 255 255 / 0.45)" fontSize="7" fontFamily="Outfit, sans-serif">
                      Keep open
                    </text>
                  </svg>
                </div>
                <p className="mt-6 text-center text-caption text-white/40">
                  The centre (Brahmasthan) is kept free of heavy structure wherever the plan allows.
                </p>
              </Reveal>
            </div>

            {/* Table */}
            <div className="lg:col-span-7">
              <StaggerGroup stagger={0.05} className="space-y-2">
                {DIRECTIONS.map((d) => (
                  <div key={d.dir} className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-cyan-500/30">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-display text-heading-md font-semibold">{d.dir}</h3>
                      <span className="font-deva text-cyan-400">{d.hindi}</span>
                      <Badge variant="outline" size="sm" className="border-white/20 text-white/50">
                        {d.element}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <p className="text-caption leading-relaxed text-white/60">
                        <span className="text-cyan-400">Best for:</span> {d.place}
                      </p>
                      <p className="text-caption leading-relaxed text-white/40">
                        <span className="text-white/60">Avoid:</span> {d.avoid}
                      </p>
                    </div>
                  </div>
                ))}
              </StaggerGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Why Vastu matters" title="What clients tell us changes" align="center" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VASTU_BENEFITS.map((benefit, i) => (
              <Reveal key={benefit} delay={i * 0.08}>
                <div className="surface flex h-full flex-col items-start gap-4 rounded-xl border p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/12 text-cyan-700 dark:text-cyan-400">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  <p className="text-[0.9375rem] leading-relaxed">{benefit}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <p className="mx-auto mt-10 max-w-lead text-center font-deva text-xl text-cyan-700 dark:text-cyan-400">
              सही दिशा, सुखी जीवन
            </p>
            <p className="mt-2 text-center text-caption text-subtle">{SITE.vastuLine}</p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-sm">
        <div className="container max-w-4xl">
          <SectionHeader overline="Questions" title="About Vastu in practice" align="center" />
          <div className="mt-10">
            <Accordion items={vastuFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </div>
      </section>

      <CtaBand
        title="Want your plan checked against Vastu?"
        lead="Send us your plot dimensions and orientation — we will tell you what works and what needs to move, before you commit."
      />
    </>
  );
}

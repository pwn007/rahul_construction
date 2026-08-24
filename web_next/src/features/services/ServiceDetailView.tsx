'use client';

import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { CtaBand, PageHero, ProjectCard, SectionHeader } from '@/components/common';
import { MepfTwin } from '@/features/mepf/MepfTwin';
import { Accordion, Button } from '@/components/ui';
import { Reveal, StaggerGroup } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { services } from '@/data/services';
import { faqs } from '@/data/content';
import { projects } from '@/data/projects';
import { MEPF_SEGMENTS } from '@/constants/site';
import { MEPF_EXPANSION } from '@/data/mepf';

export function ServiceDetailView({ slug }: { slug: string }) {
  const service = services.find((s) => s.slug === slug);

  /* Unreachable in practice: the route is prerendered from `generateStaticParams`
     with `dynamicParams = false`, so an unknown slug 404s before this renders.
     Kept as a type guard, and it replaces the old redirect-to-index — a soft
     redirect on missing content reads to a crawler as "this page exists". */
  if (!service) return null;

  const serviceFaqs = faqs.filter((f) => service.faqIds.includes(f.id));
  const relatedProjects = projects.filter((p) => p.services.includes(service.slug)).slice(0, 3);
  const others = services.filter((s) => s.id !== service.id);
  const isMepf = service.slug === 'mepf-consultancy';

  return (
    <>
      <PageHero
        overline={service.tagline}
        title={service.title}
        lead={service.summary}
        breadcrumbs={[{ label: 'Services', href: ROUTES.services }, { label: service.shortTitle }]}
        image={service.heroImage}
        stats={service.stats.map((stat) => ({ value: stat.value, label: stat.label }))}
        actions={
          <>
            <Button href={ROUTES.estimator} variant="accent" size="lg" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
              Get an estimate
            </Button>
            <Button href={ROUTES.contact} variant="secondary" size="lg">
              Discuss this service
            </Button>
          </>
        }
      />

      {/* Intro */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-body-lg leading-relaxed text-muted">{service.description}</p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="surface rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-heading-md font-semibold">What you receive</h2>
                  <ul className="mt-4 space-y-2.5">
                    {service.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={2.5} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Capabilities" title="What this service covers" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {service.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div className="surface h-full rounded-xl border p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-md">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    <Icon name={f.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-heading-md font-semibold">{f.title}</h3>
                  <p className="mt-2 text-caption leading-relaxed text-muted">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/*
        The house itself, and the argument it makes.

        This band used to be `MepfTeaser` — the same house holding still, above a
        link to `/mepf`, where the interactive version lived. That page is gone
        and the twin is here instead, because the split was costing more than it
        bought: a visitor who wanted to understand MEPF had to leave the page
        that sells it, and a visitor who landed on `/mepf` had to leave again to
        find the scope and the price.

        The intro below came from that page's opening. It is what makes the
        drawing legible to somebody who does not yet know what the letters mean,
        so it travels with it.

        Cost of the move: `MepfTwin` lazy-loads three.js (~150 KB gzipped), so
        this page now pulls it — but only this page, and only for `isMepf`. The
        home page keeps the flat teaser for exactly that reason.
      */}
      {isMepf && (
        <>
          {/* `pb-0` hands the gap to the twin below: `MepfTwin` is itself a
              `.section-sm`, so leaving both paddings in place would stack them. */}
          <section className="section-sm pb-0">
            <div className="container">
              <Reveal>
                <p className="overline">MEPF engineering</p>
                <h2 className="mt-4 max-w-[22ch] font-display text-display-sm font-semibold text-balance">
                  Most of a house is the part you never see.
                </h2>
                <p className="mt-6 max-w-lead text-body-lg text-muted">
                  <strong className="font-semibold text-[rgb(var(--c-text))]">MEPF</strong> is the air, water, power and
                  fire safety inside a building. It runs through the walls and above the ceilings, so you never see any
                  of it. You only notice it when one of the four was done badly — and by then the walls are closed.
                </p>
                <p className="mt-3 text-caption text-subtle">{MEPF_EXPANSION}.</p>
              </Reveal>
            </div>
          </section>
          <MepfTwin className="pt-10 md:pt-12" />
        </>
      )}

      {/* MEPF by segment — PDF p.16 (residential) and p.17 (commercial) */}
      {isMepf && (
        <section className="section-sm">
          <div className="container">
            <SectionHeader
              overline="Where it matters most"
              title="Different buildings, different demands"
              lead="Homes and commercial spaces put very different loads on the same four disciplines. We size and specify for the use, not for a template."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {MEPF_SEGMENTS.map((segment, i) => (
                <Reveal key={segment.key} delay={i * 0.08}>
                  <div className="surface h-full rounded-xl border p-7 shadow-sm">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                      <Icon name={segment.icon} className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-caption uppercase tracking-wide text-subtle">{segment.label}</p>
                    <h3 className="mt-1 font-display text-heading-lg font-semibold">{segment.heading}</h3>
                    <p className="mt-3 leading-relaxed text-muted">{segment.statement}</p>

                    <p className="mt-6 text-overline uppercase text-subtle">Key benefits</p>
                    <ul className="mt-3 space-y-2.5">
                      {segment.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={2.5} />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Process" title="How this engagement runs" />
          <div className="relative mt-12 pl-10">
            <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))]" aria-hidden />
            <StaggerGroup stagger={0.08} className="space-y-9">
              {service.process.map((step) => (
                <div key={step.step} className="relative">
                  <span className="absolute -left-10 top-0.5 flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 border-cyan-500/30 bg-[rgb(var(--c-bg))]">
                    <span className="num text-caption font-semibold text-cyan-700 dark:text-cyan-400">{step.step}</span>
                  </span>
                  <h3 className="font-display text-heading-md font-semibold">{step.title}</h3>
                  <p className="mt-1.5 max-w-prose text-muted">{step.description}</p>
                </div>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* Related projects */}
      {relatedProjects.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <SectionHeader
              overline="Proof"
              title="Where we have done this"
              action={
                <Link href={ROUTES.projects} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
                  All projects <ArrowUpRight className="h-4 w-4" />
                </Link>
              }
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      {serviceFaqs.length > 0 && (
        <section className="section-sm">
          <div className="container max-w-4xl">
            <SectionHeader overline="Questions" title={`About ${service.shortTitle.toLowerCase()}`} align="center" />
            <div className="mt-10">
              <Accordion items={serviceFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
            </div>
          </div>
        </section>
      )}

      {/* Other services */}
      <section className="section-sm border-t">
        <div className="container">
          <p className="overline">Also from us</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {others.map((s) => (
              <Link
                key={s.id}
                href={ROUTES.service(s.slug)}
                className="surface group flex items-center gap-3 rounded-lg border px-5 py-3 transition-all hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-sm"
              >
                <Icon name={s.icon} className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">{s.shortTitle}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={`Ready to discuss ${service.shortTitle.toLowerCase()}?`}
        lead="Start with an estimate, or book a free consultation and we will scope it properly."
      />
    </>
  );
}

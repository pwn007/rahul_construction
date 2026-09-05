'use client';

import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { CtaBand, PageHero, SectionHeader, CtaLink } from '@/components/common';
import { Accordion, Badge } from '@/components/ui';
import { MaskImage, Reveal, StaggerGroup } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { useServices } from '@/hooks/useServices';
import { useFaqs } from '@/hooks/useFaqs';
import { MEPF_DISCIPLINES, PROCESS_STEPS } from '@/constants/site';
import { IMG } from '@/lib/media';

export function ServicesView() {
  const services = useServices();
  const faqs = useFaqs();
  const generalFaqs = faqs.filter((f) => f.category === 'general' || f.category === 'process').slice(0, 6);

  return (
    <>
      <PageHero
        overline="What we offer"
        title="Comprehensive construction solutions"
        lead="Four capabilities, delivered as one system with a single point of responsibility — from concept design to final execution and a year of maintenance beyond it."
        breadcrumbs={[{ label: 'Services' }]}
        aside={
          <div className="surface rounded-2xl border p-2 shadow-lg">
            {services.map((service, i) => (
              <Link
                key={service.id}
                href={ROUTES.service(service.slug)}
                className="group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-cyan-500/[0.05]"
              >
                <span className="num w-6 shrink-0 text-caption text-subtle">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:text-cyan-400">
                  <Icon name={service.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.95rem] font-semibold leading-tight">{service.title}</span>
                  <span className="mt-0.5 block truncate text-caption text-subtle">{service.tagline}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-60" />
              </Link>
            ))}
          </div>
        }
      />

      {/* Service list — alternating editorial rows */}
      <section className="section-sm">
        <div className="container space-y-24 md:space-y-32">
          {services.map((service, i) => {
            const flip = i % 2 === 1;
            return (
              <div key={service.id} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                <div className={flip ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-6'}>
                  <MaskImage src={service.heroImage} alt={service.title} ratio="aspect-[4/3]" className="rounded-xl" parallax />
                </div>

                <div className={flip ? 'lg:col-span-6 lg:col-start-1 lg:row-start-1' : 'lg:col-span-6'}>
                  <Reveal>
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                      <Icon name={service.icon} className="h-6 w-6" />
                    </span>
                  </Reveal>
                  <Reveal delay={0.05}>
                    <p className="num mt-5 text-caption text-subtle">{String(i + 1).padStart(2, '0')}</p>
                    <h2 className="mt-1 text-display-sm">{service.title}</h2>
                    <p className="mt-2 text-cyan-700 dark:text-cyan-400">{service.tagline}</p>
                  </Reveal>
                  <Reveal delay={0.12}>
                    <p className="mt-5 max-w-lead leading-relaxed text-muted">{service.summary}</p>
                  </Reveal>

                  <StaggerGroup stagger={0.06} className="mt-6 grid gap-2 sm:grid-cols-2">
                    {service.features.slice(0, 4).map((f) => (
                      <div key={f.title} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={2.5} />
                        <span className="text-caption">{f.title}</span>
                      </div>
                    ))}
                  </StaggerGroup>

                  <Reveal delay={0.25}>
                    <div className="mt-7 flex flex-wrap items-center gap-4">
                      <CtaLink href={ROUTES.service(service.slug)}>Explore this service</CtaLink>
                      <span className="flex gap-1.5">
                        {service.stats.map((s) => (
                          <Badge key={s.label} variant="default" size="sm">
                            {s.value}
                          </Badge>
                        ))}
                      </span>
                    </div>
                  </Reveal>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MEPF spotlight */}
      <section className="on-dark grain relative overflow-hidden bg-ink-950 py-24 text-white md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
        <div className="container relative">
          <SectionHeader
            overline="Engineering excellence"
            title="MEPF — the systems that decide whether a building works"
            lead="Four disciplines, designed in-house and supervised on site. Most firms in this market subcontract all four."
            tone="light"
            align="center"
          />

          {/*
            Names the four, and then gets out of the way.

            This used to be a four-card grid repeating `MEPF_DISCIPLINES.detail`
            in full — the third place on the site those same four paragraphs
            appeared. An index page's job is to say what exists and point at it,
            so it now does exactly that, and the argument for why any of it
            matters is made once, on the MEPF service page, where the house you
            can look inside now lives alongside the scope.
          */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {MEPF_DISCIPLINES.map((d, i) => (
              <Reveal key={d.key} delay={i * 0.07}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-3 pr-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                    <Icon name={d.icon} className="h-4 w-4" />
                  </span>
                  <span className="font-display text-[0.95rem] font-semibold">{d.title}</span>
                </span>
              </Reveal>
            ))}
          </div>

          {/* One link, not two: "See what MEPF actually does" and "Scope &
              deliverables" were separate destinations until the house moved onto
              the service page. Two links to one URL is a choice that isn't. */}
          <Reveal delay={0.3} className="mt-10 flex justify-center">
            <CtaLink href={ROUTES.service('mepf-consultancy')} tone="light">
              See what MEPF actually does
            </CtaLink>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="How we work" title="The same process on every project" align="center" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.06}>
                <div className="surface h-full rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                      <Icon name={step.icon} className="h-5 w-5" />
                    </span>
                    <span className="num text-2xl font-semibold text-[rgb(var(--c-text))]/[0.12]">
                      {String(step.step).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-heading-md font-semibold">{step.title}</h3>
                  <p className="mt-2 text-caption leading-relaxed text-muted">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-sm">
        <div className="container max-w-4xl">
          <SectionHeader overline="Questions" title="Things people ask us first" align="center" />
          <div className="mt-10">
            <Accordion items={generalFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </div>
      </section>

      <CtaBand title="Not sure which service you need?" lead="Tell us what you are trying to build and we will tell you honestly what it takes." />
    </>
  );
}

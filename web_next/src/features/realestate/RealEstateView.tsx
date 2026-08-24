'use client';

import { REAL_ESTATE_COPY as PLACEHOLDER } from './copy';
import { ArrowUpRight, Check } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { CtaBand, PageHero, SectionHeader } from '@/components/common';
import { Accordion, Button } from '@/components/ui';
import { Reveal, StaggerGroup } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { IMG } from '@/lib/media';

/* ====================================================================== *
 *  PLACEHOLDER CONTENT — NOT APPROVED COPY
 *
 *  Every string below is dummy text written to give the page a realistic
 *  shape, nothing more. No rate, timeline, count or claim here has been
 *  checked with the business, so none of it should be quoted to a client
 *  or indexed as fact. Replace this whole block when real copy arrives;
 *  the JSX beneath it needs no changes.
 *
 *  Why this page is not a `services` entry: Real Estate was deliberately
 *  kept out of `data/services.ts`, so it does not appear on the /services
 *  index, in the contact form's service dropdown, in ⌘K search, or in the
 *  "Also from us" row on the other service pages. If it should appear in
 *  those, the fix is to move this content into the services array and
 *  delete this file — the shared ServiceDetailView renders the same shape.
 * ====================================================================== */

/**
 * Real Estate — a standalone page rather than a `services` entry.
 *
 * It is assembled from the same primitives as `ServiceDetailView` and follows
 * the same section order, so it reads as native alongside the four real
 * service pages without being wired into the service data.
 */
export function RealEstateView() {
  const heroImage = IMG.hero('service-real-estate');

  return (
    <>
      <PageHero
        overline={PLACEHOLDER.tagline}
        title={PLACEHOLDER.title}
        lead={PLACEHOLDER.summary}
        breadcrumbs={[{ label: 'Services', href: ROUTES.services }, { label: 'Real Estate' }]}
        image={heroImage}
        stats={PLACEHOLDER.stats.map((s) => ({ value: s.value, label: s.label }))}
        actions={
          <>
            <Button href={ROUTES.contact} variant="accent" size="lg" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
              Talk to us about a plot
            </Button>
            <Button href={ROUTES.estimator} variant="secondary" size="lg">
              Price a build
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
                <p className="text-body-lg leading-relaxed text-muted">{PLACEHOLDER.description}</p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="surface rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-heading-md font-semibold">What you receive</h2>
                  <ul className="mt-4 space-y-2.5">
                    {PLACEHOLDER.deliverables.map((d) => (
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
            {PLACEHOLDER.features.map((f, i) => (
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

      {/* Process */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Process" title="How this engagement runs" />
          <div className="relative mt-12 pl-10">
            <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))]" aria-hidden />
            <StaggerGroup stagger={0.08} className="space-y-9">
              {PLACEHOLDER.process.map((step) => (
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

      {/* FAQs */}
      <section className="section-sm">
        <div className="container max-w-4xl">
          <SectionHeader overline="Questions" title="About real estate advisory" align="center" />
          <div className="mt-10">
            <Accordion items={PLACEHOLDER.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </div>
      </section>

      <CtaBand
        title="Looking at a plot?"
        lead="Send us the location and we will tell you what it will take to build on it."
      />
    </>
  );
}

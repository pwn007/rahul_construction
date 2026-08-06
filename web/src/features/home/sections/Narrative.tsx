import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { Marquee, MaskImage, Reveal, SplitText, StaggerGroup } from '@/components/motion';
import { Badge } from '@/components/ui';
import { SectionHeader } from '@/components/common';
import { APPROACH, DIFFERENTIATORS, SERVICES_INTRO, SITE, WHAT_MAKES_US_DIFFERENT } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { IMG } from '@/lib/media';
import { clientLogos } from '@/data/people';
import { services } from '@/data/services';
import { Icon } from '@/lib/icons';
import { usePrefersReducedMotion } from '@/hooks';

/* ==================================================================== */
/* Trust bar                                                             */
/* ==================================================================== */

export function TrustBar() {
  return (
    // border-b only: the hero already closes with a rule, so a border-t here would double it.
    <section className="border-b bg-[rgb(var(--c-surface-2))] py-8">
      <div className="container">
        <p className="mb-6 text-center text-caption uppercase tracking-[0.18em] text-subtle">
          We build with materials you already trust
        </p>
        <Marquee speed={45}>
          {clientLogos.map((logo) => (
            <img
              key={logo.id}
              src={logo.logo}
              alt={logo.name}
              className="h-9 w-auto shrink-0 opacity-45 grayscale transition-all duration-500 hover:opacity-90 hover:grayscale-0 dark:invert"
              loading="lazy"
            />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* "One system" narrative — the strategic wedge, told through scroll      */
/* ==================================================================== */

export function OneSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.75], ['0%', '100%']);

  const chain = [
    { label: 'Architecture', detail: 'The plan, the Vastu, the drawings.' },
    { label: 'Engineering', detail: 'Structure and MEPF, coordinated from day one.' },
    { label: 'Execution', detail: 'Our own crews, our own quality gates.' },
    { label: 'Handover', detail: 'Plus a full year of free maintenance.' },
  ];

  return (
    <section id="intro" ref={ref} className="section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-40 dark:opacity-[0.07]" aria-hidden />

      <div className="container relative">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="overline">About Neetu Archstone</p>
            </Reveal>
            <h2 className="mt-4 text-display-md">
              <SplitText text="One system." />
              <br />
              <span className="text-gradient-brand">
                <SplitText text="One point of responsibility." delay={0.15} />
              </span>
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lead text-body-lg text-muted">
                Most construction projects fail in the gaps — between the architect and the contractor, the
                contractor and the electrician, the electrician and the carpenter. We removed the gaps by
                putting all of it under one roof.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-4 max-w-lead text-muted">
                We combine architecture, engineering and execution into one seamless system, thoughtfully
                following Vastu principles to create spaces that are balanced, efficient and harmonious.
              </p>
            </Reveal>
            <Reveal delay={0.4}>
              <Link
                to={ROUTES.about}
                className="mt-8 inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
              >
                Read our story <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="relative pl-10">
              {/* Progress spine */}
              <div className="absolute left-[13px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))]" aria-hidden />
              <motion.div
                className="absolute left-[13px] top-2 w-px origin-top bg-cyan-500"
                style={{ height: reduced ? '100%' : lineHeight }}
                aria-hidden
              />

              <StaggerGroup stagger={0.1} className="space-y-10">
                {chain.map((item, i) => (
                  <div key={item.label} className="relative">
                    <span className="absolute -left-10 top-1 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 border-[rgb(var(--c-border))] bg-[rgb(var(--c-bg))]">
                      <span className="num text-[0.65rem] font-semibold text-subtle">{i + 1}</span>
                    </span>
                    <h3 className="font-display text-heading-lg font-semibold">{item.label}</h3>
                    <p className="mt-1.5 text-muted">{item.detail}</p>
                  </div>
                ))}
              </StaggerGroup>
            </div>

            <Reveal delay={0.3} className="mt-12">
              <blockquote className="surface rounded-xl border-l-2 border-l-cyan-500 p-6 shadow-sm">
                <p className="text-body-lg italic text-muted">
                  “We eliminate confusion by offering a single point of responsibility, ensuring smooth
                  coordination and clear communication throughout the project.”
                </p>
                <footer className="mt-4 text-caption text-subtle">— {SITE.name}</footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Our Approach — PDF page 3                                             */
/* ==================================================================== */

export function Approach() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="surface relative overflow-hidden rounded-2xl border p-8 shadow-sm md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-50 dark:opacity-[0.07]" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-[100px]"
            aria-hidden
          />

          <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="overline">Our approach</p>
              </Reveal>
              <h2 className="mt-4 text-display-sm">
                <SplitText text="Every step under one system" />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-5 max-w-lead leading-relaxed text-muted">{APPROACH.statement}</p>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <p className="text-overline uppercase text-subtle">We focus on</p>
              <StaggerGroup stagger={0.08} className="mt-5 grid gap-6 sm:grid-cols-3">
                {APPROACH.focus.map((item) => (
                  <div key={item.key}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-heading-md font-semibold">{item.title}</h3>
                    <p className="mt-2 text-caption leading-relaxed text-muted">{item.description}</p>
                  </div>
                ))}
              </StaggerGroup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Services grid                                                         */
/* ==================================================================== */

export function ServicesSection() {
  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="What we offer"
          title="Comprehensive construction solutions"
          lead={SERVICES_INTRO}
          action={
            <Link
              to={ROUTES.services}
              className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
            >
              All services <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 0.06} className={i === 0 ? 'lg:col-span-2' : undefined}>
              <Link
                to={ROUTES.service(service.slug)}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border surface p-7 shadow-sm transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-md"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(600px circle at 50% 0%, rgb(0 174 239 / 0.06), transparent 60%)' }}
                  aria-hidden
                />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 transition-colors duration-500 group-hover:bg-cyan-500 group-hover:text-white dark:text-cyan-400">
                  <Icon name={service.icon} className="h-6 w-6" />
                </span>

                <h3 className="relative mt-5 font-display text-heading-lg font-semibold">{service.title}</h3>
                <p className="relative mt-1 text-caption uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
                  {service.tagline}
                </p>
                <p className="relative mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted">{service.summary}</p>

                <span className="relative mt-6 flex items-center justify-between border-t pt-4">
                  <span className="flex flex-wrap gap-1.5">
                    {service.stats.slice(0, 2).map((s) => (
                      <Badge key={s.label} variant="default" size="sm">
                        {s.value}
                      </Badge>
                    ))}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500 group-hover:border-cyan-500 group-hover:bg-cyan-500 group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Why choose us                                                         */
/* ==================================================================== */

export function WhyChooseUs() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionHeader
              overline="Why choose us"
              title="Built on trust. Driven by excellence."
              lead="Four commitments we make on every project, written into the agreement — not the marketing."
            />

            {/* What makes us different — PDF page 22 */}
            <StaggerGroup stagger={0.07} className="mt-8 space-y-3">
              {WHAT_MAKES_US_DIFFERENT.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-[0.9375rem] font-medium">{item}</span>
                </div>
              ))}
            </StaggerGroup>

            <Reveal delay={0.3} className="mt-10">
              <div className="surface flex items-start gap-4 rounded-xl border border-cyan-500/30 bg-cyan-500/[0.05] p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white">
                  <Check className="h-5 w-5" strokeWidth={3} />
                </span>
                <div>
                  <p className="font-display text-heading-md font-semibold">1 year free maintenance</p>
                  <p className="mt-1.5 text-sm text-muted">
                    Twelve months of complimentary service and support after delivery. Our name stays on the
                    building, so we stay responsible for it.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {DIFFERENTIATORS.map((item, i) => (
              <Reveal key={item.key} delay={i * 0.08}>
                <div className="group relative h-full overflow-hidden rounded-xl bg-cyan-500 p-7 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  <Icon name={item.icon} className="relative h-8 w-8" />
                  <h3 className="relative mt-5 font-display text-heading-lg font-semibold">{item.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-white/80">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Vastu teaser                                                          */
/* ==================================================================== */

export function VastuTeaser() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <MaskImage src={IMG.card('vastu-compass')} alt="Vastu-aligned planning" ratio="aspect-[5/4]" className="rounded-xl" parallax />
          </div>
          <div className="lg:col-span-6 lg:pl-6">
            <Reveal>
              <p className="overline">Vastu</p>
            </Reveal>
            <h2 className="mt-4 text-display-md">
              <SplitText text="Right Direction, Happy Living" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-lead text-body-lg text-muted">
                We see design as more than construction — it is a balance of energy, space and functionality.
                Our Vastu-based planning aligns your space with positive energy, creating an environment that
                promotes peace, prosperity and a better quality of life.
              </p>
            </Reveal>
            <StaggerGroup stagger={0.08} className="mt-8 space-y-3">
              {[
                'Enhances mental peace and positivity',
                'Supports financial growth and stability',
                'Improves health and relationships',
                'Creates a balanced and harmonious living environment',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" strokeWidth={2.5} />
                  <span className="text-[0.9375rem]">{benefit}</span>
                </div>
              ))}
            </StaggerGroup>
            <Reveal delay={0.4}>
              <Link
                to={ROUTES.vastu}
                className="mt-8 inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
              >
                How we apply Vastu <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

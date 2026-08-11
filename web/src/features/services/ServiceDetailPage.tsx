import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowUpRight, Check } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { Seo } from '@/components/seo/Seo';
import { BuildingSystems, CtaBand, PageHero, ProjectCard, SectionHeader } from '@/components/common';
import { Accordion, Badge, Button } from '@/components/ui';
import { Reveal, StaggerGroup } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { services } from '@/data/services';
import { faqs } from '@/data/content';
import { projects } from '@/data/projects';
import { MEPF_DISCIPLINES, MEPF_MATTERS, MEPF_SEGMENTS } from '@/constants/site';

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = services.find((s) => s.slug === slug);

  if (!service) return <Navigate to={ROUTES.services} replace />;

  const serviceFaqs = faqs.filter((f) => service.faqIds.includes(f.id));
  const relatedProjects = projects.filter((p) => p.services.includes(service.slug)).slice(0, 3);
  const others = services.filter((s) => s.id !== service.id);
  const isMepf = service.slug === 'mepf-consultancy';

  return (
    <>
      <Seo
        title={service.title}
        description={service.summary}
        image={service.heroImage}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.title,
          description: service.summary,
          provider: { '@type': 'Organization', name: 'Neetu Archstone' },
          areaServed: { '@type': 'City', name: 'Jaipur' },
        }}
      />

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

      {/* The four routes, drawn — sets up the discipline-by-discipline detail below. */}
      {isMepf && <BuildingSystems showLink={false} />}

      {/* MEPF disciplines deep-dive */}
      {isMepf && (
        <section className="on-dark grain relative overflow-hidden bg-ink-950 py-20 text-white md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <div className="container relative">
            <SectionHeader overline="Four disciplines" title="Designed in-house, supervised on site" tone="light" align="center" />
            <div className="mt-14 space-y-4">
              {MEPF_DISCIPLINES.map((d, i) => (
                <Reveal key={d.key} delay={i * 0.06}>
                  <div className="grid items-start gap-5 rounded-xl border border-white/10 bg-white/[0.03] p-7 md:grid-cols-12">
                    <div className="flex items-center gap-4 md:col-span-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                        <Icon name={d.icon} className="h-6 w-6" />
                      </span>
                      <h3 className="font-display text-heading-lg font-semibold">{d.title}</h3>
                    </div>
                    <div className="md:col-span-8">
                      <p className="text-white/70">{d.description}</p>
                      <p className="mt-2 text-caption leading-relaxed text-white/45">{d.detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
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

      {/* Why MEPF matters — PDF p.19 */}
      {isMepf && (
        <section className="on-dark grain relative overflow-hidden bg-ink-950 py-20 text-white md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <div className="container relative">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <SectionHeader overline="Why MEPF matters" title="The heartbeat of every building" tone="light" />
                <Reveal delay={0.15}>
                  <p className="mt-6 max-w-lead text-body-lg text-white/60">{MEPF_MATTERS.statement}</p>
                </Reveal>
              </div>
              <div className="lg:col-span-7 lg:pl-8">
                <StaggerGroup stagger={0.06} className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {MEPF_MATTERS.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 border-b border-white/10 pb-4">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" strokeWidth={2.5} />
                      <span className="text-[0.9375rem] leading-snug text-white/80">{benefit}</span>
                    </div>
                  ))}
                </StaggerGroup>
              </div>
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
                <Link to={ROUTES.projects} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
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
                to={ROUTES.service(s.slug)}
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

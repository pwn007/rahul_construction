'use client';

import Link from 'next/link';
import { ArrowUpRight, Briefcase, GraduationCap, HeartPulse, MapPin, Rocket, Users, Wallet } from 'lucide-react';
import { CtaBand, PageHero, SectionHeader } from '@/components/common';
import { Badge } from '@/components/ui';
import { MaskImage, Reveal, StaggerGroup } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { useJobs } from '@/hooks/useJobs';
import { formatRelative } from '@/lib/format';
import { IMG } from '@/lib/media';

const CULTURE = [
  { icon: Users, title: 'Small team, real ownership', body: 'You will own projects, not tickets. Everyone here talks to clients and visits sites.' },
  { icon: GraduationCap, title: 'Learn across disciplines', body: 'Architects sit with MEP engineers. Site engineers review drawings. Nobody stays in a lane.' },
  { icon: Rocket, title: 'See it get built', body: 'Every drawing you make becomes a building you can walk into within the year.' },
  { icon: HeartPulse, title: 'Sane hours', body: 'Five-day week. We plan properly so that crunch is the exception, not the operating model.' },
];

const BENEFITS = [
  'Health cover for you and immediate family',
  'Annual learning and certification budget',
  'Performance bonus linked to on-time delivery',
  'Site allowance and travel reimbursement',
  'Five-day week with genuine flexibility',
  'Clear, published progression paths',
];

export function CareersView() {
  const jobs = useJobs();
  const openings = jobs.reduce((sum, j) => sum + j.openings, 0);

  return (
    <>
      <PageHero
        overline="Careers"
        title="Build with us"
        lead="We are a small team that takes on the whole problem — design, engineering, execution. If you want to see the thing you drew get built, this is the right place."
        breadcrumbs={[{ label: 'Careers' }]}
        image={IMG.card('careers-hero')}
        stats={[
          { value: jobs.length, label: 'Open roles' },
          { value: openings, label: 'Positions available' },
          { value: 10, label: 'People on the team', suffix: '+' },
        ]}
      />

      {/* Culture */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                overline="Culture"
                title="What it is like here"
                lead="Honest about the trade-offs: it is a small firm, so you carry real responsibility early and there is nowhere to hide. Most people find that is the point."
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
              {CULTURE.map((c, i) => (
                <Reveal key={c.title} delay={i * 0.07}>
                  <div className="surface h-full rounded-xl border p-6 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-heading-md font-semibold">{c.title}</h3>
                    <p className="mt-2 text-caption leading-relaxed text-muted">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-10 rounded-2xl border p-8 md:grid-cols-12 md:p-12">
            <div className="md:col-span-5">
              <MaskImage src={IMG.card('careers-team')} alt="Our team at work" ratio="aspect-[4/3]" className="rounded-xl" />
            </div>
            <div className="md:col-span-7 md:pl-4">
              <p className="overline">Benefits</p>
              <h2 className="mt-3 text-display-sm">What we offer</h2>
              <StaggerGroup stagger={0.06} className="mt-6 grid gap-3 sm:grid-cols-2">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-start gap-2.5">
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    <span className="text-sm">{b}</span>
                  </div>
                ))}
              </StaggerGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Openings */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Open roles" title="Where we need people" />

          <div className="mt-10 space-y-3">
            {jobs.map((job, i) => (
              <Reveal key={job.id} delay={i * 0.05}>
                <Link
                  href={ROUTES.career(job.slug)}
                  className="group surface flex flex-col gap-4 rounded-xl border p-6 transition-all duration-400 hover:border-cyan-500/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-heading-lg font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                        {job.title}
                      </h3>
                      {job.openings > 1 && (
                        <Badge variant="brand" size="sm">
                          {job.openings} positions
                        </Badge>
                      )}
                      {job.type === 'internship' && (
                        <Badge variant="sand" size="sm">
                          Internship
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 max-w-prose text-caption leading-relaxed text-muted">{job.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-caption text-subtle">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> {job.department}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                      <span className="num">{job.experience}</span>
                      {job.salaryRange && <span className="num">{job.salaryRange}</span>}
                      {job.postedAt && <span>Posted {formatRelative(job.postedAt)}</span>}
                    </div>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-400 group-hover:border-cyan-500 group-hover:bg-cyan-500 group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-8 rounded-xl border border-dashed p-6 text-center">
              <p className="text-sm text-muted">
                Nothing that fits? Send your portfolio to{' '}
                <a href="mailto:neetuarchstone@gmail.com" className="text-cyan-700 underline underline-offset-2 dark:text-cyan-400">
                  neetuarchstone@gmail.com
                </a>{' '}
                anyway. We hire good people ahead of need.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Not looking for a job — looking to build?"
        lead="Head to the estimator instead."
        primary={{ label: 'Open the estimator', href: ROUTES.estimator }}
        secondary={{ label: 'See our work', href: ROUTES.projects }}
      />
    </>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Counter, Parallax, Reveal, SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/lib/format';
import { useRegisterHeroTone } from '@/app/hero-tone';
import type { Project } from '@/types/domain';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Projects index hero.
 *
 * A work page whose hero contains no work is arguing with itself. The previous
 * version was a paragraph *about* projects on an otherwise empty canvas, with a
 * background image at 13% opacity that resolved to nothing.
 *
 * This is a bespoke hero rather than the shared `PageHero` because the index has a
 * job no other interior page has — prove the library exists, and let the visitor
 * enter it at the right place. Bending `PageHero` with more props would have
 * degraded it for the other ten pages that legitimately just need a title.
 *
 * Covers are read from the real `projects` data, so the hero can never advertise a
 * project the grid below does not contain.
 */

interface CategoryChip {
  value: string;
  label: string;
}

export function ProjectsHero({
  projects,
  totalArea,
  localityCount,
  categories,
  activeCategory,
  onJumpToCategory,
}: {
  projects: Project[];
  totalArea: number;
  localityCount: number;
  categories: CategoryChip[];
  activeCategory: string;
  onJumpToCategory: (category: string) => void;
}) {
  useRegisterHeroTone('light');

  // Three most recent completed projects — the hero previews the library, never invents it.
  const covers = [...projects]
    .filter((p) => p.stage === 'completed')
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);


  const stats = [
    { value: projects.length, label: 'Projects', format: (n: number) => String(n) },
    { value: totalArea, label: 'Sq ft built', format: formatNumber },
    { value: categories.length - 1, label: 'Markets', format: (n: number) => String(n) },
    { value: localityCount, label: 'Jaipur localities', format: (n: number) => String(n) },
  ];

  return (
    <section className="relative overflow-hidden border-b bg-[rgb(var(--c-surface-2))]" style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Ground — no photographic wash; the covers carry the visual weight now. */}
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-70 dark:bg-grid-blueprint dark:opacity-[0.09]" aria-hidden />
      <div className="pointer-events-none absolute -left-32 -top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/[0.10] blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-28 top-1/3 h-[420px] w-[420px] rounded-full bg-sand-300/35 blur-[120px] dark:bg-sand-500/10" aria-hidden />

      <div className="container relative">
        <div className="grid gap-12 pb-14 pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-16">
          {/* ── Narrative ─────────────────────────────────────── */}
          <div className="lg:col-span-6 lg:pt-6">
            <Reveal>
              <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-caption text-subtle">
                <Link href={ROUTES.home} className="inline-block py-1.5 transition-colors hover:text-cyan-700 dark:hover:text-cyan-400">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[rgb(var(--c-text))]">Projects</span>
              </nav>
            </Reveal>

            <Reveal>
              <p className="overline">Selected work</p>
            </Reveal>

            <h1 className="mt-4 max-w-[15ch] text-display-md text-navy-800 dark:text-white">
              <SplitText text="Every project, documented properly" />
            </h1>

            <Reveal delay={0.15}>
              <p className="mt-6 max-w-lead text-body-lg text-muted">
                Not a wall of renders. Each project below has a brief, a constraint, an approach and a
                measurable outcome.
              </p>
            </Reveal>

            {/* Filter chips — one CTA system, not five competing buttons */}
            <Reveal delay={0.25}>
              <div className="mt-8">
                <p className="text-overline uppercase text-subtle">Jump to</p>
                <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                  {categories
                    .filter((c) => c.value !== 'all')
                    .map((category) => {
                      const on = activeCategory === category.value;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => onJumpToCategory(category.value)}
                          aria-pressed={on}
                          className={cn(
                            'group flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-300',
                            on
                              ? 'border-cyan-500 bg-cyan-500/[0.08] font-medium text-cyan-700 dark:text-cyan-300'
                              : 'bg-[rgb(var(--c-surface))] text-muted hover:-translate-y-0.5 hover:border-cyan-500/50 hover:text-[rgb(var(--c-text))]',
                          )}
                        >
                          {category.label}
                          <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-60" />
                        </button>
                      );
                    })}
                </div>
              </div>
            </Reveal>
          </div>

          {/* ── Cover cluster ─────────────────────────────────────
              One row of three at every width: a snap-scroll strip on phones,
              a plain three-across grid from `sm` up.

              There used to be a second, desktop-only composition here — a lead
              card at 3/4 beside two at 4/3, the right column pushed down by
              `mt-12`, and the two columns drifting at opposing parallax speeds.
              It was the same "one big, the rest small" arrangement the client
              asked to be rid of, so it has gone.

              Worth knowing why the ratios differed in the first place: a
              one-beside-two cluster can only balance its two column heights by
              giving the single card a taller crop. Equal sizes and that
              composition are mutually exclusive, which is why the composition is
              what gave way. One `Parallax` now carries the whole cluster, so it
              still drifts as a unit rather than shearing against itself. */}
          <div className="lg:col-span-6">
            <Parallax speed={0.06}>
              {/*
                A three-up grid at every width, not a swipe row below `sm`.

                As a scroller this measured 2.25 screens with 782px hidden, so two
                of the three covers sat off-screen behind a gesture with no
                affordance — on a hero whose entire job is showing the work. Three
                narrow columns fit a 360px phone comfortably at this crop, and the
                cluster stays one `Parallax` unit either way.
              */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {covers.map((project, i) => (
                  <CoverCard
                    key={project.id}
                    project={project}
                    index={i}
                    ratio="aspect-[4/5]"
                    priority={i === 0}
                  />
                ))}
              </div>
            </Parallax>
          </div>
        </div>
      </div>

      {/* ── Stat rail — anchors the hero, hands off to the filter bar ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="relative border-t"
      >
        <div className="container">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  'py-5 lg:py-6',
                  i % 2 === 1 ? 'border-l pl-5' : 'lg:border-l lg:pl-6',
                  i >= 2 && 'border-t lg:border-t-0',
                  i === 0 && 'lg:border-l-0 lg:pl-0',
                )}
              >
                <dd className="num text-2xl font-semibold leading-none text-navy-800 dark:text-white md:text-3xl">
                  {stat.label === 'Sq ft built' ? formatNumber(stat.value) : <Counter value={stat.value} />}
                </dd>
                <dt className="mt-1.5 text-caption text-subtle">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function CoverCard({
  project,
  index,
  ratio,
  className,
  priority,
}: {
  project: Project;
  index: number;
  ratio: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.85, delay: 0.2 + index * 0.12, ease: EASE }}
      className={className}
    >
      <Link
        href={ROUTES.project(project.slug)}
        className="group block"
        aria-label={`${project.title} — ${project.locality}, ${project.year}`}
      >
        <div className="relative overflow-hidden rounded-xl shadow-md ring-1 ring-navy-800/[0.06]">
          <img
            src={project.coverImage}
            alt=""
            aria-hidden
            loading={priority ? 'eager' : 'lazy'}
            {...(priority ? HIGH_PRIORITY_IMG : {})}
            className={cn('w-full object-cover transition-transform duration-[1.1s] ease-out-expo group-hover:scale-[1.05]', ratio)}
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/5 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-caption text-white/70">
              {project.locality} · {project.year}
            </p>
            <p className="mt-0.5 font-display text-[0.95rem] font-semibold leading-tight text-white">{project.title}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

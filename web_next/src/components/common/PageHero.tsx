'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Counter, Parallax, Reveal, SplitText } from '@/components/motion';
import { DimensionLine } from './DimensionLine';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

/**
 * Shared interior-page hero.
 *
 * Rebuilt after the Projects-page critique, which found three faults that applied to
 * every page sharing this component:
 *
 *  1. The headline rendered at `display-sm` — roughly 2:1 against the lead paragraph,
 *     so the eye landed on the paragraph instead of the title.
 *  2. `image` was painted as a 13%-opacity wash under a paper gradient. It resolved to
 *     a faint smudge: a network request that bought nothing.
 *  3. Every page was left-aligned text on a full-width canvas, leaving ~55% dead space
 *     that read as an unfinished layout rather than deliberate restraint.
 *
 * The fix is a system, not thirteen bespoke heroes (which would drift immediately):
 *
 *  • `aside`  — an optional right-hand slot. Pages fill it with something that earns
 *               its place: a real image, a sample card, a diagram, an index.
 *  • `stats`  — a structured bottom rail, replacing ad-hoc `children` stat rows.
 *  • `actions`— an optional CTA row, so a hero can offer a next step.
 *
 * Layout resolves automatically: **with an aside it is an asymmetric split; without
 * one it centres.** A centred composition reads as intentional, which an orphaned
 * left column never does.
 */

export interface HeroStat {
  value: number | string;
  label: string;
  /** Rendered in accent colour after the value — "80+", "98%". */
  suffix?: string;
  /** Animate the number up on entry. Ignored for string values. */
  count?: boolean;
}

export interface PageHeroProps {
  overline?: string;
  title: string;
  lead?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  /** Rendered as a real editorial image in the aside — never as a background wash. */
  image?: string;
  /** Right-hand slot. Takes precedence over `image`. */
  aside?: ReactNode;
  /** CTA row beneath the lead. */
  actions?: ReactNode;
  /** Structured bottom rail. */
  stats?: HeroStat[];
  tone?: 'light' | 'dark';
  /** `sm` trims vertical padding for utility pages. */
  size?: 'sm' | 'md';
  children?: ReactNode;
}

export function PageHero({
  overline,
  title,
  lead,
  breadcrumbs,
  image,
  aside,
  actions,
  stats,
  tone = 'light',
  size = 'md',
  children,
}: PageHeroProps) {
  useRegisterHeroTone(tone);

  const dark = tone === 'dark';
  const hasAside = Boolean(aside || image);

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b',
        dark ? 'on-dark grain bg-ink-950 text-white' : 'bg-[rgb(var(--c-surface-2))]',
      )}
      style={{ paddingTop: 'var(--nav-h)' }}
    >
      {/* Ground */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-grid',
          dark ? 'bg-grid-blueprint opacity-25' : 'bg-grid-light opacity-70 dark:bg-grid-blueprint dark:opacity-[0.09]',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -left-32 -top-24 h-[460px] w-[460px] rounded-full blur-[120px]',
          dark ? 'bg-cyan-500/10' : 'bg-cyan-500/[0.10]',
        )}
        aria-hidden
      />
      {!dark && (
        <div
          className="pointer-events-none absolute -right-28 top-1/3 h-[420px] w-[420px] rounded-full bg-sand-300/35 blur-[120px] dark:bg-sand-500/10"
          aria-hidden
        />
      )}

      <div className="container relative">
        <div
          className={cn(
            'grid gap-12',
            size === 'sm' ? 'pb-12 pt-10 lg:pb-14 lg:pt-12' : 'pb-14 pt-12 lg:pb-20 lg:pt-16',
            hasAside ? 'lg:grid-cols-12 lg:gap-10' : 'place-items-center text-center',
          )}
        >
          {/* ── Narrative ─────────────────────────────────────── */}
          <div className={cn(hasAside ? 'lg:col-span-6 lg:pt-4' : 'max-w-3xl')}>
            {breadcrumbs && (
              <Reveal>
                {/*
                  The trail was rendered for people but never for machines, so a
                  search result showed a bare URL where it could have shown
                  Home › Services › MEPF. Emitted here rather than in each route
                  file because this is the component that already knows the trail.
                */}
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'BreadcrumbList',
                      itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}${ROUTES.home}` },
                        ...breadcrumbs.map((b, i) => ({
                          '@type': 'ListItem',
                          position: i + 2,
                          name: b.label,
                          ...(b.href ? { item: `${SITE.url}${b.href}` } : {}),
                        })),
                      ],
                    }),
                  }}
                />
                <nav
                  aria-label="Breadcrumb"
                  className={cn(
                    'mb-6 flex flex-wrap items-center gap-2 text-caption',
                    dark ? 'text-white/45' : 'text-subtle',
                    !hasAside && 'justify-center',
                  )}
                >
                  <Link href={ROUTES.home} className="inline-block py-1.5 transition-colors hover:text-cyan-700 dark:hover:text-cyan-400">
                    Home
                  </Link>
                  {breadcrumbs.map((b) => (
                    <span key={b.label} className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3" />
                      {b.href ? (
                        <Link href={b.href} className="inline-block py-1.5 transition-colors hover:text-cyan-700 dark:hover:text-cyan-400">
                          {b.label}
                        </Link>
                      ) : (
                        <span className={dark ? 'text-white/75' : 'text-[rgb(var(--c-text))]'}>{b.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              </Reveal>
            )}

            {overline && (
              <Reveal>
                <p className="overline">{overline}</p>
              </Reveal>
            )}

            <h1
              className={cn(
                'mt-4 text-display-md',
                hasAside ? 'max-w-[16ch]' : 'max-w-[20ch]',
                dark ? 'text-white' : 'text-navy-800 dark:text-white',
              )}
            >
              <SplitText text={title} />
            </h1>

            {lead && (
              <Reveal delay={0.15}>
                <div
                  className={cn(
                    'mt-6 max-w-prose text-body-lg',
                    dark ? 'text-white/60' : 'text-muted',
                    !hasAside && 'mx-auto',
                  )}
                >
                  {lead}
                </div>
              </Reveal>
            )}

            {actions && (
              <Reveal delay={0.25}>
                <div className={cn('mt-8 flex flex-wrap items-center gap-3', !hasAside && 'justify-center')}>{actions}</div>
              </Reveal>
            )}

            {children && <Reveal delay={0.3}>{children}</Reveal>}
          </div>

          {/* ── Aside ─────────────────────────────────────────── */}
          {hasAside && (
            <div className="lg:col-span-6">
              {aside ?? (
                <Parallax speed={0.05}>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-navy-800/[0.06]"
                  >
                    <img
                      src={image}
                      alt=""
                      aria-hidden
                      {...HIGH_PRIORITY_IMG}
                      className="aspect-[4/3] max-h-[46svh] w-full object-cover"
                    />
                  </motion.div>
                </Parallax>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat rail ─────────────────────────────────────────── */}
      {stats && stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className={cn('relative border-t', dark && 'border-white/10')}
        >
          <div className="container">
            <dl className={cn('grid grid-cols-2', stats.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={cn(
                    'group py-5 lg:py-6',
                    dark && 'border-white/10',
                    i % 2 === 1 ? 'border-l pl-5' : 'lg:border-l lg:pl-6',
                    i >= 2 && 'border-t lg:border-t-0',
                    i === 0 && 'lg:border-l-0 lg:pl-0',
                  )}
                >
                  <dd
                    className={cn(
                      'num text-2xl font-semibold leading-none md:text-3xl',
                      dark ? 'text-white' : 'text-navy-800 dark:text-white',
                    )}
                  >
                    <span className="relative inline-flex">
                      {typeof stat.value === 'number' && stat.count !== false ? (
                        <Counter value={stat.value} />
                      ) : (
                        stat.value
                      )}
                      {stat.suffix && <span className="text-cyan-600 dark:text-cyan-400">{stat.suffix}</span>}
                      <DimensionLine tone={dark ? 'light' : 'dark'} />
                    </span>
                  </dd>
                  {/* mt-3 rather than mt-1.5 — the dimension line lives in this gap. */}
                  <dt className={cn('mt-3 text-caption', dark ? 'text-white/45' : 'text-subtle')}>{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      )}
    </section>
  );
}

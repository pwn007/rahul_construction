import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, Button } from '@/components/ui';
import { MaskImage, Reveal, SplitText, TiltCard } from '@/components/motion';
import { DimensionLine } from './DimensionLine';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/lib/format';
import type { Project, Testimonial } from '@/types/domain';
import type { ReactNode } from 'react';

export { Logo, LogoMark } from './Logo';
export { Navbar } from './Navbar';
export { Footer } from './Footer';
export { FloatingRail, CommandPalette, useCommandPalette } from './Chrome';
export { BuildingSystems } from './BuildingSystems';
export { PageHero, type PageHeroProps, type HeroStat } from './PageHero';
export { PackageCard } from './PackageCard';
export { PackagePlans } from './PackagePlans';

/* ==================================================================== */
/* SectionHeader                                                         */
/* ==================================================================== */

export function SectionHeader({
  overline,
  title,
  lead,
  align = 'left',
  tone = 'dark',
  action,
  className,
  split = true,
}: {
  overline?: string;
  title: string;
  lead?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  action?: ReactNode;
  className?: string;
  split?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
        className,
      )}
    >
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
        {overline && (
          <Reveal>
            <p className="overline">{overline}</p>
          </Reveal>
        )}
        <h2 className={cn('mt-4 text-display-md', tone === 'light' && 'text-white')}>
          {split ? <SplitText text={title} /> : title}
        </h2>
        {lead && (
          <Reveal delay={0.12}>
            <div
              className={cn(
                'mt-5 max-w-lead text-body-lg',
                tone === 'light' ? 'text-white/60' : 'text-muted',
                align === 'center' && 'mx-auto',
              )}
            >
              {lead}
            </div>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.2} className="shrink-0">
          {action}
        </Reveal>
      )}
    </div>
  );
}

/* ==================================================================== */
/* PageHero — shared header for interior pages                           */
/* ==================================================================== */

/* ==================================================================== */
/* StatTile                                                              */
/* ==================================================================== */

export function StatTile({
  value,
  label,
  sublabel,
  tone = 'dark',
  className,
}: {
  value: ReactNode;
  label: string;
  sublabel?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <div className={cn('group flex flex-col', className)}>
      <span className="relative inline-flex self-start">
        <span className={cn('num text-display-sm font-semibold leading-none', tone === 'light' ? 'text-white' : 'text-navy-800 dark:text-white')}>
          {value}
        </span>
        <DimensionLine tone={tone} />
      </span>
      <span className={cn('mt-3 text-sm font-medium', tone === 'light' ? 'text-white/70' : 'text-[rgb(var(--c-text))]')}>{label}</span>
      {sublabel && <span className={cn('mt-1 text-caption', tone === 'light' ? 'text-white/40' : 'text-subtle')}>{sublabel}</span>}
    </div>
  );
}

/* ==================================================================== */
/* ProjectCard                                                           */
/* ==================================================================== */

export function ProjectCard({ project, index = 0, size = 'md' }: { project: Project; index?: number; size?: 'md' | 'lg' }) {
  return (
    <TiltCard max={3} className="h-full">
      <Link to={ROUTES.project(project.slug)} className="group block h-full">
        <div className="relative overflow-hidden rounded-xl">
          <MaskImage
            src={project.coverImage}
            alt={project.title}
            ratio={size === 'lg' ? 'aspect-[16/11]' : 'aspect-[4/3]'}
            delay={index * 0.06}
            imgClassName="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />

          <div className="absolute left-4 top-4 flex gap-2">
            <Badge variant="navy" size="sm" className="backdrop-blur-sm">
              {project.locality}
            </Badge>
            {project.stage !== 'completed' && (
              <Badge variant="brand" size="sm" className="bg-cyan-500 text-white">
                {project.stage === 'ongoing' ? 'In progress' : 'Upcoming'}
              </Badge>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-caption uppercase tracking-wider text-white/60">
              {project.category.replace('-', ' ')} · {project.year}
            </p>
            <h3 className="mt-1.5 font-display text-heading-lg font-semibold">{project.title}</h3>
            <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-500 ease-out-expo group-hover:max-h-24 group-hover:grid-rows-[1fr] group-hover:opacity-100">
              <p className="min-h-0 pt-2 text-caption leading-relaxed text-white/70">{project.subtitle}</p>
            </div>
          </div>

          <span className="absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white/95 text-navy-800 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-caption text-muted">
          <span className="num">{formatNumber(project.areaSqft)} sq ft</span>
          <span>{project.floors}</span>
          <span className="num">{project.durationMonths} mo</span>
        </div>
      </Link>
    </TiltCard>
  );
}

/* ==================================================================== */
/* TestimonialCard                                                       */
/* ==================================================================== */

export function TestimonialCard({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
  const isDevanagari = testimonial.language === 'hi';
  return (
    <figure
      className={cn(
        'surface flex h-full flex-col rounded-xl border p-7 shadow-sm transition-all duration-500 ease-out-expo hover:border-cyan-500/40 hover:shadow-md',
        className,
      )}
    >
      <Quote className="h-7 w-7 shrink-0 text-cyan-500/30" aria-hidden />
      <blockquote
        className={cn('mt-4 flex-1 text-[0.9375rem] leading-relaxed text-[rgb(var(--c-text-muted))]', isDevanagari && 'font-deva')}
      >
        {testimonial.quote}
      </blockquote>
      <div className="mt-6 flex items-center gap-1" aria-label={`${testimonial.rating} out of 5 stars`}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-warning text-warning" aria-hidden />
        ))}
      </div>
      <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
        {testimonial.avatar && (
          <img src={testimonial.avatar} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
        )}
        <div>
          <p className="text-sm font-semibold">{testimonial.name}</p>
          <p className="text-caption text-subtle">{testimonial.locality}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/* ==================================================================== */
/* CtaBand                                                               */
/* ==================================================================== */

export function CtaBand({
  overline = 'Next step',
  title,
  lead,
  primary = { label: 'Get a free estimate', href: ROUTES.estimator },
  secondary = { label: 'Talk to us', href: ROUTES.contact },
  className,
}: {
  overline?: string;
  title: string;
  lead?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}) {
  return (
    <section className={cn('section-sm', className)}>
      <div className="container">
        <div className="on-dark grain relative overflow-hidden rounded-2xl bg-navy-800 px-8 py-14 text-white md:px-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/25 blur-[90px]"
            aria-hidden
          />
          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="overline">{overline}</p>
              <h2 className="mt-3 text-display-sm text-white">
                <SplitText text={title} />
              </h2>
              {lead && <p className="mt-4 max-w-lead text-white/60">{lead}</p>}
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
              <Button href={primary.href} variant="accent" size="lg" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                {primary.label}
              </Button>
              <Button href={secondary.href} variant="outline" size="lg" className="border-white/25 text-white hover:bg-white/10">
                {secondary.label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

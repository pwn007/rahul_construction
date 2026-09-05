'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, ChevronRight, Play, Quote, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, Button } from '@/components/ui';
import { MaskImage, Reveal, SplitText, TiltCard } from '@/components/motion';
import { DimensionLine } from './DimensionLine';
import { VideoLightbox, resolveVideo } from './VideoLightbox';
import { CtaLink } from './CtaLink';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/lib/format';
import { CATEGORY_LABEL } from '@/data/projects';
import { useProjects } from '@/features/projects/useProjects';
import { useServices } from '@/hooks/useServices';
import type { Project, Testimonial } from '@/types/domain';
import type { ReactNode } from 'react';

export { Logo, LogoMark } from './Logo';
export { Navbar } from './Navbar';
export { Footer } from './Footer';
export { FloatingRail, CommandPalette, useCommandPalette } from './Chrome';
export { StickyContactBar } from './StickyContactBar';
export { ConsentCheckbox, CONSENT_REQUIRED } from './ConsentCheckbox';
/* BuildingSystems is gone — the isometric house at features/mepf/scene/HouseIso
   is now the site's only MEP illustration. Two drawings of the same four
   services meant two files to keep in step and a visitor learning the notation
   twice. The house lives on /services/mepf-consultancy only; the home-page band
   shows four photographs instead, one per system. */
export { PageHero, type PageHeroProps, type HeroStat } from './PageHero';
export { PackageCard } from './PackageCard';
export { PackagePlans } from './PackagePlans';
export { TestimonialBand } from './TestimonialBand';
export { CtaLink } from './CtaLink';

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

/*
  Every project card is the same size, everywhere.

  There used to be a `size?: 'md' | 'lg'` prop whose only effect was to swap the
  image ratio to `aspect-[16/11]`, and whose only caller was the featured card in
  the home page's bento. Both are gone: the prop is removed rather than merely
  left unused so that a differently-sized project card cannot quietly reappear.
*/
export function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const services = useServices();
  return (
    <TiltCard max={3} className="h-full">
      <Link href={ROUTES.project(project.slug)} className="group block h-full">
        <div className="relative overflow-hidden rounded-xl">
          <MaskImage
            src={project.coverImage}
            alt={project.title}
            ratio="aspect-[4/3]"
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
              {CATEGORY_LABEL[project.category]} · {project.year}
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

        {/*
          What was actually done on this site.

          Deliberately outside the image block. The overlay above it holds the
          hover-reveal (`max-h-24 overflow-hidden`), so anything placed in there
          is invisible until hover and clipped after two lines — and "which work
          was done" is the question a visitor is scanning to answer, not one they
          hunt for.

          Filtering `services` by the project (rather than mapping the project's
          own array) is the same direction `ProjectDetailView` takes, and it is
          the point: order comes from services.ts, so every card lists them in
          the same sequence — Architecture → MEPF → Interiors → Project
          Management — instead of whichever order that record happened to be
          typed in.

          Not links. The card is already one big `<Link>` and an anchor inside an
          anchor is invalid HTML — but it would also be a lie: the /projects
          filters are `category`, where "MEPF" means a project that was *only*
          MEPF (one), not one of the five that included MEPF work.
        */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {services
            .filter((s) => project.services.includes(s.slug))
            .map((s) => (
              <Badge key={s.slug} variant="default" size="sm">
                {s.shortTitle}
              </Badge>
            ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-4 text-caption text-muted">
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
  const projects = useProjects();
  const isDevanagari = testimonial.language === 'hi';
  const [playing, setPlaying] = useState(false);

  /*
   * The media panel.
   *
   * `image` has held each client's own project cover since the data was written
   * and was never rendered anywhere — so the panel had its content waiting for
   * it. A project photograph is also the honest thing to put here: these are
   * real, named clients with no portraits on file, and a stock face under a real
   * name is the exact failure `monogram()` in lib/media.ts exists to avoid.
   * Their house, not a stranger's face.
   *
   * When a real recorded testimonial arrives, `videoPoster` overrides it and the
   * same panel becomes the video's poster frame. The layout does not change —
   * that is the whole point of building it this way now.
   */
  const poster = testimonial.videoPoster ?? testimonial.image ?? testimonial.avatar;
  const hasVideo = Boolean(testimonial.videoUrl && resolveVideo(testimonial.videoUrl));

  /*
   * `projectId` has been on this type since the data was written and nothing has
   * ever read it. Now it earns its keep: the visitor reads what a client said,
   * then goes and looks at the work being described.
   *
   * `ROUTES.project` takes a slug, not an id, so the record has to be resolved
   * first. Optional throughout — a testimonial with no project simply has no
   * link, which is the honest outcome rather than a guessed one.
   */
  const project = testimonial.projectId
    ? projects.find((p) => p.id === testimonial.projectId)
    : undefined;

  return (
    <figure
      className={cn(
        /*
          Side by side only from `lg`.

          It was `sm:flex-row`, which turned on at 640px — but from `md` the band
          is already two columns, so each card was ~350px wide and a 38% media
          split left barely 220px for the quote. The photographs stretched into
          tall narrow strips and the client names ran out of the card. Below
          `lg` the media goes back on top, where it has the full card width.
        */
        'surface group/t flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-500 ease-out-expo hover:border-cyan-500/40 hover:shadow-md lg:flex-row',
        className,
      )}
    >
      {poster && (
        <div className="relative h-48 shrink-0 lg:h-auto lg:w-[34%] xl:w-[38%]">
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover lg:absolute lg:inset-0"
          />

          {/*
            A photograph of someone's project that does nothing when clicked is a
            small lie about what it is. So it links — but only where the panel is
            not already the play button, which cannot share the space.

            `tabIndex={-1}` and `aria-hidden` because this goes exactly where the
            caption link goes. A mouse gets a bigger target; a keyboard or screen
            reader gets one link per card instead of the same destination twice.
          */}
          {project && !hasVideo && (
            <Link
              href={ROUTES.project(project.slug)}
              tabIndex={-1}
              aria-hidden
              className="absolute inset-0"
            />
          )}

          {hasVideo && (
            <>
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play video testimonial from ${testimonial.name}`}
                className="absolute inset-0 flex items-center justify-center bg-ink-950/20 transition-colors duration-500 hover:bg-ink-950/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
              >
                {/* `ml-0.5` optically centres a triangle in a circle; `fill-current`
                    makes it solid. Lifted from the gallery so the site has one
                    play button, not two. */}
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-navy-800 shadow-md transition-transform duration-500 ease-out-expo group-hover/t:scale-105">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </span>
              </button>
              {testimonial.videoDuration && (
                <span className="num pointer-events-none absolute right-3 top-3 rounded bg-ink-950/70 px-2 py-0.5 text-[0.7rem] text-white backdrop-blur-sm">
                  {testimonial.videoDuration}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 lg:p-7">
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
            <img src={testimonial.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" loading="lazy" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{testimonial.name}</p>
            <p className="truncate text-caption text-subtle">{testimonial.locality}</p>
          </div>
        </figcaption>

        {/*
          Outside the figcaption: that element is the attribution of the quote,
          and a link to a project page is not part of who said it.

          The project is named rather than hidden behind "View project" — the
          point of this link is that a visitor can check the claim, so it should
          say what they are about to be shown. Naming it also means the visible
          text is the whole accessible name, with no aria-label to keep in step.
        */}
        {project && (
          <CtaLink href={ROUTES.project(project.slug)} size="sm" className="mt-4 self-start">
            See the project · {project.title}
          </CtaLink>
        )}
      </div>

      {testimonial.videoUrl && (
        <VideoLightbox
          open={playing}
          onClose={() => setPlaying(false)}
          url={testimonial.videoUrl}
          title={`${testimonial.name} — ${testimonial.locality}`}
          poster={poster}
        />
      )}
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

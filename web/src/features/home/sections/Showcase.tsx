import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { Counter, Reveal, SplitText } from '@/components/motion';
import { ProjectCard, SectionHeader, StatTile, TestimonialCard } from '@/components/common';
import { ACHIEVEMENTS, PROCESS_STEPS } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { testimonials } from '@/data/people';
import { usePrefersReducedMotion } from '@/hooks';
import { cn } from '@/lib/cn';

/* ==================================================================== */
/* Featured projects                                                     */
/* ==================================================================== */

export function FeaturedProjects() {
  const featured = projects.filter((p) => p.featured).slice(0, 5);
  const [hero, ...rest] = featured;

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Selected work"
          title="Built across Jaipur"
          lead="From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly."
          action={
            <Link to={ROUTES.projects} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
              All projects <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {hero && (
            <div className="lg:col-span-7">
              <ProjectCard project={hero} size="lg" />
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">
            {rest.slice(0, 2).map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i + 1} />
            ))}
          </div>
          {rest.slice(2).map((project, i) => (
            <div key={project.id} className="lg:col-span-4">
              <ProjectCard project={project} index={i + 3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Process — horizontal rail                                             */
/* ==================================================================== */

/**
 * "How we work", read left to right.
 *
 * This was an alternating vertical timeline: six stages stacked down the page,
 * each one requiring a scroll to reach the next. It was the single tallest
 * section on the home page and you could never see the shape of the process —
 * only whichever stage happened to be in the viewport.
 *
 * Now all six sit on one rail, so the whole engagement is legible at a glance.
 * The cyan progress fill runs L→R instead of top-down; it is the same
 * `useScroll` transform as before with `width` swapped for `height`.
 */
export function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 90%'] });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={ref} className="section-sm on-dark grain relative overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />

      <div className="container relative">
        <SectionHeader
          overline="How we work"
          title="Six stages, start to a year after handover"
          lead="A process designed so you always know what is happening, what happens next, and who is responsible."
          tone="light"
        />

        <div className="relative mt-10 md:mt-12">
          {/*
            The rail only renders at `lg`, where all six nodes share a row. At `md`
            the grid wraps to 3×2 and at `sm` it becomes a swipe row, so a single
            full-width line would connect nothing.

            It has to stop at the *sixth node's centre*, not the container edge, or
            it trails off into empty space. With six columns and a 1.25rem gap the
            last centre sits one column short of the right edge, plus the node's own
            20px radius — hence the calc. Both the track and the progress fill live
            inside this wrapper so the animated width is a percentage of the rail
            rather than of the container.
          */}
          <div
            className="pointer-events-none absolute left-5 top-5 hidden h-px right-[calc((100%-6.25rem)/6-1.25rem)] lg:block"
            aria-hidden
          >
            <div className="h-full w-full bg-white/12" />
            <motion.div
              className="absolute inset-y-0 left-0 origin-left bg-cyan-500"
              style={{ width: reduced ? '100%' : progressWidth }}
            />
          </div>

          {/*
            Below `md` the cards bleed to the screen edge and snap-scroll, which
            reads as "there is more to the right" without needing arrows.
            `scroll-px` matters: without it the first card snaps to the scrollport
            edge and eats the container's own left padding.
          */}
          <ol className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-12 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-6 lg:gap-x-5">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal
                key={step.step}
                as="li"
                delay={i * 0.06}
                y={30}
                className="w-[68vw] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none"
              >
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/40 bg-ink-950">
                  <Icon name={step.icon} className="h-[18px] w-[18px] text-cyan-500" />
                </span>

                {/* Up from `text-caption`/cyan-500. It carries the sequence and the
                    timeline — the two things a reader scans this section for — and at
                    13px it was the first thing to disappear. cyan-400 is 8.9:1 on
                    ink-950 against cyan-500's 7.4:1. */}
                <p className="num mt-5 text-sm font-medium text-cyan-400">
                  {String(step.step).padStart(2, '0')} · {step.duration}
                </p>
                {/* Titles run to two lines in a sixth-width column; the min-height keeps
                    every description starting on the same baseline across the rail. */}
                <h3 className="mt-1.5 font-display text-heading-md font-semibold text-white lg:min-h-[3.5rem]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/70">{step.description}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Achievements                                                          */
/* ==================================================================== */

export function Achievements() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="overline">Our achievements</p>
            </Reveal>
            <h2 className="mt-4 text-display-md">
              <SplitText text="Built on trust." />
              <br />
              <SplitText text="Driven by excellence." delay={0.12} />
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-4">
            {ACHIEVEMENTS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <StatTile
                  value={
                    <>
                      <Counter value={stat.value} />
                      <span className="text-cyan-500">{stat.suffix}</span>
                    </>
                  }
                  label={stat.label}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/*
 * `SmartConstruction` and `LatestInsights` used to live here too.
 *
 *  · SmartConstruction restated process step 04 ("Regular Updates") at full
 *    section width. It survives as a proof link into /portal from `WhyChooseUs`.
 *  · LatestInsights sent first-time construction leads into the blog halfway
 *    down the funnel. /blog is still linked from the nav and the footer.
 *
 * `Testimonials` was also folded away — into `WhyChooseUs` as a three-card row —
 * and has since been split back out below at the client's request. Social proof
 * earns its own band; it was competing with the commitment cards for the same
 * column.
 */

/* ==================================================================== */
/* Testimonials                                                          */
/* ==================================================================== */

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="section-sm bg-[rgb(var(--c-surface-2))]">
      <div className="container">
        <SectionHeader
          overline="What our clients say"
          title="Trusted by homeowners and businesses alike"
          align="center"
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.07}>
              <div
                onMouseEnter={() => setActive(i)}
                className={cn('h-full transition-transform duration-500', active === i && 'md:-translate-y-1')}
              >
                <TestimonialCard testimonial={t} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

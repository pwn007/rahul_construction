'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
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
  /*
    Six, not five, and that is a layout constraint rather than an editorial one.

    This used to be a bento — one project at `lg:col-span-7` with a wider crop
    and the rest arranged around it — and the client did not want one card
    bigger than its neighbours. In a plain three-across grid the count decides
    whether the last row is complete: six fills 2+2+2 on tablet and 3+3 on
    desktop with no empty cell, where five leaves a hole at both.
  */
  const featured = projects.filter((p) => p.featured).slice(0, 6);

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Selected work"
          title="Built across Jaipur"
          lead="From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly."
          action={
            <Link href={ROUTES.projects} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
              All projects <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        {/* The same grid as /projects, so a project looks identical wherever it
            is listed. `index` still drives the staggered image reveal. */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
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
            {/*
              `/15`, not `/12`. Tailwind's opacity scale here has no 12 step, so
              `bg-white/12` compiled to no rule at all and this track has been
              invisible since it was written — the line visible on desktop is the
              cyan progress fill in front of it, not the track. 21 other `/12`
              colour utilities across the codebase are dead the same way; see the
              handover note.
            */}
            <div className="h-full w-full bg-white/15" />
            <motion.div
              className="absolute inset-y-0 left-0 origin-left bg-cyan-500"
              style={{ width: reduced ? '100%' : progressWidth }}
            />
          </div>

          {/*
            Three layouts, one list.

            Below `md` this was a snap-scrolling swipe row. It measured 4.36 screens
            wide with 1310px hidden, no dots, no counter and no arrows — five of the
            six stages were off-screen behind a gesture nothing invited, and the only
            hint was the second card sliced mid-word. Worse, a horizontal scroller
            inside a vertical page fights the thumb on any diagonal swipe, which is
            what made the page feel like it was sliding sideways.

            It is now a vertical timeline: nodes on a spine, read by scrolling the way
            the rest of the page scrolls. Taller — about 950px against 543px — and
            that is the trade the original rail was avoiding, but a section that can
            be read beats a compact one that cannot. `ServicesPage` already stacks
            these same six steps on mobile, so this also stops the home page being the
            odd one out.

            `md` (3×2) and `lg` (six across) are untouched.
          */}
          <ol className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-12 lg:grid-cols-6 lg:gap-x-5">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal
                key={step.step}
                as="li"
                delay={i * 0.06}
                y={30}
                className="relative grid grid-cols-[2rem_1fr] items-start gap-x-4 md:block"
              >
                {/*
                  The spine, drawn per row rather than as one absolute line down
                  the list.

                  A single line spanning the wrapper cannot know where the last
                  node is — it would run past it to the bottom of the last
                  description, which is the same trailing-off problem the
                  horizontal rail's `calc()` exists to solve. A segment per row,
                  omitted on the final one, terminates itself.

                  `top-8` starts it below the 2rem node; `-bottom-6` carries it
                  across the `gap-6` to the next node's top edge. The two must
                  stay in step — a mismatch leaves a visible break in the spine.
                */}
                {i < PROCESS_STEPS.length - 1 && (
                  <span className="pointer-events-none absolute -bottom-6 left-4 top-8 w-px bg-white/15 md:hidden" aria-hidden />
                )}

                {/* 2rem on mobile so the spine reads as a spine rather than a margin;
                    back to 2.5rem from `md`, where the node sits above its own column. */}
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-ink-950 md:h-10 md:w-10">
                  <Icon name={step.icon} className="h-4 w-4 text-cyan-500 md:h-[18px] md:w-[18px]" />
                </span>

                <div className="min-w-0">
                  {/* Up from `text-caption`/cyan-500. It carries the sequence and the
                      timeline — the two things a reader scans this section for — and at
                      13px it was the first thing to disappear. cyan-400 is 9.9:1 on
                      ink-950 against cyan-500's 9.0:1.

                      No top margin on mobile: the number sits on the node's own line,
                      which is what ties a row to its point on the spine. */}
                  <p className="num text-sm font-medium text-cyan-400 md:mt-5">
                    {String(step.step).padStart(2, '0')} · {step.duration}
                  </p>
                  {/* The min-height aligns descriptions across a six-across row. In a
                      stack there is no row to align to, so it would only add dead space. */}
                  <h3 className="mt-1.5 font-display text-heading-md font-semibold text-white lg:min-h-[3.5rem]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/70">{step.description}</p>
                </div>
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

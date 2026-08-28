'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { Counter, Reveal, SplitText } from '@/components/motion';
import { ProjectCard, SectionHeader, StatTile, TestimonialBand } from '@/components/common';
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
/**
 * One stage on the rail: a node on the line, a card beneath it.
 *
 * ── On `lit`, and why the dim state is `lg:`-only ───────────────────────────
 * The progress rail only exists at `lg`, where all six nodes share a row. At
 * `md` the grid wraps to 3×2 and below that it is a vertical spine, and neither
 * has a leading edge to sequence against — a card dimmed at those widths would
 * just look broken.
 *
 * So lit is written as the base state and only the `lg:` overrides can dim a
 * stage. Branching on a JS media query instead would flash: `useIsDesktop()`
 * reports false on the server and on the first client render (see the
 * `useSyncExternalStore` note in hooks/index.ts), so all six would paint lit
 * before five of them dimmed a tick later.
 */
function ProcessStep({
  step,
  index,
  lit,
}: {
  step: (typeof PROCESS_STEPS)[number];
  index: number;
  lit: boolean;
}) {
  /* Only ever has an effect at `lg` — see the note above. */
  const dim = !lit;

  return (
    <Reveal
      as="li"
      delay={index * 0.06}
      y={30}
      /*
        A flex column from `md`, not `block`.

        The cards want equal heights across a row, which grid stretch already gives
        the `<li>`. Getting that onto the card with `h-full` does not work: the
        percentage resolves against the li, so the card came out the li's *full*
        height with the node still stacked above it — 60px of overflow per card,
        which showed as dead space under the text and swallowed the row gap.
        `flex-1` on the card measures the space actually left over instead.
      */
      className="relative grid grid-cols-[2rem_1fr] items-start gap-x-4 md:flex md:flex-col md:items-stretch"
    >
      {/*
        The spine, drawn per row rather than as one absolute line down the list.

        A single line spanning the wrapper cannot know where the last node is —
        it would run past it to the bottom of the last description, which is the
        same trailing-off problem the horizontal rail's `calc()` exists to solve.
        A segment per row, omitted on the final one, terminates itself.

        `top-8` starts it below the 2rem node; `-bottom-6` carries it across the
        `gap-6` to the next node's top edge. The two must stay in step — a
        mismatch leaves a visible break in the spine.
      */}
      {index < PROCESS_STEPS.length - 1 && (
        <span className="pointer-events-none absolute -bottom-6 left-4 top-8 w-px bg-white/15 md:hidden" aria-hidden />
      )}

      {/*
        2rem on mobile so the spine reads as a spine rather than a margin; back to
        2.5rem from `md`, where the node sits above its own column.

        `bg-ink-950` stays opaque at both states — the rail line runs behind the
        node and would otherwise show through it. `shadow-glow` is the app's
        established active affordance and is already a ring plus a bloom in one.
        The icon takes its colour from here through `currentColor`.
      */}
      <span
        className={cn(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-ink-950 md:h-10 md:w-10 md:self-center',
          'transition-all duration-500 ease-out-expo',
          'border-cyan-500 text-cyan-400 shadow-glow',
          dim && 'lg:border-white/25 lg:text-white/40 lg:shadow-none',
        )}
      >
        <Icon name={step.icon} className="h-4 w-4 md:h-[18px] md:w-[18px]" />
      </span>

      {/* `md:mt-5` moved here off the step number, which used to carry it — the
          card is what has to clear the node now. */}
      <div
        className={cn(
          'group/card relative min-w-0 overflow-hidden rounded-xl border p-5 md:mt-5 md:flex-1 lg:p-4 xl:p-5',
          'transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-cyan-500/40',
          'border-cyan-500/25 bg-cyan-500/[0.04] shadow-inset',
          dim && 'lg:border-white/10 lg:bg-white/[0.03] lg:shadow-none',
        )}
      >
        {/* Blooms on hover. Everything after it needs `relative`, or the orb
            paints over the text rather than behind it. */}
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl transition-transform duration-700 ease-out-expo group-hover/card:scale-150"
          aria-hidden
        />

        {/* Up from `text-caption`/cyan-500. It carries the sequence — the thing a
            reader scans this section for — and at 13px it was the first thing to
            disappear. cyan-400 is 9.9:1 on ink-950 against cyan-500's 9.0:1.

            The step timing that used to follow the number is gone at the client's
            request: a published "Weeks 2–6" is a commitment made before the
            project is scoped, and it read as one. The number stayed, so it is now
            tracked out to hold the line on its own. */}
        <p
          className={cn(
            'num relative text-sm font-semibold tracking-[0.18em] transition-colors duration-500',
            'text-cyan-400',
            dim && 'lg:text-white/35',
          )}
        >
          {String(step.step).padStart(2, '0')}
        </p>
        {/* The min-height aligns descriptions across a six-across row. In a stack
            there is no row to align to, so it would only add dead space.

            3.625rem is two lines exactly, not a guess: `heading-md` is
            `clamp(1.125rem, 1.4vw, 1.375rem)`, so its line-height tops out at 29px
            once the clamp caps — 58px for two. Measured across 1024–1600, no title
            wraps to three, and every extra rem here is dead air under the
            one-line titles. Card padding narrowed these columns, so re-measure if
            the copy or the padding changes. */}
        <h3 className="relative mt-1.5 font-display text-heading-md font-semibold text-white lg:min-h-[3.625rem]">
          {step.title}
        </h3>
        <p className="relative mt-2 text-[0.9375rem] leading-relaxed text-white/70">{step.description}</p>
      </div>
    </Reveal>
  );
}

/**
 * How many nodes the progress fill has swept past.
 *
 * Node `i` sits at fraction `i / (n - 1)` of the rail — node 0 at the origin,
 * node 5 at the far end — so the count is everything at or behind `v`.
 */
function reachedFor(v: number): number {
  return Math.min(PROCESS_STEPS.length, Math.floor(v * (PROCESS_STEPS.length - 1)) + 1);
}

export function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 90%'] });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  /*
   * The stages light up in turn as the fill reaches them, so the process builds
   * itself rather than arriving all at once.
   *
   * Driven off the same `scrollYProgress` that draws the fill, so the two can
   * never disagree about where the leading edge is. This is `useState` and not a
   * MotionValue on purpose: the derived value is one integer that changes five
   * times across the whole section, `setState` bails out on an unchanged value,
   * and a plain number lets the lit/dim treatment be Tailwind classes with a CSS
   * transition — which the global reduced-motion gate already knows how to stop.
   */
  /* Annotated: `PROCESS_STEPS` is `as const`, so `.length` is the literal `6` and
     the initialiser would narrow the state to that one value. */
  const [reached, setReached] = useState<number>(PROCESS_STEPS.length);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setReached(reachedFor(v)));

  /* `change` only fires on movement, so a reload landing mid-section would keep
     whatever the initial state happened to be. Sync once against the real value. */
  useEffect(() => setReached(reachedFor(scrollYProgress.get())), [scrollYProgress]);

  /* Reduced motion pins the fill to 100%; the nodes have to agree with it. */
  const litCount = reduced ? PROCESS_STEPS.length : reached;

  return (
    <section ref={ref} className="section-sm on-dark grain relative overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      {/* Two glows, not one. At `/10` from a single corner the band read flat behind
          the cards; `CtaBand` — the richest dark surface in the app — uses `/25`. */}
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-cyan-500/[0.18] blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[360px] w-[360px] rounded-full bg-navy-500/20 blur-[130px]" aria-hidden />

      <div className="container relative">
        <SectionHeader
          overline="How we work"
          title="Six stages, start to a year after handover"
          /* "…and who is responsible" used to close this line. That is `OneSystem`'s
             claim, made three sections earlier and four other times besides — so
             this section keeps the half only it can answer: the sequence. */
          lead="The same six stages on every project, so you always know what is happening and what happens next."
          tone="light"
        />

        <div className="relative mt-10 md:mt-12">
          {/*
            The rail only renders at `lg`, where all six nodes share a row. At `md`
            the grid wraps to 3×2 and at `sm` it becomes a swipe row, so a single
            full-width line would connect nothing.

            ── Where the ends sit ──────────────────────────────────────────────
            The nodes used to sit at the left edge of their column, so the line ran
            from `left-5` (the first node's radius) to one column short of the
            right. That left every icon hanging over the left third of its card
            rather than above it, which is what the client flagged.

            The nodes are now centred on their column (`md:self-center`), so both
            ends of the line are inset by exactly half a column — which is what
            makes this calc symmetric where the old one was not. With six columns
            and five 1.25rem gaps, a column is `(100% - 6.25rem)/6` wide, so half
            of one is `(100% - 6.25rem)/12`.

            `top-5` is the node's own radius: 40px tall at `lg`, so its centre is
            20px down. Both the track and the progress fill live inside this
            wrapper so the animated width is a percentage of the rail rather than
            of the container — and because the wrapper now spans exactly first
            centre to last centre, `reachedFor()` still maps node `i` to `i/(n-1)`
            with no change.
          */}
          <div
            className="pointer-events-none absolute left-[calc((100%-6.25rem)/12)] right-[calc((100%-6.25rem)/12)] top-5 hidden h-px lg:block"
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
              <ProcessStep key={step.step} step={step} index={i} lit={i < litCount} />
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

/*
 * Exported, imported nowhere. Its headline — "Built on trust. Driven by
 * excellence." — was also `WhyChooseUs`'s, and that section has been merged
 * away, so this is now the only copy of a line the site no longer uses.
 */
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
 *    section width. Its "watch your site live" proof link used to survive in
 *    `WhyChooseUs`; that section has since been merged into `OneSystem` and the
 *    link was already commented out with the rest of /portal, so step 04 is now
 *    the only place the live cameras are mentioned on this page.
 *  · LatestInsights sent first-time construction leads into the blog halfway
 *    down the funnel. /blog is still linked from the nav and the footer.
 *
 * `Testimonials` was also folded away once — into the since-merged
 * `WhyChooseUs`, as a three-card row — and was split back out at the client's
 * request. Social proof earns its own band.
 */

/* ==================================================================== */
/* Testimonials                                                          */
/* ==================================================================== */

export function Testimonials() {
  return (
    <TestimonialBand
      overline="What our clients say"
      title="Trusted by homeowners and businesses alike"
      lead="Four projects, four families, and the part they chose to say out loud. Where a client has recorded their own, the film sits beside the words."
      items={testimonials}
    />
  );
}

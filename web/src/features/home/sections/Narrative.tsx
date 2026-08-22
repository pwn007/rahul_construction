import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { Marquee, Reveal, SplitText, StaggerGroup } from '@/components/motion';
import { SectionHeader } from '@/components/common';
import { DIFFERENTIATORS, WHAT_MAKES_US_DIFFERENT } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { clientLogos } from '@/data/people';
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
/* "One system" — scope of responsibility, and the rule governing each    */
/* ==================================================================== */

/**
 * The four disciplines the firm owns, and the discipline it owns them with.
 *
 * ── Why this is one list and not two ────────────────────────────────────────
 * This section used to run a four-step chain and then, underneath it, a "We
 * focus on" grid of three cards. They read as two ideas but they were one idea
 * said twice, almost verbatim:
 *
 *   chain "Engineering — Structure and MEPF, coordinated from day one"
 *   focus "Modern engineering — Structure and MEPF calculated and coordinated…"
 *
 * All three focus cards mapped onto a chain step that way, and the third —
 * live cameras and weekly reporting — is said a *third* time by process step 04
 * further down the page. Seven items carrying four ideas.
 *
 * So each stage now states both halves on one row: `scope` is what the system
 * takes responsibility for, `focus` is the rule that governs it. The reader
 * gets "what" and "how" in a single scan down two columns instead of matching a
 * grid back against a list. `APPROACH.focus` in site.ts is no longer rendered —
 * it stays as PDF-sourced reference copy, like the other unrendered constants.
 */
const DISCIPLINES = [
  {
    label: 'Architecture',
    scope: 'The plan, the Vastu and the working drawings.',
    focus: 'Sequenced before site',
  },
  {
    label: 'Engineering',
    scope: 'Structure and MEPF, coordinated from day one.',
    focus: 'Calculated, not assumed',
  },
  {
    label: 'Execution',
    scope: 'Our own crews, our own quality gates.',
    focus: 'Documented stage by stage',
  },
  {
    label: 'Handover',
    scope: 'Delivered on the date agreed before we broke ground.',
    focus: 'Then a year of maintenance',
  },
] as const;

export function OneSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.75], ['0%', '100%']);

  return (
    <section id="intro" ref={ref} className="section-sm relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-40 dark:opacity-[0.07]" aria-hidden />

      <div className="container relative">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="overline">About Neetu Archstone</p>
            </Reveal>

            {/*
              Two block lines, and no `text-gradient-brand`.

              That class sets `color: transparent` and paints the text from the
              element's own background. Wrapped around `SplitText`, whose words
              are each their own `inline-block`, the fragmented inline background
              only landed on the second line — so "One point of" rendered fully
              invisible, every word computing to rgba(0,0,0,0). globals.css also
              records the class at 1.6:1, under the 3:1 large-text floor. Solid
              cyan-600 is ~3.2:1 and cannot fail this way.
            */}
            <h2 className="mt-4 text-display-md">
              <span className="block">
                <SplitText text="One system." />
              </span>
              <span className="block text-cyan-600 dark:text-cyan-400">
                <SplitText text="One point of responsibility." delay={0.15} />
              </span>
            </h2>

            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lead text-body-lg text-muted">
                Most projects fail in the gaps — between the architect and the contractor, the contractor and
                the electrician. We removed the gaps by putting all four disciplines under one roof.
              </p>
            </Reveal>

            {/* The payoff. Without this the list above is a capability boast; with
                it, it is the reason the capability matters to the reader. */}
            <Reveal delay={0.3}>
              <p className="mt-5 max-w-lead font-medium text-[rgb(var(--c-text))]">
                One team owns all four, so there is nobody to chase and nobody to blame.
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
              {/* Progress spine — the visual argument that these are one
                  continuous system rather than four separate engagements. */}
              <div className="absolute left-[13px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))]" aria-hidden />
              <motion.div
                className="absolute left-[13px] top-2 w-px origin-top bg-cyan-500"
                style={{ height: reduced ? '100%' : lineHeight }}
                aria-hidden
              />

              <StaggerGroup stagger={0.1} className="space-y-9">
                {DISCIPLINES.map((item, i) => (
                  <div key={item.label} className="relative">
                    <span className="absolute -left-10 top-1 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 border-[rgb(var(--c-border))] bg-[rgb(var(--c-bg))]">
                      <span className="num text-[0.65rem] font-semibold text-subtle">{i + 1}</span>
                    </span>

                    {/* Discipline left, governing rule right: "what" and "how"
                        become two columns the eye can run down separately. */}
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b pb-3">
                      <h3 className="font-display text-heading-lg font-semibold">{item.label}</h3>
                      <p className="text-caption uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">
                        {item.focus}
                      </p>
                    </div>
                    <p className="mt-2.5 text-muted">{item.scope}</p>
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

/*
 * `Approach` used to be its own section here. It made the same argument as
 * `OneSystem` immediately above it — "every step under one system" versus "one
 * system, one point of responsibility" — so the page said the same thing twice
 * before a visitor had seen a single service. Its focus grid now closes
 * `OneSystem`, and has since been absorbed again into the per-stage `focus`
 * lines there. `APPROACH` stays in site.ts as PDF-sourced reference copy.
 */

/*
 * The "What we offer" services grid used to sit here — five cards under
 * "Comprehensive construction solutions". Removed from the home page at the
 * client's request; /services still carries all five in full, and both the nav
 * and the footer link straight to it.
 */

/* ==================================================================== */
/* Why choose us                                                         */
/* ==================================================================== */

/**
 * The single "why us" moment on the page.
 *
 * This section used to be one of four making overlapping claims — it sat between
 * a standalone Vastu teaser, a standalone live-camera section and a standalone
 * testimonial band, all of which were arguing for the same decision. Vastu and
 * the site cameras stay folded in here as proof links into the pages that
 * actually cover them.
 *
 * Social proof was folded in too, as a three-card row, and has since been split
 * back out into its own `Testimonials` band — it was competing with the
 * commitment cards for the same column rather than supporting them.
 */
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

            {/* What makes us different — PDF page 22. Chips rather than stacked
                rows: five short phrases do not each need their own line. */}
            <StaggerGroup stagger={0.07} className="mt-8 flex flex-wrap gap-2">
              {WHAT_MAKES_US_DIFFERENT.map((item) => (
                <span
                  key={item}
                  className="surface inline-flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3.5 text-caption font-medium"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </StaggerGroup>

            <Reveal delay={0.3} className="mt-8">
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

            {/* The deep-dives that used to be full sections of their own. */}
            <Reveal delay={0.35} className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link
                to={ROUTES.vastu}
                className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
              >
                Vastu-aligned planning <ArrowUpRight className="h-4 w-4" />
              </Link>
              {/* Client Portal is commented out for now — see app/router.tsx.
              <Link
                to={ROUTES.portal}
                className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
              >
                Watch your site live <ArrowUpRight className="h-4 w-4" />
              </Link>
              */}
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {DIFFERENTIATORS.map((item, i) => (
                <Reveal key={item.key} delay={i * 0.08}>
                  <div className="group relative h-full overflow-hidden rounded-xl bg-cyan-500 p-6 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                    <Icon name={item.icon} className="relative h-7 w-7" />
                    <h3 className="relative mt-4 font-display text-heading-md font-semibold">{item.title}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-white/80">{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
 * `VastuTeaser` used to close out this file — a full section with a parallax
 * compass image and a four-item benefits list. Vastu is a genuine differentiator,
 * but it had a whole page of its own at /vastu and the home page was already
 * fourteen sections long. It now appears in the hero sub-headline, in process
 * step 02, and as the proof link above.
 */

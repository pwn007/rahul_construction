'use client';

import { Marquee, Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { useClientLogos } from '@/hooks/useClientLogos';

/* ==================================================================== */
/* Trust bar                                                             */
/* ==================================================================== */

export function TrustBar() {
  const clientLogos = useClientLogos();
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

export function OneSystem() {
  return (
    /*
      `.section`, not `.section-sm`, and this is the page's only call site.
      Seven of the eight bands were the same height, which is a large part of
      why the page read flat. This one is the page's central claim, so it is the
      one that earns the room.

      `navy-800` rather than `ink-950`. The original reason was that the page
      had a second dark band — `ProcessSection` — and two different darks gave
      the scroll a rhythm the near-identical paper grounds could not (`--c-bg`
      and `--c-surface-2` differ by 3/255, so the "tint" was never visible).
      `ProcessSection` has since been removed and this is the page's only dark
      band. Navy still holds after the Sep 2026 move to the top of the page:
      the footer is `ink-950`, and an ink band this early would simply read as
      a second footer stranded under the hero. Navy is
      also already the house's second dark ground (`CtaBand`), so nothing new is
      invented either way.
   

      The four-discipline grid that used to close this band was removed at the
      client's request (Sep 2026); the paragraph above now names the four, so the
      claim still lands without the cards.
    */
    <section id="intro" className="section on-dark grain relative overflow-hidden bg-navy-800 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />

      <div className="container relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Reveal>
              <p className="overline">About Neetu Archstone</p>
            </Reveal>

            {/*
              Two block lines, and no `text-gradient-brand`.

              That class sets `color: transparent` and paints the text from the
              element's own background. Wrapped around `SplitText`, whose words
              are each their own `inline-block`, the fragmented inline background
              only landed on the second line — so "One point of" rendered fully
              invisible, every word computing to rgba(0,0,0,0). Solid cyan-300 on
              navy is well clear of the 3:1 large-text floor and cannot fail this
              way.
            */}
            <h2 className="mt-4 text-display-md text-white">
              <span className="block">
                <SplitText text="One system." />
              </span>
              <span className="block text-cyan-300">
                <SplitText text="One point of responsibility." delay={0.15} />
              </span>
            </h2>

            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lead text-body-lg text-white/60">
                Most projects fail in the gaps — between the architect and the contractor, the contractor and
                the electrician. We removed the gaps by putting architecture, engineering, execution and handover
                under one roof.
              </p>
            </Reveal>

            {/* The payoff. Without this the list below is a capability boast; with
                it, it is the reason the capability matters to the reader. */}
            <Reveal delay={0.3}>
              <p className="mt-5 max-w-lead font-medium text-white">
                One team owns all four, so there is nobody to chase and nobody to blame.
              </p>
            </Reveal>
          </div>

          {/*
            Both destinations, kept together deliberately. `/about` and `/vastu`
            have no other in-content link anywhere on the home page — they were
            one per section before the merge, and dropping either would leave a
            page reachable only from the nav.
          */}
          <Reveal delay={0.4} className="shrink-0">
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <CtaLink href={ROUTES.about} tone="light">
                Read our story
              </CtaLink>
              <CtaLink href={ROUTES.vastu} tone="light">
                Vastu-aligned planning
              </CtaLink>
            </div>
          </Reveal>
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

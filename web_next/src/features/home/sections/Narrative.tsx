'use client';

import { Marquee, Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import { useClientLogos } from '@/hooks/useClientLogos';

/* ==================================================================== */
/* Trust bar                                                             */
/* ==================================================================== */

const TRUST_LINE = 'We build with materials you already trust';

/** The suppliers' logos running past — on the trust strip, and inside OneSystem on a phone. */
function TrustLogos({ className }: { className?: string }) {
  const clientLogos = useClientLogos();
  return (
    <Marquee speed={45}>
      {clientLogos.map((logo) => (
        <img
          key={logo.id}
          src={logo.logo}
          alt={logo.name}
          className={cn('h-9 w-auto shrink-0 transition-all duration-500', className)}
          loading="lazy"
        />
      ))}
    </Marquee>
  );
}

/*
 * From `md` only. On a phone every band of the home page is one screen (the
 * client's brief, Oct 2026), and this strip is too short to be one: it used to
 * share a screen with OneSystem below it and push that band past the bottom.
 * There the logos run along the foot of OneSystem instead. Hidden, the strip
 * has no height, so the section engine does not count it as a stop. With
 * OneSystem switched off in the admin (`alone`) the strip shows on a phone too,
 * as it used to, rather than the logos going missing.
 */
export function TrustBar({ alone = false }: { alone?: boolean }) {
  return (
    // The page ground and no rule (25 Oct 2026): on a desktop the strip and OneSystem below it
    // read as one light band, where a cream strip between the hero and a navy band read as a
    // stripe. `data-section`: a stop for the section engine (lib/section-nav) on a tablet; too
    // short to be one alone, it travels with the band below it.
    <section data-section="trust" className={cn('bg-[rgb(var(--c-bg))] py-8', !alone && 'trust-bar')}>
      <div className="container">
        <p className="mb-6 text-center text-caption uppercase tracking-[0.2em] text-subtle">{TRUST_LINE}</p>
        <TrustLogos className="opacity-45 grayscale hover:opacity-90 hover:grayscale-0 dark:invert" />
      </div>
    </section>
  );
}

/* ==================================================================== */
/* "One system" — scope of responsibility, and the rule governing each    */
/* ==================================================================== */

export function OneSystem({ logos = true }: { logos?: boolean }) {
  return (
    /*
      `.section`, not `.section-sm`, and this is the page's only call site.
      Seven of the eight bands were the same height, which is a large part of
      why the page read flat. This one is the page's central claim, so it is the
      one that earns the room.

      On the page ground (mist), with navy-black text and a cyan second line,
      since 25 Oct 2026. It was saturated `navy-800` with two blurred cyan
      glows — the logo navy at full strength, the most saturated dark on the
      page, between a photographed hero and photographed chapters. The client
      called it "a very dark blur" and asked for the page lighter, with navy as
      the accent (see HomeView for the page's colour rules). The faint blueprint
      grid stays, drawn in navy now.


      The four-discipline grid that used to close this band was removed at the
      client's request (Sep 2026); the paragraph above now names the four, so the
      claim still lands without the cards.

      On a phone it is a screen of its own, like every band there (`.one-system`
      in globals.css), with the trust strip's logos along its foot — `logos`,
      the admin's "trust" switch, as for the strip.
    */
    <section
      id="intro"
      data-section=""
      className="one-system section relative overflow-hidden bg-[rgb(var(--c-bg))] text-[rgb(var(--c-text))]"
    >
      <div className="mask-fade-y pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-60" aria-hidden />

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
              invisible, every word computing to rgba(0,0,0,0). Solid brand-text
              cyan cannot fail this way, and it is the page's one heading accent
              on a light ground — the decks' "Built" and "Client" use it too
              (5.2:1 on mist; brand cyan itself would be 2.1:1). It turns to
              cyan-300 in the dark theme on its own.
            */}
            <h2 className="mt-4 text-display-md text-[rgb(var(--c-text))]">
              <span className="block">
                <SplitText text="One system." />
              </span>
              <span className="block text-[rgb(var(--c-brand-text))]">
                <SplitText text="One point of responsibility." delay={0.15} />
              </span>
            </h2>

            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lead text-body-lg text-[rgb(var(--c-text-muted))]">
                Most projects fail in the gaps — between the architect and the contractor, the contractor and
                the electrician. We removed the gaps by putting architecture, engineering, execution and handover
                under one roof.
              </p>
            </Reveal>

            {/* The payoff. Without this the list below is a capability boast; with
                it, it is the reason the capability matters to the reader. */}
            <Reveal delay={0.3}>
              <p className="one-system__payoff mt-5 max-w-lead font-medium text-[rgb(var(--c-text))]">
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
            <div className="one-system__ctas flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <CtaLink href={ROUTES.about}>Read our story</CtaLink>
              <CtaLink href={ROUTES.vastu}>Vastu-aligned planning</CtaLink>
            </div>
          </Reveal>
        </div>

      </div>

      {logos && (
        <div className="one-system__logos relative md:hidden">
          <p className="container mb-4 text-center text-caption uppercase tracking-[0.2em] text-subtle">{TRUST_LINE}</p>
          <TrustLogos className="opacity-45 grayscale dark:invert" />
        </div>
      )}
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

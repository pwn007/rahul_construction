'use client';

import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { MepfSystemStack } from './MepfSystemStack';

/**
 * MEPF on the home page — four photographs of the real thing.
 *
 * ── Why this is photography and the service page is a drawing ───────────────
 * This started as the isometric cutaway house, holding still. The client's
 * objection was that it did not look like MEPF: a line drawing explains the
 * idea, but it does not show a visitor what they are buying. An empty services
 * ceiling replaced it, then that ceiling with an electrician working in it —
 * closer each time, still one picture for a heading that promises four systems.
 *
 * ── Why the single labelled photo is gone ───────────────────────────────────
 * The version before that was one `aspect-[3/2]` photograph carrying three
 * hotspot pins, with a second photograph stamped over its bottom-right corner.
 * Measured on the running site, it failed at exactly the widths most visitors
 * use:
 *
 *     390px   photo 300×200   inset 102×77    labels display:none
 *     768px   photo 630×420   inset 252×189   labels display:none
 *     1440px  photo 740×493   inset 280×210   labels visible
 *
 * The pins lived in a `hidden lg:block` layer, so below 1024px the section's
 * whole explanation was absent and a phone visitor got a small photo with a
 * 102px stamp over its most useful corner. The inset also had to sit bottom
 * right purely because the "Ductwork" pin occupied bottom left — a layout taking
 * orders from a photograph's contents.
 *
 * Four equal frames answered all of it at once: the heading's claim became
 * true, plumbing stopped being the discipline nobody illustrated, nothing
 * overlapped anything, and the captions survived down to 360px.
 *
 * ── Why those four frames are now four full-width cards ─────────────────────
 * They were a 4-up row: 314px wide at 1440, 143px on a phone, a two-line
 * caption under each. Honest, and too small to say anything. A 143px tile is a
 * swatch rather than a photograph, and the row had no space beyond a name and
 * four words — so the home page was showing about a fifth of the copy that
 * data/mepf.ts had already written and argued over.
 *
 * One card per line, at the client's request and in the same anatomy as the
 * "What we do" index above it, fits the promise and the one consequence beside
 * a picture big enough to read. Total photography goes up again: four
 * ~486 × 272 bleeds against four 314 × 393 tiles.
 *
 * The cards stack as you scroll — each one halts under the nav and the next
 * slides over it. Why that is `position: sticky` and not a pinned GSAP rig is
 * argued at the top of MepfSystemStack; the short version is that sticky costs
 * zero extra scroll and does not touch the scroll rate, and this page has
 * already thrown out one MEPF section that failed both tests.
 *
 * ── Why there is no longer a shell around all this ──────────────────────────
 * There was one: `relative overflow-hidden rounded-2xl border bg-surface-2`,
 * holding the blueprint grid and a cyan glow. `overflow-hidden` makes a box a
 * scroll container, and a `position: sticky` descendant then sticks to *that
 * box* rather than to the viewport — the deck simply does not move, with
 * nothing in the console to say why. So the shell is gone and its two
 * decorations moved onto the cards themselves, where the glow additionally
 * became per-system colour. Do not reintroduce a wrapper with `overflow-hidden`
 * around `<MepfSystemStack />`; it will silently break the section.
 *
 * The interactive twin stays on `/services/mepf-consultancy` and is still where
 * this links. The two are not competing: the photographs say "this is MEPF", the
 * twin says "this is how it works", and that is the right order to meet them in.
 *
 * ── Cost ────────────────────────────────────────────────────────────────────
 * The old rule was that the home page must never pay for three.js (~150 KB
 * gzipped) and so got the flat SVG rather than the twin. Four photographs honour
 * the same rule for less: 252 KB of WebP across all four, lazily loaded, with no
 * scene graph to hydrate — and the stacking adds no JavaScript at all.
 */
export function MepfTeaser() {
  return (
    <section className="section-sm">
      <div className="container">
        {/*
          Heading left, lead and CTA together on the right — deliberately not
          `SectionHeader`.

          `SectionHeader` was tried first and is the wrong tool twice over.
          It hard-codes the lead *inside* the left title block and drops the
          action beside the pair at `md:items-end`, which against a three-line
          lead left the CTA marooned in the middle of the band with a screen's
          width of empty paper beside it. And it is exactly what
          `FeaturedProjects` renders two sections below, so both headers would
          have arrived at the same shape a scroll apart.

          A 6 / gutter / 5 split fixes both: the heading gets a column tall
          enough to break where it wants, the lead and its CTA read as one block
          instead of two stranded halves, and the band is a different shape from
          the one under it.

          The four coloured legend chips that used to sit under the lead are
          gone. They named the same four systems the cards now label
          individually, and saying it twice on one screen made the copy column
          look padded.

          Not the same line as the headline it links to ("Most of a house is
          the part you never see"). A teaser that repeats its destination word
          for word tells a visitor who has already been there that there is
          nothing new to see.
        */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="overline">MEPF engineering</p>
            </Reveal>
            <h2 className="mt-3 text-display-md">
              <SplitText text="Four systems you will never see again." />
            </h2>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.15}>
              <p className="max-w-lead text-muted">
                Air, water, power and fire safety run through every wall of your house. Designed together, you
                never notice them. Designed separately, you live with the result for thirty years.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <CtaLink href={ROUTES.service('mepf-consultancy')} className="mt-6">
                Look inside the house
              </CtaLink>
            </Reveal>
          </div>
        </div>

        <MepfSystemStack />
      </div>
    </section>
  );
}

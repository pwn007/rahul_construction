'use client';

import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { SYSTEMS, SYSTEM_ORDER } from '@/data/mepf';
import { SYSTEM_STYLES } from './scene/systems';
import { MepfFigure } from './MepfFigure';

/**
 * MEPF on the home page — a photograph of the real thing.
 *
 * ── Why this is a photo and the service page is a drawing ───────────────────
 * This used to be the isometric cutaway house, holding still. The client's
 * objection was that it did not look like MEPF: a line drawing explains the
 * idea, but it does not show a visitor what they are buying. The photograph that
 * replaced it was closer but still mute — an empty ceiling, nobody working, and
 * no way to tell which of the things overhead was which.
 *
 * So the figure now does both jobs at once. It is a real electrician on a lift
 * pulling cable into a ceiling that is still open, and the services around him
 * are named where they hang. See `MepfFigure` for why three are labelled and
 * not four.
 *
 * The interactive twin stays on `/services/mepf-consultancy` and is still where
 * this links. The two are not competing: the photograph says "this is MEPF", the
 * twin says "this is how it works", and that is the right order to meet them in.
 *
 * ── Cost ────────────────────────────────────────────────────────────────────
 * The old rule was that the home page must never pay for three.js (~150 KB
 * gzipped) and so got the flat SVG rather than the twin. The photograph honours
 * the same rule for less: 47 KB of WebP, and no scene graph to hydrate.
 */
export function MepfTeaser() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--c-surface-2))] px-6 py-10 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm opacity-50 dark:bg-grid-blueprint dark:opacity-[0.09]"
            aria-hidden
          />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[110px]" aria-hidden />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="overline">MEPF engineering</p>
              </Reveal>
              {/* Not the same line as the headline it links to ("Most of a house
                  is the part you never see"). A teaser that repeats its
                  destination word for word tells a visitor who has already been
                  there that there is nothing new to see. */}
              <h2 className="mt-3 text-display-sm">
                <SplitText text="Four systems you will never see again." />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-4 max-w-lead text-muted">
                  Air, water, power and fire safety run through every wall of your house. Designed together, you never
                  notice them. Designed separately, you live with the result for thirty years.
                </p>
              </Reveal>

              {/* These were the drawing's key. With a photograph they read as
                  category markers instead — and the colours are the same ones the
                  twin uses on the service page, so the vocabulary holds. */}
              <Reveal delay={0.2}>
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                  {SYSTEM_ORDER.map((key) => (
                    <li key={key} className="inline-flex items-center gap-2 text-caption text-muted">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SYSTEM_STYLES[key].colour }} aria-hidden />
                      {SYSTEMS[key].legend}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.25}>
                <CtaLink href={ROUTES.service('mepf-consultancy')} className="mt-7">
                  Look inside the house
                </CtaLink>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <MepfFigure />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

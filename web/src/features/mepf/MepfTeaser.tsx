import { useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Reveal, SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { SYSTEMS, SYSTEM_ORDER } from '@/data/mepf';
import { useIsDesktop, usePrefersReducedMotion } from '@/hooks';
import { HouseIso } from './scene/HouseIso';
import type { Reg } from './scene/refs';
import { SYSTEM_STYLES } from './scene/systems';

const ALL_ON = { hvac: false, plumbing: false, electrical: false, fire: false } as const;

/**
 * The same house, at rest, wherever MEPF needs to be pointed at.
 *
 * ── One drawing, not two ────────────────────────────────────────────────────
 * This replaces `BuildingSystems`, a separately-authored section drawing that
 * made the same argument in a different visual language on the home page and
 * the service page. Two drawings of four services meant two files to keep in
 * step and a visitor learning the notation twice. The house is now the only MEP
 * illustration on the site, and this is it holding still.
 *
 * Nothing here animates or responds: no frame loop, no selection, no switches.
 * A teaser that invited interaction would be competing with the thing it exists
 * to send people to — which is now the live twin on the MEPF service page.
 *
 * ── Why the home page still gets the flat one ───────────────────────────────
 * `MepfTwin` lazy-loads three.js, ~150 KB gzipped. The service page pays that
 * because the drawing *is* its argument; the home page must not, so this stays
 * exactly one static SVG and a link.
 */
export function MepfTeaser() {
  const reduced = usePrefersReducedMotion();
  // Same rule as the twin: the labels and furniture only earn their space once
  // there is space. Below `lg` the panel is half the width and they turn to mush.
  const isDesktop = useIsDesktop();
  const nodes = useRef(new Map<string, SVGGraphicsElement>());
  const reg = useCallback<Reg>(
    (key) => (el) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    },
    [],
  );

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
                <Link
                  to={ROUTES.service('mepf-consultancy')}
                  className="mt-7 inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
                >
                  Look inside the house <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <svg
                viewBox="-307 -464 1150 948"
                preserveAspectRatio="xMidYMid meet"
                className="block h-auto w-full"
                role="img"
                aria-label="Cutaway of a two-storey house showing where air, water, power and fire safety run through it."
                focusable="false"
              >
                <HouseIso reg={reg} focus={null} off={ALL_ON} live={false} reduced={reduced} compact={!isDesktop} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

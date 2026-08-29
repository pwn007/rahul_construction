'use client';

import { MaskImage } from '@/components/motion';
import { IMG } from '@/lib/media';
import { SYSTEMS, SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { SYSTEM_STYLES } from './scene/systems';

/**
 * What is actually in each frame.
 *
 * The strong line names the object you are looking at; `SYSTEMS[key].legend`
 * underneath says what it does for you. That pairing is not new — it is exactly
 * how the old hotspot pills read ("Cable tray" in white, "Power & lighting" in
 * grey beside it). What is new is that it now exists at every width. The pills
 * lived in a `hidden lg:block` layer, so on a phone the section's entire
 * explanation was simply absent.
 *
 * Each label names the thing in *its own* photograph, not the discipline in
 * general. `electrical` says "Distribution board" and not "Cable tray", because
 * a board is what mepf-13 shows — and the trays that would have justified the
 * old wording are visible in the *fire* frame instead. A caption that names
 * something the reader cannot see in the picture is worse than no caption.
 */
const CAPTION: Record<SystemKey, string> = {
  hvac: 'Ductwork',
  plumbing: 'Water manifold',
  electrical: 'Distribution board',
  fire: 'Sprinkler main',
};

/**
 * Where the subject sits in each frame.
 *
 * `object-cover` centres by default, which is right for three of these. In the
 * ductwork shot the ducts run across the top of a corridor and the lower third
 * is bare floor, so a centred 4:5 crop spends a quarter of the tile on nothing.
 * Nudging the focal point up keeps the subject and drops the floor.
 */
const FOCUS: Partial<Record<SystemKey, string>> = {
  hvac: 'object-[50%_30%]',
};

/**
 * Four systems, four photographs.
 *
 * ── Why four and not one ────────────────────────────────────────────────────
 * The heading has always claimed "Four systems". The band under it showed one
 * photograph, three labels, and nothing at all for plumbing — so the claim and
 * the evidence disagreed, and the fourth discipline was invisible on the page
 * that sells it. One frame per system is the smallest arrangement where the
 * heading is simply true.
 *
 * ── Why the labels sit below the frame ──────────────────────────────────────
 * On the photo they would need a scrim, and their contrast would then depend on
 * whichever picture happened to be behind them — which is a promise no stock
 * photograph can keep. Below the frame they are plain text on the card ground,
 * legible by construction, and they still read at a 143px-wide tile on a phone.
 *
 * ── Motion ──────────────────────────────────────────────────────────────────
 * `MaskImage` with a per-index `delay`, deliberately *not* wrapped in
 * `StaggerGroup`. `StaggerGroup` gives every child its own opacity/y entrance
 * while `MaskImage` runs its own clip-path wipe off its own viewport trigger
 * (`-8%` against the group's `-10%`), so nesting them puts two entrances on one
 * tile, starting at slightly different moments. One animation per tile, the same
 * way `ProjectCard` staggers the grid two sections further down the page.
 */
export function MepfSystemStrip() {
  return (
    <ul className="mt-10 grid grid-cols-2 gap-4 md:mt-12 lg:grid-cols-4 lg:gap-5">
      {SYSTEM_ORDER.map((key, i) => (
        <li key={key}>
          <MaskImage
            src={IMG.card(`home-mepf-${key}`)}
            /* Both lines, joined — a screen reader gets the same pairing the eye
               gets, rather than a filename or a bare discipline name. */
            alt={`${CAPTION[key]} — ${SYSTEMS[key].legend}`}
            ratio="aspect-[4/5]"
            delay={i * 0.06}
            className="rounded-xl"
            imgClassName={FOCUS[key]}
          />

          {/* `items-start` + a 5px nudge rather than `items-center`: at 390px
              "Distribution board" wraps to two lines, and a centred dot then
              floats into the gap between them instead of marking where the
              label starts. 15px at `leading-snug` is a 20.6px line box, so 5px
              sets the 10px dot on the first line at every width. */}
          <p className="mt-3 flex items-start gap-2 text-[0.9375rem] font-medium leading-snug">
            <span
              className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SYSTEM_STYLES[key].colour }}
              aria-hidden
            />
            {CAPTION[key]}
          </p>
          <p className="mt-1 pl-[1.125rem] text-caption leading-snug text-muted">{SYSTEMS[key].legend}</p>
        </li>
      ))}
    </ul>
  );
}

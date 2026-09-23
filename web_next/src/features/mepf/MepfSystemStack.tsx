'use client';

import type { CSSProperties } from 'react';
import { MaskImage } from '@/components/motion';
import { IMG } from '@/lib/media';
import { SYSTEMS, SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { SYSTEM_STYLES } from './scene/systems';

/**
 * What is actually in each frame.
 *
 * The strong line names the object you are looking at; `SYSTEMS[key].legend`
 * beside it says what it does for you. That pairing is not new — it is exactly
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
 * is bare floor, so a centred crop spends a quarter of the frame on nothing.
 * Nudging the focal point up keeps the subject and drops the floor. It still
 * applies at both of this card's crops — the 16:10 band on a phone and the tall
 * bleed at `lg` — because in both the ducts are the top half of the picture.
 */
const FOCUS: Partial<Record<SystemKey, string>> = {
  hvac: 'object-[50%_30%]',
};

/**
 * One consequence each, in under ten words.
 *
 * `SYSTEMS[key].without` is the source, but it runs to two sentences and the
 * second is the twist — damp above the ceiling, a held-up certificate. That
 * twist earns its space on the service page, where the reader has already
 * decided to care; on a home-page card it is the line that pushes the card past
 * its height. These are the first clause of each, trimmed to what one line can
 * carry.
 *
 * Same two rules as data/mepf.ts, which is where the originals were written and
 * argued over: say the thing a person actually feels, with a number where there
 * is one, and use no word anybody has to look up. And never as a threat — a
 * firm that frightens people into hiring it has already lost the argument it is
 * making, which is why these describe a Tuesday and not a disaster.
 */
const PAIN: Record<SystemKey, string> = {
  hvac: 'Rooms still sit at 34°C on a June afternoon.',
  plumbing: 'Upstairs taps only trickle, and drains gurgle.',
  electrical: 'A thin wire overheats inside a wall nobody can open.',
  fire: 'No alarm above the false ceiling, where fires start.',
};

/**
 * Four systems, four full-width cards, dealt onto a pile as you scroll.
 *
 * ── Why one card per line, and not the 4-up grid ────────────────────────────
 * The grid before this put four portrait frames across one row: 314px wide at
 * 1440 and 143px on a phone, each carrying a two-line caption underneath. It
 * was honest — four systems, four photographs — but a 143px tile is a swatch,
 * and the row had no space for anything beyond a name and four words. The
 * copy in data/mepf.ts had already been written and reviewed; the home page was
 * showing a fifth of it because that was all the layout could hold.
 *
 * A full-width card has room for the promise (`SYSTEMS[key].what`) and the one
 * consequence (`PAIN`) beside a photograph big enough to read. Same four
 * facts, said properly.
 *
 * ── Why the cards stack rather than simply stacking ─────────────────────────
 * Each `<li>` is `lg:sticky` with a `top` that steps 14px per index. Card one
 * halts under the nav, card two slides over it, and each buried card leaves a
 * sliver — a deck being dealt, which is the effect the client asked for.
 *
 * The important property is that it is **free**. `position: sticky` changes
 * where a box paints, not how far the page scrolls: the section is exactly as
 * tall as four cards in normal flow, which is what it would have been as a
 * plain list. That matters because this page has already rejected one
 * scroll-driven MEPF section — see the note at the top of MepfTwin, where five
 * pinned chapters cost 4,100px of scroll to deliver four facts. A GSAP pin
 * would repeat it: pinning inserts spacer height per card and drives the scroll
 * rate itself, which is the scrolljacking that NN/g and the usability
 * literature both measure as a loss in accuracy and satisfaction. Sticky is not
 * scrolljacking at all — the wheel still means exactly what it says.
 *
 * So: no gsap, no useScroll, no scroll listener. The stacking is four CSS
 * declarations.
 *
 * `WorkRail`, two sections below, reached the same conclusion from the other
 * direction: it was briefly a pinned horizontal rail driven by page scroll, and
 * that came out because a visitor cannot tell what a downward wheel turn did
 * when the answer is sideways. It is now a rail they move themselves. Between
 * the two sections the page has now rejected scroll-driven pinning three times.
 *
 * ── Three things the deck cannot do without ─────────────────────────────────
 *   · **Opaque cards.** `--c-surface-2` at full opacity, not a tint. A
 *     translucent card shows the one it is covering, and four photographs
 *     bleeding through each other is not a stack, it is a mess.
 *   · **Equal heights** (`lg:h-[17rem]`). Ragged heights turn the stepped
 *     sliver into a random edge, and "Distribution board" — the one caption
 *     that wraps — is what would have set the tallest card.
 *   · **No `overflow-hidden` above this list.** An ancestor with it becomes a
 *     scroll container, and a sticky child then sticks to *that* box instead of
 *     the viewport: the effect vanishes silently, with nothing in the console.
 *     Dissolving exactly such a wrapper is why MepfTeaser no longer has a shell
 *     around this; the blueprint texture it used to carry now lives on each
 *     card below. `overflow-hidden` on the `<article>` itself is fine — only
 *     ancestors of the sticky element matter.
 *
 * ── Why the cards are not links ─────────────────────────────────────────────
 * All four would point at `/services/mepf-consultancy`, which the section's own
 * CTA already points at. Four identical links a screen apart is noise. This is
 * where the anatomy deliberately parts company with `ServicesIndex`, whose rows
 * each go somewhere different and so are each a link.
 *
 * ── Motion ──────────────────────────────────────────────────────────────────
 * `MaskImage` with a per-index `delay`, deliberately *not* wrapped in
 * `StaggerGroup` or `Reveal`. `StaggerGroup` gives every child its own
 * opacity/y entrance while `MaskImage` runs its own clip-path wipe off its own
 * viewport trigger (`-8%` against the group's `-10%`), so nesting them puts two
 * entrances on one card, starting at slightly different moments. One animation
 * per card, the same way `ProjectCard` staggers the grid two sections down.
 *
 * `parallax` stays off for a second reason on top of that one: it reads the
 * frame's own offset through the viewport, and a sticky card is holding that
 * offset still on purpose. The two would fight.
 */
export function MepfSystemStack() {
  return (
    <ol className="mt-10 space-y-4 md:mt-12 lg:space-y-6">
      {SYSTEM_ORDER.map((key, i) => (
        <li
          key={key}
          /* `--i` drives the 14px-per-card step in the `top` below. Set inline
             because the value is per-item; `calc()` multiplying a unitless
             custom property by a length is valid CSS and needs no @property.

             `zIndex` is belt and braces — positioned siblings already paint in
             DOM order, so later cards land on top without it. Writing it down
             stops a future `z-` on something inside a card from inverting the
             pile. */
          style={{ '--i': i, zIndex: i + 1 } as CSSProperties}
          /* Sticky only from `lg`. Below it a card taller than the viewport
             would have its top edge — the numeral and the name — clipped for
             good, and there is no width at which that is worth the effect. The
             codebase's other sticky (MepfTwin's house) is `lg:` for the same
             reason.

             `motion-reduce:static` flattens the deck to a plain column. The
             scroll rate is native either way, but a card sliding over another
             is precisely the kind of thing that setting is asking us not to do. */
          className="lg:sticky lg:top-[calc(var(--nav-h)+1.5rem+var(--i)*0.875rem)] lg:motion-reduce:static"
        >
          <article className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--c-surface-2))] shadow-lg lg:h-[17rem]">
            {/* The blueprint texture, one copy per card rather than one for the
                band. It is the only place this pattern appears on the home page
                — seven of the eight bands are near-identical paper — so losing
                it with the wrapper would have cost the section the one thing
                that already set it apart. */}
            <div
              className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm opacity-50 dark:bg-grid-blueprint dark:opacity-[0.09]"
              aria-hidden
            />
            {/* The glow, tinted to this system. The shell's was a single cyan
                one for the whole band; per card it does a second job — four
                stacked cards stay told apart by their ground as well as by
                their dot, which is what the drawing convention in scene/systems
                does with the same four colours. */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-[0.07] blur-[110px]"
              style={{ backgroundColor: SYSTEM_STYLES[key].colour }}
              aria-hidden
            />

            {/*
              The photograph.

              Below `lg` it is a 16:10 band across the top of the card. From
              `lg` it bleeds the card's full height down the right-hand 38% —
              which is ~486 × 272 at 1440, landscape, so the same four pinned
              seeds crop correctly at both.

              A bleed rather than the inset thumbnail `ServicesIndex` uses. The
              two sections sit one after the other and share this row anatomy on
              purpose — numeral, name, line, picture on the right — so the
              treatment of the picture is what keeps them from reading as one
              undifferentiated run of photographs. It is also what gives the
              stack its punch: every card that slides up arrives carrying a
              full-height image.
            */}
            <MaskImage
              src={IMG.card(`home-mepf-${key}`)}
              /* Both lines, joined — a screen reader gets the same pairing the
                 eye gets, rather than a filename or a bare discipline name. */
              alt={`${CAPTION[key]} — ${SYSTEMS[key].legend}`}
              ratio="aspect-[16/10]"
              delay={i * 0.06}
              className="lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:h-full lg:w-[38%]"
              imgClassName={FOCUS[key]}
            />

            {/*
              `relative` so the copy sits above the texture and the glow.
              `lg:pr-[42%]` keeps it clear of the bleed — 38% plus a gutter.

              Top-aligned at `lg`, not centred, and the empty band underneath is
              doing a job rather than going to waste.

              A card is covered from its bottom edge upwards: the incoming card's
              top edge starts below it and sweeps up. Whatever that edge is
              crossing at any moment is cut in half. Centred copy put the text in
              the middle of that sweep, so the cut landed on a line of type at
              exactly the point where the outgoing card was still the biggest
              thing on screen — "Distribution board · Power & lighting" sliced
              through the middle of the glyphs, and it held there for ~170px of
              scroll. It reads as a rendering bug.

              Pushed to the top, the sweep spends its first ~110px crossing
              nothing, then takes the lines in reverse order of importance — the
              consequence, then the caption, then the promise, then the name —
              and it only reaches them once the card is nearly buried. Same
              effect, but it now reads as a card being filed away.

              Which is also why the card is not shrunk to fit its copy. The slack
              is the runway.
            */}
            <div className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 px-6 py-6 md:px-8 lg:h-full lg:content-start lg:gap-x-8 lg:px-10 lg:pb-8 lg:pr-[42%] lg:pt-9">
              {/* `pt-1` is optical, not structural: the numeral is 13px against
                  a display-scale name, so aligning their boxes leaves it
                  floating above the name's first line. */}
              <span className="num pt-1 text-caption text-[rgb(var(--c-brand-text))]" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>

              <div>
                <h3 className="text-heading-lg font-semibold leading-tight">{SYSTEMS[key].name}</h3>
                <p className="mt-2 max-w-lead text-muted">{SYSTEMS[key].what}</p>

                {/*
                  Ordinary inline text, not a flex row.

                  As `flex … gap-2` the three pieces were flex items, and a flex
                  item wraps *as a block* rather than into its neighbour's line.
                  At 390px, where "Distribution board · Power & lighting" cannot
                  fit on one line, that produced two ragged columns — the caption
                  broken over two lines on the left with the separator and the
                  legend stacked beside it — which reads as a broken layout
                  rather than a wrapped sentence.

                  Inline, it wraps the way a sentence does: the legend simply
                  continues onto the next line. It also disposes of the old
                  `items-start` + `mt-[5px]` pair, which existed only to stop a
                  flex-centred dot floating into the gap between two wrapped
                  lines. An inline-block dot sits on the first line by
                  construction; `align-middle` centres it against the x-height.

                  `pl-[1.125rem]` on the line below is this line's dot (10px)
                  plus its margin (8px), so the consequence hangs under the
                  caption's first letter.
                */}
                <p className="mt-4 text-[0.9375rem] font-medium leading-snug">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: SYSTEM_STYLES[key].colour }}
                    aria-hidden
                  />
                  {CAPTION[key]}
                  <span className="font-normal text-subtle"> · {SYSTEMS[key].legend}</span>
                </p>

                <p className="mt-2 pl-[1.125rem] text-caption leading-snug text-subtle">{PAIN[key]}</p>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

'use client';

import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from '@/lib/icons';
import { SYSTEMS, SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { SYSTEM_STYLES } from './scene/systems';
import { IMG } from '@/lib/media';

/**
 * What each photograph shows, for the alt text.
 *
 * Deliberately not shared with the home page's `MepfSystemStrip`, which keeps
 * its own table. Three of the four files are the same, but `electrical` is not —
 * home uses a portrait frame of an electrician at a distribution board, and this
 * page crops into a wide band where that would come out as a slice of his chest.
 * So the electrical photograph here is a different one and needs a different
 * description. Two tables that agree three times out of four is the honest
 * shape; one shared table would have needed an exception anyway.
 */
const ALT: Record<SystemKey, string> = {
  hvac: 'Insulated supply ducting running along an open services ceiling.',
  plumbing: 'A water manifold: one main feeding a row of separate distribution lines.',
  electrical: 'An electrician on a lift running cable into a ceiling that is still open.',
  fire: 'Red sprinkler pipework and cable trays under a concrete slab.',
};

/**
 * The four systems, said in full.
 *
 * ── This is the page, not a control panel ───────────────────────────────────
 * Every one of the three questions the page exists to answer is written out
 * here, for all four systems, before anybody clicks anything: what it is, where
 * it runs in the house, and what an under-designed one costs you. The research
 * on explorable explanations is blunt — most visitors never touch the controls,
 * and the ones who do sometimes retain *less*, because they attend to the
 * manipulation rather than the point. So nothing is behind a click.
 *
 * What a click does is narrow the drawing to one system, and switch it off to
 * show the house without it. Both are ways of *feeling* something the row has
 * already told you.
 *
 * ── Real buttons, outside the SVG ───────────────────────────────────────────
 * Everything interactive that lives inside an SVG on this site had to
 * reimplement focus, hit area and keyboard handling from scratch — the project
 * atlas is a hundred and seventy lines of exactly that. A row of real buttons
 * gets all of it for nothing, and clears 44px without argument.
 */
export function SystemList({
  focus,
  setFocus,
  off,
  toggle,
  restore,
  anyOff,
  className,
}: {
  focus: SystemKey | null;
  setFocus: (key: SystemKey | null) => void;
  off: Record<SystemKey, boolean>;
  toggle: (key: SystemKey) => void;
  restore: () => void;
  anyOff: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-caption text-subtle">Drag the house to turn it. Tap a system to find it. Switch one off to see the house without it.</p>
        <button
          type="button"
          onClick={restore}
          disabled={!anyOff}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-caption font-medium transition-colors',
            anyOff ? 'text-cyan-700 hover:bg-cyan-500/[0.08] dark:text-cyan-400' : 'cursor-default text-subtle opacity-40',
          )}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Turn everything back on
        </button>
      </div>

      {/*
        Two up between `sm` and `lg`, one column either side of that.

        Not a style choice — a measurement. Below `lg` this list has the band's
        whole width, so at 768px a card is 728px across, and the photograph band
        on top of it would be a 6.5:1 slit nothing is recognisable in. Two up
        puts the card back at ~340px, which is where it sits at every other
        width. From `lg` the list is the 5-column half beside the drawing, so it
        goes back to one.
      */}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {SYSTEM_ORDER.map((key) => {
          const s = SYSTEMS[key];
          const style = SYSTEM_STYLES[key];
          const dead = off[key];
          const selected = focus === key;

          return (
            <li key={key}>
              <div
                className={cn(
                  /* `overflow-hidden` so the photograph clips into the top two
                     corners; `h-full` so the pair in an `sm` row match. */
                  'surface flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300',
                  selected && 'border-cyan-500/50 shadow-sm',
                  dead && 'border-dashed',
                )}
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFocus(selected ? null : key)}
                  onMouseEnter={() => setFocus(key)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(key)}
                  onBlur={() => setFocus(null)}
                  className="flex w-full flex-col text-left"
                >
                  {/*
                    The photograph, inside the button rather than above it.

                    The drawing beside this list answers "where does it run in my
                    house". It cannot answer "what does the thing actually look
                    like" — which is the objection that rebuilt the home-page
                    band. One real frame per system answers it here too, without
                    taking a single pixel from the text: the band is full width
                    and on top, so nothing below it gets narrower. That matters,
                    because at 1024px this column is only 387px wide and the copy
                    already uses 303px of it; a thumbnail beside the text would
                    have cut it to 193px.

                    Inside the button, so hovering the photograph focuses that
                    system in the drawing exactly as hovering the words does. It
                    is part of the control rather than decoration stuck on top of
                    it — which is also why it greys out with everything else when
                    the system is switched off.

                    Fixed height, not an aspect ratio: the card runs from ~316px
                    to ~526px wide across the breakpoints, and a fixed ratio would
                    swing the band from a stripe to a slab. This holds it between
                    about 3:1 and 4:1 everywhere.
                  */}
                  <span className="relative block h-24 w-full overflow-hidden sm:h-28 xl:h-32">
                    <img
                      src={IMG.card(`service-mepf-${key}`)}
                      alt={ALT[key]}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        'h-full w-full object-cover transition-all duration-300',
                        dead && 'opacity-45 grayscale',
                      )}
                    />
                  </span>

                  <span className="flex min-h-11 w-full items-start gap-3.5 p-4">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: dead ? 'rgb(var(--c-text) / 0.06)' : `${style.colour}1F`,
                        color: dead ? 'rgb(var(--c-text-subtle))' : style.colour,
                      }}
                      aria-hidden
                    >
                      <Icon name={s.icon} className="h-[18px] w-[18px]" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="font-display text-heading-md font-semibold">{s.name}</span>
                        <span className="text-caption text-subtle">{s.discipline}</span>
                      </span>
                      <span className="mt-1 block text-muted">{s.what}</span>
                      <span className="mt-2.5 block text-caption text-subtle">
                        <span className="font-semibold uppercase tracking-wide">Where</span> · {s.where}
                      </span>
                    </span>
                  </span>
                </button>

                {/* The consequence, and the switch that shows it. Not disclosure —
                    the text is here whether or not the switch is ever touched. */}
                <div className="border-t px-4 pb-4 pt-3.5">
                  <p className={cn('text-caption leading-relaxed transition-colors', dead ? 'text-warning' : 'text-muted')}>
                    <span className="font-semibold uppercase tracking-wide">Without it</span> · {s.without}
                  </p>
                  <button
                    type="button"
                    aria-pressed={dead}
                    onClick={() => toggle(key)}
                    className={cn(
                      'mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-caption font-medium transition-colors',
                      dead
                        ? 'bg-warning/12 text-warning hover:bg-warning/20'
                        : 'text-cyan-700 hover:bg-cyan-500/[0.08] dark:text-cyan-400',
                    )}
                  >
                    <span
                      className={cn(
                        'relative h-4 w-7 rounded-full transition-colors',
                        dead ? 'bg-warning/40' : 'bg-cyan-500/40',
                      )}
                      aria-hidden
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all duration-300',
                          dead ? 'left-0.5' : 'left-3.5',
                        )}
                      />
                    </span>
                    {dead ? `Put the ${s.name.toLowerCase()} back` : `Show the house without ${s.name.toLowerCase()}`}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

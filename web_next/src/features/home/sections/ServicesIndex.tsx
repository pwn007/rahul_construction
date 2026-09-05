'use client';

import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { MaskImage } from '@/components/motion';
import { SectionHeader, CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { IMG } from '@/lib/media';
import { useServices } from '@/hooks/useServices';

/**
 * MEPF is deliberately not in this list.
 *
 * It is a service like the other three, and leaving it out looks like a bug
 * until you scroll: `MepfTeaser` — a whole band, four photographs, four
 * captions — sits immediately below this section, and `OneSystem` names it
 * again further down ("Engineering — Structure and MEPF, coordinated from day
 * one"). Listing it here too would put MEPF on the home page three times.
 *
 * That is not a hypothetical worry. `WhyChooseUs` was removed from this page at
 * the client's request for exactly this failure — four cards that mapped
 * one-to-one onto four cards a screen away (see the ledger in HomeView). The
 * filter is by slug rather than by index so that reordering `services.ts`
 * cannot silently drop the wrong one.
 *
 * The header's "See all four services" link is what closes the gap: it tells a
 * reader there are four and points at the page that lists all four.
 */
const OMIT_SLUG = 'mepf-consultancy';

/**
 * One promise each — not a list of what is in the box.
 *
 * These lines used to be the list: "Concept, elevations, approvals…",
 * "Modular kitchens, wardrobes and false ceilings…". That was fine while the
 * row had nothing else in it, but the row now carries three deliverables as
 * chips underneath, and those chips come from the same `features` array the
 * sentences were paraphrasing — interiors was the worst, where the line was
 * literally `features[0..2].title` written out as prose. Sentence and chips
 * would have said the same thing twice, which is the failure that got
 * `WhyChooseUs` and `ProcessSection` deleted from this page.
 *
 * So the sentence is now the promise and the chips are the proof.
 *
 * "Watch your own site live" is kept deliberately. That claim left the page
 * when `ProcessSection` went, and this section is where it came back; the chip
 * says "Live site monitoring", which does not tell a reader that *they* are the
 * one who gets to watch.
 *
 * Copy rules from data/mepf.ts still apply: nothing anybody has to look up,
 * every sentence well under fifteen words. Still deliberately absent: "one
 * system", "single point of responsibility", "four disciplines", "under one
 * roof" — all `OneSystem`'s, and already said more than once on this page.
 */
const SCOPE: Record<string, string> = {
  'architectural-design': 'Plans your site can actually build from.',
  'interior-design': 'Drawn and fitted by one team, so the room matches the drawing.',
  'project-management': 'Watch your own site live, from anywhere.',
};

/**
 * Three deliverables per service, by index into `services.ts`.
 *
 * Indices rather than strings so the words live in one place — `services.ts` is
 * the source, this only chooses which three surface on the home page.
 *
 * Not `slice(0, 3)`, which is what `/services` does. Architecture's sharpest
 * differentiator is **Approval drawings** — the JDA and municipal submission set
 * — and it sits sixth; Project Management's is **Single point of contact**, also
 * sixth. Taking the first three would have dropped both.
 */
const PICK: Record<string, number[]> = {
  'architectural-design': [0, 1, 5], // Concept & massing · Vastu-aligned planning · Approval drawings
  'interior-design': [0, 1, 2], //     Modular kitchens · Wardrobes & joinery · False ceiling & lighting
  /* PM starts at 1, not 0: `features[0]` is "Live site monitoring", and the
     scope line above already promises "Watch your own site live". The line owns
     that claim — it is the one the page lost when ProcessSection went — so the
     chips take the next three things instead. */
  'project-management': [1, 2, 5], //  Milestone tracking · Daily reports · Single point of contact
};

/**
 * What each photograph shows.
 *
 * The seeds are pinned in lib/media.ts and the reason is written there: the
 * three /services heroes were left to a hash and picked a cactus, an armchair
 * and a dying office plant. These three were chosen — planning, the finished
 * room, and somebody watching the site — so that the row reads as a stage of
 * the job rather than as decoration.
 */
const ALT: Record<string, string> = {
  'architectural-design': 'Two people measuring a floor plan with a scale rule.',
  'interior-design': 'A finished living room — sofa, wall panelling, lighting and joinery all fitted.',
  'project-management': 'A site supervisor checking a tablet inside a room still under work.',
};

/**
 * What we do — an index, not a card grid.
 *
 * ── Why a list ──────────────────────────────────────────────────────────────
 * A "What we offer" card grid used to live on this page and was removed at the
 * client's request in favour of /services. Rebuilding it would be that section
 * again — and it would be the page's fourth uniform card grid, after the MEPF
 * photo strip, the project cards and the testimonials. A list also scans better:
 * every element sits at a fixed, predictable position, which a card grid cannot
 * promise.
 *
 * ── Why there are photographs, after a version without them ─────────────────
 * The first build of this section was text only, and the argument for that was
 * half of a rule. The research says images stop earning their space when the
 * options differ only subtly — true, and these three do not. But the same
 * guidance says to include them when *visual aesthetics drive the choice*, when
 * the content is itself visual, or when text alone leaves a reader unsure. A
 * design-and-build firm is that category outright: the photograph is not
 * telling you which service is which, it is the evidence that the work is worth
 * buying. Text-only read as a directory listing, and the client said so.
 *
 * They sit on the **right**, which is the same guidance again: an image
 * essential to *choosing* belongs on the left, an image that supports the text
 * belongs on the right. Here the names already separate the three, so the name
 * stays the first thing in the row and the picture backs it up.
 *
 * Nothing is behind a hover or a click — all three names, lines and photographs
 * are always on screen. That is this codebase's own rule; see the note at the
 * top of features/mepf/SystemList.tsx.
 *
 * ── Why three rows do not look like a missing fourth ────────────────────────
 * In a grid they would: `FeaturedProjects` carries six projects rather than
 * five precisely because five leaves an empty cell. A list has no cells, so an
 * odd count costs nothing.
 *
 * ── Not the strip below it ──────────────────────────────────────────────────
 * `MepfTeaser` sits directly under this section and is itself four photographs.
 * These are landscape (16:10) stacked down the page with the text beside them;
 * those are portrait (4:5) in a horizontal row with captions underneath.
 * Different orientation, different axis — so seven pictures in a column do not
 * read as one undifferentiated block. `bg-grid-light` is still left alone: it
 * is the one thing that already sets `MepfTeaser` apart.
 */
export function ServicesIndex() {
  const services = useServices();
  const listed = services.filter((s) => s.slug !== OMIT_SLUG);

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="What we do"
          title="Hand us one part, or the whole build."
          lead="Each of these is a team that already sits in the same office as the others."
          action={<CtaLink href={ROUTES.services}>See all four services</CtaLink>}
        />

        <ol className="mt-10 border-y divide-y">
          {listed.map((s, i) => (
            <li key={s.slug}>
              <Link
                href={ROUTES.service(s.slug)}
                /*
                  The whole row is the link, so the hit area is the row rather
                  than the words.

                  Below `lg` the row is a small card — photograph first, then a
                  numeral gutter with the name and the line beside it. From `lg`
                  it is four tracks across: numeral, text, photograph, arrow.

                  The photograph is 15rem, down from 24rem over two passes, and
                  the row is `py-5` rather than `py-8`. At 24rem the picture stood
                  240px tall against an 80px block of text — three times the
                  height — so the row came to 304px and the words floated in the
                  middle of their own cell. It is now 150px in a 190px row: the
                  same information in a little over half the height, and 240px is
                  still wide enough to read a photograph rather than a swatch,
                  which is the line the research draws. The title moved with it,
                  from `display-sm` (40px at this width) to `heading-lg` (28px) —
                  the size `ProjectCard` already uses.
                */
                className="group grid grid-cols-[2.75rem_minmax(0,1fr)_1.75rem] items-start gap-x-4 gap-y-2.5 py-5 lg:grid-cols-[3.5rem_minmax(0,1fr)_15rem_2rem] lg:items-center lg:gap-x-8 lg:py-5"
              >
                {/*
                  `MaskImage` carries the entrance on its own — no `Reveal`
                  around the row. Two wrappers would animate the same row twice
                  off two different viewport triggers, which is the mistake
                  recorded at the top of MepfSystemStrip.
                */}
                <MaskImage
                  src={IMG.card(`home-service-${s.slug}`)}
                  alt={ALT[s.slug] ?? s.title}
                  ratio="aspect-[16/10]"
                  delay={i * 0.06}
                  /* Capped on the stacked layout. Left uncapped, a 768px tablet
                     gives each row a 728×455 photograph and the section runs to
                     2,100px — three billboards where three pictures were wanted.
                     On a phone full width is right, so the cap starts at `sm`. */
                  className="col-span-3 row-start-1 rounded-lg sm:max-w-[26rem] lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:max-w-none lg:self-center"
                  imgClassName="transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.04]"
                />

                {/* `pt-2` is optical, not structural: the numeral is 13px and the
                    name is display-scale, so aligning their boxes leaves the
                    numeral floating above the name's first line. */}
                <span
                  className="num row-start-2 pt-2 text-caption text-[rgb(var(--c-brand-text))] lg:row-start-1 lg:pt-0"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Name and line in one cell, not two grid rows. As separate rows
                    the image's height pushed them ~80px apart and they stopped
                    reading as one thought. */}
                <div className="row-start-2 lg:row-start-1">
                  <h3 className="text-heading-lg font-semibold transition-colors duration-300 group-hover:text-[rgb(var(--c-brand-text))]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-lead text-muted">{SCOPE[s.slug] ?? s.tagline}</p>

                  {/*
                    The deliverables, in the band that was empty.

                    At 1440 the scope line stops around x=653 and the photograph
                    starts at x=1096 — 443px of nothing, with another ~124px
                    unused below it, because the row's height is set by the
                    150px picture and the text only came to 66px. These chips
                    cost no height at all: they fill slack the row was already
                    paying for. Below `lg` the band is only ~32px wide, so they
                    simply wrap.

                    Plain text with a tick, not `Badge`. Four of `Badge`'s eight
                    variants ask for a background at 12 percent opacity, and 12
                    is not a step on Tailwind's opacity scale, so those
                    backgrounds compile to nothing — the same dead utility
                    appears 19 times across this codebase. The only filled
                    variant that actually renders is `default`, which is what
                    /services uses; a tick is lighter than a pill anyway at
                    three per row.
                  */}
                  <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-caption text-subtle sm:gap-x-4">
                    {(PICK[s.slug] ?? []).map((n) => (
                      <span key={n} className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--c-brand-text))]" aria-hidden />
                        {s.features[n]?.title}
                      </span>
                    ))}
                  </p>
                </div>

                <span
                  className="col-start-3 row-start-2 mt-2 flex h-7 w-7 lg:mt-0 items-center justify-center justify-self-end rounded-full border text-[rgb(var(--c-brand-text))] transition-all duration-300 ease-out-expo group-hover:border-[rgb(var(--c-brand-text))] group-hover:bg-[rgb(var(--c-brand-text))] group-hover:text-white lg:col-start-4 lg:row-start-1"
                  aria-hidden
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

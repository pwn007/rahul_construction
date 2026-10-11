'use client';

import { useRef } from 'react';
import { Reveal, SplitText } from '@/components/motion';
import { TestimonialCard } from './index';
import { useIsoLayoutEffect } from '@/hooks';
import type { Testimonial } from '@/types/domain';
import { cn } from '@/lib/cn';

/**
 * The social-proof band, shared by the home page and /about.
 *
 * ── A pile of sticky notes ──────────────────────────────────────────────────
 * The testimonials are notes: tinted paper, each at its own slight angle, each
 * parked in the middle of the screen while the next slides up and lands on it.
 * From `md` the heading stands beside the pile and holds with it; on a phone
 * it is above, and scrolls away as a heading does.
 *
 * It was a 2×2 grid of white cards, and a plain column of them on a phone. The
 * client asked for the phone's column to hold and stack the way the chapters
 * above do — but as sticky notes — and then for the same at every width.
 *
 * The look and the sticking are CSS (`.note-band` in globals.css, which also
 * explains why the pile leaves as one); nothing here listens to scroll.
 *
 * ── Every note the same size ────────────────────────────────────────────────
 * This was briefly a staggered two-column layout with the heading as the first
 * cell — the client's reference did that, and it looked well until you noticed
 * the cards were all slightly different heights and none of them lined up. The
 * client asked for one size, which is the same preference already recorded on
 * `FeaturedProjects`: no card bigger than its neighbours.
 *
 * The pile needs it for a reason of its own as well: a shorter note landing on
 * a taller one leaves the taller one's foot showing. The grid enforced it with
 * `auto-rows-fr`, and a pile cannot be a grid — a grid item's containing block
 * is its own row, so a sticky note could never leave it. So the pile is a flex
 * column and the tallest note is measured below and handed to CSS as
 * `--note-h`.
 *
 * The cost is honest and was asked for: the shortest quote carries some spare
 * paper. It sits at the note's foot, as it does on a real one.
 */
export function TestimonialBand({
  overline,
  title,
  lead,
  items,
  className,
}: {
  overline: string;
  title: string;
  lead?: string;
  items: Testimonial[];
  className?: string;
}) {
  const bandRef = useRef<HTMLDivElement>(null);

  /*
    The tallest note's natural height, as `--note-h` on the band: the notes'
    equal `min-height`, what `.note-band` centres on screen, and the height the
    heading takes beside them.

    Read from each card's content block, not the `<figure>`: the figure carries
    that `min-height`, so it would only ever report the last answer and never
    shrink. The block is `flex: none` (globals.css), so its height is what the
    card would be left alone. Observing the blocks catches every cause of a
    change — the width, the web font arriving, and the "See the project" link,
    which appears once the projects have loaded.

    Cleared for fewer than two notes, which are not a pile: without it every
    rule that reads it is invalid and the band lies flat.
  */
  useIsoLayoutEffect(() => {
    const band = bandRef.current;
    if (!band) return;
    const bodies = Array.from(band.querySelectorAll<HTMLElement>('.note-pile > * > figure > div'));

    const measure = () => {
      const tallest = bodies.length > 1 ? Math.max(...bodies.map((el) => el.offsetHeight)) : 0;
      const next = tallest ? `${tallest}px` : '';
      if (band.style.getPropertyValue('--note-h') === next) return;
      if (next) band.style.setProperty('--note-h', next);
      else band.style.removeProperty('--note-h');
    };

    const ro = new ResizeObserver(measure);
    bodies.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [items]);

  return (
    // `data-section`: a stop for the home page's section engine (lib/section-nav); inert elsewhere.
    // `overflow-x-clip`: a tilted note's corners swing out into the gutter, and a long enough note
    // would swing them past it. `clip`, not `hidden` — `hidden` makes this a scroll container, and
    // the notes would then stick to the band instead of the screen.
    <section
      data-section="testimonials"
      className={cn('section-sm overflow-x-clip bg-[rgb(var(--c-surface-2))]', className)}
    >
      <div className="container">
        {/*
          Two columns from `md`: the heading, and the pile. `items-start`, so
          neither is stretched to the row — the row is as tall as the whole
          pile, and both the heading and each note are sticky inside it.
        */}
        <div ref={bandRef} className="note-band md:grid md:grid-cols-2 md:items-start md:gap-x-12 lg:gap-x-16">
          <div className="note-band__head">
            <Reveal>
              <p className="overline">{overline}</p>
            </Reveal>
            <h2 className="mt-4 text-display-sm">
              <SplitText text={title} />
            </h2>
            {/* The rule is the reference's, and it earns its place here: on a
                phone it separates the heading from the note directly below it
                in the same column. */}
            <Reveal delay={0.1}>
              <span className="mt-6 block h-0.5 w-14 rounded-full bg-cyan-500" aria-hidden />
            </Reveal>
            {lead && (
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-lead text-muted">{lead}</p>
              </Reveal>
            )}
          </div>

          {/*
            Each `Reveal` is the sticky box, so it has to stay a direct child of
            the pile: a wrapper the height of its card would leave the card
            nowhere to travel.

            `max-w-lg`: a note is a note up to about that width. Past it the
            same quote sets in three long lines on a strip of paper, and the
            tilt that reads as casual on a note reads as a crooked banner.
          */}
          <div className="note-pile mt-12 flex flex-col gap-6 md:mx-auto md:mt-0 md:w-full md:max-w-lg">
            {items.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.07} className="h-full">
                <TestimonialCard testimonial={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

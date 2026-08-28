'use client';

import { Reveal, SplitText } from '@/components/motion';
import { TestimonialCard } from './index';
import type { Testimonial } from '@/types/domain';
import { cn } from '@/lib/cn';

/**
 * The social-proof band, shared by the home page and /about.
 *
 * ── Every card the same size ────────────────────────────────────────────────
 * This was briefly a staggered two-column layout with the heading as the first
 * cell — the client's reference did that, and it looked well until you noticed
 * the cards were all slightly different heights and none of them lined up. The
 * client asked for one size, which is the same preference already recorded on
 * `FeaturedProjects`: no card bigger than its neighbours.
 *
 * So: heading across the top, then a plain 2×2 grid. `auto-rows-fr` is what
 * actually enforces it — without it each row sizes to its own tallest card and
 * the two rows disagree. With it, every row is the height of the tallest card
 * in the band, and `h-full` on the card fills that row.
 *
 * The cost is honest and was asked for: the shortest quote now carries some
 * empty space. `flex-1` on the blockquote spends it between the quote and the
 * name rather than leaving it all in one lump at the bottom.
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
  const heading = (
    <div>
      <Reveal>
        <p className="overline">{overline}</p>
      </Reveal>
      <h2 className="mt-4 text-display-sm">
        <SplitText text={title} />
      </h2>
      {/* The rule is the reference's, and it earns its place here: it separates
          the heading from the card directly below it in the same column. */}
      <Reveal delay={0.1}>
        <span className="mt-6 block h-0.5 w-14 rounded-full bg-cyan-500" aria-hidden />
      </Reveal>
      {lead && (
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-lead text-muted">{lead}</p>
        </Reveal>
      )}
    </div>
  );

  return (
    <section className={cn('section-sm bg-[rgb(var(--c-surface-2))]', className)}>
      <div className="container">
        {heading}

        {/*
          `auto-rows-fr` is doing the work here. A plain `md:grid-cols-2` sizes
          each row to its own tallest card, so row 1 and row 2 come out different
          heights — which is the raggedness the client objected to. `1fr` rows in
          an auto-height grid all resolve to the tallest row, so all four match.

          Unprefixed, so it holds at every width. On a phone the cards are
          stacked and a 24px difference would not have been visible anyway, but
          "all one size" is easier to keep true than "all one size above 768px".
        */}
        <div className="mt-12 grid auto-rows-fr gap-6 md:grid-cols-2">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.07} className="h-full">
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

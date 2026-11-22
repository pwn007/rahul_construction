'use client';

import { useEffect, useRef, useState } from 'react';
import { STORIES } from './content';
import { Chevron } from './icons';
import { Eyebrow, Reveal } from './reveal';

const arrow =
  'grid size-[3.7vw] place-items-center rounded-full bg-cyan-500 text-white transition duration-300 hover:scale-110 hover:bg-navy-800 active:scale-95 max-lg:size-10';

/**
 * The design's client stories: dummy cards two to a view, a native scroller
 * with snap points (so a finger or trackpad turns it too), and the arrows
 * either side of a bar whose navy half travels with the scroll.
 *
 * The design softens the band with two `blur(120px)` circles; on iPhone a
 * blur that size blanked whole pages (Oct 2026), so they are the same glows
 * drawn as radial gradients, with no filter — each box grown by the blur's
 * 240px reach, the stops following a disc blurred at that radius.
 */
export function ClientStories() {
  const track = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const f = () => setProg(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth));
    el.addEventListener('scroll', f, { passive: true });
    return () => el.removeEventListener('scroll', f);
  }, []);

  const slide = (d: number) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: d * card.offsetWidth * 1.02, behavior: 'smooth' });
  };

  return (
    <section data-section="client-stories" id="client-stories" aria-label="Client stories" className="relative mt-[7vw] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[calc(8%+240px)] top-[calc(10%-240px)] aspect-square w-[calc(40%+480px)] bg-[radial-gradient(closest-side,rgba(0,187,238,.19),rgba(0,187,238,.17)_30%,rgba(0,187,238,.1)_55%,rgba(0,187,238,.03)_78%,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[calc(8%+240px)] top-[calc(30%-240px)] aspect-square w-[calc(35%+480px)] bg-[radial-gradient(closest-side,rgba(3,9,78,.14),rgba(3,9,78,.13)_30%,rgba(3,9,78,.075)_55%,rgba(3,9,78,.02)_78%,transparent)]"
      />
      <div className="mx-[3%]">
        <Reveal>
          <Eyebrow>Client Stories</Eyebrow>
        </Reveal>
      </div>
      <div ref={track} className="hide-scroll mt-[3vw] flex snap-x snap-mandatory gap-[0.8vw] overflow-x-auto px-[3%]">
        {STORIES.map((story, i) => (
          <article
            key={i}
            className="group relative aspect-[702/551] w-[calc((100%-0.8vw)/2)] shrink-0 snap-start overflow-hidden rounded-none bg-[#8a3d00] max-md:w-[88%]"
          >
            <img
              src={story.image}
              width={659}
              height={552}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-[11%] left-0 pl-[0.2%] text-[1.55vw] font-light uppercase leading-snug tracking-wider text-white transition-transform duration-300 group-hover:-translate-y-2 max-lg:text-[0.875rem]">
              {story.name}
              <br />
              {story.place}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-[2.6vw] flex items-center justify-center">
        <button type="button" onClick={() => slide(-1)} aria-label="Previous stories" className={arrow}>
          <Chevron dir="prev" />
        </button>
        <div className="relative h-[0.5vw] w-[3.7vw] bg-cyan-500 max-lg:h-1 max-lg:w-10" aria-hidden>
          <div className="absolute inset-y-0 left-0 bg-navy-800 transition-all duration-300" style={{ width: `${50 - prog * 50}%` }} />
          <div className="absolute inset-y-0 right-0 bg-navy-800 transition-all duration-300" style={{ width: `${prog * 50}%` }} />
        </div>
        <button type="button" onClick={() => slide(1)} aria-label="Next stories" className={arrow}>
          <Chevron dir="next" />
        </button>
      </div>
    </section>
  );
}

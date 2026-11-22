'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { WHAT_WE_DO } from './content';
import { ServiceIcon } from './icons';
import { Eyebrow, Reveal } from './reveal';

/**
 * The design's services: the heading, then four cards edge to edge — each a
 * centred column on a cyan-lit card, its emblem floating in a glow below.
 * "EXPLORE SERVICE" goes to the service's own page (the design's went to the
 * contact band).
 */
export function WhatWeDo() {
  return (
    <section data-section="services" id="services" className="mt-[4.5vw] scroll-mt-[6.5vw] max-lg:scroll-mt-16">
      <div className="mx-[3%]">
        <Reveal>
          <Eyebrow>{WHAT_WE_DO.eyebrow}</Eyebrow>
          <h2 className="mt-[0.4vw] text-[3.1vw] font-bold text-navy-800 max-lg:text-2xl">
            {WHAT_WE_DO.title[0]}
            <span className="text-cyan-500">{WHAT_WE_DO.title[1]}</span>
          </h2>
          <p className="mt-[0.8vw] max-w-[78%] text-justify text-[1.4vw] leading-snug max-lg:max-w-none max-lg:text-[0.875rem]">{WHAT_WE_DO.lede}</p>
        </Reveal>
      </div>
      <div className="mt-[2vw] grid gap-3 md:grid-cols-2">
        {WHAT_WE_DO.cards.map((card, i) => (
          <Reveal key={card.title} delay={(i % 2) * 120}>
            <div className="ht-service-card group relative isolate flex h-full min-h-[44vw] flex-col items-center overflow-hidden rounded-none bg-[#f8fafc] px-[4%] pt-[3.4vw] text-center max-md:min-h-0 max-md:pt-8">
              <h3 className="text-[2.4vw] font-semibold tracking-tight text-navy-800 max-lg:text-xl">{card.title}</h3>
              <p className="mt-[0.6vw] max-w-[80%] text-[1.4vw] leading-snug max-lg:text-[0.875rem]">{card.tagline}</p>
              <ul className="mt-[1.2vw] text-[1.05vw] uppercase leading-[1.8] tracking-wide text-black/70 max-lg:text-[11px]">
                {card.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link
                href={card.href}
                aria-label={`Explore ${card.title}`}
                className="ht-service-cta mt-[1.8vw] inline-flex h-[3vw] items-center rounded-full bg-cyan-500 px-[2.2vw] font-[Arial,sans-serif] text-[1vw] font-bold text-navy-800 transition duration-300 max-lg:h-10 max-lg:px-6 max-lg:text-xs max-md:mt-5"
              >
                {WHAT_WE_DO.cta}
              </Link>
              <div className="grid min-h-0 w-full flex-1 place-items-center py-[3.5vw] max-md:py-8">
                <div className="ht-emblem">
                  <div aria-hidden="true" className="ht-icon-glow" />
                  <div className="ht-float" style={{ '--fd': `${i * 0.7}s` } as CSSProperties}>
                    <ServiceIcon index={i} />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

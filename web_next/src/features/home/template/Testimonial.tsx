'use client';

import Link from 'next/link';
import { TESTIMONIAL as T } from './content';
import { QuoteGlyph } from './icons';
import { Eyebrow, Reveal } from './reveal';

/** The design's testimonial: the heading on the left, one client's words on the right. */
export function Testimonial() {
  return (
    <section data-section="testimonial" className="mx-[5.5%] grid gap-[2vw] pb-[8vw] max-lg:mx-[4%] max-lg:gap-8 lg:grid-cols-2">
      <Reveal>
        <Eyebrow light>{T.eyebrow}</Eyebrow>
        <h2 className="mt-[3vw] text-[3.1vw] font-bold leading-[1.05] text-navy-800 max-lg:text-[1.875rem]">
          {T.title[0]}
          <br />
          {T.title[1]}
          <br />
          <span className="text-cyan-500">{T.title[2]}</span>
        </h2>
        <p className="mt-[3vw] max-w-[45%] text-[1.4vw] leading-[1.1] max-lg:max-w-none max-lg:text-[0.875rem]">{T.lede}</p>
      </Reveal>
      <Reveal delay={150} className="relative lg:pl-[2.6vw]">
        <div className="absolute left-0 top-[3vw] hidden h-[7.5vw] w-px bg-gradient-to-b from-cyan-500 to-transparent lg:block" />
        <QuoteGlyph className="min-w-8 fill-current text-cyan-500" />
        <p className="mt-[0.5vw] text-[1.45vw] font-bold leading-[1.3] max-lg:text-[1rem]">{T.quote}</p>
        <p className="mt-[2.2vw] text-center text-[1.4vw] font-bold text-navy-800 max-lg:text-sm">{T.name}</p>
        <p className="text-center text-[1.4vw] max-lg:text-sm">{T.place}</p>
        <p className="mt-[4vw] text-center text-[1.4vw] max-lg:text-sm">
          See the project ·{' '}
          <Link href={T.project.href} className="underline-offset-4 transition hover:text-cyan-500 hover:underline">
            {T.project.label}
          </Link>
        </p>
      </Reveal>
    </section>
  );
}

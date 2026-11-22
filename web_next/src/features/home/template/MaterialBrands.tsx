'use client';

import { cn } from '@/lib/cn';
import { BRANDS } from './content';
import { Reveal } from './reveal';

/** The design's material brands: a thin rule, the line, four logos spread edge to edge.
    On a phone the design's 40px-tall logos run ~70px off the screen and cut Tata Steel
    in half; under 768px they scale with the width instead, so all four fit. */
export function MaterialBrands() {
  return (
    <section data-section="brands" className="mt-[3vw] border-t border-black/5 pb-[3.4vw] pt-[3.4vw]">
      <Reveal>
        <p className="text-center text-[1.2vw] max-lg:text-xs">{BRANDS.title}</p>
      </Reveal>
      <Reveal delay={150} className="mt-[1.4vw] flex items-center justify-between gap-4 px-[1%]">
        {BRANDS.logos.map((logo) => (
          <img
            key={logo.name}
            src={logo.src}
            alt={logo.name}
            width={logo.w}
            height={logo.h}
            loading="lazy"
            className={cn(
              logo.height,
              'w-auto transition duration-300 hover:-translate-y-1.5 hover:drop-shadow-[0_10px_10px_rgba(3,9,78,.25)] max-lg:h-10 max-md:h-[7vw]',
            )}
          />
        ))}
      </Reveal>
    </section>
  );
}

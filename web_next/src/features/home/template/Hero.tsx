'use client';

import Link from 'next/link';
import { HERO } from './content';
import { Reveal } from './reveal';

const button =
  'grid h-[4.2vw] w-[17.5vw] place-items-center font-[Arial,sans-serif] text-[1.15vw] transition duration-300 hover:-translate-y-1.5 active:translate-y-0 max-lg:h-12 max-lg:w-auto max-lg:px-5 max-lg:text-sm';

/** The design's first band: the Hindi line, the claim, two buttons, and the bedroom render on the right. */
export function Hero() {
  const [hi1, hi2, hi3, hi4] = HERO.taglineHi;

  return (
    <section data-section="hero" className="mx-[3%] mt-[1.4vw] grid items-start gap-[2.4vw] max-lg:gap-8 lg:grid-cols-[1fr_44.3%]">
      <div className="pt-[2.6vw] max-lg:pt-4">
        <Reveal>
          <p lang="hi" className="font-['Noto_Sans_Devanagari'] text-[1.9vw] font-medium leading-none text-navy-800 max-lg:text-[1.25rem]">
            {hi1}
            <span className="text-cyan-500">{hi2}</span>
            {hi3}
            <span className="text-cyan-500">{hi4}</span>
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="mt-[0.8vw] font-['Playfair_Display'] text-[4.2vw] font-bold leading-[1.28] tracking-[-0.03em] text-navy-800 max-lg:text-[2.25rem]">
            {HERO.title[0]}
            <br />
            {HERO.title[1]}
            <br />
            <a href="#services" className="relative inline-block leading-[1.05] text-cyan-500 transition hover:text-navy-800">
              {HERO.accent}
              <span
                aria-hidden
                className="absolute -bottom-[0.06em] left-0 h-[0.05em] w-full rounded-full bg-cyan-500 shadow-[0_0_14px_3px_rgba(0,187,238,.65)]"
              />
            </a>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-[1.8vw] max-w-[88%] text-justify text-[1.45vw] leading-snug max-lg:max-w-none max-lg:text-[1rem]">{HERO.sub}</p>
        </Reveal>
        <Reveal delay={360} className="mt-[2vw] flex flex-wrap gap-[1.2vw] max-lg:gap-3">
          <a href={HERO.primary.href} className={`${button} bg-navy-800 text-white hover:shadow-[0_14px_26px_-10px_rgba(3,9,78,.7)]`}>
            {HERO.primary.label}
          </a>
          <Link href={HERO.secondary.href} className={`${button} bg-cyan-500 text-navy-800 hover:shadow-[0_14px_26px_-10px_rgba(0,187,238,.9)]`}>
            {HERO.secondary.label}
          </Link>
        </Reveal>
      </div>
      <Reveal delay={200}>
        <img
          src={HERO.image.src}
          width={HERO.image.width}
          height={HERO.image.height}
          alt={HERO.image.alt}
          fetchPriority="high"
          className="block h-auto w-full"
          style={{ aspectRatio: '1890 / 1786' }}
        />
      </Reveal>
    </section>
  );
}

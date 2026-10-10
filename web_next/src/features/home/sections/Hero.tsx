'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Phone } from 'lucide-react';
import { Counter } from '@/components/motion';
import { SITE, ACHIEVEMENTS } from '@/constants/site';
import { usePrefersReducedMotion } from '@/hooks';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { useHeroBanner } from '@/hooks/useHeroBanner';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { HERO_SLIDES } from './heroSlides';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Where the portrait crop takes over. It has to agree with the `max-lg:portrait:`
 * classes on the <img> below — the <source> picks the file, those classes place it.
 */
const PORTRAIT_CROP = '(max-width: 1023.98px) and (orientation: portrait)';

const WHATSAPP_HREF = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
  'Hi, I would like to discuss a construction project.',
)}`;

/**
 * The homepage hero — Design B, "Cinematic Full-Screen", as signed off by the
 * client (Neetu-Archstone-Hero-Designs-v2.pdf, p.3).
 *
 * Every size, gap and tint here was measured off that render (1440×900 and
 * 390×844, both at 2×) rather than estimated: type by fitting Montserrat's
 * glyph widths and ink weight, positions from ink bounds, the scrim by fitting
 * the render against the raw photograph. Fractional pixel values are those
 * measurements, not typos.
 *
 * Desktop centres the copy over the photo, above a frosted-glass stats bar;
 * call and WhatsApp stay with the site-wide floating button in the bottom-right
 * corner. Below `lg` the copy drops to the bottom of the frame and ends in Call /
 * WhatsApp buttons, with the stats bar beneath.
 *
 * Dropped from the render at the client's request: the left contact rail, the
 * Get Free Estimate / View Projects buttons and the featured-project caption
 * (estimates are one tap away in the header on every page).
 */
export function Hero() {
  const reduced = usePrefersReducedMotion();

  useRegisterHeroTone('cinematic');

  /* From the admin's Hero & banners row when it differs, else the baked copy. */
  const banner = useHeroBanner();
  const words = (banner?.title ?? SITE.headline).split(' ');
  const subtitle = banner?.subtitle ?? SITE.promise;
  const hindi = SITE.taglineHi.split(' ');

  /* ── Slides ────────────────────────────────────────────────────
     The arrows, counter and dashes exist only once there is something to step
     to; with one photo the hero is simply that photo. */
  const slides = HERO_SLIDES;
  const multi = slides.length > 1;
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const step = useCallback((by: number) => setIndex((i) => (i + by + slides.length) % slides.length), [slides.length]);

  /* Advances on its own, restarting the clock after every manual step. */
  useEffect(() => {
    if (!multi || reduced) return;
    const t = window.setTimeout(() => step(1), 7000);
    return () => window.clearTimeout(t);
  }, [index, multi, reduced, step]);

  const enter = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: EASE } };

  return (
    <section className="on-dark relative isolate flex h-[100svh] min-h-[560px] flex-col overflow-hidden bg-navy-800 text-white lg:min-h-[640px]">
      {/* ── Photograph ─────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.desktop}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            {/* The settle-in lives on this wrapper, not the <img>: framer writes
                an inline `transform`, which would wipe out the translate that
                positions the portrait crop. */}
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2.4, ease: EASE }}
            >
              <picture>
                <source media={PORTRAIT_CROP} srcSet={slide.mobile} />
                {/*
                  Landscape: plain cover, sat 40% down the frame.

                  Portrait: deliberately tighter than cover. The render frames
                  the lit glazing and the roof slab, not the whole house — the
                  photo is 136.5% of the frame's height, bottom-aligned, with
                  58.65% of its width on the centre line.
                */}
                <img
                  src={slide.desktop}
                  alt={slide.alt}
                  fetchPriority={index === 0 ? 'high' : undefined}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-[50%_40%] max-lg:portrait:inset-auto max-lg:portrait:bottom-0 max-lg:portrait:left-1/2 max-lg:portrait:h-[136.5%] max-lg:portrait:w-auto max-lg:portrait:max-w-none max-lg:portrait:-translate-x-[58.65%]"
                />
              </picture>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hero-scrim pointer-events-none absolute inset-0 -z-10" aria-hidden />

      {/* ── Copy ───────────────────────────────────────────────── */}
      {/*
        Phones: stacked from the bottom up, above the stats bar. Desktop:
        centred in what the header (`pt-[101px]`) and the stats bar leave —
        at 1440×900 that lands the eyebrow within a few px of the render.
      */}
      <div className="relative flex flex-1 flex-col items-center justify-end px-5 pb-5 text-center lg:justify-center lg:px-10 lg:pb-0 lg:pt-[101px]">
        {multi && (
          <div className="mb-[17.75px] flex items-center gap-2 lg:hidden" aria-hidden>
            {slides.map((s, i) => (
              <span
                key={s.desktop}
                className={cn('h-[3px] transition-all duration-500', i === index ? 'w-[22px] bg-cyan-500' : 'w-2.5 bg-white/60')}
              />
            ))}
          </div>
        )}

        <motion.p
          {...enter(0.1)}
          className="flex items-center justify-center font-montserrat text-[11.5px] font-medium uppercase leading-[14px] tracking-[0.27em] text-white/95 lg:gap-[17px] lg:text-[12.75px] lg:leading-4 lg:tracking-[0.37em]"
        >
          <span className="relative -top-[1.5px] hidden h-px w-11 bg-cyan-500 lg:block" aria-hidden />
          <span>{SITE.tagline}</span>
          <span className="relative -top-[1.5px] hidden h-px w-11 bg-cyan-500 lg:block" aria-hidden />
        </motion.p>

        {/*
          Real words, uppercased by CSS, so a screen reader says "Building
          Dreams" rather than spelling it. Each word is its own masked line for
          the reveal; `pl-[<tracking>]` cancels the letter-spacing trailing the
          last letter, which would otherwise pull each word off centre.
        */}
        <h1 className="mt-[13.25px] font-montserrat text-[40px] font-semibold uppercase leading-[45px] tracking-[0.12em] lg:mt-[24.5px] lg:text-[88.25px] lg:leading-[94.5px] lg:tracking-[0.115em]">
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className="kinetic-line pl-[0.12em] lg:pl-[0.115em]">
              <motion.span
                className={i === 1 ? 'inline-block text-cyan-500' : 'inline-block'}
                initial={reduced ? { opacity: 0 } : { y: '108%' }}
                animate={reduced ? { opacity: 1 } : { y: '0%' }}
                transition={{ duration: 1.05, delay: 0.18 + i * 0.1, ease: EASE }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* नक़्शे से निर्माण तक — alternate words in cyan, as the brochure sets it. */}
        <motion.p
          {...enter(0.45)}
          lang="hi"
          className="mt-[17.75px] font-deva text-[20px] font-normal leading-[26px] lg:mt-[29px] lg:text-[25.5px] lg:leading-8"
        >
          {hindi.map((word, i) => (
            <Fragment key={`${word}-${i}`}>
              {i > 0 && ' '}
              <span className={i % 2 === 1 ? 'text-cyan-500' : 'text-white'}>{word}</span>
            </Fragment>
          ))}
        </motion.p>

        <motion.p
          {...enter(0.55)}
          className="mt-1.5 font-montserrat text-[14.25px] font-normal leading-5 tracking-[0.015em] text-white/85 lg:mt-[8.5px] lg:text-[17.25px] lg:leading-6 lg:tracking-[0.03em]"
        >
          {subtitle}
        </motion.p>

        {/* Phones get the two actions they came for as full-size targets —
            as wide as the stats bar beneath, so the two share their edges. */}
        <motion.div {...enter(0.7)} className="mt-[21.25px] w-full md:w-[min(1100px,calc(100vw-200px))] lg:hidden">
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${SITE.phoneRaw}`}
              onClick={() => track('call_click', { placement: 'hero' })}
              className="flex h-12 items-center justify-center gap-[9px] border border-white/55 font-montserrat text-[12.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors active:bg-white/10"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              Call
            </a>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { placement: 'hero' })}
              className="flex h-12 items-center justify-center gap-[9px] border border-white/55 font-montserrat text-[12.5px] font-bold uppercase tracking-[0.1em] text-white transition-colors active:bg-white/10"
            >
              <WhatsAppGlyph className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </motion.div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────
          Design A's glass stats bar, moved into this hero at the client's
          request once its buttons and caption had gone — it fills the lower
          frame with the firm's proof rather than leaving it empty.

          Phones: the width of the Call / WhatsApp row. From `md`: a centred
          card with 100px clear each side, so the site-wide floating contact
          button (fixed, bottom-right) never lands on its corner. `threshold`
          is 0 because the bar is on screen at first paint; the default would
          leave it reading 0+ until the visitor scrolled. */}
      <motion.div
        {...enter(0.85)}
        className="relative mx-5 mb-5 border border-white/15 bg-white/[0.07] backdrop-blur-md md:mx-auto md:mb-10 md:w-[min(1100px,calc(100%-200px))]"
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {ACHIEVEMENTS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                /* Reversed so the number shows above its label while the markup keeps
                   dt before dd; `justify-end` then packs from the top, so the four
                   numbers share a line even when a label wraps. */
                'flex flex-col-reverse justify-end border-white/15 px-4 py-3.5 text-left sm:px-6 lg:px-8 lg:py-6',
                i % 2 === 1 && 'border-l',
                i >= 2 && 'border-t sm:border-t-0',
                i === 2 && 'sm:border-l',
              )}
            >
              <dt className="mt-1.5 font-montserrat text-[10px] uppercase leading-snug tracking-[0.12em] text-white/60 lg:mt-2 lg:text-[11px] lg:tracking-[0.2em]">
                {stat.label}
              </dt>
              <dd className="font-montserrat text-[24px] font-semibold leading-none text-white lg:text-[40px]">
                <Counter value={stat.value} threshold={0} className="font-montserrat" />
                <span className="text-cyan-500">{stat.suffix}</span>
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>

      {/* ── Slide controls (desktop, 2+ slides) ────────────────── */}
      {multi && (
        <>
          <div className="absolute right-[52px] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex" aria-hidden>
            <span className="h-[70px] w-px bg-white/25" />
            {slides.map((s, i) => (
              <span
                key={s.desktop}
                className={cn(
                  'font-montserrat text-[12px] font-semibold tracking-[0.05em] transition-colors duration-500',
                  i === index ? 'text-cyan-500' : 'text-white/55',
                )}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            ))}
            <span className="h-[70px] w-px bg-white/25" />
          </div>

          {/* Set in from the render's `right-[72px]` so the pair clears the
              site's floating contact button in the bottom-right corner. */}
          <div className="absolute bottom-[43px] right-[108px] hidden gap-3.5 lg:flex">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous project"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/45 text-white transition-colors duration-300 hover:border-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next project"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/45 text-white transition-colors duration-300 hover:border-cyan-400 hover:text-cyan-300"
            >
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * WhatsApp's mark as an outline glyph, to sit beside lucide's Phone at the same
 * stroke weight — lucide ships no brand icons. Paths from Tabler Icons
 * (`brand-whatsapp`, MIT).
 */
function WhatsAppGlyph({ className, strokeWidth = 1.75 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
    </svg>
  );
}

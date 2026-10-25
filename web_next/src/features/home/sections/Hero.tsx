'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import { ArrowLeft, ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { ChapterEyebrow, ChapterFigures, PillLink } from '@/components/chapter';
import { usePreloaderDone } from '@/components/common/Chrome';
import { SITE, ACHIEVEMENTS } from '@/constants/site';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { useHeroBanner } from '@/hooks/useHeroBanner';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics';
import { ResponsiveImage, hasImageVariants } from '@/components/common/ResponsiveImage';
import { HERO_SLIDES, type HeroSlide } from './heroSlides';

/**
 * The homepage hero — the finalized design (Loam-style prototype, version 5),
 * replacing Design B at the client's request (Phase 1, decision 6).
 *
 * One screen of photograph that settles in over nine seconds. The headline sits
 * high — two lines in Outfit, the second in brand cyan — with the
 * Hindi line under it; the lede and the four figures run along the bottom
 * edge. Styles: `.hero-v2*` in globals.css.
 *
 * Call and WhatsApp sit under the lede, as the design drew them — the client
 * had them taken off on 11 Oct 2026 and asked for them back on 25 Oct, when the
 * site's floating contact button went. Call is the one filled pill. On a phone
 * they are the home page's only contact (its bottom contact bar is off here).
 *
 * ── Entrance ────────────────────────────────────────────────────────────────
 * Plays when the preloader starts to lift (`usePreloaderDone`), not on mount —
 * on a first visit the loader covers the page for two seconds and the entrance
 * would finish unseen. The headline's lines slide in from opposite sides out of
 * a blur; the eyebrow, Hindi line, lede and figures rise a beat later, and
 * the figures count up as they land. The prototype's timeline, at its 1.5×.
 *
 * ── Exit ────────────────────────────────────────────────────────────────────
 * Tied to the scroll over the first 40% of the hero's height: the lines part
 * sideways, the eyebrow drops, the rest lifts away. The blur on the way out is
 * phones only; at desktop sizes a scroll-linked blur of 190px type costs frames.
 *
 * Reduced motion: everything is simply there — no slide, blur, count or exit.
 *
 * Kept from Design B: the admin banner's title and subtitle override the baked
 * copy, `HERO_SLIDES` can hold several photographs (arrows appear at two), the
 * portrait crop is used on portrait screens below `lg`, and the header is told
 * this is a cinematic hero.
 */

/** WhatsApp opens on a chat with this message ready to send. */
const WHATSAPP_HREF = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi, I would like to discuss a construction project.')}`;

/** How long each photograph stays before the hero moves to the next. */
const AUTOPLAY_MS = 5000;

/** Where the portrait crop takes over: portrait screens below `lg`. */
const PORTRAIT_CROP = '(max-width: 1023.98px) and (orientation: portrait)';

const EXPO = [0.16, 1, 0.3, 1] as const;
const OUT3 = [0.215, 0.61, 0.355, 1] as const;
/* The prototype's timeline played at 1.5×: seconds below are already divided. */
const RISE_AT = 1.07;
const RISE_STEP = 0.1;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (v: number, from: number, length: number) => clamp01((v - from) / length);
const out2 = (t: number) => 1 - (1 - t) * (1 - t);
const in2 = (t: number) => t * t;
/* Alternate lines enter and leave from opposite sides. */
const side = (i: number) => (i % 2 ? 1 : -1);

/* The reduced variants still name x / y / filter: the first paint is rendered
   before the reduced-motion query is known, so it carries the full variant's
   offsets, and framer never clears a property a later variant stops mentioning
   (the trap recorded on `Reveal` in components/motion). */
function lineVariants(i: number, reduced: boolean): Variants {
  if (reduced)
    return {
      hidden: { opacity: 0, x: '0vw', filter: 'blur(0px)' },
      shown: { opacity: 1, x: '0vw', filter: 'blur(0px)', transition: { duration: 0.4 } },
    };
  return {
    hidden: { opacity: 0, x: `${side(i) * 28}vw`, filter: 'blur(16px)' },
    shown: { opacity: 1, x: '0vw', filter: 'blur(0px)', transition: { duration: 1.73, delay: 0.03, ease: EXPO } },
  };
}

function riseVariants(delay: number, reduced: boolean): Variants {
  if (reduced)
    return {
      hidden: { opacity: 0, y: 0, filter: 'blur(0px)' },
      shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4 } },
    };
  return {
    hidden: { opacity: 0, y: 46, filter: 'blur(9px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.21, delay, ease: OUT3 } },
  };
}

/* ── Scroll-linked exit wrappers ──────────────────────────────────────────
   Separate elements from the entrance ones inside them, so the two never write
   the same `transform`. `q` runs 0 → 1 over the first 40% of the hero. */

function ExitLine({ q, index, soft, active, children }: ExitProps & { index: number }) {
  const x = useTransform(q, (v) => `${side(index) * 28 * out2(v)}vw`);
  const opacity = useTransform(q, (v) => 1 - out2(v));
  const filter = useTransform(q, (v) => (soft ? `blur(${(14 * out2(seg(v, 0, 0.5))).toFixed(1)}px)` : 'none'));
  return (
    <motion.span className="ln" style={active ? { x, opacity, filter } : undefined}>
      {children}
    </motion.span>
  );
}

function ExitDrop({ q, soft, active, children }: ExitProps) {
  const y = useTransform(q, (v) => 46 * out2(seg(v, 0, 0.4)));
  const opacity = useTransform(q, (v) => 1 - seg(v, 0, 0.95));
  const filter = useTransform(q, (v) => (soft ? `blur(${(9 * out2(seg(v, 0, 0.4))).toFixed(1)}px)` : 'none'));
  return <motion.div style={active ? { y, opacity, filter } : undefined}>{children}</motion.div>;
}

function ExitLift({ q, order, soft, active, className, children }: ExitProps & { order: number; className?: string }) {
  const m = (v: number) => in2(seg(v, 0.1 + order * 0.08, 0.5));
  const y = useTransform(q, (v) => -26 * m(v));
  const opacity = useTransform(q, (v) => 1 - m(v));
  const filter = useTransform(q, (v) => (soft ? `blur(${(7 * m(v)).toFixed(1)}px)` : 'none'));
  return (
    <motion.div className={className} style={active ? { y, opacity, filter } : undefined}>
      {children}
    </motion.div>
  );
}

interface ExitProps {
  q: MotionValue<number>;
  soft: boolean;
  active: boolean;
  children: ReactNode;
}

/**
 * A figure that counts up as it lands. Big numbers start from nearby rather
 * than zero (80 from 44), small ones from zero — the prototype's rule. The
 * server and the first client render show the final value, so crawlers and
 * reduced-motion visitors read "80+", never "0+".
 */
function HeroCount({ value, play, reduced }: { value: number; play: boolean; reduced: boolean }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!play || reduced) {
      setShown(value);
      return;
    }
    const from =
      value > 20 ? Math.min(value - 1, Math.max(Math.ceil(value * 0.55), 10 ** (String(Math.round(value)).length - 1))) : 0;
    setShown(from);
    const delay = (RISE_AT + 2 * RISE_STEP) * 1000;
    const duration = 1470;
    let frame = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = clamp01((now - start) / duration);
      setShown(Math.round(from + (value - from) * out2(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [play, reduced, value]);
  return <span className="num">{shown}</span>;
}

export function Hero() {
  const reduced = usePrefersReducedMotion();
  const soft = useMediaQuery('(max-width: 767.98px)');
  const play = usePreloaderDone();

  useRegisterHeroTone('cinematic');

  /* From the admin's Hero & banners row when it differs, else the baked copy.
     The last word becomes the italic cyan line ("Building / Dreams"). */
  const banner = useHeroBanner();
  const words = (banner?.title ?? SITE.headline).trim().split(/\s+/);
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words;
  const subtitle = banner?.subtitle ?? SITE.promise;

  /* ── Slides ────────────────────────────────────────────────────
     The arrows, counter and dashes exist only once there is something to step
     to; with one photo the hero is simply that photo.

     Advances on its own every five seconds (client, 11 Oct 2026), and can be
     stepped by hand at any time: the arrows on desktop, a sideways swipe or
     the dashes on phones. A manual step restarts the five seconds, so the
     photo someone just chose stays up for a full turn. See the autoplay
     effect below for when it holds still. */
  const slides = HERO_SLIDES;
  const multi = slides.length > 1;
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const step = useCallback((by: number) => setIndex((i) => (i + by + slides.length) % slides.length), [slides.length]);

  /* A sideways swipe anywhere on the hero. Only a clearly horizontal stroke
     counts, so scrolling the page past the hero never changes the photo; the
     listener is passive and never blocks the scroll. A stroke that moved the
     page is a scroll whatever its angle: on phones the section engine
     (lib/section-nav) carries the page with a vertical drag and decides the
     axis in the first few pixels, so a drag that set off downwards and then
     swung sideways must not change the photo as well. */
  const touch = useRef<{ x: number; y: number; sy: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    if (!multi || e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, sy: window.scrollY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from || Math.abs(window.scrollY - from.sy) > 4) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  /* ── Scroll-linked exit ────────────────────────────────────── */
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const q = useTransform(scrollYProgress, [0, 0.4], [0, 1], { clamp: true });
  const exit = { q, soft, active: !reduced };

  /* ── Autoplay ─────────────────────────────────────────────────
     Every AUTOPLAY_MS, starting once the preloader has lifted (so the first
     photo gets its full turn on screen). It holds still:
     - while the hero is mostly scrolled away — nothing to watch, and no reason
       to cross-fade a photo nobody sees;
     - while the tab is in the background;
     - while keyboard focus is on the arrows or dashes, so a keyboard user is
       never stepped past the photo they are choosing;
     - for visitors who ask their device for reduced motion (WCAG 2.2.2) —
       for them the photos change only by hand. */
  const inView = useInView(ref, { amount: 0.35 });
  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    const sync = () => setTabVisible(document.visibilityState !== 'hidden');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  const [focusHold, setFocusHold] = useState(false);
  const autoplaying = multi && !reduced && play && inView && tabVisible && !focusHold;
  useEffect(() => {
    if (!autoplaying) return;
    const t = window.setTimeout(() => step(1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [index, autoplaying, step]);
  /* Keyboard focus on a slide control holds the timer. Only keyboard focus
     (`:focus-visible`): a mouse click also leaves the arrow focused, and that
     must not stop the carousel for good. */
  const onFocusCapture = (e: { target: EventTarget }) =>
    setFocusHold(
      e.target instanceof HTMLElement &&
        e.target.closest('[data-slide-control]') !== null &&
        e.target.matches(':focus-visible'),
    );
  const onBlurCapture = () => setFocusHold(false);

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      data-section=""
      aria-roledescription={multi ? 'carousel' : undefined}
      onFocusCapture={multi ? onFocusCapture : undefined}
      onBlurCapture={multi ? onBlurCapture : undefined}
      onTouchStart={multi ? onTouchStart : undefined}
      onTouchEnd={multi ? onTouchEnd : undefined}
      className="hero-v2 on-dark relative isolate flex flex-col overflow-hidden bg-navy-800 text-white"
    >
      {/* ── Photograph ─────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <AnimatePresence initial={false}>
          {/* Each slide carries its own grade and scrim, so a bright photo and
              a dark one cross-fade with the treatment each needs. */}
          <motion.div
            key={slide.desktop}
            className="hero-v2__slide absolute inset-0"
            data-tone={slide.tone}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            <div className="hero-v2__push absolute inset-0">
              <HeroPhoto slide={slide} priority={index === 0} />
            </div>
            <div className="hero-v2__scrim pointer-events-none absolute inset-0" aria-hidden />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* The other photographs, fetched once the page has settled, so a step to
          them shows at once instead of waiting on the download. */}
      {multi && play && (
        <div hidden aria-hidden>
          {slides.slice(1).map((s) => (
            <HeroPhoto key={s.desktop} slide={s} warm />
          ))}
        </div>
      )}
      {multi && (
        /* Silent while the photos turn on their own — a screen reader would
           otherwise be interrupted every five seconds — and polite once the
           visitor is stepping with the controls (keyboard focus holds autoplay). */
        <p className="sr-only" aria-live={autoplaying ? 'off' : 'polite'}>
          Photograph {index + 1} of {slides.length}
        </p>
      )}

      {/* ── Copy ───────────────────────────────────────────────── */}
      <motion.div
        className="hero-v2__copy chapter-gutters relative flex w-full flex-1 flex-col justify-between"
        initial="hidden"
        animate={play ? 'shown' : 'hidden'}
      >
        <div>
          <div className="relative">
            {multi && (
              /* Phones and tablets: the dashes share the eyebrow's line, at its
                 right end, so a second photograph moves none of the copy (a row
                 of its own pushed the eyebrow down into the bright facade).
                 Each dash is a button with a 44px-tall target. */
              <div className="hero-v2__dots absolute -right-2 -top-[13px] z-10 flex items-center lg:hidden">
                {slides.map((s, i) => (
                  <button
                    key={s.desktop}
                    type="button"
                    data-slide-control
                    onClick={() => setIndex(i)}
                    aria-label={`Show photograph ${i + 1} of ${slides.length}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="grid h-11 place-items-center px-2"
                  >
                    <span
                      className={cn('block h-[3px] transition-all duration-500', i === index ? 'w-[22px] bg-cyan-500' : 'w-2.5 bg-white/75')}
                    />
                  </button>
                ))}
              </div>
            )}
            <ExitDrop {...exit}>
              <motion.div variants={riseVariants(RISE_AT, reduced)}>
                <ChapterEyebrow plain>{SITE.tagline}</ChapterEyebrow>
              </motion.div>
            </ExitDrop>
          </div>

          <h1 className="chapter-title mb-0" data-size="hero">
            {lines.map((line, i) => (
              <Fragment key={`${line}-${i}`}>
                <ExitLine {...exit} index={i}>
                  <motion.span className="inline-block" variants={lineVariants(i, reduced)}>
                    {i === lines.length - 1 && lines.length > 1 ? <em>{line}</em> : line}
                  </motion.span>
                </ExitLine>
                {i < lines.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </h1>

          <ExitLift {...exit} order={0}>
            <motion.p lang="hi" className="hero-v2__hi" variants={riseVariants(RISE_AT, reduced)}>
              {SITE.taglineHi}
            </motion.p>
          </ExitLift>
        </div>

        <div className="hero-v2__bottom">
          {/* The lede and, under it, the two ways to reach the firm. */}
          <div className="hero-v2__lead">
            <ExitLift {...exit} order={1}>
              <motion.div variants={riseVariants(RISE_AT + RISE_STEP, reduced)}>
                <p className="hero-v2__lede">{subtitle}</p>
              </motion.div>
            </ExitLift>
            <ExitLift {...exit} order={2}>
              <motion.div className="hero-v2__actions" variants={riseVariants(RISE_AT + 2 * RISE_STEP, reduced)}>
                <PillLink
                  href={`tel:${SITE.phoneRaw}`}
                  icon={<Phone strokeWidth={1.75} />}
                  solid
                  onClick={() => track('call_click', { placement: 'hero' })}
                  ariaLabel={`Call us on ${SITE.phone}`}
                >
                  Call us
                </PillLink>
                <PillLink
                  href={WHATSAPP_HREF}
                  icon={<MessageCircle strokeWidth={1.75} />}
                  external
                  onClick={() => track('whatsapp_click', { placement: 'hero' })}
                  ariaLabel="Chat with us on WhatsApp (opens in a new tab)"
                >
                  WhatsApp
                </PillLink>
              </motion.div>
            </ExitLift>
          </div>

          {/*
            The figures (80+ projects, 30+ years, 10+ professionals, 98%
            satisfaction), hidden at the client's request for now (Oct 2026).
            Uncomment to bring them back — `ChapterFigures`, `ACHIEVEMENTS` and
            `HeroCount` are still imported and defined for it. The lede above
            needs no change either way: `.hero-v2__bottom` is a flex row.

          <ExitLift {...exit} order={2} className="hero-v2__figures">
            <motion.div variants={riseVariants(RISE_AT + 2 * RISE_STEP, reduced)}>
              <ChapterFigures
                className="mt-0 pt-[1.125rem]"
                items={ACHIEVEMENTS.map((stat) => ({
                  label: stat.label,
                  value: (
                    <>
                      <HeroCount value={stat.value} play={play} reduced={reduced} />
                      {stat.suffix}
                    </>
                  ),
                }))}
              />
            </motion.div>
          </ExitLift>
          */}
        </div>
      </motion.div>

      {/* ── Slide controls (desktop, 2+ slides) ──────────────────
          Arrows only: the 01 / 02 numbering that sat above them was removed at
          the client's request (11 Oct 2026). Screen readers still hear
          "Photograph n of N" from the live region. */}
      {multi && (
        <div className="absolute right-10 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex xl:right-[72px]">
          <span className="h-14 w-px bg-white/25" aria-hidden />
          <button
            type="button"
            data-slide-control
            onClick={() => step(-1)}
            aria-label="Previous photograph"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/60 transition-colors duration-300 hover:bg-white hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            data-slide-control
            onClick={() => step(1)}
            aria-label="Next photograph"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/60 transition-colors duration-300 hover:bg-white hover:text-navy-800"
          >
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * One slide's photograph: every width in AVIF and WebP plus the configured
 * portrait crop when `npm run images:variants` has made them for it, else the
 * slide's own two files (landscape, and the portrait crop below `lg`).
 * `warm` loads it out of sight, at normal priority, for the next step.
 */
function HeroPhoto({ slide, priority = false, warm = false }: { slide: HeroSlide; priority?: boolean; warm?: boolean }) {
  const alt = warm ? '' : slide.alt;
  if (hasImageVariants(slide.desktop)) {
    return (
      <ResponsiveImage
        src={slide.desktop}
        alt={alt}
        priority={priority}
        eager={warm}
        position={slide.position ?? '50% 40%'}
        positionPortrait="50% 50%"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }
  return (
    <picture>
      <source media={PORTRAIT_CROP} srcSet={slide.mobile} />
      <img
        src={slide.desktop}
        alt={alt}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: slide.position ?? '50% 40%' }}
      />
    </picture>
  );
}

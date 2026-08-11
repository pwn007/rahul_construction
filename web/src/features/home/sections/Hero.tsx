import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Counter } from '@/components/motion';
import { SITE, ACHIEVEMENTS } from '@/constants/site';
import { usePrefersReducedMotion } from '@/hooks';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { HeroSite } from './HeroSite';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useRegisterHeroTone('light');

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  /**
   * Deliberately restrained. The previous hero faded its own copy to zero opacity
   * while it was still on screen, which reads as a glitch rather than an effect.
   * Now only the media drifts, and the atmosphere layers fade — the surface itself
   * never changes value, so there is no seam into the section below.
   */
  const siteY = useTransform(scrollYProgress, [0, 1], ['0%', '9%']);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-6%']);
  const atmosphereOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /**
   * `.kinetic-line` is `display:block; overflow:hidden`, so each entry masks and
   * reveals as its own line — stacked exactly as the portfolio cover sets them.
   */
  const lines = ['Building', 'Dreams'];

  return (
    <section
      ref={ref}
      /*
        Dawn: drafting paper cooling to a pale blue at the horizon. It stops
        short of going dark — the only navy in the hero is the plinth under the
        stat rail, which lets the site's linework stay dark and legible the
        whole way down instead of having to invert somewhere in the middle.
      */
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-[rgb(var(--c-bg))] via-[#EEF2F7] to-[#D8E3EF]"
      style={{ paddingTop: 'var(--nav-h)' }}
    >

      {/* ── Atmosphere ───────────────────────────────────────────────
          Every layer is masked or faded out toward the bottom edge so the hero
          dissolves into the page rather than ending on a hard cut.

          The orbs are roughly twice the opacity they used to be. At 0.09 cyan on
          paper the wash was invisible on anything but a calibrated display, which
          is how a "light" hero ends up reading as flat grey-beige. */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: reduced ? 1 : atmosphereOpacity }} aria-hidden>
        <div
          className="absolute -left-40 -top-24 h-[620px] w-[620px] rounded-full bg-cyan-400/25 blur-[130px] dark:bg-cyan-500/10"
          aria-hidden
        />
        {/* Amber low on the left, so the site reads as lit by a low sun. */}
        <div
          className="absolute -bottom-40 left-1/4 h-[460px] w-[460px] rounded-full bg-amber-300/25 blur-[130px] dark:bg-sand-500/10"
          aria-hidden
        />
      </motion.div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {/*
        Top-aligned, not centred.

        `justify-center` distributed every spare pixel evenly, so once the copy
        was cut back to a headline and two lines the leftover slack collected
        under the navbar: a 217px void at 1440×900 that grew to 289px at
        1920×1080 — the taller the display, the worse it got. Anchoring the copy
        to the top and offsetting it by a fraction of the viewport keeps that gap
        fixed at roughly 80–100px everywhere, and hands the surplus to the bottom
        of the frame, where the site drawing is waiting to fill it.
      */}
      <div className="relative flex flex-1 flex-col justify-start">
        {/*
          The site itself. Full-bleed and anchored to the bottom so the ground
          line runs the whole width of the viewport, and behind everything —
          this is the environment the copy sits inside, not a picture beside it.

          It parallaxes a little slower than the copy, which is what stops the
          two layers reading as one flat image.
        */}
        <motion.div
          style={{ y: reduced ? 0 : siteY }}
          className="absolute inset-x-0 bottom-0 h-[34%] lg:h-[74%]"
          aria-hidden
        >
          <HeroSite sectionRef={ref} className="h-full w-full" />
        </motion.div>

        {/*
          Readability scrim. The copy column overlaps the left third of the
          site, and material stacks behind body text is exactly the kind of
          thing that reads as "busy" rather than "immersive". Left-anchored and
          transparent by half-width, so it never dulls the building or crane.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-gradient-to-b from-[rgb(var(--c-bg))] via-[rgb(var(--c-bg))]/85 to-transparent lg:hidden"
          aria-hidden
        />
        {/*
          Fades on both axes: to the right by colour, downward by mask.

          The original band was sized for the old copy stack — full height at 62%
          wide — and once the copy shrank to a headline and two lines it was
          covering ground the copy no longer occupied, erasing the finished house
          in the lower left. Simply shortening it traded that for a hard
          horizontal seam where the rectangle stopped. `mask-fade-b` ends it
          gradually instead, so the copy still gets its backing and the site
          below emerges with no visible edge anywhere.
        */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] mask-fade-b bg-gradient-to-r from-[rgb(var(--c-bg))] via-[rgb(var(--c-bg))]/80 to-transparent lg:block"
          aria-hidden
        />

        <div className="container relative pb-10 pt-[7svh] sm:pb-14 lg:pb-20 lg:pt-[9svh]">
        <div className="grid w-full gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Copy */}
          <motion.div className="lg:col-span-6" style={{ y: reduced ? 0 : copyY }}>
            {/*
              Straight from the portfolio cover (Port1.pdf p.1): BUILDING in navy
              over DREAMS in cyan, with "From idea to reality, without the
              hassle." beneath it. Two intermediate headlines were tried on this
              hero and neither outlasted a review; the one the firm already
              prints on its own front page did.
            */}
            <h1 className="font-semibold leading-[0.92] tracking-[-0.035em] text-[clamp(3rem,11vw,4.75rem)] text-navy-800 lg:text-[clamp(3.5rem,6vw,6.5rem)] dark:text-white">
              {lines.map((line, i) => (
                <span key={line} className="kinetic-line">
                  {/*
                    Solid cyan-600, not `text-gradient-ink`. That ramp bottoms out in
                    navy, so the "accent" line was barely distinguishable from line 1 —
                    a gradient nobody can see is just a flat colour with extra steps.
                    #0089BF is ~4:1 on paper, clear of the 3:1 large-text floor, and
                    `text-gradient-brand` could not be used: it measures 2.4:1.
                  */}
                  <motion.span
                    className={i === 1 ? 'inline-block text-cyan-600 dark:text-cyan-400' : 'inline-block'}
                    initial={reduced ? { opacity: 0 } : { y: '108%' }}
                    animate={reduced ? { opacity: 1 } : { y: '0%' }}
                    transition={{ duration: 1.05, delay: 0.18 + i * 0.1, ease: EASE }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              className="mt-6 max-w-lead text-body-lg text-muted"
            >
              {SITE.promise}
            </motion.p>

            {/*
              The two lines that close the portfolio cover. They carry the
              offering now that the value-proposition paragraph and both CTAs
              have gone — the nav keeps a standing "Get Estimate" above the fold.
            */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.72 }}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              <p className="font-deva text-lg text-cyan-700 dark:text-cyan-400">{SITE.taglineHi}</p>
              <span className="hidden h-4 w-px bg-[rgb(var(--c-border))] sm:block" aria-hidden />
              <p className="text-caption uppercase tracking-[0.22em] text-subtle">{SITE.tagline}</p>
            </motion.div>
          </motion.div>
        </div>

        </div>
      </div>

      {/* ── Achievement rail ─────────────────────────────────────────
          Anchors the hero with a horizontal line and hands off cleanly to the
          trust marquee below — no colour change, so no visible seam. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.95 }}
        /*
          `on-dark` rather than a light background: the dawn gradient lands the
          rail on navy, and fighting that with a paper strip would put a hard
          seam right under the building. Reading it as the plinth the site
          stands on is both truer to the picture and legible.
        */
        className="on-dark relative border-t border-white/10 bg-navy-900"
      >
        <div className="container">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENTS.map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  'py-6 lg:py-7',
                  i % 2 === 1 ? 'border-l border-white/15 pl-6' : 'lg:border-l lg:border-white/15 lg:pl-6',
                  i >= 2 ? 'border-t border-white/15 lg:border-t-0' : '',
                  i === 0 ? 'lg:border-l-0 lg:pl-0' : '',
                ].join(' ')}
              >
                <dd className="num text-3xl font-semibold leading-none text-white md:text-4xl">
                  {/*
                    The rail is the last thing in a 100svh hero, so on a short
                    laptop it is on screen from the first paint but never clears
                    the default 40% threshold until the visitor scrolls — which
                    left the four headline numbers reading 0+ / 0+ / 0+ / 0%.
                  */}
                  <Counter value={stat.value} threshold={0} />
                  <span className="text-cyan-400">{stat.suffix}</span>
                </dd>
                <dt className="mt-2 text-caption leading-snug text-white/60">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </section>
  );
}

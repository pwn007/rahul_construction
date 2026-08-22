import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Counter } from '@/components/motion';
import { SITE, ACHIEVEMENTS } from '@/constants/site';
import { usePrefersReducedMotion } from '@/hooks';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { cn } from '@/lib/cn';
import { HeroScene } from './HeroScene';

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
      /*
        `--hero-scene-h` and `--hero-scene-a` are declared here, on the one
        element that owns both the scene and its captions, because the two have
        to agree exactly.

        `preserveAspectRatio="…meet"` renders the scene at
        `min(containerWidth, containerHeight × aspect)` and centres it. So once
        the height is capped and the container can be wider than the drawing,
        anything sized against the *container* — the caption row — drifts off
        the stations it labels. Both figures are already known in CSS, so the
        captions derive their width from them rather than being measured at
        runtime: `min(100%, h × a)`, which is the same number the browser used.

        The height itself is `min(max(…), 58svh)`. The `max` is the floor that
        makes the scene fill the width at ordinary sizes; the `min` is the fix
        for this bug. Unbounded, that floor asked for 514px of a 575px-tall
        window while the hero had 334px to give it — and because the scene is
        bottom-anchored, the surplus grew upward straight through the copy.
      */
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-gradient-to-b from-[rgb(var(--c-bg))] via-[#EEF2F7] to-[#D8E3EF] [--hero-scene-a:2.3] [--hero-scene-h:max(26svh,calc(100vw/2.25))] [--hero-step-3:83.333%] lg:[--hero-scene-a:3] lg:[--hero-scene-h:min(max(46svh,calc(100vw/2.95)),58svh)] lg:[--hero-step-3:85.8%]"
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
          The site itself: full-bleed, bottom-anchored, and running up behind the
          copy, so the copy sits in its sky rather than beside it.

          Its height is `--hero-scene-h`, declared on the section — see the note
          there for why it is both floored and capped, and why the captions
          derive their width from the same variable.
        */}
        <motion.div
          style={{ y: reduced ? 0 : siteY }}
          /*
            In flow below `lg`, absolute above it.

            On a wide screen there is sky to spare, so the scene is pinned to the
            bottom and the copy sits *in* it. On a 360×640 phone there is not: the
            copy runs to within 40px of where the scene has to start, and pinning
            it there put the crane through the promise line. Below `lg` the scene
            is therefore an ordinary block, ordered last and pushed down by
            `mt-auto`, so a short viewport simply makes the hero taller — `min-h-[100svh]` is a floor,
            not a ceiling — and the stat rail moves a scroll away, which is what
            it already did on those phones.

            `order-last` rather than moving it down the markup: it has to stay
            *first* in the DOM so that on desktop the later, positioned copy
            paints over it. Reordering the source would put the scene on top of
            the headline at every width above `lg`.
          */
          className="relative order-last mt-auto h-[var(--hero-scene-h)] w-full lg:absolute lg:inset-x-0 lg:bottom-0 lg:order-none lg:mt-0"
          aria-hidden
        >
          <HeroScene sectionRef={ref} className="h-full w-full" />
        </motion.div>

        <div className="container relative pt-[5svh] lg:pt-[7svh]">
          {/*
            One column, kept left, and deliberately narrow.

            A second column against the headline's baseline was tried and had to
            go: the scene is tall enough that its crane reaches into the upper
            right, and the supporting lines were landing across the jib. The
            right half of this hero is not empty space needing type — it is
            where the site is. Copy left, picture right.
          */}
          <motion.div className="max-w-xl" style={{ y: reduced ? 0 : copyY }}>
            {/*
              No greeting above the headline.

              A "HI, PAWAN" overline sat here for returning visitors. It worked,
              but it put a second, competing eyebrow directly above a headline
              that is the strongest thing on the site — the hero is the one place
              where nothing should share billing with "Building Dreams". The name
              still appears in the navbar, on the estimator result and prefilled
              into the forms, which is where it is useful rather than decorative.
            */}
            {/*
              Straight from the portfolio cover (Port1.pdf p.1): BUILDING in navy
              over DREAMS in cyan, with "From idea to reality, without the
              hassle." beneath it. Two intermediate headlines were tried on this
              hero and neither outlasted a review; the one the firm already
              prints on its own front page did.
            */}
            <h1 className="font-semibold leading-[0.92] tracking-[-0.035em] text-[clamp(3rem,11vw,4.75rem)] text-navy-800 [@media(max-height:680px)]:text-[clamp(2.5rem,3.6vw,3.25rem)] lg:text-[clamp(3.5rem,5.4vw,5.75rem)] dark:text-white">
              {lines.map((line, i) => (
                <span key={line} className="kinetic-line">
                  {/*
                    Solid cyan-600, not `text-gradient-ink`. That ramp bottoms out in
                    navy, so the "accent" line was barely distinguishable from line 1 —
                    a gradient nobody can see is just a flat colour with extra steps.
                    #0096BF is ~3.2:1 on paper, still clear of the 3:1 large-text floor, and
                    `text-gradient-brand` could not be used: its lightest stop measures 1.6:1.
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

            {/*
              The supporting column, set to the headline's baseline with a
              hairline above it — the job a rule does on a printed cover, tying
              two unequal blocks of type into one band.

              The Devanagari stays here; its English counterpart has moved out
              from beside it and become the three captions under the scene,
              where each step sits under the part of the site that shows it. A
              run-on "Design · Build · Deliver" next to a picture of design,
              build and deliver was saying the same thing twice.
            */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              className="mt-6"
            >
              <p className="max-w-lead text-body-lg text-muted">{SITE.promise}</p>
              <p className="mt-3 font-deva text-lg text-cyan-700 dark:text-cyan-400">{SITE.taglineHi}</p>
            </motion.div>
          </motion.div>
        </div>

      </div>

        {/*
          The three steps, captioned under the stations that show them.

          Real text rather than lettering inside the SVG — selectable,
          translatable, and read out by a screen reader, which the illustration
          itself deliberately is not. An equal three-column grid puts each one
          under its station because the scene's stations are composed on exactly
          one sixth, one half and five sixths of its width.

          The row is sized to the *scene's* rendered box rather than to the
          container, because once the scene's height is capped the two stop
          being the same thing: `meet` centres the drawing at
          `min(width, height × aspect)`, and a caption row spanning the full
          container would slide off its station by half the letterbox.
        */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.3 }}
          /*
            Each caption is placed at its own station's centre rather than in an
            equal three-column grid.

            The grid was simpler and pinned the stations to 1/6, 1/2 and 5/6 —
            which in turn fixed the bare ground right of the house at
            `W/6 − stationWidth/2`, with no way to reduce it that did not cost
            something worse elsewhere. DELIVER now sits a little past its third
            (`--hero-step-3`) and its caption follows it.

            The row's width is still the scene's *rendered* box rather than the
            container's, so the captions stay under their stations when the
            drawing letterboxes on a short window. Its height is explicit because
            the items are absolute — it is a 3px rule over one line of small
            caps, and this is the one number here that would need revisiting if
            that ever changed.
          */
          className="relative mx-auto h-[3.5rem] w-[min(100%,calc(var(--hero-scene-h)*var(--hero-scene-a)))] lg:h-[4rem]"
        >
          {SITE.taglineSteps.map((step, i) => (
            <li
              key={step}
              style={{ left: i === 2 ? 'var(--hero-step-3)' : `${(i * 2 + 1) * 16.6667}%` }}
              className="absolute top-4 flex -translate-x-1/2 flex-col items-center gap-2 whitespace-nowrap text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-navy-800 sm:text-caption sm:tracking-[0.2em] dark:text-white"
            >
              {/* A short rule over each caption, cyan on the middle one, so the
                  row reads as three marked stops rather than as three words. */}
              <span
                className={cn('h-[3px] w-7 rounded-full', i === 1 ? 'bg-cyan-500' : 'bg-navy-800/25 dark:bg-white/30')}
                aria-hidden
              />
              {step}
            </li>
          ))}
        </motion.ul>

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

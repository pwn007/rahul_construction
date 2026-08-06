import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Calculator, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import { Counter, Magnetic } from '@/components/motion';
import { SITE, ACHIEVEMENTS } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { IMG } from '@/lib/media';
import { usePrefersReducedMotion } from '@/hooks';
import { scrollToTarget } from '@/hooks/useLenis';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Blueprint canvas — a slow drifting survey grid with drawn "plan" strokes.
 *
 * Canvas rather than Three.js: same atmosphere, ~2 KB, no WebGL context, and it
 * degrades to nothing under reduced motion. Strokes are navy/cyan at low alpha so
 * it reads as draughting on paper rather than glow on black.
 */
function BlueprintCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      t += 0.0014;

      const spacing = 76;
      const offset = (t * 34) % spacing;

      ctx.strokeStyle = 'rgba(10, 27, 77, 0.055)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -spacing + offset; x < w + spacing; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = -spacing + offset; y < h + spacing; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Drifting floor-plan outlines, weighted to the left so they sit behind the copy.
      ctx.strokeStyle = 'rgba(0, 137, 191, 0.16)';
      ctx.lineWidth = 1.25;
      const plans = [
        { x: 0.04, y: 0.16, w: 0.15, h: 0.2, s: 0.6 },
        { x: 0.26, y: 0.6, w: 0.12, h: 0.16, s: 0.85 },
        { x: 0.55, y: 0.08, w: 0.1, h: 0.13, s: 0.45 },
        { x: 0.02, y: 0.72, w: 0.17, h: 0.14, s: 0.72 },
      ];
      for (const p of plans) {
        const drift = Math.sin(t * p.s * 2) * 9;
        ctx.strokeRect(p.x * w, p.y * h + drift, p.w * w, p.h * h);
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h + drift + p.h * h * 0.58);
        ctx.lineTo(p.x * w + p.w * w, p.y * h + drift + p.h * h * 0.58);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

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
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-6%']);
  const atmosphereOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const words = ['Building', 'Dreams'];

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[rgb(var(--c-bg))]"
      style={{ paddingTop: 'var(--nav-h)' }}
    >
      {/* ── Atmosphere ───────────────────────────────────────────────
          Every layer is masked or faded out toward the bottom edge so the hero
          dissolves into the page rather than ending on a hard cut. */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: reduced ? 1 : atmosphereOpacity }} aria-hidden>
        <div className="absolute inset-0 mask-fade-b">
          <BlueprintCanvas />
        </div>
        <div
          className="absolute -left-40 -top-24 h-[560px] w-[560px] rounded-full bg-cyan-500/[0.09] blur-[130px] dark:bg-cyan-500/10"
          aria-hidden
        />
        <div
          className="absolute -right-32 top-1/3 h-[520px] w-[520px] rounded-full bg-sand-300/40 blur-[130px] dark:bg-sand-500/10"
          aria-hidden
        />
      </motion.div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="container relative flex flex-1 items-center py-14 lg:py-20">
        <div className="grid w-full gap-14 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Copy */}
          <motion.div className="lg:col-span-6" style={{ y: reduced ? 0 : copyY }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full border bg-[rgb(var(--c-surface))] py-1.5 pl-1.5 pr-4 shadow-xs"
            >
              <span className="flex items-center gap-0.5 rounded-full bg-cyan-500 px-2 py-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-white text-white" aria-hidden />
                ))}
              </span>
              <span className="text-caption text-muted">Rated 5.0 by homeowners across Jaipur</span>
            </motion.div>

            <h1 className="text-display-xl text-navy-800 dark:text-white">
              {words.map((word, i) => (
                <span key={word} className="kinetic-line">
                  <motion.span
                    className={i === 1 ? 'inline-block text-gradient-ink' : 'inline-block'}
                    initial={reduced ? { opacity: 0 } : { y: '108%' }}
                    animate={reduced ? { opacity: 1 } : { y: '0%' }}
                    transition={{ duration: 1.05, delay: 0.18 + i * 0.1, ease: EASE }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              className="mt-7 max-w-lead text-body-lg text-muted"
            >
              {SITE.promise} Architecture, MEPF engineering, construction and interiors delivered as{' '}
              <span className="font-medium text-[rgb(var(--c-text))]">one accountable system</span> — with Vastu
              resolved in the plan, not patched afterwards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.62, ease: EASE }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <Button href={ROUTES.estimator} variant="accent" size="xl" leftIcon={<Calculator className="h-[18px] w-[18px]" />}>
                  Estimate your build
                </Button>
              </Magnetic>
              <Button href={ROUTES.projects} variant="secondary" size="xl" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                Explore our work
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.85 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <p className="font-deva text-lg text-cyan-700 dark:text-cyan-400">{SITE.taglineHi}</p>
              <span className="hidden h-4 w-px bg-[rgb(var(--c-border))] sm:block" aria-hidden />
              <p className="flex items-center gap-2 text-caption text-subtle">
                <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />1 year free maintenance after handover
              </p>
            </motion.div>
          </motion.div>

          {/* Media composition */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.35, ease: EASE }}
              style={{ y: reduced ? 0 : mediaY }}
              className="relative mx-auto w-full max-w-[420px] lg:ml-auto lg:mr-0 xl:max-w-[480px]"
            >
              <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-navy-800/[0.06]">
                <motion.img
                  src={IMG.hero('hero-primary')}
                  alt="A recently completed Neetu Archstone residence in Jaipur"
                  {...HIGH_PRIORITY_IMG}
                  initial={reduced ? {} : { scale: 1.14 }}
                  animate={reduced ? {} : { scale: 1 }}
                  transition={{ duration: 1.6, delay: 0.35, ease: EASE }}
                  /* max-h keeps the whole hero inside 100svh on short laptop screens. */
                  className="aspect-[4/5] max-h-[52svh] w-full object-cover"
                />
              </div>

              {/* Offset secondary frame — architectural composition, not decoration. */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
                className="absolute -bottom-7 -left-7 hidden w-40 overflow-hidden rounded-xl shadow-md ring-4 ring-[rgb(var(--c-bg))] sm:block"
              >
                <img
                  src={IMG.square('mansarovar-cover')}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </motion.div>

              {/* Floating proof card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.8, ease: EASE }}
                className="glass absolute -right-4 top-10 hidden rounded-xl px-4 py-3 shadow-md sm:block lg:-right-6"
              >
                <p className="flex items-center gap-1.5 text-caption text-subtle">
                  <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  Mansarovar, Jaipur
                </p>
                <p className="num mt-1 text-lg font-semibold leading-none">
                  <Counter value={2850} /> <span className="text-caption font-normal text-subtle">sq ft</span>
                </p>
                <p className="mt-1.5 text-caption text-subtle">Delivered in 9 months</p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll cue — sits just above the achievement rail, never over it. */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          onClick={() => scrollToTarget('#intro', -60)}
          className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-subtle transition-colors hover:text-cyan-700 xl:flex dark:hover:text-cyan-400"
          aria-label="Scroll to content"
        >
          <span className="text-[0.65rem] uppercase tracking-[0.2em]">Scroll</span>
          <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <ArrowDown className="h-4 w-4" />
          </motion.span>
        </motion.button>
      </div>

      {/* ── Achievement rail ─────────────────────────────────────────
          Anchors the hero with a horizontal line and hands off cleanly to the
          trust marquee below — no colour change, so no visible seam. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.95 }}
        className="relative border-t"
      >
        <div className="container">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENTS.map((stat, i) => (
              <div
                key={stat.label}
                className={[
                  'py-6 lg:py-7',
                  i % 2 === 1 ? 'border-l pl-6' : 'lg:border-l lg:pl-6',
                  i >= 2 ? 'border-t lg:border-t-0' : '',
                  i === 0 ? 'lg:border-l-0 lg:pl-0' : '',
                ].join(' ')}
              >
                <dd className="num text-3xl font-semibold leading-none text-navy-800 dark:text-white md:text-4xl">
                  <Counter value={stat.value} />
                  <span className="text-cyan-600 dark:text-cyan-400">{stat.suffix}</span>
                </dd>
                <dt className="mt-2 text-caption leading-snug text-subtle">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </section>
  );
}

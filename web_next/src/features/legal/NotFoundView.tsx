'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calculator, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui';
import { SplitText } from '@/components/motion';
import { usePrefersReducedMotion } from '@/hooks';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { useRegisterHeroTone } from '@/app/hero-tone';

/**
 * A revision cloud — the scalloped loop an architect scribbles around a mistake
 * on an issued drawing, then stamps with the revision it belongs to. The page
 * already says the page was never built; this is the drawing office agreeing.
 *
 * Radii are jittered from a deterministic hash rather than `Math.random`, so
 * the same cloud is drawn on every render and every visit — a scribble that
 * reshuffled itself would read as a glitch.
 */
const hash = (i: number) => {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

function revisionCloud(w: number, h: number, r: number) {
  const count = (len: number) => Math.max(2, Math.round(len / (r * 1.55)));
  const nx = count(w);
  const ny = count(h);
  const pts: [number, number][] = [];
  for (let i = 0; i < nx; i++) pts.push([(w * i) / nx, 0]);
  for (let i = 0; i < ny; i++) pts.push([w, (h * i) / ny]);
  for (let i = 0; i < nx; i++) pts.push([w - (w * i) / nx, h]);
  for (let i = 0; i < ny; i++) pts.push([0, h - (h * i) / ny]);

  // Walking the perimeter clockwise with sweep=1 makes every arc bulge outward.
  const d = [`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 1; i <= pts.length; i++) {
    const [x, y] = pts[i % pts.length];
    const rr = (r * (0.78 + hash(i) * 0.5)).toFixed(1);
    d.push(`A${rr} ${rr} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return d.join(' ');
}

const CLOUD = revisionCloud(360, 200, 17);

export function NotFoundView() {
  useRegisterHeroTone('dark');
  const reduced = usePrefersReducedMotion();

  const suggestions = [
    { label: 'Cost Estimator', href: ROUTES.estimator, description: 'Get a costed range in two minutes.' },
    { label: 'Our Projects', href: ROUTES.projects, description: 'Completed work across Jaipur.' },
    // Pricing & Packages is commented out for now — published rates are hidden;
    // see the Pricing entry in MAIN_NAV (constants/routes.ts).
    // { label: 'Pricing & Packages', href: ROUTES.pricing, description: 'Published rates, no hidden costs.' },
    { label: 'Contact Us', href: ROUTES.contact, description: 'Talk to a person.' },
  ];

  return (
    <>
      <section className="on-dark grain relative flex min-h-[80svh] items-center overflow-hidden bg-ink-950 pt-32 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[110px]" aria-hidden />

        <div className="container relative py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              {/* The negative margin cancels the padding, so the cloud gets room
                  to breathe around the digits without shifting them off the
                  column's left edge. */}
              <span className="relative -ml-3 inline-block px-3 py-1">
                <p className="num text-[clamp(5rem,16vw,11rem)] font-semibold leading-none tracking-tighter text-white/[0.08]">404</p>

                <svg
                  viewBox="-19 -19 398 238"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                  fill="none"
                  aria-hidden
                >
                  <motion.path
                    d={CLOUD}
                    stroke="rgb(239 68 68)"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    transition={{
                      pathLength: { duration: 1.5, ease: 'easeInOut', delay: 0.45 },
                      opacity: { duration: 0.2, delay: 0.45 },
                    }}
                  />
                </svg>

                <motion.span
                  className="absolute -top-1 left-full ml-5 hidden whitespace-nowrap font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-red-400/90 lg:block"
                  initial={reduced ? false : { opacity: 0, y: 6, rotate: -3 }}
                  animate={{ opacity: 1, y: 0, rotate: -3 }}
                  transition={{ duration: 0.5, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden
                >
                  Rev. A — not issued for construction
                </motion.span>
              </span>
              <h1 className="-mt-6 text-display-md text-white md:-mt-10">
                <SplitText text="This page was never built." />
              </h1>
              <p className="mt-5 max-w-lead text-body-lg text-white/60">
                The link is broken or the page has moved. Here is where most people were actually heading.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={ROUTES.home} variant="accent" size="lg" leftIcon={<Home className="h-4 w-4" />}>
                  Back to home
                </Button>
                <Button href={ROUTES.estimator} variant="outline" size="lg" className="border-white/25 text-white hover:bg-white/10" leftIcon={<Calculator className="h-4 w-4" />}>
                  Get an estimate
                </Button>
              </div>

              <p className="mt-6 flex items-center gap-2 text-caption text-white/40">
                <Search className="h-3.5 w-3.5" />
                Tip: press <kbd className="num rounded bg-white/10 px-1.5 py-0.5">⌘K</kbd> anywhere to search the site.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-dark rounded-xl p-6">
                <p className="text-overline uppercase tracking-[0.18em] text-white/40">Popular destinations</p>
                <div className="mt-5 space-y-1">
                  {suggestions.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="group flex items-center justify-between gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <span>
                        <span className="block font-medium">{s.label}</span>
                        <span className="block text-caption text-white/45">{s.description}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-cyan-400" />
                    </Link>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-overline uppercase tracking-[0.18em] text-white/40">Recent project</p>
                  {projects[0] && (
                    <Link href={ROUTES.project(projects[0].slug)} className="group mt-3 flex items-center gap-3">
                      <img src={projects[0].coverImage} alt="" className="h-14 w-20 rounded-md object-cover" loading="lazy" />
                      <span>
                        <span className="block text-sm font-medium transition-colors group-hover:text-cyan-400">{projects[0].title}</span>
                        <span className="block text-caption text-white/40">{projects[0].locality}</span>
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

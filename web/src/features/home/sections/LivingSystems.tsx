import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal, SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { usePrefersReducedMotion } from '@/hooks';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Living Systems band.
 *
 * MEPF is the firm's core discipline but it is, by definition, invisible — there is
 * nothing to photograph. So it is drawn instead: each of the four services is a route
 * crossing the wall, rendered as line-work that draws itself once as the band enters
 * view. The shared left-to-right baseline is deliberate — it reads as four services
 * running through the same building rather than four unrelated icons.
 *
 * Inline SVG rather than WebGL or Lottie: a few hundred bytes each, animatable via
 * `pathLength`, crisp at any density, and it simply resolves to a static drawing under
 * `prefers-reduced-motion`.
 */

interface SystemDef {
  key: string;
  label: string;
  detail: string;
  /** Main route stroke, drawn on entry. */
  route: string;
  /** Optional secondary strokes drawn after the route (airflow, spray). */
  accents?: string[];
  /** Node marker along the route. */
  node?: { cx: number; cy: number; r: number };
  /** Dashed overlay that keeps flowing after the draw completes. */
  flow?: boolean;
}

const SYSTEMS: SystemDef[] = [
  {
    key: 'electrical',
    label: 'Electrical',
    detail: 'Load design, distribution, lighting',
    route: 'M2 36 H44 l11 -20 l11 40 l11 -20 H138',
    node: { cx: 44, cy: 36, r: 3 },
    flow: true,
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    detail: 'Supply, drainage, water heating',
    route: 'M2 22 H46 a12 12 0 0 1 12 12 v4 a12 12 0 0 0 12 12 H138',
    node: { cx: 70, cy: 50, r: 3 },
    flow: true,
  },
  {
    key: 'hvac',
    label: 'Mechanical · HVAC',
    detail: 'Heat load, ducting, ventilation',
    route: 'M2 24 H74 v24 H2',
    accents: ['M86 26 q12 10 0 20', 'M100 21 q14 15 0 30', 'M114 16 q16 20 0 40'],
  },
  {
    key: 'fire',
    label: 'Fire Fighting',
    detail: 'Detection, sprinklers, hydrants',
    route: 'M2 16 H70 V30',
    node: { cx: 70, cy: 33, r: 4 },
    accents: ['M50 52 q20 -14 40 0', 'M58 60 q12 -8 24 0'],
  },
];

function SystemGlyph({ system, index }: { system: SystemDef; index: number }) {
  const reduced = usePrefersReducedMotion();
  const delay = index * 0.16;

  const draw = (d: string, i = 0) => ({
    initial: reduced ? { opacity: 0 } : { pathLength: 0, opacity: 0 },
    whileInView: reduced ? { opacity: 1 } : { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: '0px 0px -12% 0px' },
    transition: { duration: reduced ? 0.2 : 1.15, delay: delay + i * 0.12, ease: EASE },
  });

  return (
    <svg viewBox="0 0 140 72" className="h-[72px] w-full overflow-visible" role="img" aria-label={system.label}>
      {/* Conduit — the faint channel the service runs through */}
      <path d={system.route} fill="none" stroke="currentColor" strokeWidth={6} className="text-cyan-500/[0.07]" strokeLinecap="round" strokeLinejoin="round" />

      {/* The route itself */}
      <motion.path
        {...draw(system.route)}
        d={system.route}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cyan-600 dark:text-cyan-400"
      />

      {/* Continuous flow along the route */}
      {system.flow && !reduced && (
        <path
          d={system.route}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeDasharray="6 26"
          className="systems-flow text-cyan-400 dark:text-cyan-200"
          style={{ animationDelay: `${delay + 1.1}s` }}
        />
      )}

      {system.accents?.map((d, i) => (
        <motion.path
          key={`${system.key}-accent-${i}`}
          {...draw(d, i + 1)}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-cyan-500/60"
        />
      ))}

      {system.node && (
        <motion.circle
          cx={system.node.cx}
          cy={system.node.cy}
          r={system.node.r}
          fill="currentColor"
          className="text-cyan-600 dark:text-cyan-400"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: delay + 0.9, ease: EASE }}
          style={{ transformOrigin: `${system.node.cx}px ${system.node.cy}px` }}
        />
      )}
    </svg>
  );
}

export function LivingSystems() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--c-surface-2))] px-6 py-10 md:px-12 md:py-14">
          <div className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm opacity-50 dark:bg-grid-blueprint dark:opacity-[0.09]" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[110px]" aria-hidden />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Reveal>
                  <p className="overline">MEPF engineering</p>
                </Reveal>
                <h2 className="mt-3 text-display-sm">
                  <SplitText text="The systems that make a building work" />
                </h2>
              </div>
              <Reveal delay={0.15}>
                <Link
                  to={ROUTES.service('mepf-consultancy')}
                  className="inline-flex shrink-0 items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
                >
                  All four, designed in-house <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>

            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {SYSTEMS.map((system, i) => (
                <div key={system.key} className={cn('group', i > 0 && 'lg:border-l lg:pl-8')}>
                  <SystemGlyph system={system} index={i} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.16, ease: EASE }}
                    className="mt-5"
                  >
                    <p className="font-display text-heading-md font-semibold">{system.label}</p>
                    <p className="mt-1 text-caption leading-relaxed text-muted">{system.detail}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

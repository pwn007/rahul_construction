import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal, SplitText } from '@/components/motion';
import { Icon } from '@/lib/icons';
import { ROUTES } from '@/constants/routes';
import { usePrefersReducedMotion } from '@/hooks';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * MEPF, drawn as a building section.
 *
 * ── Why a section and not four icons ────────────────────────────────────────
 * This replaced a band of four separate glyphs sitting on four separate
 * baselines. They were nicely drawn, but the composition argued the opposite of
 * the firm's actual pitch: four unrelated diagrams read as four separate trades,
 * when the whole selling point is that MEPF is *coordinated from day one* and
 * delivered as one system.
 *
 * A section is also what MEP engineers genuinely draw for this. A plan says two
 * services cross; only the section says whether they fit. So the four services
 * here share one building, run down one riser shaft, and stack in the ceiling
 * void of every floor in their real coordination order — ducts highest because
 * they are biggest, then pipes, then cable containment, sprinklers lowest. The
 * drawing now makes the same claim the copy does.
 *
 * ── Colour ──────────────────────────────────────────────────────────────────
 * Colour-coding by discipline is the convention on real MEP drawings, which is
 * why fire is warm against three blues rather than a fourth shade of cyan. It is
 * never the *only* channel though — every route is labelled, and isolating one
 * works on hover, focus and tap.
 */

interface System {
  key: string;
  label: string;
  detail: string;
  colour: string;
  /** Vertical riser through the shaft. */
  riser: string;
  /** One horizontal run per floor, stacked in coordination order. */
  branches: string[];
  /** Where each branch terminates, for the fitting marker. */
  terminals: { x: number; y: number }[];
  /** Dashed overlay that keeps travelling once the route has drawn. */
  flow?: boolean;
  /** Relative stroke weight. A duct is not a cable; drawing them alike loses the point. */
  weight: number;
  /**
   * Registry name for the legend icon, matching what `MEPF_DISCIPLINES` already
   * uses — so this section and the MEPF service page label the same discipline
   * with the same glyph without either importing from `lucide-react` directly.
   */
  icon: string;
}

/*
  Section geometry. Ground y=240, slabs y=170 and y=100, roof y=30; envelope
  x=70..520. The riser shaft is x=88..140, and each service takes its own lane
  inside it. Within a floor, services hang under the slab above at +14 / +22 /
  +30 / +38 — that offset order is the coordination order, not decoration.
*/
const SYSTEMS: System[] = [
  {
    key: 'hvac',
    icon: 'Fan',
    weight: 3.2,
    label: 'Mechanical · HVAC',
    detail: 'Heat load, ducting, ventilation',
    colour: '#2B4491',
    riser: 'M120 230 V44',
    branches: ['M120 44 H300', 'M120 114 H300', 'M120 184 H300'],
    terminals: [
      { x: 300, y: 44 },
      { x: 300, y: 114 },
      { x: 300, y: 184 },
    ],
  },
  {
    key: 'plumbing',
    icon: 'Droplets',
    weight: 2.4,
    label: 'Plumbing',
    detail: 'Supply, drainage, water heating',
    colour: '#026C97',
    riser: 'M108 22 V194',
    branches: ['M108 54 H362', 'M108 124 H362', 'M108 194 H362'],
    terminals: [
      { x: 362, y: 54 },
      { x: 362, y: 124 },
      { x: 362, y: 194 },
    ],
    flow: true,
  },
  {
    key: 'electrical',
    icon: 'Zap',
    weight: 1.9,
    label: 'Electrical',
    detail: 'Load design, distribution, lighting',
    colour: '#00AEEF',
    riser: 'M96 230 V64',
    branches: ['M96 64 H432', 'M96 134 H432', 'M96 204 H432'],
    terminals: [
      { x: 432, y: 64 },
      { x: 432, y: 134 },
      { x: 432, y: 204 },
    ],
    flow: true,
  },
  {
    key: 'fire',
    icon: 'FlameKindling',
    weight: 1.7,
    label: 'Fire Fighting',
    detail: 'Detection, sprinklers, hydrants',
    colour: '#D97706',
    riser: 'M132 230 V74',
    branches: ['M132 74 H492', 'M132 144 H492', 'M132 214 H492'],
    terminals: [
      { x: 492, y: 74 },
      { x: 492, y: 144 },
      { x: 492, y: 214 },
    ],
  },
];

/** The building itself — drawn first, and always faint. It is the stage, not the subject. */
const STRUCTURE = [
  'M40 240 H550',
  'M70 240 V30 H520 V240',
  'M70 100 H520',
  'M70 170 H520',
  'M76 238 H140 V212 H76 Z',
  'M96 30 V12 H130 V30',
];

/**
 * The terminal of each service run.
 *
 * ── One symbol set, not two ─────────────────────────────────────────────────
 * This used to draw purpose-made MEP fittings — a diffuser, an outlet, a
 * luminaire, a sprinkler head — while the legend below showed Lucide glyphs.
 * Authentic to a real drawing, but it meant the same discipline was marked two
 * different ways on one screen, and a reader has to learn both before either
 * helps. The legend glyph now terminates the run as well.
 *
 * The tinted disc behind it matches the legend chip, and does the work at sizes
 * where the glyph cannot: on a phone this drawing renders near 0.6 CSS px per
 * scene unit, so the icon becomes mush but the disc still reads as a terminal.
 *
 * Lucide is `stroke="currentColor"`, so the disc's group sets `color` rather
 * than `stroke` to tint it.
 */
function Terminal({ sys, x, y }: { sys: System; x: number; y: number }) {
  return (
    <g style={{ color: sys.colour }}>
      <circle cx={x} cy={y} r={7.5} fill={sys.colour} opacity={0.16} stroke="none" />
      <Icon name={sys.icon} x={x - 6.5} y={y - 6.5} width={13} height={13} />
    </g>
  );
}

export function BuildingSystems({ showLink = true }: { showLink?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  const draw = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { pathLength: 0, opacity: 0 },
    whileInView: reduced ? { opacity: 1 } : { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: '0px 0px -12% 0px' },
    transition: { duration: reduced ? 0.2 : 1.1, delay: reduced ? 0 : delay, ease: EASE },
  });

  return (
    <section className="section-sm">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--c-surface-2))] px-6 py-10 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm opacity-50 dark:bg-grid-blueprint dark:opacity-[0.09]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[110px]"
            aria-hidden
          />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Reveal>
                  <p className="overline">MEPF engineering</p>
                </Reveal>
                <h2 className="mt-3 text-display-sm">
                  <SplitText text="Four systems. One building." />
                </h2>
                <Reveal delay={0.15}>
                  <p className="mt-4 max-w-lead text-muted">
                    Every service runs through the same shaft and stacks in the same ceiling void — sized and
                    sequenced together, before anyone breaks ground.
                  </p>
                </Reveal>
              </div>
              {showLink && (
                <Reveal delay={0.2}>
                  <Link
                    to={ROUTES.service('mepf-consultancy')}
                    className="inline-flex shrink-0 items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
                  >
                    All four, designed in-house <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Reveal>
              )}
            </div>

            {/*
              Capped width, not `w-full`.

              The viewBox is 560×260, so stretching it across a 1440px container
              rendered the section drawing ~1400×650 — it dwarfed the copy, thinned
              every stroke, and pushed the legend so far down that its `whileInView`
              reveal never fired while the drawing was on screen. A section drawing
              wants to read at roughly its natural size.
            */}
            <div className="mx-auto mt-8 w-full max-w-[760px]">
            <svg
              viewBox="0 0 560 260"
              className="w-full overflow-visible"
              role="img"
              aria-label="Section through a three-storey building showing the mechanical, plumbing, electrical and fire-fighting services sharing one riser shaft"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Structure */}
              <g className="text-navy-800/30 dark:text-white/25" stroke="currentColor" strokeWidth={1.4}>
                {STRUCTURE.map((d, i) => (
                  <motion.path key={i} d={d} {...draw(i * 0.06)} />
                ))}
                {/* Riser shaft, dashed the way a section marks a void. */}
                <motion.path d="M88 240 V30" strokeDasharray="4 5" {...draw(0.36)} />
                <motion.path d="M140 240 V30" strokeDasharray="4 5" {...draw(0.4)} />
              </g>

              {/* Services */}
              {SYSTEMS.map((sys, si) => {
                const dim = active !== null && active !== sys.key;
                const lead = 0.5 + si * 0.12;
                return (
                  <g
                    key={sys.key}
                    stroke={sys.colour}
                    style={{ opacity: dim ? 0.12 : 1, transition: 'opacity .35s ease' }}
                  >
                    <motion.path d={sys.riser} strokeWidth={sys.weight + (active === sys.key ? 1 : 0)} {...draw(lead)} />
                    {sys.branches.map((d, i) => (
                      <motion.path key={i} d={d} strokeWidth={sys.weight + (active === sys.key ? 1 : 0)} {...draw(lead + 0.12 + i * 0.08)} />
                    ))}

                    {/* A travelling dash, so the live services read as carrying something. */}
                    {sys.flow && !reduced && !dim && (
                      <path d={sys.riser} strokeWidth={sys.weight} strokeDasharray="5 24" className="systems-flow" style={{ animationDelay: `${lead + 1.2}s` }} />
                    )}

                    {sys.terminals.map((t, i) => (
                      <motion.g
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: reduced ? 0 : lead + 0.7 + i * 0.06, ease: EASE }}
                        style={{ transformOrigin: `${t.x}px ${t.y}px` }}
                      >
                        <Terminal sys={sys} x={t.x} y={t.y} />
                      </motion.g>
                    ))}
                  </g>
                );
              })}
            </svg>
            </div>

            {/*
              The legend is the control, not a caption. Buttons rather than divs so
              isolating a service works from the keyboard and from a tap, not only
              from a hover a phone can never produce.
            */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SYSTEMS.map((sys, i) => (
                <Reveal key={sys.key} delay={0.6 + i * 0.08}>
                  <button
                    type="button"
                    aria-pressed={active === sys.key}
                    onMouseEnter={() => setActive(sys.key)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(sys.key)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive((a) => (a === sys.key ? null : sys.key))}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all duration-300',
                      active === sys.key
                        ? 'border-transparent bg-[rgb(var(--c-surface))] shadow-sm'
                        : 'border-transparent hover:bg-[rgb(var(--c-surface))]/60',
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${sys.colour}1A`, color: sys.colour }}
                      >
                        <Icon name={sys.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="font-display text-heading-md font-semibold">{sys.label}</span>
                    </span>
                    <span className="mt-1.5 block text-caption leading-relaxed text-muted">{sys.detail}</span>
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

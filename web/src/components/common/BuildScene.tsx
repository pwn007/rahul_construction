import { memo } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * A construction site that draws itself as the loader fills.
 *
 * The scene is tied to real progress rather than looping on a timer: at 0% there
 * is bare ground, and by 100% the frame is topped out, scaffolded and craned.
 * A visitor waiting for the site to load watches a building go up — which is
 * both the most on-brand thing this moment could do and an honest progress
 * indicator, since every element maps to a percentage.
 *
 * Drawn in the same idiom as the MEPF glyphs in LivingSystems: thin strokes on a
 * dark ground, revealed with `pathLength` so lines appear to be drawn rather
 * than switched on. `pathLength={1}` normalises every path to unit length, so a
 * single dash offset reveals them all at the same rate regardless of their real
 * geometry.
 *
 * Deliberately line-art rather than emoji or an illustration: emoji render
 * differently on every platform, cannot take the brand colour, and sit badly
 * next to a wordmark. This costs ~2 KB, inherits `currentColor`, and degrades to
 * a finished static drawing under `prefers-reduced-motion`.
 *
 * The worker is choreographed to the build rather than idling beside it: he
 * walks on, surveys the ground, rides the frame up fixing each slab as it
 * lands, signals the crane from the roof, climbs back down the scaffold and
 * steps away to look at what he made. He is drawn once around an origin between
 * his feet and posed by joint rotation, so every beat interpolates into the
 * next instead of snapping.
 */

interface Part {
  d: string;
  /** Percentage of the loader at which this part starts to draw. */
  at: number;
  /** Heavier stroke for primary structure. */
  bold?: boolean;
  faint?: boolean;
}

/* Ground at y=130. Building footprint x=68..152. Crane to the right. */
const PARTS: Part[] = [
  { d: 'M8 130 H232', at: 0, bold: true },

  // Excavation marks, then the plinth
  { d: 'M14 135 l4 -4 M24 135 l4 -4 M34 135 l4 -4', at: 4, faint: true },
  { d: 'M68 130 V124 H152 V130', at: 8, bold: true },

  // Column grid rising off the plinth
  { d: 'M74 124 V110 M110 124 V110 M146 124 V110', at: 16 },
  // First slab
  { d: 'M66 110 H154', at: 26, bold: true },

  { d: 'M74 110 V94 M110 110 V94 M146 110 V94', at: 34 },
  { d: 'M66 94 H154', at: 44, bold: true },

  { d: 'M74 94 V78 M110 94 V78 M146 94 V78', at: 52 },
  { d: 'M66 78 H154', at: 62, bold: true },

  // Openings — the building stops reading as a ladder once it has windows
  { d: 'M84 122 V114 H100 V122 M120 122 V114 H136 V122', at: 68, faint: true },
  { d: 'M84 106 V98 H100 V106 M120 106 V98 H136 V106', at: 72, faint: true },

  // Scaffold against the left face
  { d: 'M58 130 V74 M62 130 V74', at: 78, faint: true },
  { d: 'M58 116 H66 M58 100 H66 M58 84 H66', at: 82, faint: true },

  // Crane: mast, jib, counter-jib
  { d: 'M196 130 V44', at: 86, bold: true },
  { d: 'M196 130 l-6 0 M196 130 l6 0', at: 86, faint: true },
  { d: 'M170 44 H224', at: 90, bold: true },
  { d: 'M196 34 L176 44 M196 34 L218 44', at: 92, faint: true },

  // Hook and its load, hanging over the new roof
  { d: 'M180 44 V57', at: 94, bold: true },
  { d: 'M172.5 57 H187.5 V64.5 H172.5 Z', at: 96, bold: true },
];

const REVEAL_SPAN = 12; // percentage points over which a part finishes drawing

/* -------------------------------------------------------------------- */
/* The worker                                                            */
/* -------------------------------------------------------------------- */

/**
 * A pose is six joint angles in degrees rather than a set of alternative path
 * drawings. Because they are numbers, two adjacent beats can be blended, so the
 * worker eases from one attitude into the next instead of popping between
 * frames — which is the whole difference between a character and a flipbook.
 *
 * Angles follow SVG's sense: positive rotates clockwise on screen. He is drawn
 * facing right, so a limb swinging forward takes a negative angle.
 */
interface Pose {
  /** Working arm, about the shoulder. */
  armF: number;
  /** Steadying arm, about the shoulder. */
  armB: number;
  /** Leading leg, about the hip. */
  legF: number;
  /** Trailing leg, about the hip. */
  legB: number;
  /** Head tilt, about the neck. */
  head: number;
  /** Torso lean, about the hip. */
  lean: number;
  /** Hammer in hand, and the working arm loops its strike. */
  hammer?: boolean;
  /** Legs loop the walk cycle and the body bobs. */
  stride?: boolean;
}

type PoseName = 'walk' | 'survey' | 'hammer' | 'climb' | 'guide' | 'lookUp';

/**
 * No pose raises a hand above the head, and that is a geometric constraint
 * rather than a stylistic one: the arm is 7 units long from a shoulder at
 * -14.5, so its reach tops out at -21.5 — barely past the brim at -20.5, and
 * well inside the hat's ±6.9 width. Anything "raised" therefore disappears into
 * the helmet silhouette. Every gesture here works forward from the shoulder
 * instead, where it has clear air, and the head tilt carries the direction of
 * attention that the arm cannot.
 */
const POSES: Record<PoseName, Pose> = {
  walk:   { armF: -22,  armB:  22, legF: -14, legB: 14, head:   0, lean:  3, stride: true },
  // Gesturing out over the plot, head down: reading the ground.
  survey: { armF: -62,  armB:  14, legF: -18, legB: 18, head:  10, lean:  4 },
  hammer: { armF: -75,  armB: -35, legF: -22, legB: 16, head:  10, lean: 10, hammer: true },
  // Both hands forward at different heights — a ladder grip.
  climb:  { armF: -110, armB: -55, legF: -34, legB: 10, head:  -8, lean:  8, stride: true },
  // Banksman's signal: arm out just above horizontal, head up at the jib.
  guide:  { armF: -105, armB:  26, legF: -16, legB: 14, head: -16, lean: -4 },
  lookUp: { armF:  18,  armB:  26, legF: -20, legB: 18, head: -22, lean: -7 },
};

interface Beat {
  /** Progress percentage at which he reaches this mark. */
  at: number;
  /** Where his feet land. Ground y=130, plinth y=124, slabs y=110/94/78. */
  x: number;
  y: number;
  pose: PoseName;
  /** 1 faces right, -1 faces left. */
  facing: 1 | -1;
}

/**
 * The choreography. Ordered ascending by `at` — `workerAt` relies on it.
 *
 * He arrives before each slab rather than after it: he is on the plinth
 * hammering at 24% and the first slab lands at 26%, so the building reads as
 * something he is making, not something happening beside him.
 */
const BEATS: Beat[] = [
  { at: 0,     x:  8, y: 130, pose: 'walk',   facing:  1 }, // on from the left
  { at: 9,     x: 36, y: 130, pose: 'survey', facing:  1 }, // sizing up the plinth (8%)
  { at: 15,    x: 62, y: 130, pose: 'walk',   facing:  1 },
  { at: 20,    x: 78, y: 124, pose: 'walk',   facing:  1 }, // up onto the plinth
  { at: 24,    x: 88, y: 124, pose: 'hammer', facing:  1 }, // slab 1 lands at 26%
  { at: 32,    x: 88, y: 124, pose: 'hammer', facing:  1 },
  { at: 36,    x: 92, y: 110, pose: 'climb',  facing:  1 }, // up onto slab 1
  { at: 42,    x: 98, y: 110, pose: 'hammer', facing:  1 }, // slab 2 lands at 44%
  { at: 50,    x: 98, y: 110, pose: 'hammer', facing:  1 },
  { at: 54,    x:102, y:  94, pose: 'climb',  facing:  1 }, // up onto slab 2
  { at: 60,    x:110, y:  94, pose: 'hammer', facing:  1 }, // slab 3 lands at 62%
  { at: 68,    x:110, y:  94, pose: 'hammer', facing:  1 },
  { at: 76,    x: 80, y:  94, pose: 'walk',   facing: -1 }, // back across, openings drawing
  { at: 80,    x: 64, y:  94, pose: 'climb',  facing: -1 }, // onto the scaffold (78%)
  { at: 84,    x: 64, y:  78, pose: 'climb',  facing: -1 },
  { at: 88,    x: 72, y:  78, pose: 'guide',  facing:  1 }, // banksman on the roof, crane at 86%
  { at: 93,    x: 76, y:  78, pose: 'guide',  facing:  1 }, // signalling the hook down (94/96%)
  { at: 97,    x: 60, y: 120, pose: 'climb',  facing: -1 }, // down the scaffold
  { at: 98.5,  x: 54, y: 130, pose: 'walk',   facing: -1 },
  { at: 100,   x: 34, y: 130, pose: 'lookUp', facing:  1 }, // steps back and looks up
];

const mix = (a: number, b: number, f: number) => a + (b - a) * f;
/** Smoothstep, not the house ease-out: locomotion wants softened departures as
 *  well as arrivals, or he lurches away from every mark he reaches. */
const smooth = (t: number) => t * t * (3 - 2 * t);

function workerAt(progress: number) {
  let i = 0;
  while (i < BEATS.length - 1 && progress >= BEATS[i + 1].at) i += 1;
  const a = BEATS[i];
  const b = BEATS[i + 1] ?? a;
  const span = b.at - a.at;
  const f = span > 0 ? smooth(Math.max(0, Math.min(1, (progress - a.at) / span))) : 0;
  const pa = POSES[a.pose];
  const pb = POSES[b.pose];
  // Booleans cannot be blended, so they take the nearer beat's value — which
  // also widens each hammer window across half of the approach and departure.
  const near = f < 0.5 ? pa : pb;

  return {
    x: mix(a.x, b.x, f),
    y: mix(a.y, b.y, f),
    // Lerped through zero, so a turn plays as a quick pivot rather than a flip.
    facing: mix(a.facing, b.facing, f),
    armF: mix(pa.armF, pb.armF, f),
    armB: mix(pa.armB, pb.armB, f),
    legF: mix(pa.legF, pb.legF, f),
    legB: mix(pa.legB, pb.legB, f),
    head: mix(pa.head, pb.head, f),
    lean: mix(pa.lean, pb.lean, f),
    hammer: near.hammer === true,
    stride: near.stride === true,
  };
}

export const BuildScene = memo(function BuildScene({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const w = workerAt(reduced ? 100 : progress);

  /*
    Phase for the hammer strike, the walk cycle and the dust — read from the
    clock in render rather than driven by CSS keyframes. Two reasons: a CSS
    `transform` silently overrides the SVG `transform` attribute carrying the
    pose on the same element, and `transform-origin` on an SVG group still
    resolves differently across Safari versions. This component already
    re-renders on every animation frame (the preloader pushes a fresh
    `progress` each rAF tick), so sampling the clock is free, and every loop
    stops the instant progress does.
  */
  const now = reduced ? 0 : performance.now();

  // Strike: a fast fall onto the work, a slower lift back. Kept short (300ms)
  // because the ease-out on `progress` gives each hammer stop barely more.
  let strike = 0;
  if (w.hammer && !reduced) {
    const c = (now % 300) / 300;
    strike = c < 0.42 ? -30 + 50 * Math.pow(c / 0.42, 0.6) : 20 - 50 * Math.pow((c - 0.42) / 0.58, 1.6);
  }

  const step = w.stride && !reduced ? Math.sin((now / 340) * Math.PI * 2) : 0;
  const legSwing = step * 20;
  const armCounter = step * 12;
  // Half a unit of vertical bob at twice the step rate. Any more reads as a limp.
  const bob = w.stride && !reduced ? -Math.abs(Math.sin((now / 340) * Math.PI * 2)) * 0.55 : 0;

  return (
    <svg
      viewBox="0 0 240 150"
      className={cn('w-full overflow-visible', className)}
      role="img"
      aria-label="A construction site being built"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PARTS.map((part, i) => {
        // 0 → not started, 1 → fully drawn.
        const t = reduced ? 1 : Math.max(0, Math.min(1, (progress - part.at) / REVEAL_SPAN));
        return (
          <path
            key={i}
            d={part.d}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - t}
            strokeWidth={part.bold ? 1.9 : 1.3}
            className={part.faint ? 'text-cyan-500/45' : 'text-cyan-400'}
            stroke="currentColor"
            style={{ transition: reduced ? 'none' : 'stroke-dashoffset .25s linear', opacity: t > 0 ? 1 : 0 }}
          />
        );
      })}

      {/*
        The worker. Present from the first frame — the site is never empty.

        The hard hat *is* the head: at this scale a separate head circle under a
        helmet arc collapses into an unreadable blob. Dome plus brim reads as a
        person in a helmet instantly, which is the whole point.

        Drawn once in a local space whose origin sits between his feet, then
        placed with a single translate — that is what makes him movable at all.
        Every joint uses SVG's three-argument `rotate(deg cx cy)`, which pivots
        about a point without shifting the coordinate system underneath it, so
        no limb needs its own nested translate and none of this depends on
        `transform-box` (still inconsistent across Safari versions).
      */}
      <g
        transform={`translate(${(w.x).toFixed(2)} ${(w.y + bob).toFixed(2)}) scale(${w.facing.toFixed(3)} 1)`}
        opacity={Math.min(1, progress / 6).toFixed(2)}
        className="text-white"
        stroke="currentColor"
        strokeWidth={1.7}
      >
        {/* Dust kicked up under him, only while he is actually moving. */}
        {w.stride && !reduced && (
          <g fill="currentColor" stroke="none" className="text-cyan-300/60">
            {[0, 0.5].map((offset, i) => {
              const c = (now / 900 + offset) % 1;
              return (
                <circle
                  key={i}
                  cx={-5 - c * 8}
                  cy={-c * 7}
                  r={0.95 - c * 0.35}
                  opacity={Math.sin(c * Math.PI) * 0.9}
                />
              );
            })}
          </g>
        )}

        {/* Legs hang off the hip and are not carried by the torso lean. */}
        <g transform={`rotate(${(w.legB + legSwing).toFixed(2)} 0 -7.5)`}>
          <path d="M0 -7.5 V0" />
        </g>
        <g transform={`rotate(${(w.legF - legSwing).toFixed(2)} 0 -7.5)`}>
          <path d="M0 -7.5 V0" />
        </g>

        {/* Everything above the hip leans as one piece. */}
        <g transform={`rotate(${w.lean.toFixed(2)} 0 -7.5)`}>
          <path d="M0 -7.5 V-16.5" />

          <g transform={`rotate(${(w.armB + armCounter).toFixed(2)} 0 -14.5)`}>
            <path d="M0 -14.5 V-7.5" />
          </g>

          <g transform={`rotate(${w.head.toFixed(2)} 0 -16.5)`}>
            <path d="M0 -16.5 V-20.5" />
            <path d="M-6.9 -20.5 H6.9" />
            <path d="M-4.7 -20.5 a4.7 4.4 0 0 1 9.4 0" />
          </g>

          {/* Working arm, last so the hammer sits over the torso. */}
          <g transform={`rotate(${(w.armF + strike - armCounter).toFixed(2)} 0 -14.5)`}>
            <path d="M0 -14.5 V-7.5" />
            {/* Kept mounted and faded rather than unmounted — a hammer that
                appears mid-swing pops, one that fades in does not. */}
            <path
              d="M-3 -9 L3 -6"
              strokeWidth={2.8}
              style={{ opacity: w.hammer ? 1 : 0, transition: reduced ? 'none' : 'opacity .18s linear' }}
            />
          </g>
        </g>
      </g>
    </svg>
  );
});

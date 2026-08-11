/**
 * The site worker — a reusable character rig.
 *
 * Lifted out of `BuildScene` so the preloader and the home hero can share one
 * figure instead of maintaining two copies of the same anatomy. Nothing here is
 * scene-specific: a caller supplies its own `Beat[]` choreography and its own
 * colours, and gets back a posed, walking, hammering worker.
 *
 * He is drawn once around an origin between his feet and posed by joint
 * rotation, so every beat interpolates into the next instead of snapping.
 */

/**
 * A pose is six joint angles in degrees rather than a set of alternative path
 * drawings. Because they are numbers, two adjacent beats can be blended, so the
 * worker eases from one attitude into the next instead of popping between
 * frames — which is the whole difference between a character and a flipbook.
 *
 * Angles follow SVG's sense: positive rotates clockwise on screen. He is drawn
 * facing right, so a limb swinging forward takes a negative angle.
 */
export interface Pose {
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

export type PoseName = 'walk' | 'survey' | 'hammer' | 'climb' | 'guide' | 'lookUp' | 'carry' | 'lift';

/**
 * No pose raises a hand above the head, and that is a geometric constraint
 * rather than a stylistic one: the arm is 7 units long from a shoulder at
 * -14.5, so its reach tops out at -21.5 — barely past the brim at -20.5, and
 * well inside the hat's ±6.9 width. Anything "raised" therefore disappears into
 * the helmet silhouette. Every gesture here works forward from the shoulder
 * instead, where it has clear air, and the head tilt carries the direction of
 * attention that the arm cannot.
 */
export const POSES: Record<PoseName, Pose> = {
  walk:   { armF: -22,  armB:  22, legF: -14, legB: 14, head:   0, lean:  3, stride: true },
  // Gesturing out over the plot, head down: reading the ground.
  survey: { armF: -62,  armB:  14, legF: -18, legB: 18, head:  10, lean:  4 },
  hammer: { armF: -75,  armB: -35, legF: -22, legB: 16, head:  10, lean: 10, hammer: true },
  // Both hands forward at different heights — a ladder grip.
  climb:  { armF: -110, armB: -55, legF: -34, legB: 10, head:  -8, lean:  8, stride: true },
  // Banksman's signal: arm out just above horizontal, head up at the jib.
  guide:  { armF: -105, armB:  26, legF: -16, legB: 14, head: -16, lean: -4 },
  lookUp: { armF:  18,  armB:  26, legF: -20, legB: 18, head: -22, lean: -7 },
  // Both arms down and forward, torso tipped back against the weight in front.
  carry:  { armF: -46,  armB: -38, legF: -16, legB: 16, head:   4, lean: -6, stride: true },
  // Setting a load down: deep lean, both arms low.
  lift:   { armF: -30,  armB: -24, legF: -26, legB: 22, head:  14, lean: 22 },
};

export interface Beat {
  /** Progress percentage at which he reaches this mark. */
  at: number;
  /** Where his feet land. */
  x: number;
  y: number;
  pose: PoseName;
  /** 1 faces right, -1 faces left. */
  facing: 1 | -1;
}

export const mix = (a: number, b: number, f: number) => a + (b - a) * f;

/** Smoothstep, not the house ease-out: locomotion wants softened departures as
 *  well as arrivals, or he lurches away from every mark he reaches. */
export const smooth = (t: number) => t * t * (3 - 2 * t);

export interface WorkerState {
  x: number;
  y: number;
  facing: number;
  armF: number;
  armB: number;
  legF: number;
  legB: number;
  head: number;
  lean: number;
  hammer: boolean;
  stride: boolean;
}

/**
 * Blend the two beats bracketing `progress` into a single pose.
 *
 * `beats` must be ordered ascending by `at` — the scan below relies on it.
 */
export function workerAt(beats: Beat[], progress: number): WorkerState {
  let i = 0;
  while (i < beats.length - 1 && progress >= beats[i + 1]!.at) i += 1;
  const a = beats[i]!;
  const b = beats[i + 1] ?? a;
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

/**
 * The worker himself.
 *
 * The hard hat *is* the head: at this scale a separate head circle under a
 * helmet arc collapses into an unreadable blob. Dome plus brim reads as a
 * person in a helmet instantly, which is the whole point.
 *
 * Drawn once in a local space whose origin sits between his feet, then placed
 * with a single translate — that is what makes him movable at all. Every joint
 * uses SVG's three-argument `rotate(deg cx cy)`, which pivots about a point
 * without shifting the coordinate system underneath it, so no limb needs its
 * own nested translate and none of this depends on `transform-box` (still
 * inconsistent across Safari versions).
 *
 * `now` is passed in rather than read here so that every figure in a scene
 * samples the *same* instant — two workers reading the clock independently
 * would drift apart by a frame and their walk cycles would beat against each
 * other.
 */
export function Worker({
  state,
  now,
  reduced,
  opacity = 1,
  className = 'text-white',
  dustClassName = 'text-cyan-300/60',
  strokeWidth = 1.7,
  scale = 1,
  stroke = 'currentColor',
}: {
  state: WorkerState;
  /** `performance.now()` sampled once by the parent, or 0 under reduced motion. */
  now: number;
  reduced: boolean;
  opacity?: number | string;
  className?: string;
  dustClassName?: string;
  strokeWidth?: number;
  /** Uniform scale, for figures standing further back in a wide scene. */
  scale?: number;
  /**
   * Overridable so a scene can hand him a `url(#…)` paint server. The hero runs
   * every stroke through one vertical gradient, so the worker has to change
   * colour with his height up the frame like everything else does.
   */
  stroke?: string;
}) {
  const w = state;

  /*
    Phase for the hammer strike, the walk cycle and the dust — derived from the
    clock rather than driven by CSS keyframes. Two reasons: a CSS `transform`
    silently overrides the SVG `transform` attribute carrying the pose on the
    same element, and `transform-origin` on an SVG group still resolves
    differently across Safari versions. The parent re-renders every animation
    frame, so sampling the clock is free, and every loop stops the instant the
    parent's clock does.
  */

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
    <g
      transform={`translate(${w.x.toFixed(2)} ${(w.y + bob).toFixed(2)}) scale(${(w.facing * scale).toFixed(3)} ${scale})`}
      opacity={opacity}
      className={className}
      stroke={stroke}
      strokeWidth={strokeWidth}
    >
      {/* Dust kicked up under him, only while he is actually moving. */}
      {w.stride && !reduced && (
        <g fill="currentColor" stroke="none" className={dustClassName}>
          {[0, 0.5].map((offset, i) => {
            const c = (now / 900 + offset) % 1;
            return <circle key={i} cx={-5 - c * 8} cy={-c * 7} r={0.95 - c * 0.35} opacity={Math.sin(c * Math.PI) * 0.9} />;
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
  );
}

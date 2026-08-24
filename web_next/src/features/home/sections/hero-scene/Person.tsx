'use client';

import { BAND, CYAN, HAIR, HIVIS, HIVIS_LIGHT, NAVY, PAPER, SAND, SKIN } from './palette';

/**
 * A person, built from filled shapes.
 *
 * ── Why this replaces the stick rig ─────────────────────────────────────────
 * The previous figure was five 1.7px strokes. It was elegant and it was also
 * unreadable at hero scale: a thin outline is a person only to someone already
 * expecting one. This one is solid — hard hat, hi-vis vest with reflective
 * bands, sleeves, denim, boots — because those are the objects that make a
 * drawing say "construction site" before anybody has decided to look properly.
 *
 * ── The local space ─────────────────────────────────────────────────────────
 * Drawn once around an origin **between the feet**, growing upward into negative
 * y, roughly 101 units tall to the crown of the hat. Callers place a figure with
 * a single `translate(x y) scale(s)` and never think about its internals. Facing
 * is a negative x-scale, so one drawing serves both directions.
 *
 *      -101 ▁▁▁   hard hat dome
 *       -91 ▔▔▔   brim, just above the brows
 *       -87  ◍    head + face
 *       -76 ▟█▙   shoulders · vest starts
 *       -46 ▐▐    hip · legs start
 *         0 ▬▬    boots on the ground line
 *
 * Every joint uses SVG's three-argument `rotate(deg cx cy)`, which pivots about
 * a point without shifting the coordinate system under it — so no limb needs a
 * nested translate, and none of this depends on `transform-box`, which still
 * resolves differently across Safari versions.
 */

/** Waist-up geometry the whole figure is hung off. Change these, not the paths. */
const SHOULDER_Y = -73;
const HIP_Y = -46;
const HEAD_Y = -87;
const HEAD_R = 8.2;

export type Role = 'worker' | 'architect' | 'client';
export type Prop = 'clipboard' | 'roll' | 'hammer' | 'trowel' | 'key' | 'none';

export interface Pose {
  /** Forward arm, about its shoulder. Negative swings it forward. */
  armF: number;
  /** Rear arm, about its shoulder. */
  armB: number;
  /** Forward leg, about the hip. */
  legF: number;
  /** Rear leg, about the hip. */
  legB: number;
  /** Torso lean, about the hip. Everything above the waist goes with it. */
  lean: number;
  /** Head tilt, about the neck. */
  head: number;
}

/**
 * The poses the scene needs, and only those.
 *
 * A pose is angles rather than alternative drawings, so a figure can be nudged
 * per frame — an architect's arm can drift as she talks over a plan without a
 * second copy of the architect.
 */
export const POSES = {
  /** Arm out and low, indicating something on a table in front of them. */
  point: { armF: -62, armB: 12, legF: -4, legB: 6, lean: 6, head: 12 },
  /** Both hands up at chest, holding a clipboard or a plan. */
  hold: { armF: -78, armB: -64, legF: -5, legB: 5, lean: 2, head: 8 },
  /** Bent to an eyepiece: deep lean, near arm up to the instrument. */
  survey: { armF: -96, armB: -30, legF: -14, legB: 12, lean: 16, head: 20 },
  /** Mid-swing. The strike itself is a loop added on top of `armF`. */
  hammer: { armF: -58, armB: -22, legF: -16, legB: 14, lean: 12, head: 14 },
  /*
    Bricklaying: leaning into the work, trowel hand landing just above the wall's
    top course, back hand steadying the brick. The deep lean is what separates
    it from `hammer` — a mason works *down* onto a course, not out at a column.
  */
  lay: { armF: -58, armB: -26, legF: -12, legB: 10, lean: 14, head: 16 },
  /** Standing, weight even, arms relaxed. */
  stand: { armF: -8, armB: 8, legF: -3, legB: 3, lean: 0, head: 0 },
  /** Offering something forward at chest height — the key handover. */
  offer: { armF: -84, armB: 14, legF: -4, legB: 4, lean: 3, head: 6 },
  /** Reaching to take it, both hands slightly forward. */
  receive: { armF: -74, armB: -40, legF: -4, legB: 4, lean: 2, head: 4 },
  /** Arm raised in greeting — only legible on a bare head, see `hat` below. */
  wave: { armF: -152, armB: 16, legF: -4, legB: 4, lean: -2, head: -4 },
  /*
    Warm and open, for someone watching something good happen rather than doing
    anything. `stand` has both arms straight down and reads as a mannequin, and
    `receive` on a second person would look like two adults grabbing at the same
    key.
  */
  pleased: { armF: -40, armB: -22, legF: -4, legB: 4, lean: -1, head: 3 },
} as const satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

interface Kit {
  hat: 'hivis' | 'white' | 'none';
  vest: boolean;
  sleeve: string;
  trouser: string;
  boot: string;
}

/**
 * What each role wears.
 *
 * The client wears no hat and no vest on purpose. They are the one person in the
 * scene who does not work here, and the fastest way to say so is to take the
 * safety gear off them — which is also what makes the handover read as a
 * handover rather than as two colleagues talking.
 */
const KIT: Record<Role, Kit> = {
  worker: { hat: 'hivis', vest: true, sleeve: NAVY[600], trouser: NAVY[700], boot: SAND[500] },
  architect: { hat: 'white', vest: true, sleeve: CYAN[600], trouser: NAVY[800], boot: NAVY[900] },
  client: { hat: 'none', vest: false, sleeve: CYAN[500], trouser: NAVY[600], boot: NAVY[900] },
};

/** A limb: a capsule hanging from its pivot, with a hand or a boot on the end. */
function Limb({ length, width, fill, cap }: { length: number; width: number; fill: string; cap?: React.ReactNode }) {
  return (
    <>
      <rect x={-width / 2} y={0} width={width} height={length} rx={width / 2} fill={fill} />
      {cap}
    </>
  );
}

/**
 * Whatever is in the forward hand.
 *
 * `arm` is the angle that hand is currently swung to, and only the key uses it:
 * a hammer or a clipboard should turn with the wrist, but a key being *offered*
 * has to stay level. Held rigidly to the arm it rotated with it and ended up
 * pointing at the sky, which reads as someone holding a trophy rather than
 * handing over a house.
 */
function PropShape({ prop, arm }: { prop: Prop; arm: number }) {
  switch (prop) {
    case 'clipboard':
      // Held flat against the forearm, board out, so it reads as a board rather
      // than as a block: the paper is paler than the clip that holds it.
      return (
        <g transform="translate(3 22) rotate(-16)">
          <rect x={-7} y={-10} width={14} height={19} rx={1.5} fill={NAVY[700]} />
          <rect x={-5.5} y={-8.5} width={11} height={16} rx={1} fill={PAPER} />
          <rect x={-3} y={-11} width={6} height={3} rx={1} fill={CYAN[600]} />
        </g>
      );
    case 'roll':
      // A rolled drawing under the arm.
      return (
        <g transform="translate(2 22) rotate(-70)">
          <rect x={-2.5} y={-11} width={5} height={22} rx={2.5} fill={PAPER} />
          <rect x={-2.5} y={-2} width={5} height={4} fill={CYAN[300]} />
        </g>
      );
    case 'hammer':
      return (
        <g transform="translate(1 24) rotate(-24)">
          <rect x={-1.4} y={-9} width={2.8} height={13} rx={1.4} fill={SAND[500]} />
          <rect x={-5} y={-12} width={10} height={4.5} rx={1.5} fill={NAVY[700]} />
        </g>
      );
    case 'trowel':
      // Blade forward and flat, handle back along the wrist. The triangle is the
      // whole recognition: a rectangle in a mason's hand is a brick, a triangle
      // is a trowel, and the scene needs both to be legible at once.
      return (
        <g transform="translate(2 24) rotate(-14)">
          <path d="M0 -2 L13 -5.5 L13 1.5 Z" fill={NAVY[200]} />
          <rect x={-5} y={-3.4} width={6} height={2.8} rx={1.4} fill={SAND[500]} />
        </g>
      );
    case 'key':
      // Deliberately oversized. A key drawn at true scale is four pixels of
      // nothing; this one has to be legible as *the* key from across the hero,
      // because it is the single image that says "delivered".
      return (
        <g transform={`translate(2 23) rotate(${(-arm - 74).toFixed(1)})`}>
          <circle cx={0} cy={0} r={3.6} fill={GOLD} />
          <circle cx={0} cy={0} r={1.5} fill={PAPER} />
          <rect x={2.6} y={-1.2} width={9} height={2.4} rx={1} fill={GOLD} />
          <rect x={8} y={0.6} width={2} height={3} rx={0.8} fill={GOLD} />
          <rect x={10.6} y={0.6} width={2} height={3} rx={0.8} fill={GOLD} />
        </g>
      );
    default:
      return null;
  }
}

/** Brass, and the only place it appears. */
const GOLD = '#E7A33C';

export function Person({
  x,
  y,
  scale = 1,
  facing = 1,
  role = 'worker',
  pose,
  skin = 0,
  prop = 'none',
  face = true,
  hair: hairLength = 'short',
  top,
  opacity,
}: {
  x: number;
  y: number;
  scale?: number;
  facing?: 1 | -1;
  role?: Role;
  pose: Pose;
  /** Index into `SKIN` — vary it across a group or they read as clones. */
  skin?: 0 | 1 | 2;
  prop?: Prop;
  /** Eyes and a smile. Worth switching off below ~50px, where they turn to mud. */
  face?: boolean;
  /**
   * Only meaningful on a bare head.
   *
   * Length is the cue rather than a skirt, because it needs no new body parts —
   * every member of the family stays built from the same pieces as everyone
   * else in the scene, which is what keeps a cast of seven looking like one
   * drawing.
   */
  hair?: 'short' | 'long';
  /**
   * Overrides the kit's garment colour.
   *
   * Three clients in one blue read as a single person printed three times. This
   * exists so a family can be three people.
   */
  top?: string;
  opacity?: number | string;
}) {
  const kit = { ...KIT[role], sleeve: top ?? KIT[role].sleeve };
  const tone = SKIN[skin];
  const hair = HAIR[skin];
  const hatFill = kit.hat === 'white' ? PAPER : HIVIS;
  const vestFill = role === 'architect' ? HIVIS_LIGHT : HIVIS;

  const boot = <rect x={-4.5} y={38} width={12} height={8} rx={2.5} fill={kit.boot} />;
  const hand = <circle cx={0} cy={25} r={4} fill={tone} />;

  return (
    <g transform={`translate(${x} ${y}) scale(${facing * scale} ${scale})`} opacity={opacity}>
      {/* Rear leg and rear arm first, in a darker value, so the figure has a
          front and a back without needing a single outline. */}
      <g transform={`rotate(${pose.legB.toFixed(1)} 0 ${HIP_Y})`}>
        <g transform={`translate(-2 ${HIP_Y})`}>
          <Limb length={40} width={9} fill={NAVY[800]} cap={<rect x={-4.5} y={38} width={12} height={8} rx={2.5} fill={kit.boot} />} />
        </g>
      </g>
      <g transform={`rotate(${pose.legF.toFixed(1)} 0 ${HIP_Y})`}>
        <g transform={`translate(2.5 ${HIP_Y})`}>
          <Limb length={40} width={9} fill={kit.trouser} cap={boot} />
        </g>
      </g>

      {/* Everything above the hip leans as one piece. */}
      <g transform={`rotate(${pose.lean.toFixed(1)} 0 ${HIP_Y})`}>
        {/* Rear arm, behind the torso. */}
        <g transform={`rotate(${pose.armB.toFixed(1)} -7.5 ${SHOULDER_Y})`}>
          <g transform={`translate(-7.5 ${SHOULDER_Y})`}>
            <Limb length={24} width={7} fill={NAVY[800]} cap={<><circle cx={0} cy={25} r={4} fill={tone} /><circle cx={0} cy={25} r={4} fill={NAVY[900]} opacity={0.22} /></>} />
          </g>
        </g>

        {/* Torso: shirt, then the vest over it. The V-notch at the collar is what
            stops the vest reading as a bib — it is the detail that makes the
            silhouette specifically a *vest*. */}
        <rect x={-13} y={SHOULDER_Y - 3} width={26} height={31} rx={6} fill={kit.sleeve} />
        {kit.vest && (
          <>
            <rect x={-11.5} y={SHOULDER_Y} width={23} height={27} rx={3.5} fill={vestFill} />
            <path d={`M-3.4 ${SHOULDER_Y} L0 ${SHOULDER_Y + 6.5} L3.4 ${SHOULDER_Y} Z`} fill={kit.sleeve} />
            {/* Retroreflective bands. Two, low on the vest, as they sit in life. */}
            <rect x={-11.5} y={SHOULDER_Y + 14} width={23} height={2.8} fill={BAND} />
            <rect x={-11.5} y={SHOULDER_Y + 19.5} width={23} height={2.8} fill={BAND} />
          </>
        )}

        {/* Neck. */}
        <rect x={-3} y={-80} width={6} height={6} fill={tone} />

        <g transform={`rotate(${pose.head.toFixed(1)} 0 -78)`}>
          {kit.hat === 'none' && hairLength === 'long' && (
            // Behind the head, so the face still sits on top of it. Falls to
            // about the shoulder on both sides — at hero scale that silhouette
            // change is what does the work, not any detail inside it.
            <path
              d={`M-9.4 ${HEAD_Y} a9.4 9.4 0 0 1 18.8 0 v13 q0 3 -3 3 t-3 -3 v-8 a9 9 0 0 1 -9.8 0 v8 q0 3 -3 3 t-3 -3 Z`}
              fill={hair}
            />
          )}
          <circle cx={0} cy={HEAD_Y} r={HEAD_R} fill={tone} />
          {kit.hat === 'none' && (
            // Hair as the crown of the head, plus a short sweep at the back —
            // enough to read as "not wearing safety gear", which is this
            // character's entire job in the picture.
            <>
              <path d={`M-${HEAD_R} ${HEAD_Y} a${HEAD_R} ${HEAD_R} 0 0 1 ${HEAD_R * 2} 0 Z`} fill={hair} />
              <path d={`M-${HEAD_R} ${HEAD_Y} q-2 6 1 9 l3 -2 q-2.5 -3 -1 -7 Z`} fill={hair} />
            </>
          )}
          {face && (
            <>
              <circle cx={2.2} cy={HEAD_Y - 0.5} r={1.15} fill={NAVY[900]} />
              <circle cx={6} cy={HEAD_Y - 0.5} r={1.15} fill={NAVY[900]} />
              <path
                d={`M2 ${HEAD_Y + 3.4} q2 2.1 4.2 0`}
                stroke={NAVY[900]}
                strokeWidth={1.1}
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {kit.hat !== 'none' && (
            <>
              {/* Brim juts forward, which is what gives a hard hat its profile —
                  a symmetrical dome reads as a bowl.

                  ── Where the brim sits, and why it matters ──────────────────
                  The whole hat used to sit 3.5 units higher, and every engineer
                  in the hero looked like they were balancing it rather than
                  wearing it. The head is a circle of r=8.2 centred at -87, so
                  its crown is at -95.2; a brim whose lower edge was at -93.5
                  crossed the head where the circle is only 10 units across —
                  against a 23-unit brim. What you saw was a skull bulging out
                  from under a hat perched on its very top.

                  At -90.5 the head is 14.8 units across, so the brim covers it,
                  and the 1.85 units left above the eyes puts the edge just over
                  the brows, which is where a hard hat actually sits.

                  The white hat also gets a thin navy edge: paper white on this
                  hero's pale ground is barely a shape at all, and the architect
                  was losing her head against the sky. Hi-vis hats carry
                  themselves. */}
              <g
                stroke={kit.hat === 'white' ? NAVY[400] : 'none'}
                strokeWidth={kit.hat === 'white' ? 1 : 0}
                strokeLinejoin="round"
              >
                <rect x={-10} y={-94.5} width={23} height={4} rx={2} fill={hatFill} />
                <path d={`M-8.3 -93 a8.3 8.2 0 0 1 16.6 0 Z`} fill={hatFill} />
              </g>
              <rect x={-1.4} y={-100.5} width={2.8} height={7.5} rx={1.2} fill={NAVY[900]} opacity={0.12} />
            </>
          )}
        </g>

        {/* Forward arm last, so whatever is in the hand sits over the torso. */}
        <g transform={`rotate(${pose.armF.toFixed(1)} 7.5 ${SHOULDER_Y})`}>
          <g transform={`translate(7.5 ${SHOULDER_Y})`}>
            <Limb length={24} width={7} fill={kit.sleeve} cap={hand} />
            <PropShape prop={prop} arm={pose.armF} />
          </g>
        </g>
      </g>
    </g>
  );
}

import { memo, useEffect, useRef, useState } from 'react';
import { useScroll } from 'framer-motion';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion, useInView, useIsDesktop } from '@/hooks';
import { Worker, workerAt, smooth, type Beat } from '@/components/common/build-rig';
import { MARK_PATHS } from '@/components/common/Logo';

/**
 * The home hero's background: a construction site that is actually working.
 *
 * ── Why this exists next to `BuildScene` ────────────────────────────────────
 * `BuildScene` is the preloader's 240×150 scene, and it stays exactly as it is.
 * This is its wide sibling: a 480×180 site laid out around the hero copy rather
 * than centred in a loader, with a crane that slews, a hoist that actually
 * lifts something, and a second worker on the ground. They share one character
 * rig (`build-rig.tsx`) so the figure can never drift between the two.
 *
 * ── Composition ─────────────────────────────────────────────────────────────
 * Everything tall lives right of centre, because the headline and CTA occupy
 * the left six columns. The left third is deliberately nothing but ground,
 * material stacks and a walking worker — low enough to pass under the copy.
 *
 * ── Colour ──────────────────────────────────────────────────────────────────
 * The hero background is a dawn gradient: paper at the top, navy at the base.
 * Linework therefore has to run the other way or it vanishes at one end, and a
 * single vertical `linearGradient` on the stroke does that for every path at
 * once — including the crane mast, which climbs out of the dark ground into the
 * light sky and changes from cyan to navy on its way up.
 *
 * ── Motion ──────────────────────────────────────────────────────────────────
 * Three drivers, one number. An intro ramp erects the site 0→70% over ~4s; the
 * hero's own scroll progress carries it 70→100% as the visitor leaves; and a
 * set of ambient loops (crane slew, hoist cycle, walk cycles, dust) run off the
 * clock and never stop, which is what makes it read as live rather than as an
 * animation that has finished.
 *
 * The rAF loop lives *here* rather than in `Hero` on purpose: it re-renders on
 * every frame, and hoisting that state up would re-render the headline, both
 * CTAs and the stat rail sixty times a second for no reason. It also stops
 * entirely when the hero leaves the viewport.
 */

interface Part {
  d: string;
  /** Percentage of the build at which this part starts to draw. */
  at: number;
  /** Heavier stroke for primary structure. */
  bold?: boolean;
  faint?: boolean;
}

/*
  Ground at y=160. Building footprint x=250..350 — narrow and four storeys, not
  wide and three. The first pass was 148 units across by 80 tall and read as a
  warehouse; the firm's actual work (Jagatpura, Pratap Nagar, Sanganer in the
  portfolio) is narrow-plot residential that goes up rather than out. Floors are
  24 apart: plinth 152, slabs 128 / 104 / 80 / 56. Crane mast at x=410.
*/
const PARTS: Part[] = [
  { d: 'M-700 160 H1180', at: 0, bold: true },

  // Excavation marks across the plot
  { d: 'M18 166 l5 -5 M34 166 l5 -5 M50 166 l5 -5', at: 3, faint: true },

  /*
    The left third of the site.

    With only a ground line here the hero opened on a large empty quadrant
    between the copy and the frame. What fills it is a *finished* two-storey
    house standing beside the one going up — the delivered project next to the
    one in progress, which is the firm's whole offer in one picture. It rises to
    y=110 so it occupies the middle band the copy leaves free, rather than
    hugging the ground where nothing was visible.
  */
  { d: 'M0 160 V150 H14', at: 2, faint: true },

  { d: 'M20 160 V112 H106 V160', at: 4 },
  { d: 'M16 112 H110', at: 6, faint: true },
  { d: 'M20 136 H106', at: 8, faint: true },
  { d: 'M32 128 V118 H50 V128 M76 128 V118 H94 V128', at: 10, faint: true },
  { d: 'M32 152 V142 H50 V152', at: 12, faint: true },
  { d: 'M74 160 V140 H92 V160', at: 13, faint: true },

  // Laydown: rebar bundle, brick pallet, pipe stack
  { d: 'M120 160 H148 M123 155.5 H145 M126 151 H142', at: 15, faint: true },
  { d: 'M158 160 V150 H186 V160 M158 155 H186', at: 17, faint: true },
  { d: 'M194 160 a7 7 0 0 1 14 0', at: 19, faint: true },

  // The crane goes up first, as it does on a real site
  { d: 'M410 160 V36', at: 10, bold: true },
  { d: 'M410 160 l-8 0 M410 160 l8 0', at: 14, faint: true },

  // Plinth, then the frame rising off it
  { d: 'M250 160 V152 H350 V160', at: 22, bold: true },

  /*
    The two outer columns run the full height in one stroke rather than being
    interrupted at every floor. Without a continuous envelope the frame reads as
    shelving — horizontals on stubs — instead of a building.
  */
  { d: 'M250 152 V56', at: 26, bold: true },
  { d: 'M350 152 V56', at: 26, bold: true },

  { d: 'M300 152 V128', at: 29 },
  { d: 'M246 128 H354', at: 34, bold: true },
  { d: 'M262 148 V136 H286 V148 M314 148 V136 H338 V148', at: 39, faint: true },

  { d: 'M300 128 V104', at: 37 },
  { d: 'M246 104 H354', at: 42, bold: true },
  { d: 'M262 124 V112 H286 V124 M314 124 V112 H338 V124', at: 47, faint: true },

  { d: 'M300 104 V80', at: 45 },
  { d: 'M246 80 H354', at: 50, bold: true },
  { d: 'M262 100 V88 H286 V100 M314 100 V88 H338 V100', at: 55, faint: true },

  { d: 'M300 80 V56', at: 53 },
  { d: 'M246 56 H354', at: 58, bold: true },

  // Scaffold against the left face
  { d: 'M234 160 V52 M240 160 V52', at: 60, faint: true },
  { d: 'M234 140 H246 M234 116 H246 M234 92 H246 M234 68 H246', at: 63, faint: true },

  /*
    Contractor's banner, hung on the outer face of the scaffold.

    This is the copy phones see — the mobile viewBox starts at x=148 and crops
    the finished house, and its sign, away entirely.

    It is on the scaffold rather than inside the frame because the frame has no
    free bay. The worker's own choreography sweeps x 239..325 across y 59..80
    between 62% and 81% as he works the third slab, which is the whole top
    storey; a banner there would have him walking through it. Out here it clears
    him (he never comes further left than x=244), clears the ground worker (who
    stops at x=202 and never leaves the ground) and clears the scaffold rungs,
    which run right from x=234.
  */
  { d: 'M210 86 H234 V116 H210 Z', at: 60, faint: true },

  // Topping out — the roof rail lands under scroll, not during the intro
  { d: 'M250 56 V48 M350 56 V48', at: 66, faint: true },
  { d: 'M246 48 H354', at: 74 },
];

/**
 * The parts that swing with the jib.
 *
 * Split out of `PARTS` because they have to live inside the rotating group —
 * the mast stays put and everything above it slews as one piece, which is how a
 * tower crane actually moves.
 */
const JIB_PARTS: Part[] = [
  /*
    A tower crane is asymmetric: a long working jib to one side, a short
    counter-jib carrying the counterweight to the other, and a tall A-frame
    above the mast. The first pass had a symmetrical jib under a low, wide apex,
    which reads as an umbrella rather than a crane.
  */
  { d: 'M384 36 H468', at: 18, bold: true },
  { d: 'M410 14 L392 36 M410 14 L458 36', at: 21, faint: true },
  { d: 'M410 14 V36', at: 21, faint: true },
  // Counterweight on the short end
  { d: 'M384 33 H394 V41 H384 Z', at: 23, faint: true },
];

const REVEAL_SPAN = 12;

/**
 * The frame worker, choreographed to the build.
 *
 * He arrives before each slab rather than after it — on the plinth hammering at
 * 31% while the first slab lands at 37% — so the building reads as something he
 * is making, not something happening beside him.
 */
const FRAME_BEATS: Beat[] = [
  { at: 0,   x: 196, y: 160, pose: 'walk',   facing:  1 }, // on from the left
  { at: 8,   x: 226, y: 160, pose: 'survey', facing:  1 }, // reading the ground
  { at: 18,  x: 244, y: 160, pose: 'walk',   facing:  1 },
  { at: 23,  x: 258, y: 152, pose: 'walk',   facing:  1 }, // up onto the plinth
  { at: 28,  x: 268, y: 152, pose: 'hammer', facing:  1 },
  { at: 34,  x: 268, y: 152, pose: 'hammer', facing:  1 },
  { at: 38,  x: 278, y: 128, pose: 'climb',  facing:  1 },
  { at: 42,  x: 288, y: 128, pose: 'hammer', facing:  1 },
  { at: 46,  x: 288, y: 128, pose: 'hammer', facing:  1 },
  { at: 50,  x: 296, y: 104, pose: 'climb',  facing:  1 },
  { at: 54,  x: 306, y: 104, pose: 'hammer', facing:  1 },
  { at: 58,  x: 306, y: 104, pose: 'hammer', facing:  1 },
  { at: 62,  x: 300, y:  80, pose: 'climb',  facing:  1 },
  { at: 66,  x: 312, y:  80, pose: 'hammer', facing:  1 },
  { at: 71,  x: 312, y:  80, pose: 'hammer', facing:  1 },
  { at: 77,  x: 268, y:  80, pose: 'walk',   facing: -1 },
  { at: 81,  x: 246, y:  80, pose: 'climb',  facing: -1 }, // onto the scaffold
  { at: 85,  x: 246, y:  56, pose: 'climb',  facing: -1 },
  { at: 89,  x: 270, y:  56, pose: 'guide',  facing:  1 }, // banksman on the roof
  { at: 94,  x: 282, y:  56, pose: 'guide',  facing:  1 }, // signalling the hook in
  { at: 97,  x: 244, y: 120, pose: 'climb',  facing: -1 }, // back down the scaffold
  { at: 99,  x: 224, y: 160, pose: 'walk',   facing: -1 },
  { at: 100, x: 190, y: 160, pose: 'lookUp', facing:  1 }, // steps back and looks up
];

/**
 * The ground worker, on his own loop rather than on the build progress.
 *
 * The frame worker's story ends when the building tops out. This one has to
 * keep going or the site looks abandoned the moment the intro finishes — he is
 * the reason the hero still reads as *live* thirty seconds after it loaded.
 */
const GROUND_BEATS: Beat[] = [
  { at: 0,   x: 128, y: 160, pose: 'lift',  facing:  1 },
  { at: 12,  x: 134, y: 160, pose: 'carry', facing:  1 },
  { at: 42,  x: 196, y: 160, pose: 'carry', facing:  1 },
  { at: 52,  x: 202, y: 160, pose: 'lift',  facing:  1 },
  { at: 62,  x: 202, y: 160, pose: 'lift',  facing:  1 },
  { at: 70,  x: 196, y: 160, pose: 'walk',  facing: -1 },
  { at: 94,  x: 130, y: 160, pose: 'walk',  facing: -1 },
  { at: 100, x: 128, y: 160, pose: 'lift',  facing:  1 },
];

const GROUND_LOOP_MS = 15000;
const CRANE_SLEW_MS = 9000;
const HOIST_CYCLE_MS = 12000;
const INTRO_MS = 4000;
/** Where the intro stops and scroll takes over. */
const INTRO_CEILING = 70;

/** One drawn part, revealed by dash offset as the build passes its `at`. */
function SitePath({ part, progress, reduced }: { part: Part; progress: number; reduced: boolean }) {
  // 0 → not started, 1 → fully drawn.
  const t = reduced ? 1 : Math.max(0, Math.min(1, (progress - part.at) / REVEAL_SPAN));
  return (
    <path
      d={part.d}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - t}
      strokeWidth={part.bold ? 2.1 : 1.4}
      opacity={part.faint ? 0.55 : 1}
      style={{
        transition: reduced ? 'none' : 'stroke-dashoffset .25s linear',
        visibility: t > 0 ? 'visible' : 'hidden',
      }}
    />
  );
}

/**
 * The brand mark, drawn onto the site as line-work.
 *
 * Placed by transform rather than by re-plotting the coordinates, so the path
 * data stays byte-identical to `LogoMark`. Transforms apply right to left:
 * `translate(-4 -4)` first moves the *ink* bbox (`4 4 30 36`, not the 44×44
 * artboard) to the origin, then it scales, then it positions.
 *
 * Two details that are easy to get wrong:
 *
 *  · Stroke scales with the group, so the requested width is pre-divided by the
 *    scale to land at the intended thickness in scene units. `vectorEffect=
 *    "non-scaling-stroke"` would be the obvious alternative and is wrong here —
 *    it pins the stroke to screen pixels, so the mark would keep one thickness
 *    while every other line in the scene scales with the viewport.
 *
 *  · The leading shape takes cyan-600 rather than brand cyan `#00AEEF`, which
 *    measures ~2.5:1 against this hero's pale ground — under the 3:1 floor for
 *    non-text graphics. cyan-600 is ~4:1 and still unmistakably brand cyan. The
 *    trailing shape inherits the scene's ink gradient, so the mark belongs to
 *    the drawing while still reading as the logo.
 */
function SiteMark({
  x,
  y,
  height,
  at,
  stroke = 0.85,
  progress,
  reduced,
}: {
  /** Top-left of the mark's ink, in scene units. */
  x: number;
  y: number;
  height: number;
  at: number;
  /** Intended stroke width in *scene* units, before the group scale is undone. */
  stroke?: number;
  progress: number;
  reduced: boolean;
}) {
  const scale = height / 36;
  const t = reduced ? 1 : Math.max(0, Math.min(1, (progress - at) / REVEAL_SPAN));
  const dash = {
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - t,
    style: {
      transition: reduced ? 'none' : 'stroke-dashoffset .25s linear',
      visibility: (t > 0 ? 'visible' : 'hidden') as 'visible' | 'hidden',
    },
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) translate(-4 -4)`} strokeWidth={stroke / scale}>
      <path d={MARK_PATHS.leading} stroke="#0089BF" {...dash} />
      <path d={MARK_PATHS.trailing} {...dash} />
    </g>
  );
}

/** Position of the load on its lift cycle: 0 on the ground, 1 up at the roof. */
function hoistHeight(now: number, reduced: boolean) {
  if (reduced) return 0;
  const c = (now / HOIST_CYCLE_MS) % 1;
  if (c < 0.35) return smooth(c / 0.35); // raising
  if (c < 0.5) return 1; // held at height while it is landed
  if (c < 0.85) return 1 - smooth((c - 0.5) / 0.35); // lowering for the next pick
  return 0;
}

export const HeroSite = memo(function HeroSite({
  /** The hero section, for scroll coupling. */
  sectionRef,
  className,
}: {
  sectionRef: React.RefObject<HTMLElement>;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const isDesktop = useIsDesktop();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({ once: false, threshold: 0, rootMargin: '0px' });

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });

  /*
    One state update per frame carries both clocks. `now` drives every ambient
    loop; `intro` is the 0→70 ramp. Scroll is read imperatively from the motion
    value inside the same tick rather than through `useTransform`, so the whole
    scene still costs exactly one render per frame.
  */
  const [tick, setTick] = useState(() => ({ now: 0, progress: reduced ? 100 : 0 }));
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || !inView) return;

    let frame = 0;
    const step = (now: number) => {
      startedAt.current ??= now;
      const elapsed = now - startedAt.current;

      // Same ease-out as the preloader: a cubic is at 87% by halfway, which
      // flashes the crane and scaffold past before they can be read.
      const t = Math.min(1, elapsed / INTRO_MS);
      const intro = (1 - Math.pow(1 - t, 1.8)) * INTRO_CEILING;

      const scrolled = INTRO_CEILING + scrollYProgress.get() * (100 - INTRO_CEILING);

      // `max` rather than a phase switch: scrolling during the intro pulls the
      // build forward instead of fighting it, and it can never run backwards.
      setTick({ now, progress: Math.max(intro, t >= 1 ? scrolled : 0) });
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduced, inView, scrollYProgress]);

  const progress = reduced ? 100 : tick.progress;
  const now = reduced ? 0 : tick.now;

  const frameWorker = workerAt(FRAME_BEATS, progress);
  const groundWorker = workerAt(GROUND_BEATS, reduced ? 0 : ((now / GROUND_LOOP_MS) % 1) * 100);

  // Crane. The jib slews about the mast head; the trolley runs out and back
  // along it; the hook hangs from wherever the trolley currently is.
  const slew = reduced ? 0 : Math.sin(now / CRANE_SLEW_MS) * 6;
  const trolleyX = reduced ? 430 : 400 + ((1 + Math.sin(now / 11000)) / 2) * 56;
  const lift = hoistHeight(now, reduced);
  const loadY = 148 - lift * 84;
  /** The crane is drawn in by 22%; its moving parts should not precede it. */
  const craneOpacity = Math.max(0, Math.min(1, (progress - 23) / 8));

  return (
    <div ref={viewRef} className={cn('pointer-events-none select-none', className)} aria-hidden>
      <svg
        /*
          Cropped on phones. At 390px the full 480-unit scene is width-limited to
          about 146px tall no matter how much room its container is given, which
          left a dead band between the copy and the site. Dropping the empty left
          third of the viewBox zooms the rest — laydown, scaffold, building,
          crane — by ~45%, so it fills the space and stays legible at thumb size.
        */
        viewBox={isDesktop ? '0 0 480 180' : '148 0 332 180'}
        className="h-full w-full"
        /*
          `meet`, never `slice`.

          `slice` scales to *cover*, so any container wider than the viewBox's
          480:180 overflows vertically and — being bottom-anchored — crops from
          the top. That silently decapitated the crane on every viewport shorter
          than about 900px: measured clipped at 1470×760, 1280×720, 1512×850 and
          1920×1080, and only intact at 1440×900. It also blew the scene up to
          ~2× on phones, where the container is far taller than it is wide.

          `meet` fits the whole scene instead, so nothing is ever cut. The cost
          is letterboxing on wide containers, which the over-long ground path
          above absorbs: the horizon keeps running the full width of the viewport
          while the building and crane sit right-anchored, clear of the copy.
          That works because an SVG clips to its own element box, not to the
          viewBox — so the ground line is free to run out across the letterbox
          margins, and the element is full-width.
        */
        preserveAspectRatio={isDesktop ? 'xMaxYMax meet' : 'xMidYMax meet'}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <defs>
          {/*
            One vertical gradient for every stroke in the scene.

            The first pass ran this all the way to near-white at the base on the
            assumption that the background would be navy down there. It is not —
            the hero stays light almost to its foot, and the only genuinely dark
            band is the stat rail below the scene. Pale ink on pale ground made
            the ground worker and the site line almost invisible. So the ramp now
            stays *dark throughout*, navy at the top through to brand cyan at the
            base: enough separation to read as depth, never light enough to
            disappear.

            `userSpaceOnUse` is mandatory, not a preference. The default,
            `objectBoundingBox`, resolves per element — so every path would get
            its own private gradient across its own box, and a horizontal line
            (zero-height box, of which this scene is mostly made) would degenerate
            entirely. Anchoring to the viewBox makes one gradient span the scene.
          */}
          <linearGradient id="na-site-ink" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="180">
            <stop offset="0%" stopColor="#0A1B4D" />
            <stop offset="45%" stopColor="#12265C" />
            <stop offset="78%" stopColor="#026C97" />
            <stop offset="100%" stopColor="#0089BF" />
          </linearGradient>
        </defs>

        <g stroke="url(#na-site-ink)">
          {PARTS.map((part, i) => (
            <SitePath key={i} part={part} progress={progress} reduced={reduced} />
          ))}

          {/* Everything above the mast head swings as one piece. */}
          <g transform={`rotate(${slew.toFixed(3)} 410 36)`}>
            {JIB_PARTS.map((part, i) => (
              <SitePath key={i} part={part} progress={progress} reduced={reduced} />
            ))}

            {/* Trolley, hoist rope, and the load riding up to the frame. */}
            <g opacity={craneOpacity}>
              <path d={`M${trolleyX - 5} 36 H${trolleyX + 5}`} strokeWidth={2.1} />
              <path d={`M${trolleyX} 36 V${loadY}`} strokeWidth={1.4} />
              <path
                d={`M${trolleyX - 9} ${loadY} H${trolleyX + 9} V${loadY + 9} H${trolleyX - 9} Z`}
                strokeWidth={2.1}
              />
            </g>
          </g>

          {/*
            Both figures take the same gradient paint as the structure, so the
            frame worker darkens as he climbs into the light half and the ground
            worker stays bright against the navy base. A flat colour would have
            made one of the two invisible.
          */}
          {/*
            A · On the finished house, between its two upper windows (x 32..50
            and 76..94), which leaves x 50..76 clear. Drawn at 16, just after
            the house completes at 13 — the name goes up once the home is done,
            which is what the firm's own handover promise says.
          */}
          <SiteMark x={55.5} y={116} height={18} at={16} stroke={0.85} progress={progress} reduced={reduced} />

          {/*
            B · On the scaffold banner, so the mark survives the mobile crop.
            Bigger than the house sign, deliberately: on a 390px screen the
            scene renders at ~1.2px per unit, and this copy has to hold its
            4-unit gutter open at that size or the two shapes weld into a blob.
          */}
          <SiteMark x={212} y={88} height={24} at={64} stroke={1} progress={progress} reduced={reduced} />

          <Worker
            state={frameWorker}
            now={now}
            reduced={reduced}
            opacity={Math.min(1, progress / 5).toFixed(2)}
            stroke="url(#na-site-ink)"
            dustClassName="text-cyan-400/60"
          />
          <Worker
            state={groundWorker}
            now={now}
            reduced={reduced}
            opacity={craneOpacity}
            stroke="url(#na-site-ink)"
            dustClassName="text-cyan-400/60"
            scale={0.92}
          />
        </g>
      </svg>
    </div>
  );
});

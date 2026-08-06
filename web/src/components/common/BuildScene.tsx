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

export const BuildScene = memo(function BuildScene({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

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
      */}
      <g className="text-white" stroke="currentColor" strokeWidth={1.7}>
        <path d="M31 111.5 a5 4.6 0 0 1 10 0" />
        <path d="M28.6 111.5 H43.4" />
        <path d="M36 111.5 V116" />
        <path d="M36 116 V125.5" />
        <path d="M36 125.5 L31.5 131 M36 125.5 L40.8 131" />
        {/* Steadying arm */}
        <path d="M36 118 L30.8 121.5" />
        {/* Working arm — the only looping motion in the scene */}
        <g className={reduced ? undefined : 'build-scene-arm'} style={{ transformOrigin: '36px 118px' }}>
          <path d="M36 118 L42.6 114.6" />
          <path d="M41.4 112.6 L45.2 116.4" strokeWidth={2.6} />
        </g>
      </g>

      {/* Dust kicked up at the worker's feet, once the frame is going up. */}
      {!reduced && progress > 20 && (
        <g className="text-cyan-300/50" fill="currentColor" stroke="none">
          <circle cx={47} cy={129} r={0.9} className="build-scene-dust" />
          <circle cx={52} cy={130} r={0.7} className="build-scene-dust" style={{ animationDelay: '.5s' }} />
        </g>
      )}
    </svg>
  );
});

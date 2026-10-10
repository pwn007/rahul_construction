'use client';

import { memo } from 'react';
import { cn } from '@/lib/cn';
import { MAP_FRAME } from '@/data/jaipur-districts';
import { DISTRICT_PATHS, JMC_OUTLINE } from '@/data/jaipur-districts.geometry';
import { toPercent } from '@/lib/geo';
import type { Project } from '@/types/domain';
import type { AtlasEntry, AtlasInteraction } from './useAtlas';

/**
 * The map itself — real Jaipur Municipal Corporation zone geometry.
 *
 * This is the only module that imports the generated path data, which is why
 * the geometry lives in its own file: everything else in the feature needs the
 * district *labels* and would otherwise drag ~6 KB of `d` strings into chunks
 * that never draw a map.
 *
 * Labels and pins are HTML positioned by percentage over the SVG rather than
 * `<text>`/`<circle>` inside it. That buys real type tokens, real truncation
 * and tabular figures, at a size independent of the frame scale — the same
 * trick the previous schematic map used. The overlay is inert; the SVG
 * underneath carries all the interaction and all the semantics.
 */

const { width: W, height: H } = MAP_FRAME;

/**
 * Disc diameter in CSS px. Grows with √count so four projects read as "more
 * than one" without four times the visual weight — the classic area-vs-value
 * error that makes choropleths lie.
 */
const discSize = (count: number) => Math.round(22 + 6 * Math.sqrt(count));

interface AtlasCanvasProps {
  entries: AtlasEntry[];
  outside: Project[];
  interaction: AtlasInteraction;
  selected: string | null;
  /** False on mobile and for the read-only variants — see ProjectAtlas. */
  interactive: boolean;
  /** Show individual project pins for the emphasised district. */
  showPins: boolean;
  /** Highlighted from outside, e.g. hovering a project card in the grid. */
  activeProjectId?: string;
  describedById?: string;
  labelledById: string;
  className?: string;
}

function AtlasCanvasImpl({
  entries,
  outside,
  interaction,
  selected,
  interactive,
  showPins,
  activeProjectId,
  describedById,
  labelledById,
  className,
}: AtlasCanvasProps) {
  const { hovered, setHovered, focusId, rovingId, select, onKeyDown, registerRef } = interaction;

  const emphasised = entries.find((e) => e.district.id === focusId);
  const pinned = showPins && emphasised ? emphasised.projects : [];

  return (
    <div className={cn('relative', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        /* Never "none" — stretching would falsify the geography the whole feature exists to show. */
        preserveAspectRatio="xMidYMid meet"
        className="atlas block h-auto w-full"
        style={{ touchAction: 'pan-y' }}
        role={interactive ? 'radiogroup' : 'presentation'}
        aria-hidden={interactive ? undefined : true}
        aria-labelledby={interactive ? labelledById : undefined}
        aria-describedby={interactive ? describedById : undefined}
        data-focus={focusId ?? undefined}
        onKeyDown={interactive ? onKeyDown : undefined}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Land beyond the municipal limit. */}
        <rect x={0} y={0} width={W} height={H} fill="rgb(var(--c-atlas-void))" />

        <g>
          {entries.map(({ district, count, interactive: live }) => {
            const isSelected = selected === district.id;
            const isFocus = focusId === district.id;
            const fill = !count
              ? 'rgb(var(--c-atlas-land))'
              : isSelected
                ? 'rgb(var(--c-brand) / 0.34)'
                : isFocus
                  ? 'rgb(var(--c-brand) / 0.22)'
                  : 'rgb(var(--c-brand) / 0.11)';

            return (
              <g
                key={district.id}
                ref={registerRef(district.id)}
                data-district-id={district.id}
                data-active={isFocus || undefined}
                role={interactive && live ? 'radio' : undefined}
                aria-checked={interactive && live ? isSelected : undefined}
                /* Empty districts are geography, not controls: no tab stop, no
                   tooltip, no announcement. */
                aria-hidden={live ? undefined : true}
                tabIndex={interactive && live ? (rovingId === district.id ? 0 : -1) : undefined}
                aria-label={
                  interactive && live
                    ? `${district.label}, ${district.official} zone — ${count} project${count === 1 ? '' : 's'}`
                    : undefined
                }
                onMouseEnter={live ? () => setHovered(district.id) : undefined}
                onClick={interactive && live ? () => select(district.id) : undefined}
                style={{ pointerEvents: live ? 'auto' : 'none' }}
              >
                <path
                  d={DISTRICT_PATHS[district.id]}
                  className="atlas-district"
                  data-active={isFocus || undefined}
                  fill={fill}
                  stroke={isFocus ? 'rgb(var(--c-brand) / 0.85)' : 'rgb(var(--c-atlas-line))'}
                  strokeWidth={isFocus ? 2.5 : 1.2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        {/* The JMC limit, drawn last so no district fill paints over it. */}
        <path
          d={JMC_OUTLINE}
          fill="none"
          stroke="rgb(var(--c-atlas-outline))"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeOpacity={0.55}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />

      </svg>

      {/*
        Inert HTML overlay: markers, labels, pins.

        `inset-0` only lines up with the SVG's own coordinate space because the
        SVG is full-bleed in this box (no padding here — pad the panel outside)
        and its viewBox aspect matches the rendered box exactly under
        `preserveAspectRatio="xMidYMid meet"` + `w-full h-auto`. Introduce
        padding on this element and every marker silently drifts.

        The count discs are HTML rather than SVG <circle> for the same reason:
        one coordinate space for the marker and its number means they cannot
        come apart, and the disc keeps a legible fixed size instead of scaling
        with the frame.
      */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {entries.map(({ district, count }) => {
          const isFocus = focusId === district.id;
          const hidden = pinned.length > 0 && isFocus;
          return (
            <div
              key={district.id}
              className="atlas-label absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              data-active={isFocus || undefined}
              style={{ left: `${(district.labelX / W) * 100}%`, top: `${(district.labelY / H) * 100}%` }}
            >
              {count > 0 && (
                <span
                  className="num flex items-center justify-center rounded-full font-bold leading-none text-white ring-[3px] ring-[rgb(var(--c-atlas-void))]"
                  style={{
                    width: discSize(count),
                    height: discSize(count),
                    fontSize: count > 9 ? '0.66rem' : '0.72rem',
                    background: 'rgb(var(--c-brand))',
                    /* Individual pins replace the disc while a district is emphasised. */
                    opacity: hidden ? 0 : 1,
                    transform: hidden ? 'scale(0.6)' : 'scale(1)',
                    transition: 'opacity .22s ease-out, transform .22s ease-out',
                  }}
                >
                  {count}
                </span>
              )}
              <span
                className={cn(
                  'block whitespace-nowrap text-[0.6rem] font-semibold leading-tight tracking-tight sm:text-[0.68rem]',
                  count ? 'text-[rgb(var(--c-text))]' : 'text-subtle',
                )}
              >
                {district.label}
              </span>
            </div>
          );
        })}

        {/* Individual pins for the emphasised district. */}
        {pinned.map((project, i) => {
          /* An admin-created project may have no pin — skip it here; the zone
             shading above already counted it through districtId. */
          if (!project.coordinates) return null;
          const { left, top } = toPercent(project.coordinates.lat, project.coordinates.lng);
          return (
            <span
              key={project.id}
              className="absolute block -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/80 dark:ring-ink-950/70"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: activeProjectId === project.id ? 15 : 11,
                height: activeProjectId === project.id ? 15 : 11,
                background: 'rgb(var(--c-brand))',
                transition: 'width .2s ease-out, height .2s ease-out',
                animation: `atlas-pin-in .28s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both`,
              }}
            />
          );
        })}

        {/*
          Projects beyond the municipal limit. Always drawn individually and
          always dashed — they have no zone to fold into, and that is the point.
        */}
        {outside.map((project) => {
          if (!project.coordinates) return null;
          const { left, top } = toPercent(project.coordinates.lat, project.coordinates.lng);
          return (
            <span
              key={project.id}
              className={cn(
                'absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed',
                activeProjectId === project.id ? 'scale-125' : '',
              )}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                borderColor: 'rgb(var(--c-brand))',
                background: 'rgb(var(--c-atlas-void))',
                transition: 'transform .2s ease-out',
              }}
            />
          );
        })}
      </div>

      {/* Hover readout. Never shown for empty districts — a tooltip reading
          "0 projects" puts a negative number in front of a prospect. */}
      {hovered && interactive && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border bg-[rgb(var(--c-surface))]/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <p className="text-caption font-semibold leading-tight">{labelOf(entries, hovered)}</p>
          <p className="num text-xs leading-tight text-subtle sm:text-[0.68rem]">
            {countOf(entries, hovered)} project{countOf(entries, hovered) === 1 ? '' : 's'} · JMC {officialOf(entries, hovered)}
          </p>
        </div>
      )}
    </div>
  );
}

const labelOf = (entries: AtlasEntry[], id: string) => entries.find((e) => e.district.id === id)?.district.label ?? '';
const officialOf = (entries: AtlasEntry[], id: string) => entries.find((e) => e.district.id === id)?.district.official ?? '';
const countOf = (entries: AtlasEntry[], id: string) => entries.find((e) => e.district.id === id)?.count ?? 0;

export const AtlasCanvas = memo(AtlasCanvasImpl);

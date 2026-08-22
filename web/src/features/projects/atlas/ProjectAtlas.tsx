import { useId, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useIsDesktop } from '@/hooks';
import { ATLAS_SOURCE } from '@/data/jaipur-districts';
import { OUTSIDE_DISTRICT, resolveDistrictId } from '@/lib/geo';
import type { Project } from '@/types/domain';
import { AtlasCanvas } from './AtlasCanvas';
import { AtlasChips } from './AtlasChips';
import { useAtlasInteraction, useAtlasModel } from './useAtlas';

/**
 * Project Atlas — the firm's work plotted on the real municipal geography of
 * Jaipur.
 *
 * Deliberately *not* branded a "digital twin". That term has a specific
 * meaning in AEC — a live, bi-directional link to a physical asset — and this
 * is a map. Overclaiming it on a construction firm's site invites a
 * knowledgeable prospect to discount the BIM and QA claims too.
 *
 * Three variants:
 *   explorer — the Projects page. Hover, click-to-filter, keyboard, URL state.
 *   compact  — Contact page. Read-only, same geography.
 *   single   — Project detail. Emphasises one project's district.
 *
 * `compact` is the default so a bare <ProjectAtlas projects={…} /> renders
 * something correct; the migration from the old ProjectMap cannot half-work.
 */

export type AtlasVariant = 'explorer' | 'compact' | 'single';

export interface ProjectAtlasProps {
  /**
   * Projects to plot. For `explorer`, pass the list filtered by everything
   * EXCEPT district — otherwise every other district's count collapses to zero
   * the moment one is selected.
   */
  projects: Project[];
  variant?: AtlasVariant;

  /** `single`: the project to emphasise. */
  activeId?: string;
  onSelect?: (project: Project) => void;

  /** `explorer`: controlled selection. The page owns the URL. */
  districtId?: string | null;
  onDistrictChange?: (id: string | null) => void;
  /** `explorer`: highlight a pin when its card is hovered in the grid. */
  activeProjectId?: string;
  onHoverDistrict?: (id: string | null) => void;

  /** Id of the element that serves as the map's text equivalent (the project list). */
  describedById?: string;
  className?: string;
}

export function ProjectAtlas({
  projects,
  variant = 'compact',
  activeId,
  districtId = null,
  onDistrictChange,
  activeProjectId,
  onHoverDistrict,
  describedById,
  className,
}: ProjectAtlasProps) {
  const isDesktop = useIsDesktop();
  const captionId = useId();
  const liveId = useId();

  const model = useAtlasModel(projects);

  /**
   * The map is interactive only where interaction is meaningful *and* usable:
   * the explorer variant, on a pointer-sized screen. Everywhere else the SVG is
   * inert and aria-hidden, and the chips carry the semantics.
   */
  const interactive = variant === 'explorer' && isDesktop;

  // On the detail page, emphasise the district containing the shown project.
  const activeProject = activeId ? projects.find((p) => p.id === activeId) : undefined;
  const emphasisedDistrict = variant === 'single' && activeProject ? resolveDistrictId(activeProject) : districtId;

  const interaction = useAtlasInteraction({
    entries: model.entries,
    selected: emphasisedDistrict,
    onSelect: onDistrictChange,
    enabled: interactive,
  });

  const selectedLabel = useMemo(() => {
    if (!districtId) return null;
    if (districtId === OUTSIDE_DISTRICT.id) return OUTSIDE_DISTRICT.label;
    return model.entries.find((e) => e.district.id === districtId)?.district.label ?? null;
  }, [districtId, model.entries]);

  const showChips = variant === 'explorer';
  const showPins = variant !== 'compact';

  /**
   * One width for the map and its caption.
   *
   * The frame is very nearly square (Jaipur's municipal area is 18 × 26 km,
   * which the cosine correction renders as 1000 × 988), so letting it run the
   * full width of a desktop container turns the map into wallpaper. But the cap
   * has to govern the caption too — capping only the panel left the credit line
   * running wider than the map it belongs to, which reads as a misalignment.
   *
   * Capping the *container* rather than the SVG matters as well: the marker
   * overlay is positioned against this box, so shrinking the SVG inside a wider
   * box would letterbox it and every pin would drift.
   */
  const cap = 'mx-auto w-full max-w-[620px]';

  return (
    <figure className={cn('m-0', className)}>
      <div className={cn(cap, 'grain relative overflow-hidden rounded-xl border bg-[rgb(var(--c-atlas-void))] p-3 sm:p-4')}>
        {/* Drafting paper in light, blueprint in dark — the same utilities the
            rest of the site uses for technical grounds. */}
        <div
          className="pointer-events-none absolute inset-0 bg-grid-light bg-grid-sm opacity-60 dark:bg-grid-blueprint dark:opacity-[0.10]"
          aria-hidden
        />

        <AtlasCanvas
          entries={model.entries}
          outside={model.outside}
          interaction={interaction}
          selected={variant === 'single' ? emphasisedDistrict : districtId}
          interactive={interactive}
          showPins={showPins}
          activeProjectId={activeProjectId ?? activeId}
          describedById={describedById}
          labelledById={captionId}
        />

        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border bg-[rgb(var(--c-surface))]/85 px-2.5 py-1 backdrop-blur-sm">
          <MapPin className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
          <span className="text-xs leading-none text-muted sm:text-[0.68rem]">Jaipur, Rajasthan</span>
        </div>
      </div>

      {showChips && (
        <AtlasChips
          className="mt-4"
          entries={model.entries}
          outsideCount={model.outside.length}
          selected={districtId}
          onSelect={(id) => onDistrictChange?.(id)}
          onHover={onHoverDistrict ?? (interactive ? interaction.setHovered : undefined)}
          total={model.total}
        />
      )}

      {/*
        Announced on selection only, never on hover — a live region that fires
        on every mouse movement is unusable.
      */}
      <p id={liveId} className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedLabel
          ? `${selectedLabel} selected. Showing ${countIn(model, districtId)} of ${model.total} projects.`
          : `Showing all ${model.total} projects.`}
      </p>

      <figcaption className={cn(cap, 'mt-3 space-y-1.5 text-xs leading-relaxed text-subtle sm:text-[0.7rem]')}>
        <p id={captionId}>
          Project Atlas — our work across Jaipur's municipal zones.{' '}
          {model.outside.length > 0 && (
            <>
              {model.outside.length === 1 ? 'One project sits' : `${model.outside.length} projects sit`} beyond the
              Jaipur Municipal Corporation limit, on land administered by the JDA, so{' '}
              {model.outside.length === 1 ? 'it falls' : 'they fall'} outside the mapped zones.{' '}
            </>
          )}
          Locations are shown to locality level.
        </p>
        {/*
          CC BY 4.0 requires attribution the reader can actually see — not
          behind a hover, not in a repository. This line is a licence
          obligation. See scripts/data/LICENCE-datameet.txt.
        */}
        <p>
          {ATLAS_SOURCE.vintage} ·{' '}
          <a
            href={ATLAS_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="link-underline inline-block py-1 hover:text-[rgb(var(--c-brand-text))]"
          >
            {ATLAS_SOURCE.title} © {ATLAS_SOURCE.publisher}
          </a>{' '}
          <a
            href={ATLAS_SOURCE.licenceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow license"
            className="link-underline inline-block py-1 hover:text-[rgb(var(--c-brand-text))]"
          >
            {ATLAS_SOURCE.licence}
          </a>
        </p>
      </figcaption>
    </figure>
  );
}

function countIn(model: ReturnType<typeof useAtlasModel>, districtId: string | null): number {
  if (!districtId) return model.total;
  if (districtId === OUTSIDE_DISTRICT.id) return model.outside.length;
  return model.entries.find((e) => e.district.id === districtId)?.count ?? 0;
}

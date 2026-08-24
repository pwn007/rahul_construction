'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { JAIPUR_DISTRICTS, type JaipurDistrict } from '@/data/jaipur-districts';
import { groupByDistrict, OUTSIDE_DISTRICT } from '@/lib/geo';
import type { Project } from '@/types/domain';

/** A district plus the projects that landed in it. */
export interface AtlasEntry {
  district: JaipurDistrict;
  projects: Project[];
  count: number;
  /** Districts with no work are context, not controls — see the a11y notes below. */
  interactive: boolean;
}

export interface AtlasModel {
  entries: AtlasEntry[];
  /** Projects beyond the mapped municipal zones. Rendered, never snapped. */
  outside: Project[];
  /** Highest count in any district, for scaling the count discs. */
  max: number;
  total: number;
}

/**
 * Build the atlas model. Districts are returned in the generated order — north
 * to south, west to east — which is simultaneously the paint order, the DOM
 * order and therefore the keyboard traversal order.
 */
export function useAtlasModel(projects: Project[]): AtlasModel {
  return useMemo(() => {
    const { byDistrict, outside, max } = groupByDistrict(projects);
    const entries = JAIPUR_DISTRICTS.map((district) => {
      const bucket = byDistrict.get(district.id) ?? [];
      return { district, projects: bucket, count: bucket.length, interactive: bucket.length > 0 };
    });
    return { entries, outside, max, total: projects.length };
  }, [projects]);
}

interface AtlasInteractionArgs {
  entries: AtlasEntry[];
  selected: string | null;
  onSelect?: (id: string | null) => void;
  enabled: boolean;
}

export interface AtlasInteraction {
  hovered: string | null;
  setHovered: (id: string | null) => void;
  /** Whichever district is currently emphasised — hover wins over selection. */
  focusId: string | null;
  /** Ids that can receive focus, in traversal order. */
  stops: string[];
  /** The single district carrying tabIndex=0 (roving tabindex). */
  rovingId: string | null;
  select: (id: string | null) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  registerRef: (id: string) => (el: SVGGElement | null) => void;
}

/**
 * Hover, roving tabindex and the keyboard model.
 *
 * There is no ARIA `map` role and `role="img"` is wrong the moment regions are
 * clickable, so this composes the WAI-ARIA APG **Radio Group** pattern: exactly
 * one district is tabbable, arrow keys move between them, and — per APG — arrow
 * keys move selection along with focus, which also happens to be the nicer
 * interaction (the grid filters as you arrow across the city).
 *
 * Districts with no projects are skipped entirely, so the keyboard never lands
 * on dead geography.
 */
export function useAtlasInteraction({ entries, selected, onSelect, enabled }: AtlasInteractionArgs): AtlasInteraction {
  const [hovered, setHovered] = useState<string | null>(null);
  const refs = useRef(new Map<string, SVGGElement>());

  /**
   * The out-of-limit group is deliberately absent here: it has no polygon, so
   * there is nothing on the map to focus. It remains a selectable filter via
   * the chip row, which is also what satisfies WCAG 2.5.8 for the map at large.
   */
  const stops = useMemo(() => entries.filter((e) => e.interactive).map((e) => e.district.id), [entries]);

  const rovingId = useMemo(() => {
    if (!stops.length) return null;
    if (selected && stops.includes(selected)) return selected;
    return stops[0];
  }, [stops, selected]);

  const select = useCallback(
    (id: string | null) => {
      if (!enabled) return;
      onSelect?.(id === selected ? null : id);
    },
    [enabled, onSelect, selected],
  );

  const registerRef = useCallback(
    (id: string) => (el: SVGGElement | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
    [],
  );

  const move = useCallback(
    (from: string | null, delta: number) => {
      if (!stops.length) return;
      const at = from ? stops.indexOf(from) : -1;
      const next = stops[(at + delta + stops.length) % stops.length];
      refs.current.get(next)?.focus();
      onSelect?.(next);
    },
    [stops, onSelect],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || !stops.length) return;
      const current = (event.target as SVGGElement)?.dataset?.districtId ?? rovingId;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          move(current, 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          move(current, -1);
          break;
        case 'Home':
          event.preventDefault();
          refs.current.get(stops[0])?.focus();
          onSelect?.(stops[0]);
          break;
        case 'End':
          event.preventDefault();
          refs.current.get(stops[stops.length - 1])?.focus();
          onSelect?.(stops[stops.length - 1]);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          if (current) select(current);
          break;
        case 'Escape':
          event.preventDefault();
          onSelect?.(null);
          break;
        default:
      }
    },
    [enabled, stops, rovingId, move, select, onSelect],
  );

  return {
    hovered,
    setHovered: enabled ? setHovered : NOOP,
    focusId: hovered ?? selected,
    stops,
    rovingId,
    select,
    onKeyDown,
    registerRef,
  };
}

const NOOP = () => {};

export { OUTSIDE_DISTRICT };

import { MAP_FRAME, LOCALITY_TO_DISTRICT, JAIPUR_DISTRICTS } from '@/data/jaipur-districts';
import type { Project } from '@/types/domain';

/**
 * Projection and district-resolution helpers for the Project Atlas.
 *
 * Pure functions, no React, no geometry — this module is safe to import from
 * anywhere. The SVG path data lives in `@/data/jaipur-districts.geometry` and is
 * imported by exactly one component.
 */

const SX = MAP_FRAME.width / (MAP_FRAME.lon1 - MAP_FRAME.lon0);
/**
 * Latitude and longitude degrees are not the same distance on the ground. At
 * Jaipur's latitude a degree of longitude is only cos(26.9°) ≈ 0.892 as wide as
 * a degree of latitude, so the vertical scale is the horizontal one multiplied
 * by that factor. Drop it and the whole city is stretched 12% horizontally.
 *
 * The same constant is baked into the generated paths, so pins and polygons
 * agree by construction.
 */
const SY = SX * MAP_FRAME.cosMidLat;

/** Latitude/longitude → frame units (the SVG's own coordinate space). */
export function projectPoint(lat: number, lng: number): { x: number; y: number } {
  return { x: (lng - MAP_FRAME.lon0) * SX, y: (MAP_FRAME.lat1 - lat) * SY };
}

/**
 * Latitude/longitude → percentage of the frame, for HTML elements overlaid on
 * the SVG. Deliberately unclamped: a point outside the frame is a real fact
 * about the project (see the Pratap Nagar note in scripts/districts.config.mjs),
 * and clamping it would silently move a pin onto land it isn't on.
 */
export function toPercent(lat: number, lng: number): { left: number; top: number } {
  const { x, y } = projectPoint(lat, lng);
  return { left: (x / MAP_FRAME.width) * 100, top: (y / MAP_FRAME.height) * 100 };
}

/** True when the point falls inside the drawn frame at all. */
export function isWithinFrame(lat: number, lng: number): boolean {
  const { left, top } = toPercent(lat, lng);
  return left >= 0 && left <= 100 && top >= 0 && top <= 100;
}

/**
 * Which district a project belongs to, or `null` for land outside the mapped
 * municipal zones.
 *
 * Resolution is editorial and settled at build time — an explicit `districtId`
 * first, then the locality lookup. There is deliberately no runtime
 * point-in-polygon: an admin-created project in an unmapped locality lands in
 * the "outside" bucket, where it is shown honestly, rather than being snapped
 * into whichever polygon happens to be nearest.
 */
export function resolveDistrictId(project: Pick<Project, 'districtId' | 'locality'>): string | null {
  if (project.districtId) return project.districtId;
  return LOCALITY_TO_DISTRICT[project.locality.trim().toLowerCase()] ?? null;
}

export interface DistrictGrouping {
  /** district id → its projects, in the order given. Only non-empty districts appear. */
  byDistrict: Map<string, Project[]>;
  /** Projects on land beyond the mapped municipal zones. */
  outside: Project[];
  /** Largest project count in any one district — used to scale the count discs. */
  max: number;
}

export function groupByDistrict(projects: Project[]): DistrictGrouping {
  const byDistrict = new Map<string, Project[]>();
  const outside: Project[] = [];

  for (const project of projects) {
    const id = resolveDistrictId(project);
    if (!id) {
      outside.push(project);
      continue;
    }
    const bucket = byDistrict.get(id);
    if (bucket) bucket.push(project);
    else byDistrict.set(id, [project]);
  }

  let max = 0;
  for (const bucket of byDistrict.values()) if (bucket.length > max) max = bucket.length;

  return { byDistrict, outside, max };
}

/** Human-readable district name, falling back to the outside-the-limit label. */
export function districtLabel(id: string | null): string {
  if (!id) return OUTSIDE_DISTRICT.label;
  return JAIPUR_DISTRICTS.find((d) => d.id === id)?.label ?? id;
}

/**
 * The pseudo-district for projects beyond the JMC limit. It behaves like a real
 * district everywhere in the UI — it filters, it has a chip, it announces — but
 * it has no polygon, because there is no municipal zone to draw.
 */
export const OUTSIDE_DISTRICT = {
  id: 'outside-jmc',
  label: 'Beyond JMC limit',
  official: 'JDA-administered',
} as const;

/** Grow a [x0, y0, x1, y1] box by a fraction of its own size. */
export function padBbox(bbox: readonly [number, number, number, number], pct: number): [number, number, number, number] {
  const [x0, y0, x1, y1] = bbox;
  const dx = (x1 - x0) * pct;
  const dy = (y1 - y0) * pct;
  return [x0 - dx, y0 - dy, x1 + dx, y1 + dy];
}

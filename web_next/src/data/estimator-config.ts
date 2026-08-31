import type {
  BaseRate,
  Enhancement,
  FurnitureSpec,
  LocationMultiplier,
  MaterialSpec,
  WorkHeadSpec,
} from '@/types/domain';
import { ENHANCEMENTS, LOCATIONS, PACKAGES } from '@/constants/estimator';
import { MATERIAL_LINES, defaultOption } from '@/constants/materials';
import { WORK_HEADS } from '@/constants/work-heads';
import { FURNITURE_LINES, furnitureOptionOf } from '@/constants/furniture';

/**
 * Persisted mirror of the estimator constants.
 *
 * The public calculator resolves its configuration from this collection (via the
 * API layer) and falls back to the compiled constants if the request fails —
 * so editing a rate in /admin/estimator-config changes the live estimator.
 */

const meta = (id: string) => ({
  id,
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  status: 'published' as const,
});

export const BASE_RATES: BaseRate[] = PACKAGES.map((p, i) => ({
  ...meta(`rate_${p.key}`),
  key: p.key,
  label: p.label,
  description: p.description,
  minRate: p.minRate,
  maxRate: p.maxRate,
  labourOnlyRate: p.labourOnlyRate,
  order: i + 1,
}));

export const MATERIAL_RECORDS: MaterialSpec[] = MATERIAL_LINES.map((line, i) => ({
  ...meta(`mat_${line.key}`),
  key: line.key,
  label: line.label,
  group: line.group,
  unit: line.unit,
  coefficient: line.coefficient,
  options: line.options.map((o) => `${o.label} — ₹${o.rate}`),
  defaultRate: defaultOption(line).rate,
  provisional: line.options.some((o) => o.provisional),
  essential: Boolean(line.essential),
  order: i + 1,
}));

export const LOCATION_RECORDS: LocationMultiplier[] = LOCATIONS.map((l, i) => ({
  ...meta(`loc_${l.key}`),
  key: l.key,
  label: l.label,
  zone: l.zone,
  multiplier: l.multiplier,
  order: i + 1,
}));

export const ENHANCEMENT_RECORDS: Enhancement[] = ENHANCEMENTS.map((e, i) => ({
  ...meta(`enh_${e.key}`),
  key: e.key,
  label: e.label,
  description: e.description,
  icon: e.icon,
  pricingModel: e.pricingModel,
  unitPrice: e.unitPrice,
  appliesTo: [...e.appliesTo],
  order: i + 1,
}));

export const WORK_HEAD_RECORDS: WorkHeadSpec[] = WORK_HEADS.map((h, i) => ({
  ...meta(`work_${h.key}`),
  key: h.key,
  label: h.label,
  ...(h.hindi && { hindi: h.hindi }),
  minPackage: h.minPackage,
  costHead: h.costHead,
  materials: [...h.materialKeys],
  labourWeight: h.labourWeight,
  order: i + 1,
}));

export const FURNITURE_RECORDS: FurnitureSpec[] = FURNITURE_LINES.map((l, i) => ({
  ...meta(`fur_${l.key}`),
  key: l.key,
  label: l.label,
  description: l.blurb,
  icon: l.icon,
  pricingModel: l.pricingModel,
  options: l.options.map((o) => `${o.label} — ₹${o.rate}`),
  defaultRate: furnitureOptionOf(l, undefined).rate,
  order: i + 1,
}));

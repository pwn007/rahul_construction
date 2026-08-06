import type { BaseRate, Enhancement, LocationMultiplier, QualityTier } from '@/types/domain';
import { ENHANCEMENTS, LOCATIONS, PACKAGES, QUALITY_TIERS } from '@/constants/estimator';

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

export const QUALITY_RECORDS: QualityTier[] = QUALITY_TIERS.map((q, i) => ({
  ...meta(`quality_${q.key}`),
  key: q.key,
  label: q.label,
  description: q.description,
  multiplier: q.multiplier,
  highlights: [...q.highlights],
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

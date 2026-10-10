import type { DevelopmentType } from '@/types/domain';

/**
 * What the visitor wants built, as asked by the lead popup.
 *
 * Deliberately not `PROPERTY_TYPES` from ./estimator — that list carries
 * `mixed-use`, `interior-only` and a pricing factor per type, because the
 * estimator prices them differently. A lead only needs to be routed, and three
 * buckets a visitor can answer without thinking is the right size for a popup.
 *
 * The popup's select, the admin filter, the admin column and the admin form
 * field all read this one list, so a new option cannot appear in one and be
 * missing from another.
 */
export const DEVELOPMENT_TYPES: readonly { key: DevelopmentType; label: string }[] = [
  { key: 'residential', label: 'Residential' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'other', label: 'Other' },
];

export function developmentTypeLabel(key: string | undefined): string | undefined {
  return DEVELOPMENT_TYPES.find((t) => t.key === key)?.label ?? key;
}

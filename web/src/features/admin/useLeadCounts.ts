import { useQueries } from '@tanstack/react-query';
import { MODULES } from './config/modules';
import type { ResourceConfig } from './types';

/**
 * Live counts for the lead modules.
 *
 * The sidebar badges and the dashboard tiles used to be computed once, at module
 * scope, from the static seed arrays in `@/data/ops`. So a genuinely new
 * enquiry — which lands in the adapter's overlay, not in that array — never
 * moved the "unread" count, and changing a lead's stage in the panel never
 * decremented it. The panel showed a number that could not respond to anything
 * happening in it.
 *
 * Each lead module already declares its own `badge(rows)` rule in
 * `config/modules.tsx`; that callback was simply never invoked. This runs it
 * against live data, so the definition of "new" stays in one place.
 *
 * `pageSize: 500` matches `service.all()` — these collections are small, and one
 * fetch per lead resource is cheaper than paginating for a count.
 */

export interface LeadCounts {
  /** module key → badge number, absent when zero. */
  badges: Record<string, number>;
  /** module key → total rows in that collection. */
  totals: Record<string, number>;
  isLoading: boolean;
}

/** The modules that declare a badge rule — enquiries, estimates, applications. */
const BADGED = MODULES.filter((m) => typeof m.badge === 'function') as ResourceConfig<never>[];

export function useLeadCounts(): LeadCounts {
  const queries = useQueries({
    queries: BADGED.map((module) => ({
      queryKey: [module.service.resource, 'list', { pageSize: 500 }],
      queryFn: () => module.service.list({ pageSize: 500 }),
      staleTime: 30_000,
    })),
  });

  const badges: Record<string, number> = {};
  const totals: Record<string, number> = {};

  BADGED.forEach((module, i) => {
    const rows = (queries[i]?.data?.items ?? []) as never[];
    totals[module.key] = rows.length;
    const count = module.badge?.(rows);
    if (count) badges[module.key] = count;
  });

  return { badges, totals, isLoading: queries.some((q) => q.isLoading) };
}

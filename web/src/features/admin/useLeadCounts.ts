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
  /**
   * Hours since the oldest untouched lead arrived, or null when the queue is clear.
   *
   * A count of new leads says how much work there is; this says how late it is.
   * They are different questions and only the second one predicts revenue —
   * contacting within five minutes rather than thirty is worth 21× on
   * qualification, so a queue of two that is a day old is a worse position than
   * a queue of ten that is a minute old.
   */
  oldestNewLeadHours: number | null;
  isLoading: boolean;
}

/** A row that has been captured but not yet acted on. */
interface StaleCandidate {
  stage?: string;
  createdAt?: string;
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
  let oldest: number | null = null;

  BADGED.forEach((module, i) => {
    const rows = (queries[i]?.data?.items ?? []) as never[];
    totals[module.key] = rows.length;
    const count = module.badge?.(rows);
    if (count) badges[module.key] = count;

    for (const row of rows as StaleCandidate[]) {
      if (row.stage !== 'new' || !row.createdAt) continue;
      const at = Date.parse(row.createdAt);
      /* Seed data carries future-dated timestamps; a negative age is not "urgent". */
      if (Number.isNaN(at) || at > Date.now()) continue;
      oldest = oldest === null ? at : Math.min(oldest, at);
    }
  });

  return {
    badges,
    totals,
    oldestNewLeadHours: oldest === null ? null : (Date.now() - oldest) / 3_600_000,
    isLoading: queries.some((q) => q.isLoading),
  };
}

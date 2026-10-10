'use client';

import { useQuery } from '@tanstack/react-query';
import { AREA_UNITS, type AreaUnit } from '@/constants/estimator';

/**
 * The civil-work quantity engine's client half — September 2026 revamp.
 *
 * The arithmetic lives on the server (backend config/estimator.php +
 * EstimatorController): quantities from per-sqft thumb-rule coefficients with
 * quantities priced at current Jaipur rates (the wastage allowance rides
 * inside the admin-owned rates), plus labour. Keeping it server-side means a cement price change is an .env-free
 * config edit on the host — the live estimator follows without a rebuild, and
 * the PDF, the admin's lead record and the page can never disagree.
 *
 * Talks to the API directly (like services/media.ts) rather than through
 * httpAdapter: this is a computation endpoint, not a resource.
 */

export type PackageKey = 'civil' | 'semi-furnished';

export interface QuoteInput {
  propertyType: string;
  areaPerFloor: number;
  areaUnit: AreaUnit;
  floors: number;
  /** Which scope the engine prices: civil structure alone, or structure plus
      the finishing trades. Fully-furnished joins in a later phase. */
  package: PackageKey;
  /** material key → chosen brand-option key. Absent = the server's default. */
  selections: Record<string, string>;
}

export interface QuoteOption {
  key: string;
  label: string;
  detail: string;
  rate: number;
  /** Fixing labour per unit, when the line prices it per option. */
  labour?: number | null;
  default: boolean;
  /** Site-relative brand mark (only real brands carry one — cement, steel). */
  logo: string | null;
  /** Site-relative product photo for options that are types rather than
      brands (bricks, sand…) — licensed reuse, see docs/image-credits.md. */
  photo: string | null;
}

export interface QuoteLine {
  key: string;
  /** 'structure' (civil tier) or 'finishing' (semi tier) — drives the group
      headers and sub-totals in the result. */
  group: 'structure' | 'finishing';
  label: string;
  unit: string;
  qty: number;
  rate: number;
  /** Per-unit fixing labour on lines whose options carry it (door frames —
      granite, Bijolia and wood install differently); null everywhere else.
      `rate` stays the material price, and amount = qty × (rate + labourRate). */
  labourRate: number | null;
  amount: number;
  note: string;
  /** Thumb-rule inputs, restated for the visitor (show-your-work). */
  coefficient: number;
  wastes: boolean;
  /** When set, the headline shows this buying-unit figure ("9.6 tonnes",
      "22 trolleys") and the raw qty/unit drops to the sub-line. Null where
      qty/unit is already how it sells (cement bags, bricks). */
  buyQty: string | null;
  buyUnit: string | null;
  /** The brand this line is priced at. */
  chosen: { key: string; label: string; detail: string };
  /** Every brand the visitor can switch to — the UI builds its pickers from
      this, so rates exist in exactly one place (the server's config). */
  options: QuoteOption[];
}

export interface Quote {
  package: PackageKey;
  builtUpArea: number;
  wastagePct: number;
  lines: QuoteLine[];
  materialsTotal: number;
  /* `rates` rides along only on civil quotes: ground-only carries the one-time
     excavation/foundation work on one floor, so the two tiers differ and the
     page's floors-note quotes them (admin-set, never hardcoded in copy). */
  labour: { rate: number; amount: number; rates?: { ground: number; upper: number } };
  overheads: { pct: number; amount: number };
  total: number;
  totalMin: number;
  totalMax: number;
  timelineWeeks: number;
}

/* areaPerFloor 0 = the field starts empty. The result column shows a prompt,
   not a priced default: an estimate nobody asked for reads as a quotation and
   anchors the visitor against a number that is not theirs (user feedback,
   Sep 2026 — the same reasoning that removed the old hero's sample figure). */
export const DEFAULT_QUOTE_INPUT: QuoteInput = {
  propertyType: 'residential',
  areaPerFloor: 0,
  areaUnit: 'sqft',
  floors: 2,
  package: 'civil',
  selections: {},
};

export function toSqft(area: number, unit: AreaUnit): number {
  return area * (AREA_UNITS.find((u) => u.key === unit)?.toSqft ?? 1);
}

async function fetchQuote(input: QuoteInput): Promise<Quote> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/estimator/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ areaPerFloor: input.areaPerFloor, areaUnit: input.areaUnit, floors: input.floors, package: input.package, selections: input.selections }),
  });
  const json = (await res.json().catch(() => null)) as { data?: Quote; message?: string } | null;
  if (!res.ok || !json?.data) throw new Error(json?.message ?? 'Could not calculate right now.');
  return json.data;
}

export function useQuote(input: QuoteInput) {
  return useQuery<Quote>({
    queryKey: ['estimator-quote', input.areaPerFloor, input.areaUnit, input.floors, input.package, JSON.stringify(Object.entries(input.selections).sort())],
    queryFn: () => fetchQuote(input),
    enabled: input.areaPerFloor >= 50,
    /* The previous answer stays on screen while the next one loads, so typing
       an area never blanks the table — it just re-prices. */
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

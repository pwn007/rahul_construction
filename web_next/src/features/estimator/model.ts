'use client';

import {
  AREA_UNITS,
  ASSUMPTIONS,
  COMMERCIAL_HEADS,
  COST_HEADS,
  COST_SPLIT,
  ENHANCEMENTS,
  LOCATIONS,
  MODEL,
  PACKAGES,
  PAYMENT_SCHEDULE,
  PROPERTY_TYPES,
  type AreaUnit,
  type CommercialHeadKey,
  type CostHeadKey,
  type PackageKey,
  type PackageOption,
  type PropertyTypeKey,
  type ServiceModel,
} from '@/constants/estimator';
import {
  MATERIAL_LINES,
  MATERIAL_LINE_BY_KEY,
  defaultOption,
  optionOf,
  type MaterialGroupKey,
  type QuantityUnit,
} from '@/constants/materials';
import { WORK_HEADS, headInPackage, type WorkHead } from '@/constants/work-heads';
import {
  BEDROOM_PER_SQFT,
  FURNITURE_LINES,
  FURNITURE_LINE_BY_KEY,
  furnitureOptionOf,
  type FurnitureLine,
} from '@/constants/furniture';

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface EstimatorInput {
  propertyType: PropertyTypeKey;
  serviceModel: ServiceModel;
  /**
   * Built-up area of ONE floor, in `areaUnit`. Total built-up = this × floors.
   *
   * This used to be the *plot* area, with the built-up area derived through a
   * ground-coverage slider the visitor had to set. That asked a homeowner to
   * predict their own setbacks, and — because every competitor asks for built-up
   * area — people routinely typed their built-up figure into the plot field and
   * silently over-estimated by roughly 39%. Asking per floor also makes the floor
   * stepper visibly consequential: the running total moves as you tap it.
   */
  areaPerFloor: number;
  areaUnit: AreaUnit;
  floors: number;
  hasBasement: boolean;
  hasStilt: boolean;
  location: string;
  enhancements: string[];
  /**
   * materialKey → chosen optionKey. Presence IS selection.
   *
   * Replaced an `includedOptional` / `excluded` pair, which existed only to
   * express deviation from a default selection — and there is no default
   * selection any more. The visitor picks every material and every brand, so one
   * map says both what is in and which brand it is.
   */
  materials: Record<string, string>;
  /**
   * The package the visitor explicitly chose — and `undefined` when they have not
   * been asked yet.
   *
   * The scope used to be *only* derived from the materials, on the reasoning that
   * "semi-furnished" is a contract term rather than a question a homeowner can
   * answer. That reasoning still holds for someone who wants to assemble a build
   * material by material, and `deriveScope` is unchanged for them. But it left the
   * visitor with no way to see what the three packages cost side by side, which is
   * the first thing anyone comparing builders wants — so the package is now asked,
   * with the derived scope as the floor beneath it.
   *
   * Deliberately optional rather than defaulted: `undefined` is what makes every
   * link shared before today decode to exactly the behaviour it had then.
   */
  packageKey?: PackageKey;
  /**
   * furnitureKey → chosen allowance level. Presence IS selection, like `materials`.
   *
   * Priced additively after the package total, never inside it — a sofa is not in
   * the ₹2,500–3,000/sq ft contract the client publishes, and folding it in would
   * restate the price of everything else. See `constants/furniture.ts`.
   */
  furniture: Record<string, string>;
}

export const DEFAULT_INPUT: EstimatorInput = {
  propertyType: 'residential',
  serviceModel: 'turnkey',
  /**
   * Deliberately 0, not a "typical" value.
   *
   * A prefilled 1,500 sq ft produced a fully-priced quotation on step 1 — before the
   * visitor had told the tool anything. A large, precise number that is not yours is
   * worse than no number: it reads as a quote and it anchors. The meter stays inert
   * until real input arrives.
   */
  areaPerFloor: 0,
  areaUnit: 'sqft',
  floors: 2,
  hasBasement: false,
  hasStilt: false,
  location: 'mansarovar',
  /**
   * Nothing pre-selected, for the same reason `plotArea` is 0.
   *
   * This used to seed `['modular-kitchen', 'false-ceiling']` — a ₹2.85 L lumpsum
   * plus ₹95/sqft charged into the live meter from the first screen, before the
   * visitor had seen the enhancement list at all. On a 2,160 sq ft build that is
   * ~₹4.7 L, roughly a tenth of the estimate, agreed to by nobody. It also meant
   * a default configuration with no plot area still returned ₹2.76 L.
   * Enhancements are now opt-in on the result screen, priced individually.
   */
  enhancements: [],
  /**
   * Empty, and it stays empty until the visitor chooses.
   *
   * The screen used to arrive with fifteen of sixteen materials already ticked,
   * which meant it reported a selection rather than asking for one. Nothing about
   * the model needs a seed: an empty selection prices nothing, and the UI says so
   * rather than rendering ₹0 as though it were an estimate.
   */
  materials: {},
  /** Empty, and it stays empty until the visitor opts in. */
  furniture: {},
};

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

/**
 * The build's scope, derived from what the visitor included — never asked.
 *
 * This is what replaced the finish ladder. "Semi-furnished" is a contract term
 * with a rate band attached; it is not a question a homeowner can answer. But it
 * falls straight out of the materials they chose: if there is no flooring and no
 * paint, the build is structure-only; if there is a modular kitchen, it is fully
 * furnished. The scope then selects the commercial split and the timeline factor.
 */
export function deriveScope(input: EstimatorInput): PackageKey {
  // Interiors-only work is a fit-out: always fully finished, never structure.
  if (input.propertyType === 'interior-only') return 'fully-furnished';

  const chosen = Object.keys(input.materials)
    .map((k) => MATERIAL_LINE_BY_KEY[k])
    .filter(Boolean);
  if (!chosen.length) return 'civil';

  /**
   * Read off the selection, never asked. Picking a kitchen is what makes a build
   * fully furnished; picking only cement and bricks is what makes it structural.
   * Nobody types "semi-furnished" — a contract term with a rate band attached,
   * and not a question a homeowner can answer.
   *
   * The scope is the *cheapest* scope every selected line is valid in — a max of
   * per-line minimums. Two earlier attempts got this wrong: grouping by display
   * group made a water tank imply "semi-furnished" (tanks show under Services but
   * belong on a bare structure too), and testing `!packages.includes(...)` made
   * conduiting imply "fully-furnished" because conduiting is civil-*only*, which
   * is narrower than semi, not broader.
   */
  return chosen.reduce<PackageKey>((scope, line) => {
    const min = SCOPE_ORDER.find((s) => line.packages.includes(s)) ?? 'civil';
    return SCOPE_ORDER.indexOf(min) > SCOPE_ORDER.indexOf(scope) ? min : scope;
  }, 'civil');
}

/** Cheapest scope first. A line's minimum scope is the first of these it allows. */
const SCOPE_ORDER: PackageKey[] = ['civil', 'semi-furnished', 'fully-furnished'];

/**
 * The scope actually priced: never below what the visitor chose, never below what
 * they selected.
 *
 * Taking the max of the two is what makes the promotion honest. Choose Semi
 * Furnished and then add a modular kitchen and you are building a fully furnished
 * house, whatever the button you pressed earlier said — pricing it at the semi
 * rate would apply the wrong commercial split to work that is plainly not
 * semi-furnished. The UI announces the promotion rather than letting it happen
 * silently, but the model cannot let it not happen.
 *
 * It cannot fall, either: removing flooring from a Semi Furnished build leaves you
 * on Semi Furnished with flooring missing, which `missingEssentials` already says
 * out loud. Silently demoting to Civil would reprice the whole estimate because of
 * one deselected row.
 */
export function effectiveScope(input: EstimatorInput): PackageKey {
  if (input.propertyType === 'interior-only') return 'fully-furnished';
  const derived = deriveScope(input);
  if (!input.packageKey) return derived;
  return SCOPE_ORDER.indexOf(derived) > SCOPE_ORDER.indexOf(input.packageKey)
    ? derived
    : input.packageKey;
}

/**
 * The material selection a package fills in when it is chosen.
 *
 * The filter is deliberately identical to the one `check-estimator.ts` uses to
 * build its calibration set (`!isAlternative`, then the package's own scope), so
 * the selection a visitor gets by tapping a package and the selection the rate
 * card is asserted against are provably the same array rather than two things
 * that happen to agree today. Alternatives stay out: nobody tapping "Semi
 * Furnished" has asked for ready-mix.
 */
export function packageDefaults(key: PackageKey): Record<string, string> {
  return Object.fromEntries(
    MATERIAL_LINES.filter((l) => !l.isAlternative && l.packages.includes(key)).map((l) => [
      l.key,
      defaultOption(l).key,
    ]),
  );
}

/** Materials a complete build at this scope needs but the visitor has not picked. */
export function missingEssentials(input: EstimatorInput): typeof MATERIAL_LINES {
  const scope = effectiveScope(input);
  const chosen = activeLines(input, scope);
  const chosenKeys = new Set(chosen.map((l) => l.key));

  /* Anything an active choice supplants is not "missing" — selecting ready-mix
     is a decision about cement, not an omission of it. */
  const supplanted = new Set(chosen.flatMap((l) => l.exclusiveWith ?? []));

  return MATERIAL_LINES.filter(
    (l) =>
      l.essential &&
      l.packages.includes(scope) &&
      !chosenKeys.has(l.key) &&
      !supplanted.has(l.key),
  );
}

/**
 * A one-line description of what was selected, for the result header and PDF.
 *
 * There is no quality tier to name — the visitor picks materials, not a grade —
 * so this reports the shape of the selection instead: how many of the available
 * materials are in, and whether anything standard was left out. Honest where
 * "Signature" was merely convenient.
 */
export function specSummary(input: EstimatorInput): string {
  const active = activeLines(input, effectiveScope(input));
  if (!active.length) return 'Nothing selected yet';

  /* Counted, not compared against a total. A denominator would have to include
     alternatives like ready-mix, so "15 of 16" would report a material as missing
     when the visitor simply chose the other way of buying it. */
  return `${active.length} material${active.length === 1 ? '' : 's'} selected`;
}

/**
 * How far the visitor's selection has moved from the package they chose.
 *
 * Reported rather than renamed. A build that is Semi Furnished plus a modular
 * kitchen is not a fourth package with a fourth rate card — it is Semi Furnished
 * with a change, and saying so keeps the estimate anchored to a scope the client
 * actually publishes a price for. Inventing "Semi Furnished Plus" would put a
 * number on screen with nothing to check it against.
 */
export interface PackageDeviation {
  /** In the build, but not part of the chosen package. */
  added: string[];
  /** Part of the chosen package, but taken out. */
  removed: string[];
  /** Kept, but at a different brand or specification than the package standard. */
  respecified: string[];
  count: number;
  /** "2 changes" — empty when the selection is the package as we standardly build it. */
  summary: string;
}

export function packageDeviation(input: EstimatorInput): PackageDeviation {
  const scope = effectiveScope(input);
  const defaults = packageDefaults(scope);
  const label = (key: string) => MATERIAL_LINE_BY_KEY[key]?.label ?? key;

  /* Compared against what is actually priced, so a line the scope has dropped —
     a kitchen counter once the build became fully furnished — never reads as
     something the visitor removed. */
  const priced = new Set(activeLines(input, scope).map((l) => l.key));

  const added = [...priced].filter((k) => !(k in defaults)).map(label);
  const removed = Object.keys(defaults).filter((k) => !priced.has(k)).map(label);
  const respecified = [...priced]
    .filter((k) => k in defaults && input.materials[k] !== defaults[k])
    .map(label);

  const count = added.length + removed.length + respecified.length;

  return {
    added,
    removed,
    respecified,
    count,
    summary: count === 0 ? '' : `${count} change${count === 1 ? '' : 's'}`,
  };
}

export interface CostHeadResult {
  key: CostHeadKey;
  label: string;
  description: string;
  color: string;
  amount: number;
  percent: number;
}

/** Materials / labour / design / overhead — the split the visitor sees first. */
export interface CommercialHeadResult {
  key: CommercialHeadKey;
  label: string;
  description: string;
  color: string;
  amount: number;
  percent: number;
}

export interface MaterialLineResult {
  key: string;
  label: string;
  group: MaterialGroupKey;
  head: CostHeadKey;
  quantity: number;
  unit: QuantityUnit;
  /** Delivered rate — the graded rate after locality and building-type scaling. */
  unitRate: number;
  amount: number;
  /** The brand or specification this line buys. */
  spec: string;
  /** Which option key was chosen. */
  option: string;
  /** True when the rate is derived rather than published. */
  provisional?: boolean;
  optional?: boolean;
  note?: string;
}

/**
 * One row of the work-head view: the work, as a homeowner names it.
 *
 * A different axis again from the commercial split (materials / labour / design /
 * overhead) and from the construction heads (structure / finishing / MEPF /
 * interiors). Those two answer "what am I paying for?" and "which trade?"; this
 * one answers "what will actually happen on my site, and what does each part of
 * it cost?" — which is the question the client asked for, and the one that makes
 * excavation and shuttering visible without pricing them twice.
 */
export interface WorkHeadResult {
  key: string;
  label: string;
  hindi?: string;
  blurb: string;
  costHead: CostHeadKey;
  amount: number;
  percent: number;
  /** The priced material lines under this head. Empty for labour-and-plant work. */
  lines: MaterialLineResult[];
  /**
   * True when this head buys no branded product at all — excavation, plaster,
   * the site overheads. Surfaced in the UI rather than rendering an empty list,
   * because "no materials shown" and "we forgot to show the materials" look
   * identical otherwise.
   */
  labourAndPlant: boolean;
  detail?: string[];
}

export interface EnhancementResult {
  key: string;
  label: string;
  amount: number;
}

export interface PaymentRow {
  milestone: string;
  trigger: string;
  percent: number;
  amount: number;
}

export interface EstimateResult {
  areaPerFloorSqft: number;
  builtUpArea: number;
  chargeableArea: number;
  effectiveRate: number;
  /** Commercial split — always sums to `total` exactly. */
  commercial: CommercialHeadResult[];
  /** Itemised materials — always sums to the `materials` commercial head exactly. */
  materialLines: MaterialLineResult[];
  /** Sum of the material lines. The number every other figure is derived from. */
  materialsCost: number;
  /** Derived, never asked. Selects the commercial split and the timeline factor. */
  scope: PackageKey;
  /** The work, head by head. Always sums to `total` exactly. */
  workHeads: WorkHeadResult[];
  coreCost: number;
  enhancementsCost: number;
  enhancementBreakdown: EnhancementResult[];
  /** Loose furniture, priced on top of the package. Zero unless opted into. */
  furnitureCost: number;
  furnitureBreakdown: EnhancementResult[];
  total: number;
  min: number;
  max: number;
  perSqft: number;
  heads: CostHeadResult[];
  /**
   * Still computed, but no longer shown anywhere on the estimator.
   *
   * The programme card, the hero line, the meter row and the PDF bars were all
   * removed at the client's request. This survives because every lead record
   * carries it — `EstimateRequest.timelineWeeks` is required by the API and
   * non-null in the database, and the estimates module in /admin displays
   * it — so dropping it would break lead submission, not just hide a number.
   */
  timelineWeeks: number;
  payments: PaymentRow[];
  assumptions: string[];
  labels: {
    propertyType: string;
    packageLabel: string;
    packageHeadline: string;
    /** True when the visitor tapped this package rather than it being derived. */
    packageChosen: boolean;
    /** "2 changes", or empty when the selection is the package as standard. */
    packageDeviation: string;
    quality: string;
    location: string;
    locationZone: string;
    serviceModel: string;
    floors: string;
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function toSqft(area: number, unit: AreaUnit): number {
  const match = AREA_UNITS.find((u) => u.key === unit);
  return area * (match?.toSqft ?? 1);
}

export function floorLabel(floors: number, basement: boolean, stilt: boolean): string {
  const core = floors <= 1 ? 'Ground' : `Ground + ${floors - 1}`;
  const extras = [basement && 'basement', stilt && 'stilt'].filter(Boolean).join(' + ');
  return extras ? `${core} (with ${extras})` : core;
}

/**
 * Chargeable area accounts for basement (more expensive per sqft — excavation,
 * retaining, waterproofing) and stilt (much cheaper — no walls, no finishing).
 * Both are expressed as *equivalent* sqft so a single rate can be applied.
 *
 * The footprint is now the per-floor area the visitor typed, not a coverage
 * ratio applied to a plot — so basement and stilt price against a real number
 * rather than an assumed one.
 */
function computeAreas(input: EstimatorInput) {
  const areaPerFloorSqft = toSqft(input.areaPerFloor, input.areaUnit);

  // Interior-only work is priced on the area given, not on area × floors.
  if (input.propertyType === 'interior-only') {
    return {
      areaPerFloorSqft,
      builtUpArea: areaPerFloorSqft,
      chargeableArea: areaPerFloorSqft,
      footprint: areaPerFloorSqft,
    };
  }

  const builtUpArea = areaPerFloorSqft * input.floors;

  let chargeable = builtUpArea;
  if (input.hasBasement) chargeable += areaPerFloorSqft * MODEL.basementFactor;
  if (input.hasStilt) chargeable += areaPerFloorSqft * MODEL.stiltFactor;

  return { areaPerFloorSqft, builtUpArea, chargeableArea: chargeable, footprint: areaPerFloorSqft };
}

/**
 * The materials actually priced, after opt-ins, opt-outs and mutual exclusion.
 *
 * Extracted because three callers need the identical answer — the pricing, the
 * summary label, and the selector UI. Duplicating the filter is how a screen and
 * its own total end up disagreeing about what is in the build.
 */
export function activeLines(input: EstimatorInput, scope: PackageKey) {
  const active = MATERIAL_LINES.filter(
    (l) => l.packages.includes(scope) && l.key in input.materials,
  );

  /**
   * Mutual exclusion, resolved in favour of the alternative.
   *
   * Ready-mix and site-mixed cement + sand + aggregate are the same concrete
   * bought two ways. If a visitor selects both — easy enough, they are separate
   * rows — pricing them together charges for the same cubic metre twice, which is
   * what a competitor's calculator does today.
   *
   * Only lines marked `isAlternative` supplant. Letting every line supplant its
   * partners annihilated both sides: cement dropped ready-mix while ready-mix
   * dropped cement, and a selection containing all four priced none of them.
   */
  const supplanted = new Set(
    active.filter((l) => l.isAlternative).flatMap((l) => l.exclusiveWith ?? []),
  );

  return active.filter((l) => !supplanted.has(l.key));
}

/**
 * Materials, priced directly.
 *
 * This is now the *primary* calculation, not a decoration on one. Quantity comes
 * from the published thumb-rule coefficient; rate comes from the grade the
 * visitor picked, scaled for locality and building type. Nothing is normalised,
 * because there is no longer a top-down pool to normalise into — the pool is
 * derived from this sum, not the other way round.
 *
 * The previous design could not work once materials became selectable: a
 * normalisation factor sized to make the lines fit a package-rate pool would have
 * silently absorbed every grade change, so picking imported marble moved nothing.
 */
function computeMaterials(
  input: EstimatorInput,
  chargeableArea: number,
  scope: PackageKey,
  rateScale: number,
): MaterialLineResult[] {
  return activeLines(input, scope).map((line) => {
    const option = optionOf(line, input.materials[line.key]);
    /**
     * Quantities are rounded here, in the model, not at the point of display.
     *
     * Rounding only on screen produced a breakdown that failed its own
     * arithmetic: 9.6 doors rendered as "10 nos @ ₹12,264" against an amount of
     * ₹1,17,731, so a reader who multiplied the two columns was out by 4% — the
     * exact defect this design exists to prevent, reintroduced one layer up.
     * Rounding first is also the truthful model: nobody buys 9.6 doors.
     */
    const quantity = Math.round(line.coefficient * chargeableArea);
    const unitRate = option.rate * rateScale;

    return {
      key: line.key,
      label: line.label,
      group: line.group,
      head: line.head,
      quantity,
      unit: line.unit,
      unitRate,
      amount: quantity * unitRate,
      spec: option.detail ? `${option.label} — ${option.detail}` : option.label,
      option: option.key,
      ...(option.provisional && { provisional: true }),
      note: line.note,
    };
  });
}

/**
 * Work heads — a re-partition of the total, never an addition to it.
 *
 *   pool         = total − Σ(claimed material lines) − enhancementsCost
 *   amount(head) = Σ(its priced lines) + pool × weight / Σ(active weights)
 *
 * Because the weights are normalised over whatever is active, the identity
 *
 *   Σ workHeads ≡ Σ claimed lines + pool + enhancementsCost ≡ total
 *
 * holds for every selection, every locality and every area. `materialsCost` is
 * untouched, so `total` is untouched, so the published rate card is untouched —
 * which is the whole reason excavation and shuttering are heads here rather than
 * material lines. Their cost is already inside the labour and overhead shares of
 * the total; adding them as lines would charge for the same work twice and push
 * ₹/sq ft outside the client's published band.
 *
 * Enhancements get their own row rather than being spread across the heads. A
 * lift is not part of the staircase, and the row then reads the same number the
 * "Selected enhancements" card does.
 */
function computeWorkHeads(args: {
  materialLines: MaterialLineResult[];
  total: number;
  scope: PackageKey;
  enhancementsCost: number;
  furnitureCost: number;
  labourOnly: boolean;
}): WorkHeadResult[] {
  const { materialLines, total, scope, enhancementsCost, furnitureCost, labourOnly } = args;
  if (!(total > 0)) return [];

  const byKey = new Map(materialLines.map((l) => [l.key, l]));

  /**
   * A head is live when it is in scope and something it covers is actually being
   * built. Under a labour-only contract there are no material lines at all, so
   * that test would silently drop brickwork and the RCC frame from a contract
   * that plainly includes them — every in-scope head stays live instead.
   */
  const isActive = (head: WorkHead) =>
    labourOnly || head.materialKeys.length === 0 || head.materialKeys.some((k) => byKey.has(k));

  const active = WORK_HEADS.filter((h) => headInPackage(h, scope) && isActive(h));
  const weightSum = active.reduce((sum, h) => sum + h.labourWeight, 0);

  /* Claimed from the lines actually priced, so an unclaimed line — an
     enhancement's material fraction — never lands inside a construction head. */
  const claimed = active.flatMap((h) => h.materialKeys.map((k) => byKey.get(k)).filter(Boolean) as MaterialLineResult[]);
  const claimedCost = claimed.reduce((sum, l) => sum + l.amount, 0);
  const pool = total - claimedCost - enhancementsCost - furnitureCost;

  const rows: WorkHeadResult[] = active.map((head) => {
    const lines = head.materialKeys.map((k) => byKey.get(k)).filter(Boolean) as MaterialLineResult[];
    const amount =
      lines.reduce((sum, l) => sum + l.amount, 0) +
      (weightSum > 0 ? (pool * head.labourWeight) / weightSum : 0);

    return {
      key: head.key,
      label: head.label,
      ...(head.hindi && { hindi: head.hindi }),
      blurb: head.blurb,
      costHead: head.costHead,
      amount,
      percent: (amount / total) * 100,
      lines,
      labourAndPlant: head.materialKeys.length === 0,
      ...(head.detail && { detail: head.detail }),
    };
  });

  if (furnitureCost > 0) {
    rows.push({
      key: 'furnishing',
      label: 'Furniture & decor',
      hindi: 'फ़र्नीचर और सजावट',
      blurb: 'Loose furniture, curtains, decorative lighting and appliances you chose',
      costHead: 'interior',
      amount: furnitureCost,
      percent: (furnitureCost / total) * 100,
      lines: [],
      labourAndPlant: false,
    });
  }

  if (enhancementsCost > 0) {
    rows.push({
      key: 'extras',
      label: 'Optional extras',
      hindi: 'अतिरिक्त काम',
      blurb: 'Whole systems and works outside the building envelope that you added',
      costHead: 'misc',
      amount: enhancementsCost,
      percent: (enhancementsCost / total) * 100,
      lines: [],
      labourAndPlant: false,
    });
  }

  return rows;
}

function enhancementAmount(
  key: string,
  ctx: { chargeableArea: number; floors: number },
): EnhancementResult | null {
  const def = ENHANCEMENTS.find((e) => e.key === key);
  if (!def) return null;

  let amount = 0;
  if (def.pricingModel === 'per-sqft') amount = def.unitPrice * ctx.chargeableArea;
  else if (def.pricingModel === 'per-floor') amount = def.unitPrice * Math.max(1, ctx.floors - 1);
  else amount = def.unitPrice;

  return { key: def.key, label: def.label, amount };
}

/** Bedrooms, on the same rule the wardrobe line uses, so the two cannot disagree. */
export function bedroomCount(chargeableArea: number): number {
  return Math.max(1, Math.round(BEDROOM_PER_SQFT * chargeableArea));
}

/**
 * Loose furniture, priced like an enhancement rather than like a material.
 *
 * Additive and after the fact, for the reason set out in `constants/furniture.ts`:
 * the fully-furnished rate card prices fixed joinery, and a bed is not in it.
 * Everything here is an allowance, so there is no quantity × brand-rate to
 * itemise — the number the visitor picks IS the number.
 */
function computeFurniture(
  input: EstimatorInput,
  chargeableArea: number,
): EnhancementResult[] {
  /* Under a labour-only contract the client buys the furniture themselves, the
     same reasoning that excludes enhancements there. */
  if (input.serviceModel === 'labour-only') return [];

  return FURNITURE_LINES.filter((line) => line.key in input.furniture).map((line: FurnitureLine) => {
    const option = furnitureOptionOf(line, input.furniture[line.key]);
    const amount =
      line.pricingModel === 'per-sqft'
        ? option.rate * chargeableArea
        : line.pricingModel === 'per-bedroom'
          ? option.rate * bedroomCount(chargeableArea)
          : option.rate;

    return { key: line.key, label: line.label, amount };
  });
}

function computeTimeline(input: EstimatorInput, builtUpArea: number, packageKey: PackageKey): number {
  const { baseWeeks, weeksPerThousandSqft, weeksPerFloor, packageFactor, min, max } = MODEL.timeline;

  if (input.propertyType === 'interior-only') {
    // Fit-outs are a different curve entirely: ~12–20 weeks, area-driven only.
    return Math.round(Math.max(10, Math.min(24, 10 + (builtUpArea / 1000) * 3.4)));
  }

  const raw =
    (baseWeeks + (builtUpArea / 1000) * weeksPerThousandSqft + (input.floors - 1) * weeksPerFloor) *
    (packageFactor[packageKey] ?? 1);

  return Math.round(Math.max(min, Math.min(max, raw)));
}

/* ------------------------------------------------------------------ */
/* The estimate                                                        */
/* ------------------------------------------------------------------ */


export function calculateEstimate(input: EstimatorInput): EstimateResult {
  const location = LOCATIONS.find((l) => l.key === input.location) ?? LOCATIONS[0]!;
  const propertyType = PROPERTY_TYPES.find((p) => p.key === input.propertyType) ?? PROPERTY_TYPES[0]!;

  const { areaPerFloorSqft, builtUpArea, chargeableArea } = computeAreas(input);

  const scope = effectiveScope(input);
  const pkg = PACKAGES.find((p) => p.key === scope) ?? PACKAGES[1]!;
  const split = COST_SPLIT[scope];

  /** Locality and building type still scale every rate; nothing else does. */
  const rateScale = location.multiplier * propertyType.factor;

  const materialLines = computeMaterials(input, chargeableArea, scope, rateScale);
  const materialsCost = materialLines.reduce((sum, l) => sum + l.amount, 0);

  /**
   * THE INVERSION.
   *
   * Materials are known; everything else is derived from them. Previously the
   * package rate produced a total and materials were normalised into a share of
   * it, which meant a material choice could not move the number — the factor
   * absorbed it. Dividing by the share runs the same relationship the other way.
   *
   * `npm run check:estimator` asserts that at Standard grade this reproduces the
   * client's published rate card for every scope, which is the evidence that
   * inverting the direction did not invent a different price list.
   */
  const coreTotal = materialsCost / split.materials;

  // Enhancements are a turnkey concept — under a labour-only contract the client
  // buys these materials directly, so we exclude them rather than double-count.
  const enhancementBreakdown =
    input.serviceModel === 'labour-only'
      ? []
      : input.enhancements
          .map((key) => enhancementAmount(key, { chargeableArea, floors: input.floors }))
          .filter((x): x is EnhancementResult => x !== null);

  const enhancementsCost = enhancementBreakdown.reduce((sum, e) => sum + e.amount, 0);

  const furnitureBreakdown = computeFurniture(input, chargeableArea);
  const furnitureCost = furnitureBreakdown.reduce((sum, f) => sum + f.amount, 0);

  /**
   * Labour-only: the client procures materials, so we charge the rate card's
   * labour-only rate directly and there is no material cost of ours to itemise.
   */
  const labourOnly = input.serviceModel === 'labour-only';
  const total = labourOnly
    ? chargeableArea * pkg.labourOnlyRate * rateScale
    : coreTotal + enhancementsCost + furnitureCost;

  const effectiveRate = chargeableArea > 0 ? total / chargeableArea : 0;

  /* Head-wise split: package weights applied to the total, enhancements moved to
     their own declared head, so the breakdown always reconciles. */
  const headBase = total - enhancementsCost - furnitureCost;
  const headAmounts = COST_HEADS.reduce<Record<CostHeadKey, number>>(
    (acc, head) => {
      acc[head.key] = headBase * (pkg.weights[head.key] ?? 0);
      return acc;
    },
    { structure: 0, finishing: 0, mep: 0, interior: 0, misc: 0 },
  );

  for (const item of enhancementBreakdown) {
    const def = ENHANCEMENTS.find((e) => e.key === item.key);
    if (def) headAmounts[def.head] += item.amount;
  }

  /* Loose furniture is interiors, wherever the package sits. */
  headAmounts.interior += furnitureCost;

  const heads: CostHeadResult[] = COST_HEADS.map((head) => ({
    ...head,
    amount: headAmounts[head.key],
    percent: total > 0 ? (headAmounts[head.key] / total) * 100 : 0,
  })).filter((h) => h.amount > 0);

  /**
   * Enhancements join the material breakdown at their material share.
   *
   * Without this the itemised lines would sum to `materialsCost` while the
   * Materials head reads `total × split.materials` — which is larger, because the
   * total now carries enhancements too. Adding them here is what keeps the
   * identity exact:
   *
   *   total × split.materials  ≡  materialsCost + Σ(enhancement × split.materials)
   *
   * A lift and a solar array really do contain materials; showing them in the
   * material list at their material fraction is both truthful and what makes the
   * column add up.
   */
  const enhancementLines: MaterialLineResult[] = enhancementBreakdown.map((item) => ({
    key: `enh-${item.key}`,
    label: item.label,
    group: 'fixtures' as const,
    head: ENHANCEMENTS.find((e) => e.key === item.key)?.head ?? 'misc',
    quantity: 1,
    unit: 'nos' as const,
    unitRate: item.amount * split.materials,
    amount: item.amount * split.materials,
    spec: 'Material content of this add-on',
    option: 'included',
    optional: true,
  }));

  /* Same identity as the enhancement lines above: the Materials head reads
     `total × split.materials`, and the total now carries furniture too, so the
     furniture's material fraction has to appear in the itemised column or the
     column stops equalling the head it belongs to. A sofa really is mostly
     material. */
  const furnitureLines: MaterialLineResult[] = furnitureBreakdown.map((item) => ({
    key: `fur-${item.key}`,
    label: item.label,
    group: 'fixtures' as const,
    head: 'interior' as const,
    quantity: 1,
    unit: 'nos' as const,
    unitRate: item.amount * split.materials,
    amount: item.amount * split.materials,
    spec: 'Material content of this furnishing',
    option: 'included',
    optional: true,
  }));

  const allMaterialLines = labourOnly ? [] : [...materialLines, ...enhancementLines, ...furnitureLines];

  /**
   * Commercial split. `COST_SPLIT` rows sum to 1, so the four heads always
   * reconcile to the total exactly.
   *
   * Labour-only gets its own split rather than the turnkey one: the client buys
   * every material themselves, so reporting "Materials 56%" against an invoice
   * that contains no materials would be plainly false.
   */
  const LABOUR_ONLY_SPLIT: Record<CommercialHeadKey, number> = {
    materials: 0,
    labour: 0.72,
    design: 0.18,
    overhead: 0.1,
  };
  const shownSplit = labourOnly ? LABOUR_ONLY_SPLIT : split;

  const commercial: CommercialHeadResult[] = COMMERCIAL_HEADS.map((head) => ({
    ...head,
    amount: total * shownSplit[head.key],
    percent: shownSplit[head.key] * 100,
  })).filter((h) => h.amount > 0);

  const workHeads = computeWorkHeads({
    materialLines: allMaterialLines,
    total,
    scope,
    enhancementsCost,
    furnitureCost,
    labourOnly,
  });

  const timelineWeeks = computeTimeline(input, builtUpArea, scope);

  const payments: PaymentRow[] = PAYMENT_SCHEDULE.map((row) => ({
    milestone: row.milestone,
    trigger: row.trigger,
    percent: row.percent,
    amount: (total * row.percent) / 100,
  }));

  return {
    areaPerFloorSqft,
    builtUpArea,
    chargeableArea,
    effectiveRate,
    commercial,
    materialLines: allMaterialLines,
    materialsCost,
    scope,
    workHeads,
    coreCost: coreTotal,
    enhancementsCost,
    enhancementBreakdown,
    furnitureCost,
    furnitureBreakdown,
    total,
    min: total * MODEL.rangeLow,
    max: total * MODEL.rangeHigh,
    perSqft: chargeableArea > 0 ? total / chargeableArea : 0,
    heads,
    timelineWeeks,
    payments,
    assumptions:
      input.serviceModel === 'labour-only' ? [MODEL.labourOnlyNote, ...ASSUMPTIONS] : ASSUMPTIONS,
    labels: {
      propertyType: propertyType.label,
      packageLabel: pkg.label,
      packageHeadline: pkg.headline,
      packageChosen: Boolean(input.packageKey),
      packageDeviation: packageDeviation(input).summary,
      quality: specSummary(input),
      location: location.label,
      locationZone: location.zone,
      serviceModel: input.serviceModel === 'turnkey' ? 'Turnkey (all-inclusive)' : 'Labour only',
      floors: floorLabel(input.floors, input.hasBasement, input.hasStilt),
    },
  };
}

/* ------------------------------------------------------------------ */
/* The three packages, priced side by side                             */
/* ------------------------------------------------------------------ */

export interface PackageComparison {
  key: PackageKey;
  pkg: PackageOption;
  /** The selection this package fills in when chosen. */
  defaults: Record<string, string>;
  result: EstimateResult;
  /** Hoisted from `result` because the card reads them directly. */
  total: number;
  perSqft: number;
  workHeads: WorkHeadResult[];
  /** True when this is the package the visitor is on. */
  current: boolean;
  /** ₹ against the current package — or against Civil Work before one is chosen. */
  delta: number;
}

/**
 * All three packages, at this visitor's area and locality, at our standard spec.
 *
 * Every card is priced from `packageDefaults`, including the one the visitor is
 * already on, so the three numbers are a like-for-like comparison rather than
 * three differently-customised builds. Once a package is chosen the result screen
 * shows their own number; this screen answers the narrower question of what the
 * three scopes cost as we normally build them.
 *
 * Enhancements are held out for the same reason: a lift added on one package
 * would make it look more expensive as a *scope*, which is not what the
 * comparison is for. The service model is carried through, because a labour-only
 * contract has three genuinely different rates.
 *
 * Calling `calculateEstimate` three times per render is free — the check script
 * runs 36,864 of them in well under a second. This exists for cohesion, not
 * speed: three screens need this identical answer (the package cards, the
 * locality band on step one, and the upgrade nudge on the result), and computing
 * it three ways is how they end up disagreeing on screen.
 */
export function comparePackages(input: EstimatorInput): PackageComparison[] {
  const current = input.packageKey;

  const rows = PACKAGES.map((pkg) => {
    const defaults = packageDefaults(pkg.key);
    const result = calculateEstimate({
      ...input,
      packageKey: pkg.key,
      materials: defaults,
      /* Held out for the same reason: a lift or a sofa added on one package would
         make it look more expensive as a *scope*, which is not the comparison. */
      enhancements: [],
      furniture: {},
    });

    return {
      key: pkg.key,
      pkg,
      defaults,
      result,
      total: result.total,
      perSqft: result.perSqft,
      workHeads: result.workHeads,
      current: pkg.key === current,
      delta: 0,
    };
  });

  /* Before a package is chosen, everything reads as "₹X more than Civil Work" —
     the cheapest scope is the only baseline that needs no explanation. */
  const base = rows.find((r) => r.current)?.total ?? rows[0]?.total ?? 0;

  return rows.map((r) => ({ ...r, delta: r.total - base }));
}

/**
 * Legacy `?pkg=` / `?tier=` links resolve onto an equivalent material selection
 * rather than 404ing on a concept that no longer exists. A link that promised
 * "Bespoke" should still land on a fully furnished build.
 */
const LEGACY_PRESETS: Record<string, MaterialGroupKey[]> = {
  civil: ['structure', 'services'],
  'grey-structure': ['structure', 'services'],
  essential: ['structure', 'finishing', 'services'],
  'semi-furnished': ['structure', 'finishing', 'services'],
  signature: ['structure', 'finishing', 'services'],
  'fully-furnished': ['structure', 'finishing', 'services', 'fixtures'],
  bespoke: ['structure', 'finishing', 'services', 'fixtures'],
};

/** What each legacy link was promising, in the vocabulary the estimator now asks in. */
const LEGACY_PACKAGES: Record<string, PackageKey> = {
  civil: 'civil',
  'grey-structure': 'civil',
  essential: 'semi-furnished',
  'semi-furnished': 'semi-furnished',
  signature: 'semi-furnished',
  'fully-furnished': 'fully-furnished',
  bespoke: 'fully-furnished',
};

function applyLegacyPreset(name: string): Partial<EstimatorInput> | null {
  const groups = LEGACY_PRESETS[name];
  if (!groups) return null;

  /* Exclusive alternatives stay out: a legacy link never asked for ready-mix. */
  const lines = MATERIAL_LINES.filter((l) => groups.includes(l.group) && !l.exclusiveWith?.length);
  return { materials: Object.fromEntries(lines.map((l) => [l.key, defaultOption(l).key])) };
}

/** Deep-linkable estimator state: /estimator?type=residential&floorArea=1200… */
export function encodeInput(input: EstimatorInput): string {
  const params = new URLSearchParams({
    type: input.propertyType,
    model: input.serviceModel,
    floorArea: String(input.areaPerFloor),
    unit: input.areaUnit,
    floors: String(input.floors),
    loc: input.location,
  });
  /* `p`, not `pkg`. The legacy `pkg` key runs applyLegacyPreset, which overwrites
     the whole material map — and this function's output is fed straight back
     through history.replaceState on every keystroke, so reusing the key would
     wipe the visitor's brand choices on the next render. */
  if (input.packageKey) params.set('p', input.packageKey);
  const packedFurniture = Object.entries(input.furniture)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  if (packedFurniture) params.set('f', packedFurniture);
  if (input.hasBasement) params.set('basement', '1');
  if (input.hasStilt) params.set('stilt', '1');
  if (input.enhancements.length) params.set('add', input.enhancements.join(','));
  const packed = Object.entries(input.materials)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  if (packed) params.set('m', packed);

  return params.toString();
}

export function decodeInput(search: string): Partial<EstimatorInput> {
  const params = new URLSearchParams(search);
  const out: Partial<EstimatorInput> = {};

  const type = params.get('type');
  if (type && PROPERTY_TYPES.some((p) => p.key === type)) out.propertyType = type as PropertyTypeKey;

  const model = params.get('model');
  if (model === 'turnkey' || model === 'labour-only') out.serviceModel = model;

  const unit = params.get('unit');
  if (unit && AREA_UNITS.some((u) => u.key === unit)) out.areaUnit = unit as AreaUnit;

  const floors = Number(params.get('floors'));
  if (Number.isFinite(floors) && floors >= 1 && floors <= 5) out.floors = floors;

  const floorArea = Number(params.get('floorArea'));
  if (Number.isFinite(floorArea) && floorArea > 0) {
    out.areaPerFloor = floorArea;
  } else {
    /**
     * Legacy `?area=` carried the *plot* area, from which built-up was derived as
     * plot × coverage × floors. Convert rather than drop it: an inbound link that
     * silently reset to zero would look like the estimator had lost the visitor's
     * answer. `MODEL.defaultBuiltUpRatio` survives for exactly this one purpose.
     */
    const legacyPlot = Number(params.get('area'));
    if (Number.isFinite(legacyPlot) && legacyPlot > 0) {
      const ratio = Number(params.get('ratio'));
      const coverage = Number.isFinite(ratio) && ratio > 0.2 && ratio <= 1 ? ratio : MODEL.defaultBuiltUpRatio;
      out.areaPerFloor = legacyPlot * coverage;
    }
  }

  /* Legacy `?tier=` / `?pkg=` from the pricing cards — still linked from PackageCard. */
  const legacy = params.get('tier') ?? params.get('pkg');
  if (legacy) Object.assign(out, applyLegacyPreset(legacy) ?? {});

  /* A legacy link promised a scope as well as a selection; now that the package is
     an answerable question, honour the promise by pre-answering it. */
  const legacyPackage = legacy ? LEGACY_PACKAGES[legacy] : undefined;
  if (legacyPackage) out.packageKey = legacyPackage;

  /*
   * Read before `m`, so an explicit material list in the same URL still wins.
   * A link carrying both is a shared configuration, not a fresh package choice.
   */
  const p = params.get('p');
  if (p && PACKAGES.some((x) => x.key === p)) {
    out.packageKey = p as PackageKey;
    out.materials = packageDefaults(p as PackageKey);
  }

  const m = params.get('m');
  if (m) {
    const materials: Record<string, string> = {};
    for (const pair of m.split(',')) {
      const [key, optionKey] = pair.split(':');
      const line = key ? MATERIAL_LINE_BY_KEY[key] : undefined;
      if (line && optionKey && line.options.some((o) => o.key === optionKey)) {
        materials[key!] = optionKey;
      }
    }
    if (Object.keys(materials).length) out.materials = materials;
  }

  const f = params.get('f');
  if (f) {
    const furniture: Record<string, string> = {};
    for (const pair of f.split(',')) {
      const [key, optionKey] = pair.split(':');
      const line = key ? FURNITURE_LINE_BY_KEY[key] : undefined;
      if (line && optionKey && line.options.some((o) => o.key === optionKey)) {
        furniture[key!] = optionKey;
      }
    }
    if (Object.keys(furniture).length) out.furniture = furniture;
  }

  const loc = params.get('loc');
  if (loc && LOCATIONS.some((l) => l.key === loc)) out.location = loc;

  if (params.get('basement') === '1') out.hasBasement = true;
  if (params.get('stilt') === '1') out.hasStilt = true;

  const add = params.get('add');
  if (add) out.enhancements = add.split(',').filter((k) => ENHANCEMENTS.some((e) => e.key === k));

  return out;
}

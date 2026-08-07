import {
  AREA_UNITS,
  ASSUMPTIONS,
  COST_HEADS,
  ENHANCEMENTS,
  LOCATIONS,
  MODEL,
  PACKAGES,
  PAYMENT_SCHEDULE,
  PROPERTY_TYPES,
  QUALITY_TIERS,
  TIMELINE_PHASES,
  type AreaUnit,
  type CostHeadKey,
  type PackageKey,
  type PropertyTypeKey,
  type QualityKey,
  type ServiceModel,
} from '@/constants/estimator';
import {
  MATERIAL_CATEGORIES,
  QUANTIFIED_AT_BOQ,
  type MaterialGroup,
  type RateUnit,
} from '@/constants/materials';

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface EstimatorInput {
  propertyType: PropertyTypeKey;
  serviceModel: ServiceModel;
  plotArea: number;
  areaUnit: AreaUnit;
  builtUpRatio: number;
  floors: number;
  hasBasement: boolean;
  hasStilt: boolean;
  packageKey: PackageKey;
  quality: QualityKey;
  location: string;
  enhancements: string[];
  /** 'recommended' uses the chosen quality tier as-is; 'custom' opens the material picker. */
  materialMode: 'recommended' | 'custom';
  /** categoryId -> { groupOrBrandKey: optionName } — mirrors the source calculator's shape. */
  materials: Record<string, Record<string, string>>;
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
  plotArea: 0,
  areaUnit: 'sqft',
  builtUpRatio: MODEL.defaultBuiltUpRatio,
  floors: 2,
  hasBasement: false,
  hasStilt: false,
  packageKey: 'semi-furnished',
  quality: 'signature',
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
  materialMode: 'recommended',
  materials: {},
};

/* ------------------------------------------------------------------ */
/* Output                                                              */
/* ------------------------------------------------------------------ */

export interface CostHeadResult {
  key: CostHeadKey;
  label: string;
  description: string;
  color: string;
  amount: number;
  percent: number;
}

export interface EnhancementResult {
  key: string;
  label: string;
  amount: number;
}

export interface TimelinePhase {
  key: string;
  label: string;
  weeks: number;
  startWeek: number;
  sharePercent: number;
}

export interface PaymentRow {
  milestone: string;
  trigger: string;
  percent: number;
  amount: number;
}

export interface SpecLine {
  category: string;
  group: string;
  choice: string;
  priceLabel?: string;
  /** Signed delta against the group's baseline. 0 when quantified at BOQ. */
  delta: number;
  quantifiedAtBoq: boolean;
  unit?: RateUnit;
}

export interface EstimateResult {
  plotAreaSqft: number;
  builtUpArea: number;
  chargeableArea: number;
  effectiveRate: number;
  coreCost: number;
  enhancementsCost: number;
  enhancementBreakdown: EnhancementResult[];
  /** Net effect of the material specification vs. the package's standard spec. */
  specAdjustment: number;
  specSchedule: SpecLine[];
  specDeferredCount: number;
  contingency: number;
  total: number;
  min: number;
  max: number;
  perSqft: number;
  heads: CostHeadResult[];
  timelineWeeks: number;
  phases: TimelinePhase[];
  payments: PaymentRow[];
  assumptions: string[];
  labels: {
    propertyType: string;
    packageLabel: string;
    packageHeadline: string;
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
 */
function computeAreas(input: EstimatorInput) {
  const plotAreaSqft = toSqft(input.plotArea, input.areaUnit);

  // Interior-only work is priced on the carpet/built-up area given, not on plot × floors.
  if (input.propertyType === 'interior-only') {
    return { plotAreaSqft, builtUpArea: plotAreaSqft, chargeableArea: plotAreaSqft, footprint: plotAreaSqft };
  }

  const footprint = plotAreaSqft * input.builtUpRatio;
  const builtUpArea = footprint * input.floors;

  let chargeable = builtUpArea;
  if (input.hasBasement) chargeable += footprint * MODEL.basementFactor;
  if (input.hasStilt) chargeable += footprint * MODEL.stiltFactor;

  return { plotAreaSqft, builtUpArea, chargeableArea: chargeable, footprint };
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

function computeTimeline(input: EstimatorInput, builtUpArea: number): number {
  const { baseWeeks, weeksPerThousandSqft, weeksPerFloor, packageFactor, min, max } = MODEL.timeline;

  if (input.propertyType === 'interior-only') {
    // Fit-outs are a different curve entirely: ~12–20 weeks, area-driven only.
    return Math.round(Math.max(10, Math.min(24, 10 + (builtUpArea / 1000) * 3.4)));
  }

  const raw =
    (baseWeeks + (builtUpArea / 1000) * weeksPerThousandSqft + (input.floors - 1) * weeksPerFloor) *
    (packageFactor[input.packageKey] ?? 1);

  return Math.round(Math.max(min, Math.min(max, raw)));
}

/* ------------------------------------------------------------------ */
/* The estimate                                                        */
/* ------------------------------------------------------------------ */


/**
 * Material specification → cost delta.
 *
 * Prices the *difference* from each group's baseline, because the package rate
 * already carries a standard specification. Groups priced per RFT/TON/CUM/NOS need a
 * drawing-based take-off, so they are listed in the schedule but contribute 0 to the
 * headline — flagged via `quantifiedAtBoq`.
 */
function computeSpecification(
  input: EstimatorInput,
  builtUpArea: number,
): { adjustment: number; schedule: SpecLine[]; deferred: number; byHead: Partial<Record<CostHeadKey, number>> } {
  const schedule: SpecLine[] = [];
  const byHead: Partial<Record<CostHeadKey, number>> = {};
  let adjustment = 0;
  let deferred = 0;

  if (input.materialMode !== 'custom') return { adjustment, schedule, deferred, byHead };

  const priceGroup = (categoryLabel: string, group: MaterialGroup, choiceName: string) => {
    const chosen = group.options.find((o) => o.name === choiceName);
    if (!chosen) return;

    const base = group.options.find((o) => o.name === group.baseline);
    const boqUnit = chosen.unit ? QUANTIFIED_AT_BOQ.includes(chosen.unit) : false;

    let delta = 0;

    if (chosen.unit === 'lumpsum') {
      delta = (chosen.rate ?? 0) - (base?.rate ?? 0);
    } else if (chosen.unit === 'sqft' && group.coverage) {
      delta = ((chosen.rate ?? 0) - (base?.rate ?? 0)) * group.coverage * builtUpArea;
    }

    if (boqUnit) deferred += 1;
    if (delta !== 0) {
      adjustment += delta;
      byHead[group.head] = (byHead[group.head] ?? 0) + delta;
    }

    schedule.push({
      category: categoryLabel,
      group: group.name,
      choice: chosen.name,
      priceLabel: chosen.priceLabel,
      delta,
      quantifiedAtBoq: boqUnit,
      unit: chosen.unit,
    });
  };

  for (const category of MATERIAL_CATEGORIES) {
    const picked = input.materials[category.id];
    if (!picked) continue;

    const brand = picked['brand'];
    if (brand && category.brands?.some((b) => b.name === brand)) {
      schedule.push({ category: category.label, group: 'Brand', choice: brand, delta: 0, quantifiedAtBoq: false });
    }

    for (const group of category.groups ?? []) {
      const choice = picked[group.name];
      if (choice) priceGroup(category.label, group, choice);
    }
  }

  return { adjustment, schedule, deferred, byHead };
}

export function calculateEstimate(input: EstimatorInput): EstimateResult {
  const pkg = PACKAGES.find((p) => p.key === input.packageKey) ?? PACKAGES[1]!;
  const quality = QUALITY_TIERS.find((q) => q.key === input.quality) ?? QUALITY_TIERS[1]!;
  const location = LOCATIONS.find((l) => l.key === input.location) ?? LOCATIONS[0]!;
  const propertyType = PROPERTY_TYPES.find((p) => p.key === input.propertyType) ?? PROPERTY_TYPES[0]!;

  const { plotAreaSqft, builtUpArea, chargeableArea } = computeAreas(input);

  const baseRate =
    input.serviceModel === 'labour-only' ? pkg.labourOnlyRate : (pkg.minRate + pkg.maxRate) / 2;

  const effectiveRate = baseRate * quality.multiplier * location.multiplier * propertyType.factor;
  const coreCost = chargeableArea * effectiveRate;

  // Enhancements are a turnkey concept — under a labour-only contract the client
  // buys these materials directly, so we exclude them rather than double-count.
  const enhancementBreakdown =
    input.serviceModel === 'labour-only'
      ? []
      : input.enhancements
          .map((key) => enhancementAmount(key, { chargeableArea, floors: input.floors }))
          .filter((x): x is EnhancementResult => x !== null);

  const enhancementsCost = enhancementBreakdown.reduce((sum, e) => sum + e.amount, 0);

  const spec = computeSpecification(input, builtUpArea);
  // Labour-only contracts exclude material cost entirely, so spec deltas do not apply.
  const specAdjustment = input.serviceModel === 'labour-only' ? 0 : spec.adjustment;

  const subtotal = coreCost + enhancementsCost + specAdjustment;
  const contingency = subtotal * MODEL.contingency;
  const total = subtotal + contingency;

  /* Head-wise split: package weights applied to the core, enhancements added to
     their own declared head, so the breakdown always reconciles to the total. */
  const headAmounts = COST_HEADS.reduce<Record<CostHeadKey, number>>(
    (acc, head) => {
      acc[head.key] = coreCost * (pkg.weights[head.key] ?? 0);
      return acc;
    },
    { structure: 0, finishing: 0, mep: 0, interior: 0, misc: 0 },
  );

  if (specAdjustment !== 0) {
    for (const [head, amount] of Object.entries(spec.byHead)) {
      headAmounts[head as CostHeadKey] += amount;
    }
  }

  for (const item of enhancementBreakdown) {
    const def = ENHANCEMENTS.find((e) => e.key === item.key);
    if (def) headAmounts[def.head] += item.amount;
  }
  headAmounts.misc += contingency;

  const heads: CostHeadResult[] = COST_HEADS.map((head) => ({
    ...head,
    amount: headAmounts[head.key],
    percent: total > 0 ? (headAmounts[head.key] / total) * 100 : 0,
  })).filter((h) => h.amount > 0);

  const timelineWeeks = computeTimeline(input, builtUpArea);

  let cursor = 0;
  const phases: TimelinePhase[] = TIMELINE_PHASES.map((phase) => {
    const weeks = Math.max(1, Math.round(timelineWeeks * phase.share));
    const startWeek = cursor;
    cursor += weeks;
    return { key: phase.key, label: phase.label, weeks, startWeek, sharePercent: phase.share * 100 };
  });

  const payments: PaymentRow[] = PAYMENT_SCHEDULE.map((row) => ({
    milestone: row.milestone,
    trigger: row.trigger,
    percent: row.percent,
    amount: (total * row.percent) / 100,
  }));

  return {
    plotAreaSqft,
    builtUpArea,
    chargeableArea,
    effectiveRate,
    coreCost,
    enhancementsCost,
    enhancementBreakdown,
    specAdjustment,
    specSchedule: spec.schedule,
    specDeferredCount: spec.deferred,
    contingency,
    total,
    min: total * MODEL.rangeLow,
    max: total * MODEL.rangeHigh,
    perSqft: chargeableArea > 0 ? total / chargeableArea : 0,
    heads,
    timelineWeeks,
    phases,
    payments,
    assumptions:
      input.serviceModel === 'labour-only' ? [MODEL.labourOnlyNote, ...ASSUMPTIONS] : ASSUMPTIONS,
    labels: {
      propertyType: propertyType.label,
      packageLabel: pkg.label,
      packageHeadline: pkg.headline,
      quality: quality.label,
      location: location.label,
      locationZone: location.zone,
      serviceModel: input.serviceModel === 'turnkey' ? 'Turnkey (all-inclusive)' : 'Labour only',
      floors: floorLabel(input.floors, input.hasBasement, input.hasStilt),
    },
  };
}

/** Deep-linkable estimator state: /estimator?type=residential&area=1500… */
export function encodeInput(input: EstimatorInput): string {
  const params = new URLSearchParams({
    type: input.propertyType,
    model: input.serviceModel,
    area: String(input.plotArea),
    unit: input.areaUnit,
    ratio: String(input.builtUpRatio),
    floors: String(input.floors),
    pkg: input.packageKey,
    quality: input.quality,
    loc: input.location,
  });
  if (input.hasBasement) params.set('basement', '1');
  if (input.hasStilt) params.set('stilt', '1');
  if (input.enhancements.length) params.set('add', input.enhancements.join(','));
  if (input.materialMode === 'custom') {
    params.set('spec', 'custom');
    const packed = Object.entries(input.materials)
      .flatMap(([cat, picks]) => Object.entries(picks).map(([k, v]) => `${cat}:${k}=${v}`))
      .join('|');
    if (packed) params.set('mat', packed);
  }
  return params.toString();
}

export function decodeInput(search: string): Partial<EstimatorInput> {
  const params = new URLSearchParams(search);
  const out: Partial<EstimatorInput> = {};

  const type = params.get('type');
  if (type && PROPERTY_TYPES.some((p) => p.key === type)) out.propertyType = type as PropertyTypeKey;

  const model = params.get('model');
  if (model === 'turnkey' || model === 'labour-only') out.serviceModel = model;

  const area = Number(params.get('area'));
  if (Number.isFinite(area) && area > 0) out.plotArea = area;

  const unit = params.get('unit');
  if (unit && AREA_UNITS.some((u) => u.key === unit)) out.areaUnit = unit as AreaUnit;

  const ratio = Number(params.get('ratio'));
  if (Number.isFinite(ratio) && ratio > 0.2 && ratio <= 1) out.builtUpRatio = ratio;

  const floors = Number(params.get('floors'));
  if (Number.isFinite(floors) && floors >= 1 && floors <= 5) out.floors = floors;

  const pkg = params.get('pkg');
  if (pkg && PACKAGES.some((p) => p.key === pkg)) out.packageKey = pkg as PackageKey;

  const quality = params.get('quality');
  if (quality && QUALITY_TIERS.some((q) => q.key === quality)) out.quality = quality as QualityKey;

  const loc = params.get('loc');
  if (loc && LOCATIONS.some((l) => l.key === loc)) out.location = loc;

  if (params.get('basement') === '1') out.hasBasement = true;
  if (params.get('stilt') === '1') out.hasStilt = true;

  const add = params.get('add');
  if (add) out.enhancements = add.split(',').filter((k) => ENHANCEMENTS.some((e) => e.key === k));

  if (params.get('spec') === 'custom') {
    out.materialMode = 'custom';
    const mat = params.get('mat');
    if (mat) {
      const parsed: Record<string, Record<string, string>> = {};
      for (const entry of mat.split('|')) {
        const [lhs, value] = entry.split('=');
        const [cat, key] = (lhs ?? '').split(':');
        if (!cat || !key || !value) continue;
        (parsed[cat] ??= {})[key] = value;
      }
      out.materials = parsed;
    }
  }

  return out;
}

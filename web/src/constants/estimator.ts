/**
 * Estimator configuration.
 *
 * Rates are anchored to the client's published rate card (Port1.pdf p.14–15) and
 * cross-checked against 2026 Jaipur market ranges. Every constant here is mirrored in
 * `data/estimator-config.json` and is editable from /admin/estimator-config —
 * the public calculator reads the admin store first and falls back to these defaults.
 */

export type PropertyTypeKey = 'residential' | 'commercial' | 'mixed-use' | 'interior-only';
export type PackageKey = 'civil' | 'semi-furnished' | 'fully-furnished';
export type ServiceModel = 'turnkey' | 'labour-only';
export type AreaUnit = 'sqft' | 'sqyd' | 'sqm';

export interface PropertyTypeOption {
  key: PropertyTypeKey;
  label: string;
  description: string;
  icon: string;
  factor: number;
}

export interface PackageOption {
  key: PackageKey;
  label: string;
  headline: string;
  description: string;
  minRate: number;
  maxRate: number;
  labourOnlyRate: number;
  /** Turnkey scope — PDF p.15. */
  inclusions: string[];
  /** Flexible / labour-only scope — PDF p.14. Materials are procured by the client. */
  labourInclusions: string[];
  /** Cost distribution across construction heads — must sum to 1. */
  weights: Record<CostHeadKey, number>;
}

export interface LocationOption {
  key: string;
  label: string;
  zone: string;
  multiplier: number;
}

export interface EnhancementOption {
  key: string;
  label: string;
  description: string;
  icon: string;
  pricingModel: 'per-sqft' | 'lumpsum' | 'per-floor';
  unitPrice: number;
  appliesTo: PropertyTypeKey[];
  head: CostHeadKey;
}

export type CostHeadKey = 'structure' | 'finishing' | 'mep' | 'interior' | 'misc';

export const COST_HEADS: { key: CostHeadKey; label: string; description: string; color: string }[] = [
  { key: 'structure', label: 'Structure', description: 'Foundation, RCC frame, brickwork, roofing', color: '#0A1B4D' },
  { key: 'finishing', label: 'Finishing', description: 'Plaster, flooring, painting, doors & windows', color: '#00AEEF' },
  { key: 'mep', label: 'MEPF', description: 'Electrical, plumbing, HVAC, fire safety', color: '#4FC8F6' },
  { key: 'interior', label: 'Interiors', description: 'Kitchen, wardrobes, ceilings, fixtures', color: '#B99465' },
  { key: 'misc', label: 'Approvals & Site', description: 'Approvals, supervision, contingency', color: '#828A9C' },
];
export const PROPERTY_TYPES: PropertyTypeOption[] = [
  {
    key: 'residential',
    label: 'Residential',
    description: 'Independent house, villa, duplex or apartment block.',
    icon: 'Home',
    factor: 1.0,
  },
  {
    key: 'commercial',
    label: 'Commercial',
    description: 'Retail, office or showroom — higher loads and compliance.',
    icon: 'Building2',
    factor: 1.12,
  },
  {
    key: 'mixed-use',
    label: 'Mixed Use',
    description: 'Shops below, residence above — the Sanganer model.',
    icon: 'Store',
    factor: 1.08,
  },
  {
    key: 'interior-only',
    label: 'Interiors Only',
    description: 'Structure already built. Fit-out and furnishing only.',
    icon: 'Sofa',
    factor: 1.0,
  },
];
/**
 * The client's published rate card (Port1.pdf p.14–15).
 *
 * `minRate`/`maxRate` no longer *drive* the estimate — pricing runs bottom-up
 * from the material grades. They are now the **validation band**: at Standard
 * grade the bottom-up total must land inside them for every scope, which is what
 * `npm run check:estimator` asserts. Keeping them as an independent check is
 * more useful than keeping them as an input, because a drift in the coefficients
 * now fails a test instead of quietly repricing the product.
 *
 * `labourOnlyRate` is still a direct input — under a labour-only contract there
 * are no materials of ours to price up from.
 */
export const PACKAGES: PackageOption[] = [
  {
    key: 'civil',
    label: 'Civil Work',
    headline: 'Building Structure',
    description: 'A structurally complete building, ready for you to finish on your own terms.',
    minRate: 1200,
    maxRate: 1400,
    labourOnlyRate: 100,
    inclusions: ['All structural work', 'Quality materials supplied', 'On-site supervision', 'Basic roofing & brickwork'],
    labourInclusions: ['Foundation work', 'Structural work', 'Brick work', 'Basic roofing'],
    weights: { structure: 0.62, finishing: 0.12, mep: 0.1, interior: 0.0, misc: 0.16 },
  },
  {
    key: 'semi-furnished',
    label: 'Semi Furnished',
    headline: 'Move-in Ready',
    description: 'Everything in civil work, plus the finishes and services that make it livable.',
    minRate: 1800,
    maxRate: 2200,
    labourOnlyRate: 149,
    inclusions: ['Complete civil work', 'Premium flooring', 'Electrical & plumbing', 'Painting & finishing'],
    labourInclusions: ['All civil work', 'Flooring & tiling', 'Wall painting', 'Basic electrical & plumbing'],
    weights: { structure: 0.42, finishing: 0.27, mep: 0.16, interior: 0.05, misc: 0.1 },
  },
  {
    key: 'fully-furnished',
    label: 'Interior Work',
    headline: 'Fully Furnished',
    description: 'Hand over the keys and walk in. Modular kitchen, wardrobes, ceilings, lighting.',
    minRate: 2500,
    maxRate: 3000,
    labourOnlyRate: 199,
    inclusions: ['Everything included', 'Modular kitchen', 'Designer wardrobes', 'False ceiling & lighting'],
    labourInclusions: ['All semi-finished work', 'Modular kitchen', 'Wardrobes & cabinetry', 'False ceiling & lighting'],
    weights: { structure: 0.34, finishing: 0.24, mep: 0.14, interior: 0.2, misc: 0.08 },
  },
];

/* ------------------------------------------------------------------ */
/* Commercial split — what the visitor sees first                      */
/* ------------------------------------------------------------------ */

/**
 * The *commercial* breakdown (materials / labour / design / approvals) is a
 * different axis from the *construction* breakdown (structure / finishing / MEPF
 * / interiors). Both are true; only this one answers "what am I paying for?",
 * which is the question a homeowner actually asks. The construction heads move
 * behind a disclosure.
 */
export type CommercialHeadKey = 'materials' | 'labour' | 'design' | 'overhead';

export const COMMERCIAL_HEADS: {
  key: CommercialHeadKey;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    key: 'materials',
    label: 'Materials',
    description: 'Everything that ends up in the building — cement, steel, tiles, wiring, fittings.',
    color: '#0A1B4D',
  },
  {
    key: 'labour',
    label: 'Labour',
    description: 'Masons, bar-benders, carpenters, electricians, plumbers, painters.',
    color: '#00AEEF',
  },
  {
    key: 'design',
    label: 'Design & project management',
    description: 'Drawings, structural and MEPF design, site engineers, supervision.',
    color: '#B99465',
  },
  {
    key: 'overhead',
    label: 'Approvals, site & contingency',
    description: 'Setup, temporary works, testing, wastage allowance and contingency.',
    color: '#828A9C',
  },
];

/**
 * Commercial split per package. Each row must sum to exactly 1.
 *
 * These are not invented: they sit inside the published Indian benchmark bands
 * (materials 55–60%, labour 25–30%, design 5–8%, overhead 5–10%) and are then
 * calibrated so the bottom-up material lines in `materials.ts` reconcile against
 * the pool they produce — see `MATERIAL_LINES` and the normalisation factor
 * asserted in the estimator's reconciliation test.
 *
 * Every row here was arrived at by calibration, not preference. Pricing runs
 * bottom-up from the material lines, so these ratios are the only thing standing
 * between the summed materials and the total — and `npm run check:estimator`
 * asserts that each one lands the resulting ₹/sq ft inside the rate card the
 * client publishes for that scope. Change a coefficient in `materials.ts` and
 * one of these usually has to move with it; the test says which.
 *
 * Civil sits at a higher labour share than the finished packages because a
 * structure-only contract is labour-intensive and buys no finishing materials.
 * All four rows stay inside the published Indian bands.
 */
export const COST_SPLIT: Record<PackageKey, Record<CommercialHeadKey, number>> = {
  civil: { materials: 0.57, labour: 0.28, design: 0.05, overhead: 0.1 },
  'semi-furnished': { materials: 0.56, labour: 0.25, design: 0.08, overhead: 0.11 },
  'fully-furnished': { materials: 0.58, labour: 0.23, design: 0.09, overhead: 0.1 },
};

/** Locality multipliers — Jaipur zones from the client's actual project history, plus other cities. */
export const LOCATIONS: LocationOption[] = [
  { key: 'mansarovar', label: 'Mansarovar', zone: 'Jaipur — South West', multiplier: 1.0 },
  { key: 'jagatpura', label: 'Jagatpura', zone: 'Jaipur — South East', multiplier: 0.98 },
  { key: 'pratap-nagar', label: 'Pratap Nagar', zone: 'Jaipur — South', multiplier: 0.97 },
  { key: 'sanganer', label: 'Sanganer', zone: 'Jaipur — South', multiplier: 0.96 },
  { key: 'malviya-nagar', label: 'Malviya Nagar', zone: 'Jaipur — South East', multiplier: 1.04 },
  { key: 'vaishali-nagar', label: 'Vaishali Nagar', zone: 'Jaipur — West', multiplier: 1.03 },
  { key: 'c-scheme', label: 'C-Scheme / Civil Lines', zone: 'Jaipur — Central', multiplier: 1.09 },
  { key: 'jhotwara', label: 'Jhotwara', zone: 'Jaipur — North West', multiplier: 0.95 },
  { key: 'ajmer-road', label: 'Ajmer Road', zone: 'Jaipur — West', multiplier: 0.97 },
  { key: 'tonk-road', label: 'Tonk Road', zone: 'Jaipur — South', multiplier: 1.02 },
  { key: 'jaipur-other', label: 'Other area in Jaipur', zone: 'Jaipur', multiplier: 1.0 },
  { key: 'outside-jaipur', label: 'Outside Jaipur (Rajasthan)', zone: 'Rajasthan', multiplier: 1.06 },
];

/**
 * Optional extras that sit OUTSIDE the material model.
 *
 * Modular kitchen, wardrobes, false ceiling and waterproofing used to live here
 * too. They are now `MATERIAL_LINES`, and leaving them in both places would let a
 * visitor add — and pay for — the same kitchen twice: once as an opt-in material
 * and again as an enhancement. Everything remaining is genuinely not a material
 * line: whole systems (HVAC, solar, lift, automation) or works outside the
 * building envelope (boundary wall, landscaping, elevation treatment).
 */
export const ENHANCEMENTS: EnhancementOption[] = [
  {
    key: 'elevation',
    label: 'Premium Elevation',
    description: 'Louvers, stone cladding, CNC panels and facade lighting.',
    icon: 'LayoutPanelTop',
    pricingModel: 'per-sqft',
    unitPrice: 165,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'finishing',
  },
  {
    key: 'anti-termite',
    label: 'Anti-Termite Treatment',
    description: 'Pre- and post-construction chemical soil treatment.',
    icon: 'Bug',
    pricingModel: 'per-sqft',
    unitPrice: 16,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'structure',
  },
  {
    key: 'hvac',
    label: 'Centralised HVAC',
    description: 'VRF/ducted system with load calculation and duct routing.',
    icon: 'Fan',
    pricingModel: 'per-sqft',
    unitPrice: 210,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'mep',
  },
  {
    key: 'home-automation',
    label: 'Home Automation',
    description: 'App-controlled lighting, curtains, and security integration.',
    icon: 'Cpu',
    pricingModel: 'lumpsum',
    unitPrice: 340000,
    appliesTo: ['residential', 'mixed-use', 'interior-only'],
    head: 'mep',
  },
  {
    key: 'solar',
    label: 'Rooftop Solar (3 kW)',
    description: 'On-grid solar with net metering and 25-year panel warranty.',
    icon: 'Sun',
    pricingModel: 'lumpsum',
    unitPrice: 195000,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'mep',
  },
  {
    key: 'lift',
    label: 'Passenger Lift',
    description: '4–6 passenger lift with shaft, machine and installation.',
    icon: 'ArrowUpDown',
    pricingModel: 'per-floor',
    unitPrice: 260000,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'mep',
  },
  {
    key: 'boundary-wall',
    label: 'Boundary Wall & Gate',
    description: 'RCC boundary with MS gate and entrance treatment.',
    icon: 'Fence',
    pricingModel: 'lumpsum',
    unitPrice: 340000,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'structure',
  },
  {
    key: 'landscaping',
    label: 'Landscaping & Driveway',
    description: 'Paving, planters, soft landscape and outdoor lighting.',
    icon: 'Trees',
    pricingModel: 'lumpsum',
    unitPrice: 220000,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'finishing',
  },
];

export const AREA_UNITS: { key: AreaUnit; label: string; toSqft: number }[] = [
  { key: 'sqft', label: 'sq ft', toSqft: 1 },
  { key: 'sqyd', label: 'sq yard (gaj)', toSqft: 9 },
  { key: 'sqm', label: 'sq metre', toSqft: 10.7639 },
];

export const FLOOR_OPTIONS = [
  { value: 1, label: 'Ground only', short: 'G' },
  { value: 2, label: 'Ground + 1', short: 'G+1' },
  { value: 3, label: 'Ground + 2', short: 'G+2' },
  { value: 4, label: 'Ground + 3', short: 'G+3' },
  { value: 5, label: 'Ground + 4', short: 'G+4' },
];

/** Model tuning constants. */
export const MODEL = {
  /** Typical ground coverage of plot after setbacks. */
  defaultBuiltUpRatio: 0.72,
  /** Basement costs more per sqft than a normal floor (excavation, retaining). */
  basementFactor: 1.35,
  /** Stilt/parking floor is cheaper — no walls, minimal finishing. */
  stiltFactor: 0.55,
  /** Contingency added to the point estimate. */
  contingency: 0.03,
  /** Range spread around the point estimate. */
  rangeLow: 0.94,
  rangeHigh: 1.08,
  /** Labour-only model excludes materials, so head weights shift to labour-heavy items. */
  labourOnlyNote: 'Labour-only rates exclude all material cost. Materials are procured by you.',
  timeline: {
    baseWeeks: 14,
    weeksPerThousandSqft: 3.2,
    weeksPerFloor: 4,
    packageFactor: { civil: 0.82, 'semi-furnished': 1.0, 'fully-furnished': 1.22 } as Record<PackageKey, number>,
    min: 12,
    max: 104,
  },
} as const;

/** Payment milestones as % of contract value — matches Indian turnkey practice. */
export const PAYMENT_SCHEDULE = [
  { milestone: 'Booking & agreement', percent: 10, trigger: 'On signing' },
  { milestone: 'Foundation & plinth', percent: 15, trigger: 'Plinth level complete' },
  { milestone: 'Structure — ground floor', percent: 20, trigger: 'GF slab cast' },
  { milestone: 'Structure — upper floors', percent: 20, trigger: 'Final slab cast' },
  { milestone: 'Brickwork, plaster & MEPF rough-in', percent: 15, trigger: 'Plaster complete' },
  { milestone: 'Flooring, painting & fittings', percent: 15, trigger: 'Finishing complete' },
  { milestone: 'Handover', percent: 5, trigger: 'Snag-free handover' },
] as const;

/** Construction phases used in the estimator's timeline strip. */
export const TIMELINE_PHASES = [
  { key: 'design', label: 'Design & Approvals', share: 0.14 },
  { key: 'foundation', label: 'Foundation & Plinth', share: 0.12 },
  { key: 'structure', label: 'Structure & Slabs', share: 0.28 },
  { key: 'masonry', label: 'Masonry & Plaster', share: 0.16 },
  { key: 'mepf', label: 'MEPF & Waterproofing', share: 0.12 },
  { key: 'finishing', label: 'Finishing & Handover', share: 0.18 },
] as const;

export const ASSUMPTIONS = [
  'Estimate is based on the built-up area derived from your plot area and floor selection.',
  'Rates assume a clear, accessible plot with municipal water and power available at site.',
  'Government approvals, development charges and JDA/municipal fees are excluded.',
  'Soil testing may revise foundation design and cost after site inspection.',
  'GST is not included and is charged as applicable.',
  'Final cost is confirmed only after approved drawings and a signed BOQ.',
];

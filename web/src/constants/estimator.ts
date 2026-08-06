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
export type QualityKey = 'essential' | 'signature' | 'bespoke';
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

export interface QualityOption {
  key: QualityKey;
  label: string;
  description: string;
  multiplier: number;
  highlights: string[];
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

export const QUALITY_TIERS: QualityOption[] = [
  {
    key: 'essential',
    label: 'Essential',
    description: 'Reliable, well-known brands. Everything that matters, nothing that does not.',
    multiplier: 0.92,
    highlights: ['ISI-certified TMT steel', 'Vitrified tiles 600×600', 'Standard modular switches', 'Emulsion paint'],
  },
  {
    key: 'signature',
    label: 'Signature',
    description: 'Our recommended specification. The balance most of our clients choose.',
    multiplier: 1.0,
    highlights: ['TATA / JSW / Jindal TMT', 'Large-format vitrified tiles', 'Branded CP & sanitary ware', 'Premium emulsion & textures'],
  },
  {
    key: 'bespoke',
    label: 'Bespoke',
    description: 'Imported finishes, designer fittings and detailing specified line by line.',
    multiplier: 1.18,
    highlights: ['Imported marble & Italian stone', 'Designer CP fittings', 'Home automation ready', 'Custom joinery in veneer'],
  },
];

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

export const ENHANCEMENTS: EnhancementOption[] = [
  {
    key: 'modular-kitchen',
    label: 'Modular Kitchen',
    description: 'Base + wall units, counter, chimney, hob and accessories.',
    icon: 'ChefHat',
    pricingModel: 'lumpsum',
    unitPrice: 285000,
    appliesTo: ['residential', 'mixed-use', 'interior-only'],
    head: 'interior',
  },
  {
    key: 'false-ceiling',
    label: 'False Ceiling & Cove Lighting',
    description: 'Gypsum ceiling with profile lighting in living and bedrooms.',
    icon: 'Lightbulb',
    pricingModel: 'per-sqft',
    unitPrice: 95,
    appliesTo: ['residential', 'commercial', 'mixed-use', 'interior-only'],
    head: 'interior',
  },
  {
    key: 'wardrobes',
    label: 'Designer Wardrobes',
    description: 'Full-height wardrobes with laminate/veneer shutters.',
    icon: 'DoorClosed',
    pricingModel: 'lumpsum',
    unitPrice: 210000,
    appliesTo: ['residential', 'mixed-use', 'interior-only'],
    head: 'interior',
  },
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
    key: 'waterproofing',
    label: 'Full Waterproofing',
    description: 'Terrace, bathrooms, sunken slabs and external walls.',
    icon: 'Umbrella',
    pricingModel: 'per-sqft',
    unitPrice: 42,
    appliesTo: ['residential', 'commercial', 'mixed-use'],
    head: 'structure',
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

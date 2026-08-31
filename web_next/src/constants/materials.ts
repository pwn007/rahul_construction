import type { CostHeadKey } from './estimator';

/**
 * Material pricing model.
 *
 * The client's existing calculator (archubicbuildcon.com/calculator) was
 * transcribed here in full — 14 categories, every brand, every published rate —
 * as a *specification* catalogue: it recorded which brand you picked and priced
 * the difference from a package baseline.
 *
 * That catalogue has been folded into `MATERIAL_LINES` below and removed. It
 * could name a brand but never a quantity, so it could not answer "how much
 * cement does my house need"; and because the package rate already carried a
 * standard specification, it could only ever express a choice as a ± delta.
 * Pricing now runs bottom-up from quantity × graded rate, so every published
 * price point it held lives on as a grade — see the `spec` strings, which carry
 * the original brand names.
 */

/* ==================================================================== */
/* Bottom-up material lines — what the estimator actually prices          */
/* ==================================================================== */

/**
 * Quantity coefficients per sq ft of chargeable area, and one rate each.
 *
 * These lines ARE the pricing model. The visitor selects the materials they want
 * and the estimate is built upward from them — materials summed directly, then
 * labour, design and site costs derived from the materials share.
 *
 * ONE CARD PER BRAND
 * Every brand stands on its own, at its own price. The source calculator groups
 * equivalents — "KAMADHENU Or RATHI", "ULTRATECH / AMBUJA" — and reproducing that
 * meant one card had to represent two suppliers at once, which reads as a single
 * ambiguous choice rather than two clear ones. Equivalent brands simply share a
 * rate; nothing is paired on screen.
 *
 * BRANDS, NOT TIERS
 * Each material offers the brands and specifications the client's own calculator
 * lists, with their published prices. They are never ranked and never given tier
 * names: two of the window options cost the same, and the cheapest cement is not
 * "Economy". Where the client publishes distinct prices the option *ratios* come
 * from those figures; where the published unit differs from ours, the default
 * option keeps the calibrated absolute rate and the rest scale by the published
 * ratio. Where brands carry no published price difference at all — cement, steel,
 * bricks — the spread is derived and marked `provisional`.
 *
 * NOTHING IS PRE-SELECTED
 * The visitor picks every material and every brand. `MaterialLine.essential`
 * marks what a complete build needs, but it only drives an advisory coverage
 * strip — it never blocks, and it never pre-ticks.
 *
 * The five structural coefficients are the published Indian thumb rules, and
 * they converge tightly across sources:
 *
 *   cement 0.40 bags/sq ft (published range 0.40–0.50)
 *   steel  4.00 kg/sq ft   (3.5–4.5)
 *   sand   0.90 cft/sq ft  (0.8–1.0)
 *   agg.   1.10 cft/sq ft  (1.0–1.2)
 *   bricks 8 nos/sq ft     (5–10, depending on wall type)
 *
 * They are thumb rules, not a take-off, and the UI says so. Final quantities come
 * from approved drawings and a bar-bending schedule. A real BOQ for a 2,000 sq ft
 * house runs 80–150 line items across 12–18 sections; twenty sections is the
 * granularity a homeowner can actually hold in their head.
 */

export type QuantityUnit = 'bag' | 'kg' | 'cft' | 'cum' | 'ton' | 'nos' | 'sqft' | 'rft' | 'point';

export type MaterialGroupKey = 'structure' | 'finishing' | 'services' | 'fixtures';

export const MATERIAL_GROUPS: { key: MaterialGroupKey; label: string; description: string }[] = [
  { key: 'structure', label: 'Structure', description: 'What holds the building up' },
  { key: 'finishing', label: 'Finishing', description: 'What you see and touch' },
  { key: 'services', label: 'Services', description: 'Electrical, plumbing and water' },
  { key: 'fixtures', label: 'Fixtures & joinery', description: 'Kitchen, wardrobes, ceilings' },
];

export interface MaterialOption {
  key: string;
  /** The brand, as the client's own calculator names it. */
  label: string;
  /** Grade, size or what the allowance buys. */
  detail?: string;
  /** ₹ per unit. */
  rate: number;
  /** Exactly one per material. Carries the calibrated rate — see the note below. */
  isDefault?: boolean;
  /** True when this rate is derived rather than published. Surfaced with an asterisk. */
  provisional?: boolean;
}

export interface MaterialLine {
  key: string;
  label: string;
  group: MaterialGroupKey;
  head: CostHeadKey;
  /** Quantity per sq ft of chargeable area. */
  coefficient: number;
  unit: QuantityUnit;
  /** One line for the collapsed row — what this material is, in plain words. */
  blurb: string;
  /** Brands or specifications to choose between. Never ranked, never tier-named. */
  options: MaterialOption[];
  /** Scopes that can include this line. */
  packages: PackageKeyRef[];
  /** A complete build needs this. Drives the coverage strip, never blocks anything. */
  essential?: boolean;
  /**
   * This is the *alternative* way of buying something, not the norm.
   *
   * `exclusiveWith` has to be declared symmetrically or the UI and the pricing
   * disagree about which row is live — but that symmetry means "materials that
   * participate in an exclusion" cannot tell you which side is the default. This
   * can: ready-mix is the alternative, site-mixed cement is the norm.
   */
  isAlternative?: boolean;
  /**
   * Materials this one replaces.
   *
   * Ready-mix and site-mixed concrete are the same concrete bought two ways — the
   * trade advice is explicitly "either mix on site or order RMC". Reidius lists
   * Cement *and* Mix Concrete as two additive rows, which charges for the same
   * cubic metre twice. Selecting one here drops the other.
   */
  exclusiveWith?: string[];
  /** Expanded detail — provenance, or what the allowance covers. */
  note?: string;
}

type PackageKeyRef = 'civil' | 'semi-furnished' | 'fully-furnished';

const ALL: PackageKeyRef[] = ['civil', 'semi-furnished', 'fully-furnished'];
const FINISHED: PackageKeyRef[] = ['semi-furnished', 'fully-furnished'];
const FURNISHED: PackageKeyRef[] = ['fully-furnished'];

export const MATERIAL_LINES: MaterialLine[] = [
  /* ---- Structure --------------------------------------------------- */
  {
    key: 'cement',
    label: 'Cement',
    group: 'structure',
    head: 'structure',
    coefficient: 0.4,
    unit: 'bag',
    blurb: 'Binder for concrete, masonry and plaster',
    packages: ALL,
    essential: true,
    exclusiveWith: ['rmc'],
    options: [
      { key: 'ultratech', label: 'UltraTech', detail: 'PPC', rate: 420, isDefault: true },
      { key: 'ambuja', label: 'Ambuja', detail: 'PPC', rate: 420 },
      { key: 'jk-super', label: 'JK Super', detail: 'OPC 53-grade', rate: 455, provisional: true },
      { key: 'acc', label: 'ACC', detail: 'OPC 43-grade', rate: 405, provisional: true },
      { key: 'wonder', label: 'Wonder', detail: 'PPC', rate: 390, provisional: true },
      { key: 'shree', label: 'Shree', detail: 'PPC', rate: 390, provisional: true },
    ],
    note: '50 kg bags. Thumb rule 0.40–0.50 bags per sq ft.',
  },
  {
    key: 'steel',
    label: 'TMT Steel',
    group: 'structure',
    head: 'structure',
    coefficient: 4,
    unit: 'kg',
    blurb: 'Reinforcement for footings, columns and slabs',
    packages: ALL,
    essential: true,
    /* Four brands, exactly as the source lists them. JSW and Jindal Panther were
       briefly merged into one option here — they are separate manufacturers and
       the source never paired them. JSW stays the default, so the calibrated
       ₹72 is unchanged. */
    options: [
      { key: 'tata', label: 'TATA TISCON', detail: 'Fe550D', rate: 78, provisional: true },
      { key: 'jindal', label: 'Jindal Panther', detail: 'Fe500D', rate: 74, provisional: true },
      { key: 'jsw', label: 'JSW', detail: 'Fe500D', rate: 72, isDefault: true },
      { key: 'kamadhenu', label: 'Kamadhenu', detail: 'Fe500D', rate: 66, provisional: true },
      { key: 'rathi', label: 'Rathi', detail: 'Fe500D', rate: 66, provisional: true },
    ],
    note: 'Thumb rule 3.5–4.5 kg per sq ft; final quantity from the bar-bending schedule.',
  },
  {
    key: 'sand',
    label: 'Sand',
    group: 'structure',
    head: 'structure',
    coefficient: 0.9,
    unit: 'cft',
    blurb: 'Fine aggregate for concrete, masonry and plaster',
    packages: ALL,
    essential: true,
    exclusiveWith: ['rmc'],
    options: [
      { key: 'river', label: 'River sand', detail: 'Screened', rate: 55, isDefault: true },
      { key: 'msand', label: 'M-sand', detail: 'Manufactured', rate: 40 },
    ],
    note: 'Published at ₹1,250 and ₹900 per tonne respectively.',
  },
  {
    key: 'aggregate',
    label: 'Aggregate',
    group: 'structure',
    head: 'structure',
    coefficient: 1.1,
    unit: 'cft',
    blurb: 'Coarse aggregate for RCC and PCC',
    packages: ALL,
    essential: true,
    exclusiveWith: ['rmc'],
    options: [
      { key: 'graded', label: 'Graded 20 mm & 10 mm', rate: 45, isDefault: true },
      { key: 'washed', label: 'Washed, low-silt', rate: 52, provisional: true },
    ],
  },
  {
    key: 'rmc',
    label: 'Ready-mix concrete',
    group: 'structure',
    head: 'structure',
    coefficient: 0.042,
    unit: 'cum',
    blurb: 'Batched off site and pumped — replaces cement, sand and aggregate',
    packages: ALL,
    isAlternative: true,
    exclusiveWith: ['cement', 'sand', 'aggregate'],
    options: [
      { key: 'm25', label: 'M25', detail: 'Design mix, pumped', rate: 5600, isDefault: true },
      { key: 'm20', label: 'M20', detail: 'Design mix, pumped', rate: 5280 },
      { key: 'm75', label: 'M7.5', detail: 'PCC only', rate: 3200 },
    ],
    note: 'You buy the same concrete one way or the other, never both — selecting this drops the site-mix materials.',
  },
  {
    key: 'bricks',
    label: 'Bricks & blocks',
    group: 'structure',
    head: 'structure',
    coefficient: 8,
    unit: 'nos',
    blurb: 'Masonry for walls and partitions',
    packages: ALL,
    essential: true,
    options: [
      { key: 'renwel', label: 'Renwel', detail: 'Branded clay brick', rate: 9, isDefault: true },
      { key: 'clay', label: 'Clay brick', detail: 'Standard local kiln', rate: 9 },
      { key: 'flyash', label: 'Fly-ash block', rate: 7, provisional: true },
      { key: 'kanota', label: 'Kanota', rate: 11, provisional: true },
      { key: 'hanumangarh', label: 'Hanumangarh', rate: 11, provisional: true },
    ],
    note: 'Count varies 5–10 per sq ft with wall thickness and block size.',
  },
  {
    key: 'stone',
    label: 'Foundation stone',
    group: 'structure',
    head: 'structure',
    coefficient: 0.0125,
    unit: 'ton',
    blurb: 'Rubble masonry for footings and plinth',
    packages: ALL,
    essential: true,
    options: [{ key: 'masonry', label: 'Masonry stone', detail: 'Kota quarry', rate: 750, isDefault: true }],
    note: 'Roughly 30 tonnes on a 2,400 sq ft build.',
  },
  {
    key: 'waterproofing',
    label: 'Waterproofing',
    group: 'structure',
    head: 'structure',
    coefficient: 1,
    unit: 'sqft',
    blurb: 'Membranes, coatings and concrete admixtures',
    packages: ALL,
    essential: true,
    options: [
      { key: 'standard', label: 'Terrace, baths & sunken slabs', rate: 40, isDefault: true },
      { key: 'full', label: 'Full envelope + crystalline admixture', rate: 55, provisional: true },
    ],
  },

  /* ---- Finishing ---------------------------------------------------- */
  {
    key: 'flooring',
    label: 'Flooring & tiles',
    group: 'finishing',
    head: 'finishing',
    coefficient: 1,
    unit: 'sqft',
    blurb: 'Floor tiles plus bathroom and kitchen wall dado',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 't50', label: 'Vitrified, tile up to ₹50/sq ft', rate: 60 },
      { key: 't80', label: 'Vitrified, tile up to ₹80/sq ft', rate: 95, isDefault: true },
      { key: 't120', label: 'Large-format & marble, up to ₹120/sq ft', rate: 142 },
    ],
    note: 'Rate covers supply and laying across the whole floor area, not just the tile.',
  },
  {
    key: 'wall-finish',
    label: 'Wall finish & paint',
    group: 'finishing',
    head: 'finishing',
    coefficient: 2.4,
    unit: 'sqft',
    blurb: 'POP, putty, primer and two coats — inside and out',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'tractor', label: 'Tractor emulsion', rate: 22 },
      { key: 'premium', label: 'Premium emulsion', rate: 28, isDefault: true },
      { key: 'royal', label: 'Royal Matt + textures', rate: 50 },
    ],
    note: 'Wall area runs about 2.4× the floor area.',
  },
  {
    key: 'doors',
    label: 'Doors',
    group: 'finishing',
    head: 'finishing',
    coefficient: 0.004,
    unit: 'nos',
    blurb: 'Frame, shutter, hardware and polish',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'flush', label: 'Flush shutter', detail: 'Granite frame', rate: 9800 },
      { key: 'laminated', label: 'Laminated shutter', detail: 'Wooden frame', rate: 12000, isDefault: true },
      { key: 'teak', label: 'Teak veneer', detail: 'Polished wooden frame', rate: 14200 },
    ],
    note: 'Roughly one door per 250 sq ft.',
  },
  {
    key: 'grills',
    label: 'Grills & safety railings',
    group: 'finishing',
    head: 'finishing',
    coefficient: 0.08,
    unit: 'sqft',
    blurb: 'Window grills and balcony railings, fitted and painted',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'ms-plain', label: 'MS plain', detail: 'Painted mild steel', rate: 300, provisional: true },
      { key: 'ms-design', label: 'MS decorative', detail: 'Fabricated pattern', rate: 350, isDefault: true, provisional: true },
      { key: 'ss', label: 'SS 304', detail: 'Brushed stainless', rate: 600, provisional: true },
    ],
    note: 'Priced against the same window area as the glazing — about 8% of floor area.',
  },
  {
    key: 'windows',
    label: 'Windows',
    group: 'finishing',
    head: 'finishing',
    coefficient: 0.08,
    unit: 'sqft',
    blurb: 'Glazed and fitted — about 8% of floor area',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'aluminium', label: 'Aluminium', detail: 'Single glazed', rate: 440 },
      { key: 'upvc', label: 'UPVC', detail: 'Single glazed', rate: 520, isDefault: true },
      { key: 'wooden', label: 'Wooden', detail: 'Seasoned hardwood', rate: 520 },
    ],
  },

  /* ---- Services ------------------------------------------------------ */
  {
    key: 'conduiting',
    label: 'Electrical & plumbing conduiting',
    group: 'services',
    head: 'mep',
    coefficient: 1,
    unit: 'sqft',
    blurb: 'Conduit and drainage cast into the structure — no fittings',
    packages: ['civil'],
    essential: true,
    options: [
      { key: 'isi', label: 'ISI conduit, drainage cast in', rate: 75, isDefault: true },
      { key: 'pvc', label: 'PVC conduit and sleeves', rate: 62, provisional: true },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    group: 'services',
    head: 'mep',
    coefficient: 0.025,
    unit: 'point',
    blurb: 'Conduit, wire, switch, plate and DB share — one point per 40 sq ft',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'anchor', label: 'Anchor Penta', rate: 4100, provisional: true },
      { key: 'havells', label: 'Havells modular', rate: 4400, isDefault: true },
      { key: 'schneider', label: 'Schneider', detail: 'Modular', rate: 4700, provisional: true },
      { key: 'gm', label: 'GM', detail: 'Modular', rate: 4700, provisional: true },
    ],
    note: 'The client publishes switch rates (₹12 and ₹18 per sq ft); a switch is only part of a point, so the spread here is scaled from it rather than taken literally.',
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    group: 'services',
    head: 'mep',
    coefficient: 1,
    unit: 'sqft',
    blurb: 'Supply and drainage lines, valves and testing',
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'ashirvad', label: 'Ashirvad', detail: 'CPVC & PVC', rate: 45, isDefault: true },
      { key: 'astral', label: 'Astral', detail: 'CPVC & PVC', rate: 45 },
      { key: 'supreme', label: 'Supreme', detail: 'CPVC & PVC', rate: 41, provisional: true },
      { key: 'prince', label: 'Prince', detail: 'CPVC & PVC', rate: 41, provisional: true },
      { key: 'kisan', label: 'Kisan', detail: 'CPVC & PVC', rate: 37, provisional: true },
    ],
    note: 'Fixtures are priced separately.',
  },
  {
    key: 'bathroom',
    label: 'Bathroom fixtures',
    group: 'services',
    head: 'mep',
    coefficient: 0.0025,
    unit: 'nos',
    blurb: 'WC, basin, shower, taps and accessories — priced per bathroom',
    /* The source prices CP-vitreous by class with no brand attached, so the class
       is the label and the brands are examples. Pairing Jaquar with Kohler as
       equivalents was wrong twice over: invented, and not peers. */
    packages: FINISHED,
    essential: true,
    options: [
      { key: 'set35', label: '₹35,000 class', detail: 'Parryware, Essco or equivalent', rate: 22000, isDefault: true },
      { key: 'set50', label: '₹50,000 class', detail: 'Jaquar, Kohler or equivalent', rate: 31400 },
    ],
  },
  {
    key: 'water-tank',
    label: 'Water tanks',
    group: 'services',
    head: 'mep',
    coefficient: 0.0004,
    unit: 'nos',
    blurb: 'Overhead and underground storage, with pump',
    packages: ALL,
    essential: true,
    options: [
      { key: 's10', label: '500 L × 2', rate: 10000 },
      { key: 's15', label: '1,000 L + 500 L', rate: 15000, isDefault: true },
      { key: 's50', label: '5,000 L', rate: 50000 },
      { key: 's100', label: '10,000 L', rate: 100000 },
    ],
  },

  /* ---- Fixtures & joinery -------------------------------------------- */
  {
    key: 'kitchen',
    label: 'Modular kitchen',
    group: 'fixtures',
    head: 'interior',
    coefficient: 0.008,
    unit: 'rft',
    blurb: 'Base and wall units, counter, chimney and hob',
    packages: FURNISHED,
    options: [
      { key: 'basic', label: 'Basic', detail: 'About ₹1 L for a typical kitchen', rate: 5000 },
      { key: 'premium', label: 'Premium', detail: 'About ₹1.5 L', rate: 7500, isDefault: true },
      { key: 'classic', label: 'Classic', detail: 'About ₹2 L', rate: 10000 },
    ],
    note: 'Quoted per running foot of platform, as the trade does. About 20 rft in a 2,500 sq ft home.',
  },
  {
    key: 'kitchen-counter',
    label: 'Kitchen counter & sink',
    group: 'fixtures',
    head: 'interior',
    coefficient: 0.008,
    unit: 'rft',
    blurb: 'Granite platform, dado and sink — without the modular cabinetry',
    /*
     * Semi-furnished only, and that is what keeps it from colliding with the
     * modular kitchen rather than an exclusivity rule.
     *
     * A modular kitchen already contains its own counter and sink; pricing both
     * charges for one worktop twice. Expressing that through `packages` rather
     * than `exclusiveWith` is both simpler and safer: `activeLines` already drops
     * out-of-scope lines, so a hand-crafted URL naming both can never price both,
     * and neither line has to be marked `isAlternative` — which would have taken
     * the modular kitchen out of `packageDefaults('fully-furnished')`, i.e. out of
     * the very package it defines.
     */
    packages: ['semi-furnished'],
    essential: true,
    options: [
      { key: 'granite', label: 'Granite platform', detail: 'With SS sink', rate: 1800, isDefault: true, provisional: true },
      { key: 'quartz', label: 'Quartz platform', detail: 'With quartz sink', rate: 3200, provisional: true },
    ],
    note: 'Quoted per running foot of platform, as the trade does. About 20 rft in a 2,500 sq ft home.',
  },
  {
    key: 'wardrobes',
    label: 'Wardrobes & joinery',
    group: 'fixtures',
    head: 'interior',
    coefficient: 0.0016,
    unit: 'nos',
    blurb: 'Full-height wardrobes, roughly one per bedroom',
    packages: FURNISHED,
    options: [
      { key: 'laminate', label: 'Laminate shutters', rate: 62000, provisional: true },
      { key: 'acrylic', label: 'Acrylic shutters', rate: 85000, isDefault: true },
      { key: 'membrane', label: 'Membrane shutters', rate: 85000, provisional: true },
      { key: 'veneer', label: 'Veneer shutters', detail: 'Soft-close hardware', rate: 118000, provisional: true },
    ],
  },
  {
    key: 'ceiling',
    label: 'False ceiling & lighting',
    group: 'fixtures',
    head: 'interior',
    coefficient: 0.55,
    unit: 'sqft',
    blurb: 'Living areas and bedrooms — about 55% of floor area',
    packages: FURNISHED,
    options: [
      { key: 'plain', label: 'Plain gypsum, surface lights', rate: 170, provisional: true },
      { key: 'cove', label: 'Gypsum with cove lighting', rate: 230, isDefault: true },
      { key: 'designer', label: 'Designer profile + smart lighting', rate: 310, provisional: true },
    ],
  },
  {
    key: 'railings',
    label: 'Staircase railings',
    group: 'fixtures',
    head: 'finishing',
    coefficient: 0.02,
    unit: 'rft',
    blurb: 'Stair and balcony railings, fitted and polished',
    packages: FURNISHED,
    options: [
      { key: 'ms', label: 'MS railing', detail: 'Painted mild steel', rate: 1200, provisional: true },
      { key: 'ss304', label: 'SS 304 railing', rate: 1800, isDefault: true },
      { key: 'ssglass', label: 'SS with toughened glass', rate: 5400 },
    ],
    /*
     * The source calculator prices MS railing at ₹1,000/rft against SS 304 at
     * ₹400/rft — mild steel at 2.5× stainless, which is backwards from every
     * market rate and looks like a transposition in their data. Shipping it
     * verbatim would put an obviously wrong number in front of a customer, so MS
     * is priced below SS here and flagged provisional. Raised with the client.
     */
    note: 'MS rate is provisional — the published figure appears transposed with SS and is being confirmed.',
  },
];

export const MATERIAL_LINE_BY_KEY = Object.fromEntries(MATERIAL_LINES.map((l) => [l.key, l]));

/** The option a material carries when nothing has been chosen — and the calibrated rate. */
export function defaultOption(line: MaterialLine): MaterialOption {
  return line.options.find((o) => o.isDefault) ?? line.options[0]!;
}

export function optionOf(line: MaterialLine, key: string | undefined): MaterialOption {
  return line.options.find((o) => o.key === key) ?? defaultOption(line);
}

export const QUANTITY_UNIT_LABEL: Record<QuantityUnit, string> = {
  bag: 'bags',
  kg: 'kg',
  cft: 'cft',
  cum: 'cum',
  ton: 'ton',
  nos: 'nos',
  sqft: 'sq ft',
  rft: 'rft',
  point: 'points',
};

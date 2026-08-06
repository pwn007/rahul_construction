import type { CostHeadKey } from './estimator';

/**
 * Material specification catalogue.
 *
 * Transcribed verbatim from the client's existing calculator
 * (archubicbuildcon.com/calculator) — 14 categories, every brand, every
 * sub-category, every option and every published rate.
 *
 * WHAT WE ADD OVER THE ORIGINAL
 * The original records selections and posts them to a lead endpoint; the choices
 * never affect a number and the user never sees a cost. Here every option carries
 * a parsed `rate` + `unit`, and each group declares a `baseline` and a `coverage`
 * factor, so a choice moves the estimate live.
 *
 * WHY DELTAS, NOT ABSOLUTES
 * The package rate (₹1,800–2,200/sq ft) already includes a standard specification.
 * Adding a chosen ₹/sq ft rate on top would double-count it. We therefore price the
 * *difference* from each group's baseline option. Choosing the baseline costs nothing
 * extra; trading up or down moves the number by the real difference.
 *
 * `coverage` = the share of built-up area a group actually applies to. Wall paint
 * covers ~2.4× the floor area; door shutters ~5%. Groups priced per RFT / TON / CUM /
 * NOS need a quantity take-off we cannot honestly do from four inputs, so they carry
 * no coverage: they are recorded in the specification schedule at their unit rate and
 * excluded from the headline, with that stated on screen and in the PDF.
 */

export type RateUnit = 'sqft' | 'rft' | 'ton' | 'cum' | 'nos' | 'lumpsum';

export interface MaterialOption {
  name: string;
  /** "Or RATHI" — the original shows an equivalent alternative brand. */
  alt?: string;
  /** Exactly as printed on the client's calculator. */
  priceLabel?: string;
  rate?: number;
  unit?: RateUnit;
}

export interface MaterialGroup {
  name: string;
  options: MaterialOption[];
  /** Option treated as "already included in the package rate". */
  baseline: string;
  /** Share of built-up area this group applies to. Omitted ⇒ excluded from the headline. */
  coverage?: number;
  head: CostHeadKey;
}

export interface MaterialExtra {
  name: string;
  /** Maps onto an existing enhancement so the cost is never counted twice. */
  enhancementKey: string;
}

export interface MaterialCategory {
  id: string;
  label: string;
  icon: string;
  /** Brand-only categories: spec signal, no direct rate. */
  brands?: MaterialOption[];
  groups?: MaterialGroup[];
  extras?: MaterialExtra[];
  /** Shown under the category title to explain what the choice affects. */
  note?: string;
}

const sqft = (n: number) => ({ rate: n, unit: 'sqft' as const, priceLabel: `₹${n}/sqft` });

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'steel',
    label: 'TMT Steel',
    icon: '🔩',
    note: 'Reinforcement grade drives structural durability. All listed brands are Fe500D or better.',
    brands: [
      { name: 'TATA TISCON' },
      { name: 'JINDAL PANTHER' },
      { name: 'KAMADHENU', alt: 'RATHI' },
      { name: 'JSW' },
    ],
  },
  {
    id: 'bricks',
    label: 'Bricks',
    icon: '🧱',
    note: 'Masonry choice affects thermal performance and plaster consumption.',
    brands: [
      { name: 'FLY ASH BRICKS' },
      { name: 'RENWEL', alt: 'CLAY BRICKS' },
      { name: 'KANOTA', alt: 'HANUMANGARH' },
    ],
    extras: [
      { name: 'Water Proofing', enhancementKey: 'waterproofing' },
      { name: 'Termite Solution', enhancementKey: 'anti-termite' },
    ],
  },
  {
    id: 'cement',
    label: 'Cement',
    icon: '🏗️',
    note: 'All options are OPC/PPC 43–53 grade from established plants.',
    brands: [
      { name: 'ULTRATECH', alt: 'AMBUJA' },
      { name: 'JK SUPER' },
      { name: 'WONDER', alt: 'SHREE' },
      { name: 'ACC' },
    ],
  },
  {
    id: 'electrical',
    label: 'Electrical',
    icon: '⚡',
    groups: [
      {
        name: 'Slab & Wall Material',
        head: 'mep',
        baseline: 'JINDAL',
        options: [{ name: 'SHIVA' }, { name: 'JINDAL' }, { name: 'OTHER BRANDS' }],
      },
      {
        name: 'Wires & Cables',
        head: 'mep',
        baseline: 'PARAMOUNT',
        options: [{ name: 'SCHNEIDER / GM' }, { name: 'PARAMOUNT' }, { name: 'RR / HAVELLS' }],
      },
      {
        name: 'Switches & Plates',
        head: 'mep',
        baseline: 'ANCHOR PENTA',
        coverage: 1.0,
        options: [
          { name: 'ANCHOR PENTA', ...sqft(12) },
          { name: 'HAVELLS', ...sqft(18) },
          { name: 'SCHNEIDER', ...sqft(18) },
          { name: 'GM', ...sqft(18) },
        ],
      },
    ],
  },
  {
    id: 'flooring',
    label: 'Flooring',
    icon: '🪨',
    groups: [
      {
        name: 'Vitrified Tiles',
        head: 'finishing',
        baseline: 'Upto ₹80/sqft',
        coverage: 0.72,
        options: [
          { name: 'Upto ₹50/sqft', ...sqft(50) },
          { name: 'Upto ₹80/sqft', ...sqft(80) },
          { name: 'Upto ₹120/sqft', ...sqft(120) },
        ],
      },
      {
        name: 'Ceramic Wall Tile',
        head: 'finishing',
        baseline: 'Upto ₹80/sqft',
        coverage: 0.3,
        options: [
          { name: 'Upto ₹50/sqft', ...sqft(50) },
          { name: 'Upto ₹80/sqft', ...sqft(80) },
          { name: 'Upto ₹120/sqft', ...sqft(120) },
        ],
      },
      {
        name: 'Granite',
        head: 'finishing',
        baseline: 'Upto ₹90/sqft',
        coverage: 0.1,
        options: [
          { name: 'Upto ₹75/sqft', ...sqft(75) },
          { name: 'Upto ₹90/sqft', ...sqft(90) },
          { name: 'Upto ₹120/sqft', ...sqft(120) },
        ],
      },
      {
        name: 'Rough Stone',
        head: 'finishing',
        baseline: 'Upto ₹60/sqft',
        coverage: 0.18,
        options: [
          { name: 'Upto ₹40/sqft', ...sqft(40) },
          { name: 'Upto ₹60/sqft', ...sqft(60) },
          { name: 'Upto ₹90/sqft', ...sqft(90) },
        ],
      },
    ],
  },
  {
    id: 'door',
    label: 'Door',
    icon: '🚪',
    groups: [
      {
        name: 'Door Shutter',
        head: 'finishing',
        baseline: '₹55/sqft',
        coverage: 0.05,
        options: [
          { name: '₹45/sqft', ...sqft(45) },
          { name: '₹55/sqft', ...sqft(55) },
          { name: '₹65/sqft', ...sqft(65) },
        ],
      },
      {
        name: 'Door Frame',
        head: 'finishing',
        baseline: 'GRANITE',
        coverage: 0.05,
        options: [
          { name: 'WOODEN', ...sqft(35) },
          { name: 'GRANITE', ...sqft(20) },
          { name: 'KAROLI STONE', ...sqft(8) },
        ],
      },
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    icon: '🪟',
    groups: [
      {
        name: 'Windows',
        head: 'finishing',
        baseline: 'ALUMINIUM',
        coverage: 0.11,
        options: [
          { name: 'UPVC', ...sqft(65) },
          { name: 'ALUMINIUM', ...sqft(55) },
          { name: 'WOODEN', ...sqft(65) },
        ],
      },
    ],
  },
  {
    id: 'wall-finish',
    label: 'Wall Finish',
    icon: '🎨',
    groups: [
      {
        name: 'POP False Ceiling',
        head: 'interior',
        baseline: 'JK SUPER',
        options: [{ name: 'BIRLA / SACARNI' }, { name: 'JK SUPER' }, { name: 'OTHER BRANDS' }],
      },
      {
        name: 'POP in Walls',
        head: 'finishing',
        baseline: 'PHANTI',
        coverage: 2.4,
        options: [
          { name: 'PLUMB', ...sqft(18) },
          { name: 'PHANTI', ...sqft(15) },
          { name: 'PUNNING', ...sqft(10) },
        ],
      },
      {
        name: 'Internal Wall Paint',
        head: 'finishing',
        baseline: 'PREMIUM',
        coverage: 2.4,
        options: [
          { name: 'ROYAL MATT', ...sqft(45) },
          { name: 'PREMIUM', ...sqft(25) },
          { name: 'TRACTOR EMULSION', ...sqft(20) },
        ],
      },
    ],
  },
  {
    id: 'hand-rails',
    label: 'Hand Rails',
    icon: '🏠',
    note: 'Priced per running foot — quantified against the approved drawings at BOQ stage.',
    groups: [
      {
        name: 'Stair Handrail',
        head: 'finishing',
        baseline: 'SS RAILING 304',
        options: [
          { name: 'SS RAILING 304', rate: 400, unit: 'rft', priceLabel: '₹400/RFT' },
          { name: 'MS RAILING', rate: 1000, unit: 'rft', priceLabel: '₹1000/RFT' },
          { name: 'SS RAILING GLASS', rate: 1200, unit: 'rft', priceLabel: '₹1200/RFT' },
        ],
      },
      {
        name: 'Balcony Handrail',
        head: 'finishing',
        baseline: 'SS GLASS 1000',
        options: [
          { name: 'SS GLASS 1200', rate: 1200, unit: 'rft', priceLabel: '₹1200/RFT' },
          { name: 'SS GLASS 1500', rate: 1500, unit: 'rft', priceLabel: '₹1500/RFT' },
          { name: 'SS GLASS 1000', rate: 1000, unit: 'rft', priceLabel: '₹1000/RFT' },
        ],
      },
    ],
  },
  {
    id: 'stone',
    label: 'Stone',
    icon: '⛰️',
    note: 'Priced per tonne — quantified from the foundation and masonry drawings.',
    groups: [
      {
        name: 'Stone',
        head: 'structure',
        baseline: 'MASONRY STONE',
        options: [{ name: 'MASONRY STONE', rate: 750, unit: 'ton', priceLabel: '₹750/TON' }],
      },
    ],
  },
  {
    id: 'concrete',
    label: 'Mix Concrete',
    icon: '🪣',
    note: 'Priced per cubic metre — quantified from the structural design.',
    groups: [
      {
        name: 'Concrete',
        head: 'structure',
        baseline: 'M20',
        options: [
          { name: 'M25', rate: 3500, unit: 'cum', priceLabel: '₹3500/CUM' },
          { name: 'M20', rate: 3300, unit: 'cum', priceLabel: '₹3300/CUM' },
        ],
      },
      {
        name: 'PCC (Plain Cement Concrete)',
        head: 'structure',
        baseline: 'M7.5',
        options: [{ name: 'M7.5', rate: 2000, unit: 'cum', priceLabel: '₹2000/CUM' }],
      },
    ],
  },
  {
    id: 'sand',
    label: 'Sand',
    icon: '🏖️',
    note: 'Priced per tonne — quantified from mortar and concrete volumes.',
    groups: [
      {
        name: 'Sand',
        head: 'structure',
        baseline: 'M/E SAND',
        options: [
          { name: 'RIVER SAND', rate: 1250, unit: 'ton', priceLabel: '₹1250/TON' },
          { name: 'M/E SAND', rate: 900, unit: 'ton', priceLabel: '₹900/TON' },
        ],
      },
    ],
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: '🔧',
    groups: [
      {
        name: 'PVC (Internal & External)',
        head: 'mep',
        baseline: 'SUPREME / PRINCE',
        options: [{ name: 'ASHIRVAD / ASTRAL' }, { name: 'SUPREME / PRINCE' }, { name: 'KISAN' }],
      },
      {
        name: 'CPVC (Internal & External)',
        head: 'mep',
        baseline: 'SUPREME / PRINCE',
        options: [{ name: 'ASHIRVAD / ASTRAL' }, { name: 'SUPREME / PRINCE' }, { name: 'KISAN' }],
      },
      {
        name: 'CP-Vitreous',
        head: 'mep',
        baseline: '35K - ₹35,000/NOS',
        options: [
          { name: '35K - ₹35,000/NOS', rate: 35000, unit: 'nos', priceLabel: '₹35,000 per set' },
          { name: '50K - ₹50,000/NOS', rate: 50000, unit: 'nos', priceLabel: '₹50,000 per set' },
        ],
      },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: '⚙️',
    groups: [
      {
        /**
         * TODO(client): the source calculator lists PREMIUM at ₹1,50,000 and CLASSIC at
         * ₹2,00,000 — i.e. "premium" is cheaper than "classic". Transcribed exactly as
         * published; please confirm whether the two labels are swapped.
         */
        name: 'Modular Kitchen',
        head: 'interior',
        baseline: 'BASIC',
        options: [
          { name: 'PREMIUM', rate: 150000, unit: 'lumpsum', priceLabel: '₹1,50,000' },
          { name: 'CLASSIC', rate: 200000, unit: 'lumpsum', priceLabel: '₹2,00,000' },
          { name: 'BASIC', rate: 100000, unit: 'lumpsum', priceLabel: '₹1,00,000' },
        ],
      },
      {
        name: 'Water Tank',
        head: 'mep',
        baseline: '1000L+500L',
        options: [
          { name: '500L×2', rate: 10000, unit: 'lumpsum', priceLabel: '₹10,000' },
          { name: '1000L+500L', rate: 15000, unit: 'lumpsum', priceLabel: '₹15,000' },
          { name: '5000L', rate: 50000, unit: 'lumpsum', priceLabel: '₹50,000' },
          { name: '10000L', rate: 100000, unit: 'lumpsum', priceLabel: '₹1,00,000' },
          { name: '50000L', rate: 500000, unit: 'lumpsum', priceLabel: '₹5,00,000' },
        ],
      },
    ],
  },
];

/** Locations offered by the source calculator's Project Details step. */
export const CALCULATOR_CITIES = [
  'Jaipur',
  'Mansarovar',
  'Vaishali Nagar',
  'Malviya Nagar',
  'Jagatpura',
  'Ajmer Road',
  'Tonk Road',
  'Delhi NCR',
  'Other',
] as const;

/** Units that need a drawing-based take-off and are therefore excluded from the headline. */
export const QUANTIFIED_AT_BOQ: RateUnit[] = ['rft', 'ton', 'cum', 'nos'];

export const MATERIAL_CATEGORY_BY_ID = Object.fromEntries(MATERIAL_CATEGORIES.map((c) => [c.id, c]));

import type { CostHeadKey, PackageKey } from './estimator';

/**
 * Work heads — the *work*, as a homeowner names it.
 *
 * `MATERIAL_LINES` prices the maal: cement, steel, tiles. It cannot answer "is
 * khudai included?", because excavation buys no branded product — it is labour
 * and plant, and its cost already sits inside the labour and overhead shares of
 * the total. Shipping it as a material line would price the same rupee twice and
 * push ₹/sq ft outside the published rate card.
 *
 * So this layer adds no money. It *re-partitions* money that is already in the
 * total:
 *
 *   poolNonMaterial = total − Σ(priced material lines)
 *   amount(head)    = Σ(its priced lines) + poolNonMaterial × weight / Σ active weights
 *
 * Because the weights are normalised over whatever is active, `Σ workHeads ≡
 * total` holds identically — for any selection, any locality, any area, and for
 * a labour-only contract where there are no material lines at all and the whole
 * total lands here. `check:estimator` asserts it across the full sweep.
 *
 * NESTING THIS INSIDE `COST_HEADS` DOES NOT WORK, and was tried.
 * Deriving each head as `Σ its lines + (costHeadAmount − Σ that head's lines)`
 * reuses `PACKAGES[].weights` and reconciles beautifully at a full selection —
 * but it goes negative on a partial one. Select only flooring on a fully
 * furnished build: the finishing lines come to X while the finishing cost head
 * is only 0.24 × (X / 0.58) = 0.414X, and the residual renders as a negative
 * rupee amount on screen. Flat normalisation over active heads has no such
 * failure mode. Work heads are therefore a *third, independent* view alongside
 * the commercial split and the construction donut — never a subdivision of one.
 *
 * WEIGHTS ARE RELATIVE, NOT ABSOLUTE.
 * They are normalised at compute time, so adding a head never adds a rupee and
 * removing one never loses one. The civil rows are scaled to sum to 100 purely
 * so they read as percentages; the finished rows continue that scale.
 *
 * PROVENANCE. The civil distribution is reconciled from four published sources,
 * which agree on the shape and disagree on the detail:
 *
 *   excavation 3% (2–5) · foundation 9% (8–12) · RCC frame 34% (23–38) ·
 *   brickwork 13% (8–15) · plaster 9% (6–10) · roof & staircase 6% (5–7) ·
 *   waterproofing 3.5% (3–4) · supervision & contingency 17% (11–20)
 *
 * — Civil Practical Knowledge's ₹1,600/sq ft civil breakup, Liza Homes'
 * Bengaluru 2026 breakdown, Construction Estimator India, and Civil Site, which
 * explicitly warns that no dependable *national* percentage table exists. These
 * are national/Bengaluru-weighted and must be calibrated against the client's
 * own Jaipur BOQ before they are treated as anything more than indicative. The
 * test guarantees only that the arithmetic on screen does not lie.
 *
 * Compound wall is deliberately NOT here. It stays the `boundary-wall`
 * enhancement, because a wall's length is a function of the plot boundary, not
 * of built-up area — a per-sq-ft head would price it wrong on every plot — and
 * because carrying it in both places would let a visitor pay for one wall twice.
 */
export interface WorkHead {
  key: string;
  /** The work, in the words a homeowner uses. */
  label: string;
  /** Devanagari gloss for the trade terms. Rendered small, under the label. */
  hindi?: string;
  /** One line for the package-card checklist. */
  blurb: string;
  /** The cheapest package this work is part of. Drives the checklist ticks. */
  minPackage: PackageKey;
  /** Roll-up for the construction donut and the PDF. */
  costHead: CostHeadKey;
  /**
   * `MATERIAL_LINES` keys whose amounts belong to this head.
   *
   * May be empty: excavation, plaster and the site overheads buy no branded
   * product. Those heads are funded entirely from the non-material pool, and the
   * UI says so rather than showing an empty material list.
   */
  materialKeys: string[];
  /** Relative share of the non-material pool. Normalised over active heads. */
  labourWeight: number;
  /** Extra checklist bullets that are not heads of their own. */
  detail?: string[];
}

export const WORK_HEADS: WorkHead[] = [
  /* ---- Civil ------------------------------------------------------- */
  {
    key: 'excavation',
    label: 'Excavation & earthwork',
    hindi: 'खुदाई और मिट्टी का काम',
    blurb: 'Digging out the foundation, levelling and disposing of the spoil',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: [],
    labourWeight: 3,
    detail: ['Site clearing and setting out', 'Excavation to footing depth', 'Backfilling and compaction'],
  },
  {
    key: 'foundation',
    label: 'Foundation, footings & PCC',
    hindi: 'नींव और फुटिंग',
    blurb: 'What the building stands on — below the plinth',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: ['stone'],
    labourWeight: 9,
    detail: ['PCC bed', 'Isolated or raft footings', 'Rubble masonry up to plinth', 'Plinth beam'],
  },
  {
    key: 'rcc-frame',
    label: 'RCC frame — columns, beams & slabs',
    hindi: 'ढाँचा — कॉलम, बीम, स्लैब',
    blurb: 'The skeleton: reinforced concrete from plinth to terrace',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: ['cement', 'steel', 'sand', 'aggregate', 'rmc'],
    labourWeight: 34,
    detail: ['Centering & shuttering', 'Bar bending and tying', 'Concrete pour, vibration and curing'],
  },
  {
    key: 'masonry',
    label: 'Brickwork & blockwork',
    hindi: 'चिनाई',
    blurb: 'External walls and internal partitions',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: ['bricks'],
    labourWeight: 13,
    detail: ['9" external walls', '4" internal partitions', 'Lintels and sills'],
  },
  {
    key: 'plaster',
    label: 'Plaster — internal & external',
    hindi: 'प्लस्तर',
    blurb: 'Cement plaster on every wall face, inside and out',
    minPackage: 'civil',
    costHead: 'finishing',
    materialKeys: [],
    labourWeight: 9,
    detail: ['12 mm internal plaster', '20 mm external plaster', '6 mm ceiling plaster'],
  },
  {
    key: 'roof-staircase',
    label: 'Roof slab & staircase',
    hindi: 'छत और सीढ़ी',
    blurb: 'Terrace slab, parapet, and the stairs between floors',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: [],
    labourWeight: 6,
    detail: ['Terrace slab and weathering course', 'Parapet wall', 'RCC staircase with steps'],
  },
  {
    key: 'waterproofing',
    label: 'Waterproofing',
    hindi: 'वॉटरप्रूफिंग',
    blurb: 'Terrace, bathrooms and sunken slabs, sealed against water',
    minPackage: 'civil',
    costHead: 'structure',
    materialKeys: ['waterproofing'],
    labourWeight: 3.5,
  },
  {
    key: 'services-rough-in',
    label: 'Electrical & plumbing rough-in',
    hindi: 'पाइप और वायरिंग की नाली',
    blurb: 'Conduit and drainage cast into the structure, before plaster',
    minPackage: 'civil',
    costHead: 'mep',
    materialKeys: ['conduiting'],
    labourWeight: 4,
    detail: ['Conduit chased and cast in', 'Drainage stacks and sleeves'],
  },
  {
    key: 'water-storage',
    label: 'Water storage & pump',
    hindi: 'पानी की टंकी और पंप',
    blurb: 'Overhead and underground tanks, with the pump that fills them',
    minPackage: 'civil',
    costHead: 'mep',
    materialKeys: ['water-tank'],
    labourWeight: 1.5,
  },
  {
    key: 'supervision',
    label: 'Supervision, overheads & contingency',
    hindi: 'देखरेख और आकस्मिक खर्च',
    blurb: 'Site engineer, temporary works, testing, wastage and contingency',
    minPackage: 'civil',
    costHead: 'misc',
    materialKeys: [],
    labourWeight: 17,
    detail: ['Resident site engineer', 'Site setup, water and power', 'Cube testing and quality checks', 'Wastage and contingency allowance'],
  },

  /* ---- Semi-furnished ---------------------------------------------- */
  {
    key: 'flooring',
    label: 'Flooring & tiling',
    hindi: 'फर्श और टाइल',
    blurb: 'Floor tiles throughout, plus bathroom and kitchen dado',
    minPackage: 'semi-furnished',
    costHead: 'finishing',
    materialKeys: ['flooring'],
    labourWeight: 13,
    detail: ['Floor tile supply and laying', 'Skirting', 'Bathroom and kitchen wall dado'],
  },
  {
    key: 'doors-windows',
    label: 'Doors & windows',
    hindi: 'दरवाज़े और खिड़कियाँ',
    blurb: 'Frames, shutters, glazing, hardware and polish',
    minPackage: 'semi-furnished',
    costHead: 'finishing',
    materialKeys: ['doors', 'windows'],
    labourWeight: 11,
  },
  {
    key: 'painting',
    label: 'Wall finish & painting',
    hindi: 'पुताई और पेंट',
    blurb: 'POP, putty, primer and two coats — inside and out',
    minPackage: 'semi-furnished',
    costHead: 'finishing',
    materialKeys: ['wall-finish'],
    labourWeight: 5,
  },
  {
    key: 'electrical',
    label: 'Electrical wiring & fittings',
    hindi: 'बिजली की वायरिंग और फिटिंग',
    blurb: 'Wire, switches, plates and the distribution board',
    minPackage: 'semi-furnished',
    costHead: 'mep',
    materialKeys: ['electrical'],
    labourWeight: 8,
    detail: ['One point per 40 sq ft', 'Modular switches and plates', 'DB, MCBs and earthing'],
  },
  {
    key: 'plumbing',
    label: 'Plumbing & sanitary ware',
    hindi: 'प्लंबिंग और सैनिटरी',
    blurb: 'Supply and drainage lines, plus WC, basin, shower and taps',
    minPackage: 'semi-furnished',
    costHead: 'mep',
    materialKeys: ['plumbing', 'bathroom'],
    labourWeight: 7,
  },

  /* ---- Fully furnished --------------------------------------------- */
  {
    key: 'kitchen-counter',
    label: 'Kitchen counter & sink',
    hindi: 'रसोई का प्लेटफ़ॉर्म और सिंक',
    blurb: 'Granite platform, dado and sink — the working kitchen, without cabinetry',
    minPackage: 'semi-furnished',
    costHead: 'interior',
    materialKeys: ['kitchen-counter'],
    labourWeight: 3,
  },

  {
    key: 'modular-kitchen',
    label: 'Modular kitchen',
    hindi: 'मॉड्यूलर रसोई',
    blurb: 'Base and wall units, counter, chimney and hob',
    minPackage: 'fully-furnished',
    costHead: 'interior',
    materialKeys: ['kitchen'],
    labourWeight: 6,
  },
  {
    key: 'wardrobes',
    label: 'Wardrobes & joinery',
    hindi: 'अलमारी और लकड़ी का काम',
    blurb: 'Full-height wardrobes, roughly one per bedroom',
    minPackage: 'fully-furnished',
    costHead: 'interior',
    materialKeys: ['wardrobes'],
    labourWeight: 6,
  },
  {
    key: 'false-ceiling',
    label: 'False ceiling & lighting',
    hindi: 'फॉल्स सीलिंग और लाइटिंग',
    blurb: 'Gypsum ceiling with coves, and the lights set into it',
    minPackage: 'fully-furnished',
    costHead: 'interior',
    materialKeys: ['ceiling'],
    labourWeight: 5,
  },
  {
    key: 'grills-railings',
    label: 'Grills & railings',
    hindi: 'जाली और रेलिंग',
    blurb: 'Window grills, balcony and staircase railings, fitted and finished',
    /* Grills arrive with the finishes; the polished staircase railing arrives
       with the interiors. One head, because a homeowner does not separate them. */
    minPackage: 'semi-furnished',
    costHead: 'finishing',
    materialKeys: ['grills', 'railings'],
    labourWeight: 2,
  },
];

export const WORK_HEAD_BY_KEY: Record<string, WorkHead> = Object.fromEntries(
  WORK_HEADS.map((h) => [h.key, h]),
);

/** Cheapest scope first — mirrors `SCOPE_ORDER` in the estimator model. */
const PACKAGE_ORDER: PackageKey[] = ['civil', 'semi-furnished', 'fully-furnished'];

/** Is this work part of the given package's scope? */
export function headInPackage(head: WorkHead, pkg: PackageKey): boolean {
  return PACKAGE_ORDER.indexOf(pkg) >= PACKAGE_ORDER.indexOf(head.minPackage);
}

/** Every work head a package includes, in declaration order. */
export function workHeadsFor(pkg: PackageKey): WorkHead[] {
  return WORK_HEADS.filter((h) => headInPackage(h, pkg));
}

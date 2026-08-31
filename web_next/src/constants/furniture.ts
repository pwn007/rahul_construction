/**
 * Loose furniture and decor — the layer a builder's "fully furnished" does not
 * actually contain.
 *
 * In the trade, a fully furnished handover means fixed joinery: modular kitchen,
 * wardrobes, false ceiling, lighting. It does not mean a bed. The client asked
 * for beds and sofas to be in the calculator, and both things can be true — but
 * only if the loose furniture is a separate, opt-in layer rather than folded into
 * the package rate.
 *
 * That separation is not presentational. `PACKAGES['fully-furnished']` publishes
 * ₹2,500–3,000/sq ft, and `check:estimator` asserts the bottom-up model lands
 * inside it. A sofa is not in that contract; adding one to the base would push
 * ₹/sq ft outside the band the client publishes and quietly restate the price of
 * everything else. So furniture is priced the way enhancements are — additively,
 * after the package total, itemised — and the check script asserts that a fully
 * furnished build *with* furniture sits deliberately outside the band.
 *
 * PRICED AS ALLOWANCES, NOT PRODUCTS.
 * Three levels per item, each an amount rather than a named product, which is how
 * this market's better calculators quote interiors — "bathroom fittings up to
 * ₹17,000" rather than a specific tap. It is honest about what an estimate can
 * know at this stage, and it survives a supplier change.
 *
 * Ranges are from published 2025-26 Indian interior guides (Studio Matrx,
 * NoBroker, Godrej Properties, NearMe, MagicDecor) and are national rather than
 * Jaipur figures. They need calibrating against the client's own rate card before
 * they are treated as more than indicative, and every rate here is marked
 * `provisional` until that happens.
 */

export interface FurnitureOption {
  key: string;
  label: string;
  detail?: string;
  /** ₹ per unit of the pricing model. */
  rate: number;
  isDefault?: boolean;
  provisional?: boolean;
}

export interface FurnitureLine {
  key: string;
  label: string;
  hindi?: string;
  blurb: string;
  /** Lucide icon name, resolved through `lib/icons`. */
  icon: string;
  /**
   * `per-bedroom` uses the same 1-per-625-sq-ft rule the wardrobe line already
   * uses, so a home that is quoted four wardrobes is quoted four beds.
   */
  pricingModel: 'lumpsum' | 'per-sqft' | 'per-bedroom';
  options: FurnitureOption[];
  note?: string;
}

/** The wardrobe line's coefficient, reused so bedroom counts cannot disagree. */
export const BEDROOM_PER_SQFT = 0.0016;

export const FURNITURE_LINES: FurnitureLine[] = [
  {
    key: 'beds',
    label: 'Beds & bedroom furniture',
    hindi: 'पलंग और बेडरूम का सामान',
    blurb: 'Bed, side tables and a dresser, per bedroom',
    icon: 'BedDouble',
    pricingModel: 'per-bedroom',
    options: [
      { key: 'basic', label: 'Essential', detail: 'Engineered wood, laminate', rate: 35000, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'Veneer, upholstered headboard', rate: 65000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Solid wood, storage bed', rate: 120000, provisional: true },
    ],
    note: 'Counted at one bedroom per 625 sq ft — the same rule the wardrobe line uses.',
  },
  {
    key: 'sofa',
    label: 'Sofa & living seating',
    hindi: 'सोफ़ा और बैठक',
    blurb: 'Sofa set, centre table and accent seating',
    icon: 'Sofa',
    pricingModel: 'lumpsum',
    options: [
      { key: 'basic', label: 'Essential', detail: '3+1+1, fabric', rate: 60000, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'L-shape, premium fabric', rate: 150000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Designer, leather', rate: 350000, provisional: true },
    ],
  },
  {
    key: 'dining',
    label: 'Dining set',
    hindi: 'डाइनिंग सेट',
    blurb: 'Dining table, chairs and a crockery unit',
    icon: 'Utensils',
    pricingModel: 'lumpsum',
    options: [
      { key: 'basic', label: 'Essential', detail: '4-seater', rate: 40000, provisional: true },
      { key: 'mid', label: 'Signature', detail: '6-seater with crockery unit', rate: 90000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: '8-seater, marble or solid wood', rate: 200000, provisional: true },
    ],
  },
  {
    key: 'tv-unit',
    label: 'TV unit & console',
    hindi: 'टीवी यूनिट',
    blurb: 'Wall-mounted unit, panelling and storage',
    icon: 'Tv',
    pricingModel: 'lumpsum',
    options: [
      { key: 'basic', label: 'Essential', detail: 'Laminate console', rate: 30000, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'Panelled wall with storage', rate: 65000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Veneer wall, integrated lighting', rate: 140000, provisional: true },
    ],
  },
  {
    key: 'curtains',
    label: 'Curtains & blinds',
    hindi: 'पर्दे और ब्लाइंड्स',
    blurb: 'Every window in the house, with rods and fitting',
    icon: 'Blinds',
    pricingModel: 'lumpsum',
    options: [
      { key: 'basic', label: 'Essential', detail: 'Polyester, standard rods', rate: 50000, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'Lined, blackout in bedrooms', rate: 100000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Motorised blinds, sheers', rate: 150000, provisional: true },
    ],
  },
  {
    key: 'decor-lighting',
    label: 'Decorative lighting',
    hindi: 'सजावटी रोशनी',
    blurb: 'Pendants, wall lights and scene control, over and above the ceiling lights',
    icon: 'Lamp',
    pricingModel: 'per-sqft',
    options: [
      { key: 'basic', label: 'Essential', detail: 'LED fixtures', rate: 30, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'Designer fixtures', rate: 100, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Scene control and dimming zones', rate: 250, provisional: true },
    ],
  },
  {
    key: 'appliances',
    label: 'Appliances',
    hindi: 'उपकरण',
    blurb: 'Air conditioning, chimney, hob, and the white goods',
    icon: 'Refrigerator',
    pricingModel: 'lumpsum',
    options: [
      { key: 'basic', label: 'Essential', detail: 'Window AC, basic white goods', rate: 100000, provisional: true },
      { key: 'mid', label: 'Signature', detail: 'Split AC throughout', rate: 250000, isDefault: true, provisional: true },
      { key: 'premium', label: 'Premium', detail: 'Ducted, built-in appliances', rate: 500000, provisional: true },
    ],
  },
];

export const FURNITURE_LINE_BY_KEY: Record<string, FurnitureLine> = Object.fromEntries(
  FURNITURE_LINES.map((l) => [l.key, l]),
);

export function furnitureOptionOf(line: FurnitureLine, key: string | undefined): FurnitureOption {
  return line.options.find((o) => o.key === key) ?? line.options.find((o) => o.isDefault) ?? line.options[0]!;
}

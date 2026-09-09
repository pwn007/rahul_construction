import type {
  BaseRate,
  EstimatorPrice,
  Enhancement,
  FurnitureSpec,
  LocationMultiplier,
  MaterialSpec,
  WorkHeadSpec,
} from '@/types/domain';
import { ENHANCEMENTS, LOCATIONS, PACKAGES } from '@/constants/estimator';
import { MATERIAL_LINES, defaultOption } from '@/constants/materials';
import { WORK_HEADS } from '@/constants/work-heads';
import { FURNITURE_LINES, furnitureOptionOf } from '@/constants/furniture';

/**
 * Persisted mirror of the estimator constants.
 *
 * The live calculator reads only ESTIMATOR_PRICES below (the estimator-prices
 * resource, editable in /admin/estimator-prices); the other collections are the
 * retired wizard's, kept because the API contract still serves them.
 */

const meta = (id: string) => ({
  id,
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-06-01T09:00:00.000Z',
  status: 'published' as const,
});

export const BASE_RATES: BaseRate[] = PACKAGES.map((p, i) => ({
  ...meta(`rate_${p.key}`),
  key: p.key,
  label: p.label,
  description: p.description,
  minRate: p.minRate,
  maxRate: p.maxRate,
  labourOnlyRate: p.labourOnlyRate,
  order: i + 1,
}));

export const MATERIAL_RECORDS: MaterialSpec[] = MATERIAL_LINES.map((line, i) => ({
  ...meta(`mat_${line.key}`),
  key: line.key,
  label: line.label,
  group: line.group,
  unit: line.unit,
  coefficient: line.coefficient,
  options: line.options.map((o) => `${o.label} — ₹${o.rate}`),
  defaultRate: defaultOption(line).rate,
  provisional: line.options.some((o) => o.provisional),
  essential: Boolean(line.essential),
  order: i + 1,
}));

export const LOCATION_RECORDS: LocationMultiplier[] = LOCATIONS.map((l, i) => ({
  ...meta(`loc_${l.key}`),
  key: l.key,
  label: l.label,
  zone: l.zone,
  multiplier: l.multiplier,
  order: i + 1,
}));

export const ENHANCEMENT_RECORDS: Enhancement[] = ENHANCEMENTS.map((e, i) => ({
  ...meta(`enh_${e.key}`),
  key: e.key,
  label: e.label,
  description: e.description,
  icon: e.icon,
  pricingModel: e.pricingModel,
  unitPrice: e.unitPrice,
  appliesTo: [...e.appliesTo],
  order: i + 1,
}));

export const WORK_HEAD_RECORDS: WorkHeadSpec[] = WORK_HEADS.map((h, i) => ({
  ...meta(`work_${h.key}`),
  key: h.key,
  label: h.label,
  ...(h.hindi && { hindi: h.hindi }),
  minPackage: h.minPackage,
  costHead: h.costHead,
  materials: [...h.materialKeys],
  labourWeight: h.labourWeight,
  order: i + 1,
}));

export const FURNITURE_RECORDS: FurnitureSpec[] = FURNITURE_LINES.map((l, i) => ({
  ...meta(`fur_${l.key}`),
  key: l.key,
  label: l.label,
  description: l.blurb,
  icon: l.icon,
  pricingModel: l.pricingModel,
  options: l.options.map((o) => `${o.label} — ₹${o.rate}`),
  defaultRate: furnitureOptionOf(l, undefined).rate,
  order: i + 1,
}));

/**
 * The flat price list the live quote engine reads (estimator-prices resource).
 *
 * Generated from backend/config/estimator.php on 9 Sep 2026, with the old 20%
 * wastage buffer BAKED INTO the rates of every line that used to waste
 * (rate × 1.2, rounded; ≥200 to the nearest 5) — the client's call: quantities
 * now read net, the allowance rides inside the rate like a contractor's loaded
 * rate. Keys are "<line>:<option>", plus labour:civil-ground /
 * labour:civil-upper / labour:semi-furnished
 * (₹ per built-up sq ft) and overheads (whole percent). If a rate changes here
 * or in the config, regenerate the other side with it — contract-diff catches
 * drift.
 */
export const ESTIMATOR_PRICES: EstimatorPrice[] = [
  { ...meta('esp_1'), key: 'cement:ultratech', label: 'Cement — UltraTech (PPC)', unit: 'per bag', rate: 505, image: '/images/brands/ultratech.png', order: 1 },
  { ...meta('esp_2'), key: 'cement:ambuja', label: 'Cement — Ambuja (PPC)', unit: 'per bag', rate: 505, image: '/images/brands/ambuja.png', order: 2 },
  { ...meta('esp_3'), key: 'cement:jk-super', label: 'Cement — JK Super (OPC 53-grade)', unit: 'per bag', rate: 545, image: '/images/brands/jk-super.png', order: 3 },
  { ...meta('esp_4'), key: 'cement:acc', label: 'Cement — ACC (OPC 43-grade)', unit: 'per bag', rate: 485, image: '/images/brands/acc.png', order: 4 },
  { ...meta('esp_5'), key: 'cement:wonder', label: 'Cement — Wonder (PPC)', unit: 'per bag', rate: 470, image: '/images/brands/wonder.png', order: 5 },
  { ...meta('esp_6'), key: 'cement:shree', label: 'Cement — Shree (PPC)', unit: 'per bag', rate: 470, image: '/images/brands/shree.png', order: 6 },
  { ...meta('esp_7'), key: 'steel:jsw', label: 'TMT Steel — JSW (Fe500D)', unit: 'per kg', rate: 86, image: '/images/brands/jsw.svg', order: 7 },
  { ...meta('esp_8'), key: 'steel:tata', label: 'TMT Steel — TATA TISCON (Fe550D)', unit: 'per kg', rate: 94, image: '/images/brands/tata.png', order: 8 },
  { ...meta('esp_9'), key: 'steel:jindal', label: 'TMT Steel — Jindal Panther (Fe500D)', unit: 'per kg', rate: 89, image: '/images/brands/jindal.png', order: 9 },
  { ...meta('esp_10'), key: 'steel:kamadhenu', label: 'TMT Steel — Kamadhenu (Fe500D)', unit: 'per kg', rate: 79, image: '/images/brands/kamadhenu.png', order: 10 },
  { ...meta('esp_11'), key: 'steel:rathi', label: 'TMT Steel — Rathi (Fe500D)', unit: 'per kg', rate: 79, image: '/images/brands/rathi.png', order: 11 },
  { ...meta('esp_12'), key: 'bricks:renwel', label: 'Bricks — Renwel (Branded clay brick)', unit: 'per brick', rate: 11, image: '/images/materials/bricks-renwel.jpg', order: 12 },
  { ...meta('esp_13'), key: 'bricks:clay', label: 'Bricks — Clay brick (Standard local kiln)', unit: 'per brick', rate: 11, image: '/images/materials/bricks-clay.jpg', order: 13 },
  { ...meta('esp_14'), key: 'bricks:flyash', label: 'Bricks — Fly-ash block', unit: 'per brick', rate: 8, image: '/images/materials/bricks-flyash.jpg', order: 14 },
  { ...meta('esp_15'), key: 'bricks:kanota', label: 'Bricks — Kanota', unit: 'per brick', rate: 13, image: '/images/materials/bricks-kanota.jpg', order: 15 },
  { ...meta('esp_16'), key: 'bricks:hanumangarh', label: 'Bricks — Hanumangarh', unit: 'per brick', rate: 13, image: '/images/materials/bricks-hanumangarh.jpg', order: 16 },
  { ...meta('esp_17'), key: 'sand:river', label: 'Sand — River sand (Screened)', unit: 'per cubic ft', rate: 66, image: '/images/materials/sand-river.jpg', order: 17 },
  { ...meta('esp_18'), key: 'sand:msand', label: 'Sand — M-sand (Manufactured)', unit: 'per cubic ft', rate: 48, image: '/images/materials/sand-msand.jpg', order: 18 },
  { ...meta('esp_19'), key: 'aggregate:graded', label: 'Aggregate — Graded 20 & 10 mm', unit: 'per cubic ft', rate: 54, image: '/images/materials/agg-graded.jpg', order: 19 },
  { ...meta('esp_20'), key: 'aggregate:washed', label: 'Aggregate — Washed, low-silt', unit: 'per cubic ft', rate: 62, image: '/images/materials/agg-washed.jpg', order: 20 },
  { ...meta('esp_21'), key: 'stone:masonry', label: 'Foundation stone — Masonry stone (Kota quarry)', unit: 'per tonne', rate: 900, image: '/images/materials/stone-masonry.jpg', order: 21 },
  { ...meta('esp_24'), key: 'flooring:t50', label: 'Flooring & tiles — Vitrified, tile up to ₹50/sq ft', unit: 'per sq ft', rate: 72, image: '/images/materials/flooring-t50.jpg', order: 24 },
  { ...meta('esp_25'), key: 'flooring:t80', label: 'Flooring & tiles — Vitrified, tile up to ₹80/sq ft', unit: 'per sq ft', rate: 114, image: '/images/materials/flooring-t80.jpg', order: 25 },
  { ...meta('esp_26'), key: 'flooring:t120', label: 'Flooring & tiles — Large-format & marble, up to ₹120/sq ft', unit: 'per sq ft', rate: 170, image: '/images/materials/flooring-t120.jpg', order: 26 },
  { ...meta('esp_27'), key: 'wall-finish:tractor', label: 'Wall finish & paint — Tractor emulsion', unit: 'per sq ft', rate: 26, image: '/images/materials/wallfinish-tractor.jpg', order: 27 },
  { ...meta('esp_28'), key: 'wall-finish:premium', label: 'Wall finish & paint — Premium emulsion', unit: 'per sq ft', rate: 34, image: '/images/materials/wallfinish-premium.jpg', order: 28 },
  { ...meta('esp_29'), key: 'wall-finish:royal', label: 'Wall finish & paint — Royal Matt + textures', unit: 'per sq ft', rate: 60, image: '/images/materials/wallfinish-royal.jpg', order: 29 },
  { ...meta('esp_30'), key: 'doors:flush', label: 'Doors — Flush shutter (Granite frame)', unit: 'per door', rate: 9800, image: '/images/materials/doors-flush.jpg', order: 30 },
  { ...meta('esp_31'), key: 'doors:laminated', label: 'Doors — Laminated shutter (Wooden frame)', unit: 'per door', rate: 12000, image: '/images/materials/doors-laminated.jpg', order: 31 },
  { ...meta('esp_32'), key: 'doors:teak', label: 'Doors — Teak veneer (Polished wooden frame)', unit: 'per door', rate: 14200, image: '/images/materials/doors-teak.jpg', order: 32 },
  { ...meta('esp_33'), key: 'grills:ms-plain', label: 'Grills & safety railings — MS plain (Painted mild steel)', unit: 'per sq ft', rate: 300, image: '/images/materials/grills-msplain.jpg', order: 33 },
  { ...meta('esp_34'), key: 'grills:ms-design', label: 'Grills & safety railings — MS decorative (Fabricated pattern)', unit: 'per sq ft', rate: 350, image: '/images/materials/grills-msdecorative.jpg', order: 34 },
  { ...meta('esp_35'), key: 'grills:ss', label: 'Grills & safety railings — SS 304 (Brushed stainless)', unit: 'per sq ft', rate: 600, image: '/images/materials/grills-ss.jpg', order: 35 },
  { ...meta('esp_36'), key: 'windows:aluminium', label: 'Windows — Aluminium (Single glazed)', unit: 'per sq ft', rate: 440, image: '/images/materials/windows-aluminium.jpg', order: 36 },
  { ...meta('esp_37'), key: 'windows:upvc', label: 'Windows — UPVC (Single glazed)', unit: 'per sq ft', rate: 520, image: '/images/materials/windows-upvc.jpg', order: 37 },
  { ...meta('esp_38'), key: 'windows:wooden', label: 'Windows — Wooden (Seasoned hardwood)', unit: 'per sq ft', rate: 520, image: '/images/materials/windows-wooden.jpg', order: 38 },
  { ...meta('esp_39'), key: 'conduiting:isi', label: 'Electrical & plumbing conduiting — ISI conduit, drainage cast in', unit: 'per sq ft', rate: 90, image: '/images/materials/conduit-isi.jpg', order: 39 },
  { ...meta('esp_40'), key: 'conduiting:pvc', label: 'Electrical & plumbing conduiting — PVC conduit and sleeves', unit: 'per sq ft', rate: 74, image: '/images/materials/conduit-pvc.jpg', order: 40 },
  { ...meta('esp_41'), key: 'electrical:anchor', label: 'Electrical — Anchor Penta', unit: 'per point', rate: 4100, image: '/images/brands/anchor.png', order: 41 },
  { ...meta('esp_42'), key: 'electrical:havells', label: 'Electrical — Havells modular', unit: 'per point', rate: 4400, image: '/images/brands/havells.png', order: 42 },
  { ...meta('esp_43'), key: 'electrical:schneider', label: 'Electrical — Schneider (Modular)', unit: 'per point', rate: 4700, image: '/images/brands/schneider.png', order: 43 },
  { ...meta('esp_44'), key: 'electrical:gm', label: 'Electrical — GM (Modular)', unit: 'per point', rate: 4700, image: '/images/brands/gm.svg', order: 44 },
  { ...meta('esp_45'), key: 'plumbing:ashirvad', label: 'Plumbing — Ashirvad (CPVC & PVC)', unit: 'per sq ft', rate: 54, image: '/images/brands/ashirvad.png', order: 45 },
  { ...meta('esp_46'), key: 'plumbing:astral', label: 'Plumbing — Astral (CPVC & PVC)', unit: 'per sq ft', rate: 54, image: '/images/brands/astral.png', order: 46 },
  { ...meta('esp_47'), key: 'plumbing:supreme', label: 'Plumbing — Supreme (CPVC & PVC)', unit: 'per sq ft', rate: 49, image: '/images/brands/supreme.png', order: 47 },
  { ...meta('esp_48'), key: 'plumbing:prince', label: 'Plumbing — Prince (CPVC & PVC)', unit: 'per sq ft', rate: 49, image: '/images/brands/prince.png', order: 48 },
  { ...meta('esp_49'), key: 'plumbing:kisan', label: 'Plumbing — Kisan (CPVC & PVC)', unit: 'per sq ft', rate: 44, image: '/images/brands/kisan.png', order: 49 },
  { ...meta('esp_50'), key: 'bathroom:set35', label: 'Bathroom fixtures — ₹35,000 class (Parryware, Essco or equivalent)', unit: 'per bathrooms', rate: 22000, image: '/images/materials/bathroom-set35.jpg', order: 50 },
  { ...meta('esp_51'), key: 'bathroom:set50', label: 'Bathroom fixtures — ₹50,000 class (Jaquar, Kohler or equivalent)', unit: 'per bathrooms', rate: 31400, image: '/images/materials/bathroom-set50.jpg', order: 51 },
  { ...meta('esp_52'), key: 'water-tank:s10', label: 'Water tanks — 500 L × 2', unit: 'per tank', rate: 10000, image: '/images/materials/tank-small.jpg', order: 52 },
  { ...meta('esp_53'), key: 'water-tank:s15', label: 'Water tanks — 1,000 L + 500 L', unit: 'per tank', rate: 15000, image: '/images/materials/tank-small.jpg', order: 53 },
  { ...meta('esp_54'), key: 'water-tank:s50', label: 'Water tanks — 5,000 L', unit: 'per tank', rate: 50000, order: 54 },
  { ...meta('esp_55'), key: 'water-tank:s100', label: 'Water tanks — 10,000 L', unit: 'per tank', rate: 100000, order: 55 },
  /* Civil labour is floor-wise (client's call): ground-only carries all the
     one-time excavation/foundation work on one floor's area. */
  { ...meta('esp_56'), key: 'labour:civil-ground', label: 'Labour — Civil (Ground only)', unit: 'per sq ft built-up', rate: 450, order: 56 },
  { ...meta('esp_59'), key: 'labour:civil-upper', label: 'Labour — Civil (Ground + floors)', unit: 'per sq ft built-up', rate: 350, order: 57 },
  { ...meta('esp_57'), key: 'labour:semi-furnished', label: 'Labour — Semi Furnished', unit: 'per sq ft built-up', rate: 400, order: 58 },
  { ...meta('esp_58'), key: 'overheads', label: 'Site overheads', unit: '% of materials + labour', rate: 15, order: 59 },
];

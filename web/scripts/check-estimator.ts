/**
 * Estimator reconciliation & calibration check.
 *
 * The estimator shows a total, splits it four ways, and itemises one of those
 * four into seventeen material lines with quantities and rates. Three chances for
 * the arithmetic on screen to disagree with itself — which is exactly the failure
 * a competitor ships today, where three displayed components miss their own
 * stated total by 3.6% because an undisclosed 5% uplift is applied to one of
 * them. A visitor who adds up the numbers they were shown gets a different answer
 * to the one printed above them.
 *
 * What this asserts, across the whole input space:
 *
 *   1. Σ commercial heads   ≡ total
 *   2. Σ construction heads ≡ total
 *   3. Σ material lines     ≡ the Materials head
 *   4. quantity × rate      ≡ amount, on every line
 *   5. selecting every material at its default brand lands ₹/sq ft inside the
 *      PUBLISHED RATE CARD for the derived scope
 *   6. mutually exclusive materials are never priced together
 *   7. every material declares exactly one default option, and no option smuggles
 *      structure into a display string
 *   8. an empty selection prices zero without dividing by zero or producing NaN
 *
 * (1)–(4) are now plain arithmetic rather than something engineered. Pricing runs
 * bottom-up: `total` is *defined* as materialsCost ÷ materials-share, so the
 * Materials head cannot fail to equal the lines that produced it. The previous
 * design reached the same guarantee via a normalisation factor — which is exactly
 * why it had to go: a factor sized to make the lines fit a package-rate pool would
 * have silently absorbed every grade change, so picking imported marble moved
 * nothing.
 *
 * (5) is the real calibration alarm, and it is stronger than the factor it
 * replaced. Inverting the model could have quietly invented a new price list;
 * this asserts that the default selection still reproduces the rates the client
 * publishes. When it fails, the coefficients in `constants/materials.ts` and the
 * rate card in `constants/estimator.ts` have stopped describing the same
 * building.
 *
 * (6) guards a double-count. Ready-mix concrete and site-mixed cement + sand +
 * aggregate are the same concrete bought two ways; a competitor's calculator
 * lists both as additive rows and charges for the cubic metre twice.
 *
 *   npm run check:estimator
 */

import { calculateEstimate, deriveScope, DEFAULT_INPUT } from '../src/features/estimator/model';
import { LOCATIONS, PACKAGES, PROPERTY_TYPES } from '../src/constants/estimator';
import { MATERIAL_LINES, defaultOption } from '../src/constants/materials';

/** A rupee of slack for floating-point noise on values in the crores. */
const EPSILON = 0.01;

const AREAS = [400, 1200, 2500, 8000];
const FLOORS = [1, 2, 3, 5];
const LEVELS: [boolean, boolean][] = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
];

/** Select the given lines, each at its default brand — the calibrated rate. */
function select(lines: typeof MATERIAL_LINES) {
  return Object.fromEntries(lines.map((l) => [l.key, defaultOption(l).key]));
}

/* The default set is everything except the alternatives. Filtering on
   `exclusiveWith` instead would have dropped cement, sand and aggregate — they
   declare exclusivity with ready-mix, symmetrically, so participating in an
   exclusion says nothing about which side is the norm. */
const SELECTABLE = MATERIAL_LINES.filter((l) => !l.isAlternative);
const STRUCTURE_ONLY = SELECTABLE.filter((l) => l.packages.includes('civil'));
const FINISHED = SELECTABLE.filter((l) => l.group !== 'fixtures');

let checked = 0;
const failures: string[] = [];

/* -------------------------------------------------------------------- */
/* 1–4. Reconciliation                                                    */
/* -------------------------------------------------------------------- */

{
  for (const loc of LOCATIONS) {
    for (const propertyType of PROPERTY_TYPES) {
      for (const areaPerFloor of AREAS) {
        for (const floors of FLOORS) {
          for (const [hasBasement, hasStilt] of LEVELS) {
            for (const [label, lines] of [
              ['structure-only', STRUCTURE_ONLY],
              ['finished', FINISHED],
              ['furnished', SELECTABLE],
              ['empty', []],
            ] as [string, typeof MATERIAL_LINES][]) {
              const r = calculateEstimate({
                ...DEFAULT_INPUT,
                materials: select(lines),
                location: loc.key,
                propertyType: propertyType.key,
                areaPerFloor,
                floors,
                hasBasement,
                hasStilt,
              });
              checked++;

              const where = `${label}/${propertyType.key}/${loc.key} ${areaPerFloor}×${floors}`;

              if (!Number.isFinite(r.total) || r.total < 0) {
                failures.push(`${where}: total is ${r.total}`);
              }
              if (!lines.length && r.total !== 0) {
                failures.push(`${where}: empty selection priced ${r.total}, expected 0`);
              }

              const commercialSum = r.commercial.reduce((s, c) => s + c.amount, 0);
              if (Math.abs(commercialSum - r.total) > EPSILON) {
                failures.push(`${where}: commercial heads sum to ${commercialSum}, total is ${r.total}`);
              }

              const headSum = r.heads.reduce((s, h) => s + h.amount, 0);
              if (Math.abs(headSum - r.total) > EPSILON) {
                failures.push(`${where}: construction heads sum to ${headSum}, total is ${r.total}`);
              }

              const pool = r.commercial.find((c) => c.key === 'materials')?.amount ?? 0;
              const lineSum = r.materialLines.reduce((s, l) => s + l.amount, 0);
              if (Math.abs(lineSum - pool) > EPSILON) {
                failures.push(`${where}: material lines sum to ${lineSum}, Materials head is ${pool}`);
              }

              for (const line of r.materialLines) {
                if (Math.abs(line.quantity * line.unitRate - line.amount) > EPSILON) {
                  failures.push(`${where}: ${line.key} — quantity × rate ≠ amount`);
                }
              }
            }
          }
        }
      }
    }
  }
}

/* -------------------------------------------------------------------- */
/* 5. Rate-card calibration                                               */
/* -------------------------------------------------------------------- */

console.log(`\nChecked ${checked.toLocaleString('en-IN')} configurations.\n`);
console.log('Every material at its default brand, vs the published rate card:');

/* Baseline geometry — a plain 2,400 sq ft build with no basement or stilt, since
   those deliberately move the chargeable area away from the card's assumptions. */
const SCENARIOS: { label: string; lines: typeof MATERIAL_LINES }[] = [
  { label: 'Structure only', lines: STRUCTURE_ONLY },
  { label: 'Finished', lines: FINISHED },
  { label: 'With fixtures', lines: SELECTABLE },
];

for (const scenario of SCENARIOS) {
  const input = {
    ...DEFAULT_INPUT,
    materials: select(scenario.lines),
    areaPerFloor: 1200,
    floors: 2,
  };
  const r = calculateEstimate(input);
  const scope = deriveScope(input);
  const pkg = PACKAGES.find((p) => p.key === scope)!;
  const rate = r.perSqft;
  const ok = rate >= pkg.minRate && rate <= pkg.maxRate;

  console.log(
    `  ${scenario.label.padEnd(15)} → ${scope.padEnd(16)} ₹${Math.round(rate)
      .toLocaleString('en-IN')
      .padStart(6)}/sq ft   card ₹${pkg.minRate.toLocaleString('en-IN')}–${pkg.maxRate.toLocaleString('en-IN')}  ${ok ? '✓' : '✗'}`,
  );

  if (!ok) {
    failures.push(
      `${scenario.label}: bottom-up rate ₹${Math.round(rate)}/sq ft falls outside the published ` +
        `${scope} band of ₹${pkg.minRate}–${pkg.maxRate}. The quantity coefficients and the rate card ` +
        `have drifted apart — the breakdown will still add up, but it no longer prices the product we sell.`,
    );
  }
}

/* -------------------------------------------------------------------- */
/* 6. Mutual exclusion                                                    */
/* -------------------------------------------------------------------- */

for (const line of MATERIAL_LINES.filter((l) => l.exclusiveWith?.length)) {
  /* Declared both ways, or the UI can show a partner row as live while the
     pricing has already dropped it. */
  for (const partnerKey of line.exclusiveWith ?? []) {
    const partner = MATERIAL_LINES.find((l) => l.key === partnerKey);
    if (!partner) {
      failures.push(`${line.key}: exclusiveWith names "${partnerKey}", which is not a material`);
      continue;
    }
    if (!partner.exclusiveWith?.includes(line.key)) {
      failures.push(`${partner.key}: does not declare ${line.key} as exclusive, but ${line.key} declares it`);
    }
  }
}

/* And prove it holds in the output, not just the data. */
{
  const withRmc = calculateEstimate({
    ...DEFAULT_INPUT,
    areaPerFloor: 1200,
    floors: 2,
    materials: { ...select(FINISHED), rmc: 'm25' },
  });
  const keys = new Set(withRmc.materialLines.map((l) => l.key));
  for (const dropped of ['cement', 'sand', 'aggregate']) {
    if (keys.has(dropped)) {
      failures.push(`ready-mix selected but ${dropped} is still priced — the same concrete is charged twice`);
    }
  }
  if (!keys.has('rmc')) failures.push('ready-mix selected but not priced');
}

/* -------------------------------------------------------------------- */
/* 7. Exactly one default per material                                    */
/* -------------------------------------------------------------------- */

/**
 * The label assertion exists because of a real bug.
 *
 * The brand card used to infer an "Or" by splitting `label` on " / ", so any
 * slash became a supplier alternation: two separate steel manufacturers were
 * merged into one option and shown as equivalents, and "Acrylic / membrane
 * shutters" — one finish description — rendered as a choice between two brands.
 * Every brand now gets its own card, so no label should pair two names at all.
 */
const PAIRED = / \/ | [Oo]r /;

for (const line of MATERIAL_LINES) {
  const defaults = line.options.filter((o) => o.isDefault);
  if (defaults.length !== 1) {
    failures.push(`${line.key}: has ${defaults.length} default options, expected exactly 1`);
  }
  if (!line.options.length) failures.push(`${line.key}: has no options`);

  const keys = new Set(line.options.map((o) => o.key));
  if (keys.size !== line.options.length) failures.push(`${line.key}: duplicate option keys`);

  for (const o of line.options) {
    if (PAIRED.test(o.label)) {
      failures.push(
        `${line.key}/${o.key}: label "${o.label}" pairs two names. Every brand gets its own ` +
          'option — equivalents share a rate rather than a card.',
      );
    }
  }
}

const provisional = MATERIAL_LINES.filter((l) => l.options.some((o) => o.provisional));
if (provisional.length) {
  console.log(
    `\n${provisional.length} material(s) have at least one brand priced by derivation rather than ` +
      'from the client\'s published calculator. Marked with an asterisk in the UI: ' +
      provisional.map((l) => l.label).join(', ') + '.',
  );
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):\n`);
  for (const f of failures.slice(0, 20)) console.error(`  ${f}`);
  if (failures.length > 20) console.error(`  … and ${failures.length - 20} more`);
  process.exit(1);
}

console.log(
  `\n✓ ${MATERIAL_LINES.length} materials · ${MATERIAL_LINES.reduce((n, l) => n + l.options.length, 0)} brand options. ` +
    'Every level reconciles exactly, and default brands match the published rate card.\n',
);

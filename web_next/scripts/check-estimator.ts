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
 *   5. tapping each package lands its ₹/sq ft inside that package's PUBLISHED
 *      RATE CARD
 *   6. mutually exclusive materials are never priced together
 *   7. every material declares exactly one default option, and no option smuggles
 *      structure into a display string
 *   8. an empty selection prices zero without dividing by zero or producing NaN
 *   9. Sum of work heads     = total
 *  10. every material line belongs to exactly one work head, and every work head
 *      names only real material lines
 *  11. loose furniture reconciles like an enhancement — and takes ₹/sq ft OUTSIDE
 *      the fully-furnished band, deliberately
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
 * (9) is what makes the work-head view safe to show. Work heads re-partition the
 * total rather than adding to it, and the weights are normalised over whatever is
 * active, so the identity should hold for every selection including the empty one
 * and the labour-only one. Asserting it is cheaper than reasoning about it.
 *
 * (10) is what makes "what is shown is what is priced" true rather than
 * aspirational. A material that belongs to no work head is money the breakdown
 * silently drops; a material in two heads is money it counts twice.
 *
 *   npm run check:estimator
 */

import { calculateEstimate, effectiveScope, packageDefaults, DEFAULT_INPUT } from '../src/features/estimator/model';
import { ENHANCEMENTS, LOCATIONS, PACKAGES, PROPERTY_TYPES } from '../src/constants/estimator';
import { MATERIAL_LINES, defaultOption } from '../src/constants/materials';
import { WORK_HEADS, workHeadsFor } from '../src/constants/work-heads';
import { FURNITURE_LINES } from '../src/constants/furniture';

/** A rupee of slack for floating-point noise on values in the crores. */
const EPSILON = 0.01;

/**
 * The commercial modes, swept alongside the geometry.
 *
 * These were previously fixed at the defaults, which left two whole branches of
 * the model unasserted: labour-only, where there are no material lines at all and
 * the entire total has to land on the work heads, and a selection carrying
 * enhancements, where an enhancement's material fraction appears in
 * `materialLines` while its full cost has to reconcile exactly once.
 */
const MODES: { label: string; serviceModel: 'turnkey' | 'labour-only'; enhancements: string[] }[] = [
  { label: 'turnkey', serviceModel: 'turnkey', enhancements: [] },
  { label: 'turnkey+extras', serviceModel: 'turnkey', enhancements: ENHANCEMENTS.map((e) => e.key) },
  { label: 'labour-only', serviceModel: 'labour-only', enhancements: [] },
];

/** Every furnishing at its default allowance — the heaviest selection possible. */
const ALL_FURNITURE = Object.fromEntries(
  FURNITURE_LINES.map((l) => [l.key, (l.options.find((o) => o.isDefault) ?? l.options[0]!).key]),
);

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
            for (const mode of MODES) {
              const r = calculateEstimate({
                ...DEFAULT_INPUT,
                materials: select(lines),
                location: loc.key,
                propertyType: propertyType.key,
                areaPerFloor,
                floors,
                hasBasement,
                hasStilt,
                serviceModel: mode.serviceModel,
                enhancements: mode.enhancements,
                /* Swept on the extras mode, so the furniture path is covered by
                   every reconciliation assertion rather than only by its own. */
                furniture: mode.enhancements.length ? ALL_FURNITURE : {},
              });
              checked++;

              const where = `${label}/${mode.label}/${propertyType.key}/${loc.key} ${areaPerFloor}×${floors}`;

              if (!Number.isFinite(r.total) || r.total < 0) {
                failures.push(`${where}: total is ${r.total}`);
              }
              /* Turnkey, and nothing added. A labour-only contract prices the work
                 at the rate card's labour rate, which does not depend on a material
                 selection; and an enhancement is a priced thing in its own right.
                 An empty selection is only expected to price zero when there is
                 genuinely nothing in the build. */
              if (!lines.length && mode.serviceModel === 'turnkey' && !mode.enhancements.length && r.total !== 0) {
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

              /* (9) Work heads re-partition the total; they never add to it. */
              const workSum = r.workHeads.reduce((s, h) => s + h.amount, 0);
              const expected = r.total > 0 ? r.total : 0;
              if (Math.abs(workSum - expected) > EPSILON) {
                failures.push(`${where}: work heads sum to ${workSum}, total is ${expected}`);
              }
              for (const head of r.workHeads) {
                if (!Number.isFinite(head.amount) || head.amount < 0) {
                  failures.push(`${where}: work head ${head.key} is ${head.amount}`);
                }
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
console.log('Each package at its default selection, vs the published rate card:');

/*
 * Baseline geometry — a plain 2,400 sq ft build with no basement or stilt, since
 * those deliberately move the chargeable area away from the card's assumptions.
 *
 * The scenarios used to be three hand-built proxies (structure-only, everything
 * bar the fixtures, everything) chosen to *land on* each derived scope. They are
 * now the literal selections `packageDefaults` fills in, which is what a visitor
 * gets by tapping a package — so this asserts the thing that is actually shipped
 * rather than a stand-in for it. The two agree today, which is how we know the
 * swap changed the strength of the test and not the product.
 */
for (const pkg of PACKAGES) {
  const materials = packageDefaults(pkg.key);
  const input = {
    ...DEFAULT_INPUT,
    packageKey: pkg.key,
    materials,
    areaPerFloor: 1200,
    floors: 2,
  };
  const r = calculateEstimate(input);
  const scope = effectiveScope(input);
  const rate = r.perSqft;
  const ok = rate >= pkg.minRate && rate <= pkg.maxRate;

  console.log(
    `  ${pkg.label.padEnd(15)} → ${scope.padEnd(16)} ₹${Math.round(rate)
      .toLocaleString('en-IN')
      .padStart(6)}/sq ft   card ₹${pkg.minRate.toLocaleString('en-IN')}–${pkg.maxRate.toLocaleString('en-IN')}  ${ok ? '✓' : '✗'}`,
  );

  if (scope !== pkg.key) {
    failures.push(
      `${pkg.label}: tapping this package derives scope "${scope}". The defaults it fills in imply a ` +
        'different scope than the one the visitor asked for, so the commercial split applied to their ' +
        'estimate is not the one on the card they tapped.',
    );
  }

  if (!ok) {
    failures.push(
      `${pkg.label}: bottom-up rate ₹${Math.round(rate)}/sq ft falls outside the published ` +
        `${pkg.key} band of ₹${pkg.minRate}–${pkg.maxRate}. The quantity coefficients and the rate card ` +
        `have drifted apart — the breakdown will still add up, but it no longer prices the product we sell.`,
    );
  }
}

/*
 * The selection a visitor gets and the selection the band is asserted against
 * have to be the same array, not two filters that happen to agree. `SELECTABLE`
 * is this file's calibration set; `packageDefaults` is the product's.
 */
{
  const expected = new Set(SELECTABLE.filter((l) => l.packages.includes('fully-furnished')).map((l) => l.key));
  const actual = new Set(Object.keys(packageDefaults('fully-furnished')));
  for (const key of expected) {
    if (!actual.has(key)) failures.push(`packageDefaults(fully-furnished): missing ${key}, which SELECTABLE includes`);
  }
  for (const key of actual) {
    if (!expected.has(key)) failures.push(`packageDefaults(fully-furnished): includes ${key}, which SELECTABLE excludes`);
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

/* -------------------------------------------------------------------- */
/* 10. Work-head coverage                                                 */
/* -------------------------------------------------------------------- */

{
  const owner = new Map<string, string>();

  for (const head of WORK_HEADS) {
    for (const key of head.materialKeys) {
      if (!MATERIAL_LINES.some((l) => l.key === key)) {
        failures.push(`work head ${head.key}: names material "${key}", which does not exist`);
        continue;
      }
      const existing = owner.get(key);
      if (existing) {
        failures.push(`material ${key}: claimed by both ${existing} and ${head.key} — it would be counted twice`);
      } else {
        owner.set(key, head.key);
      }
    }
  }

  for (const line of MATERIAL_LINES) {
    if (!owner.has(line.key)) {
      failures.push(`material ${line.key}: belongs to no work head — its cost would vanish from the breakdown`);
    }
  }

  /* A head has to be reachable, or it is documentation rather than a head. */
  for (const head of WORK_HEADS) {
    if (!workHeadsFor(head.minPackage).some((h) => h.key === head.key)) {
      failures.push(`work head ${head.key}: not returned by workHeadsFor(${head.minPackage})`);
    }
  }

  const duplicates = WORK_HEADS.length - new Set(WORK_HEADS.map((h) => h.key)).size;
  if (duplicates) failures.push(`WORK_HEADS: ${duplicates} duplicate key(s)`);

  for (const head of WORK_HEADS) {
    if (!(head.labourWeight > 0)) {
      failures.push(`work head ${head.key}: labourWeight is ${head.labourWeight}, expected a positive number`);
    }
  }
}

/* -------------------------------------------------------------------- */
/* 11. Furniture is additive, and deliberately outside the band            */
/* -------------------------------------------------------------------- */

{
  const base = {
    ...DEFAULT_INPUT,
    packageKey: 'fully-furnished' as const,
    materials: packageDefaults('fully-furnished'),
    areaPerFloor: 1200,
    floors: 2,
  };
  const without = calculateEstimate(base);
  const furnished = calculateEstimate({ ...base, furniture: ALL_FURNITURE });

  if (!(furnished.furnitureCost > 0)) {
    failures.push('furniture: every item selected priced nothing');
  }
  if (Math.abs(furnished.total - without.total - furnished.furnitureCost) > EPSILON) {
    failures.push('furniture: the total did not move by exactly the furniture cost — it is not purely additive');
  }
  /*
   * Asserted so that nobody later "fixes" it.
   *
   * ₹2,500–3,000/sq ft is the price of a fully furnished *contract*: fixed
   * joinery, not a sofa. A build carrying loose furniture is expected to sit
   * above that band, and a future change that quietly brings it back inside would
   * mean furniture had been folded into the package rate — restating the price of
   * everything else to make room for it.
   */
  const card = PACKAGES.find((p) => p.key === 'fully-furnished')!;
  if (furnished.perSqft <= card.maxRate) {
    failures.push(
      `furniture: a fully furnished build with every furnishing prices at ₹${Math.round(furnished.perSqft)}/sq ft, ` +
        `inside the ₹${card.minRate}–${card.maxRate} contract band. Furniture is priced on top of that contract, ` +
        'not inside it — if this now fits, it has been folded into the package rate.',
    );
  }

  console.log(
    `\n  Fully Furnished + all furnishings → ₹${Math.round(furnished.perSqft).toLocaleString('en-IN')}/sq ft ` +
      `(₹${Math.round(furnished.furnitureCost).toLocaleString('en-IN')} of furniture, priced above the contract band).`,
  );

  for (const line of FURNITURE_LINES) {
    const defaults = line.options.filter((o) => o.isDefault);
    if (defaults.length !== 1) failures.push(`furniture ${line.key}: has ${defaults.length} defaults, expected 1`);
    if (new Set(line.options.map((o) => o.key)).size !== line.options.length) {
      failures.push(`furniture ${line.key}: duplicate option keys`);
    }
  }
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):\n`);
  for (const f of failures.slice(0, 20)) console.error(`  ${f}`);
  if (failures.length > 20) console.error(`  … and ${failures.length - 20} more`);
  process.exit(1);
}

console.log(
  `\n✓ ${MATERIAL_LINES.length} materials · ${MATERIAL_LINES.reduce((n, l) => n + l.options.length, 0)} brand options · ` +
    `${WORK_HEADS.length} work heads · ${FURNITURE_LINES.length} furnishings. ` +
    'Every level reconciles exactly, and default brands match the published rate card.\n',
);

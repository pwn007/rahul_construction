/**
 * Project Atlas — geometry generator.
 *
 *   node scripts/build-districts.mjs
 *
 * Reads the vendored DataMeet zone polygons, applies the editorial layer in
 * districts.config.mjs, and emits two generated modules:
 *
 *   src/data/jaipur-districts.ts           metadata (labels, label anchors, bboxes)
 *   src/data/jaipur-districts.geometry.ts  the SVG path strings (~4 KB gzip)
 *
 * The split is deliberate: several consumers (admin config, filter chips, SEO
 * copy) need the labels and none of them need the path data. Path strings live
 * in one object literal, which Rollup cannot tree-shake, so a file boundary is
 * the only thing that actually keeps geometry out of those chunks.
 *
 * Output is committed, exactly like src/data/image-catalogue.ts. This script is
 * not part of `npm run build`.
 *
 * WHY MAPSHAPER RATHER THAN A HAND-ROLLED SIMPLIFIER
 * Adjacent zones share borders. A per-feature Douglas-Peucker simplifies each
 * side of a shared border independently and tears them apart, leaving hairline
 * gaps between districts. Mapshaper simplifies shared arcs once, so borders
 * stay welded. Do not swap it for something simpler.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import mapshaper from 'mapshaper';
import polylabel from 'polylabel';
import { FRAME, SIMPLIFY, MAX_LABEL_LENGTH, ZONES, OVERRIDES, REVIEW_NOTES, KNOWN_PROJECT_LOCALITIES } from './districts.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'data/jaipur-zones.geojson');
const OUT_META = join(HERE, '../src/data/jaipur-districts.ts');
const OUT_GEOM = join(HERE, '../src/data/jaipur-districts.geometry.ts');
const PROJECTS_TS = join(HERE, '../src/data/projects.ts');
const SITE_TS = join(HERE, '../src/constants/site.ts');

const RETRIEVED = '2026-08-06';
const EXPECTED_SHA = '8dc41b6e756a8d9ad14bcd9b5d2e23ce5e316d6b904694c5506729f8f3ada1c3';

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

/* ── 1. Read and validate ─────────────────────────────────────────────── */

const raw = readFileSync(SRC);
const sha = createHash('sha256').update(raw).digest('hex');
if (sha !== EXPECTED_SHA) {
  fail(
    `Source geojson sha256 mismatch.\n    expected ${EXPECTED_SHA}\n    actual   ${sha}\n` +
      `  The upstream file changed. Re-verify the geometry and licence, then update\n` +
      `  EXPECTED_SHA here and in scripts/data/LICENCE-datameet.txt.`,
  );
}

const source = JSON.parse(raw.toString('utf8'));
if (source.type !== 'FeatureCollection') fail(`Expected a FeatureCollection, got ${source.type}`);
if (source.features.length !== 10) fail(`Expected 10 zones, got ${source.features.length}`);

// Self-discover the name property rather than trusting a hard-coded key.
const NAME_KEYS = ['Zone_Name', 'ZONE_NAME', 'Name', 'NAME', 'name', 'zone'];
const nameKey = NAME_KEYS.find((k) => k in source.features[0].properties);
if (!nameKey) {
  fail(`No zone-name property found. Observed keys: ${Object.keys(source.features[0].properties).join(', ')}`);
}

for (const f of source.features) {
  if (f.geometry.type !== 'Polygon') fail(`${f.properties[nameKey]}: expected Polygon, got ${f.geometry.type}`);
  if (f.geometry.coordinates.length !== 1) {
    fail(`${f.properties[nameKey]}: expected a single ring, got ${f.geometry.coordinates.length} (holes are not handled)`);
  }
}
ok(`10 single-ring polygons, name property "${nameKey}", sha256 verified`);

/* ── 2. Join the editorial layer, both directions ─────────────────────── */

const zoneNames = source.features.map((f) => String(f.properties[nameKey]).trim().replace(/\s+/g, ' ').toUpperCase());
const configNames = Object.keys(ZONES);

const missingConfig = zoneNames.filter((n) => !configNames.includes(n));
const orphanConfig = configNames.filter((n) => !zoneNames.includes(n));
if (missingConfig.length) fail(`Zones in the geojson with no ZONES entry: ${missingConfig.join(', ')}`);
if (orphanConfig.length) fail(`ZONES entries that match no zone in the geojson: ${orphanConfig.join(', ')}`);

for (const [name, z] of Object.entries(ZONES)) {
  if (z.label.length > MAX_LABEL_LENGTH) {
    fail(`${name}: label "${z.label}" is ${z.label.length} chars, over the ${MAX_LABEL_LENGTH} limit (it is drawn on the map and must not wrap)`);
  }
}

const ids = configNames.map((n) => ZONES[n].id);
if (new Set(ids).size !== ids.length) fail('Duplicate district id in ZONES');
ok('editorial layer maps 1:1 onto the geometry, labels within length limit');

/* ── 3. Frame: equirectangular with the cos(mid-latitude) correction ───── */

let lonMin = Infinity, lonMax = -Infinity, latMin = Infinity, latMax = -Infinity;
for (const f of source.features) {
  for (const [lon, lat] of f.geometry.coordinates[0]) {
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
  }
}
const padLon = (lonMax - lonMin) * FRAME.padPct;
const padLat = (latMax - latMin) * FRAME.padPct;
const lon0 = lonMin - padLon, lon1 = lonMax + padLon;
const lat0 = latMin - padLat, lat1 = latMax + padLat;

const W = FRAME.width;
const midLat = (lat0 + lat1) / 2;
const cosMidLat = Math.cos((midLat * Math.PI) / 180);
const sx = W / (lon1 - lon0);
const sy = sx * cosMidLat;                 // <- the correction. Omit it and the map is 12.1% too wide.
const H = (lat1 - lat0) * sy;

const ASPECT_EXPECTED = 0.9886;
if (Math.abs(H / W - ASPECT_EXPECTED) > 0.01) {
  fail(
    `Frame aspect ${(H / W).toFixed(4)} is not ~${ASPECT_EXPECTED}. If it is ~1.1085 the cosine\n` +
      `  correction was dropped and every district is stretched horizontally.`,
  );
}
ok(`frame ${W}×${H.toFixed(1)} (aspect ${(H / W).toFixed(4)}, cos ${midLat.toFixed(3)}° = ${cosMidLat.toFixed(5)})`);

const project = (lon, lat) => [(lon - lon0) * sx, (lat1 - lat) * sy];

/* ── 4. Project every vertex into the pixel frame ─────────────────────── */

const pixels = {
  type: 'FeatureCollection',
  features: source.features.map((f, i) => ({
    type: 'Feature',
    properties: { zid: ZONES[zoneNames[i]].id },
    geometry: { type: 'Polygon', coordinates: f.geometry.coordinates.map((ring) => ring.map(([lon, lat]) => project(lon, lat))) },
  })),
};
const rawVertexCount = pixels.features.reduce((n, f) => n + f.geometry.coordinates[0].length, 0);

/* ── 5. Simplify with shared-arc topology preserved ───────────────────── */

const run = (cmd, input) =>
  new Promise((resolve, reject) =>
    mapshaper.applyCommands(cmd, input, (err, out) => (err ? reject(err) : resolve(out))),
  );

const simplified = await run(
  `-i in.json -snap precision=${SIMPLIFY.snapPrecision} ` +
    `-simplify interval=${SIMPLIFY.interval} planar keep-shapes -clean -o out.json`,
  { 'in.json': JSON.stringify(pixels) },
).then((o) => JSON.parse(o['out.json'].toString()));

const simpVertexCount = simplified.features.reduce(
  (n, f) => n + (f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat()).reduce((m, r) => m + r.length, 0),
  0,
);
if (simplified.features.length !== 10) fail(`Simplification dropped features: ${simplified.features.length}/10`);
ok(`simplified ${rawVertexCount} → ${simpVertexCount} vertices (${((1 - simpVertexCount / rawVertexCount) * 100).toFixed(1)}% reduction)`);

// The JMC outline, dissolved from the *simplified* districts so its edge is
// pixel-identical to the outer district edges. Dissolving the raw geometry
// instead would leave the outline floating a fraction off the fills.
const outlineOut = await run('-i in.json -dissolve2 -o out.json', {
  'in.json': JSON.stringify(simplified),
}).then((o) => JSON.parse(o['out.json'].toString()));

// mapshaper emits a bare GeometryCollection once dissolving has dropped all
// properties, but returns a FeatureCollection when any survive. Accept either.
const outlineGeom =
  outlineOut.type === 'GeometryCollection' ? outlineOut.geometries[0]
  : outlineOut.type === 'FeatureCollection' ? outlineOut.features[0].geometry
  : outlineOut;
if (!outlineGeom?.coordinates) fail(`Could not read the dissolved outline (got ${outlineOut.type})`);
ok(`JMC outline dissolved (${outlineGeom.type})`);

/* ── 6. Serialise ─────────────────────────────────────────────────────── */

const r = (n) => Number(n.toFixed(FRAME.round));
const ringToPath = (ring) => {
  // Drop the duplicate closing vertex; `Z` reinstates it.
  const pts = ring.slice(0, -1);
  return `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`;
};
const geometryToPath = (g) =>
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map((poly) => poly.map(ringToPath).join('')).join('');

/* ── 7. Label anchors, bboxes, ordering ───────────────────────────────── */

const inRing = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
/**
 * Planar ray-cast rather than d3-geo's spherical `geoContains`. At city scale
 * (18 × 26 km) the two agree to well under a pixel, and this keeps the
 * dependency list to the two tools that are doing irreplaceable work.
 */
const inGeometry = (pt, g) => {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.some((p) => inRing(pt, p[0]) && !p.slice(1).some((hole) => inRing(pt, hole)));
};

const districts = simplified.features.map((f) => {
  const cfg = Object.values(ZONES).find((z) => z.id === f.properties.zid);
  if (!cfg) fail(`Simplified feature carries unknown id "${f.properties.zid}"`);

  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  // Anchor the label in the largest part of a multi-part district.
  const ringArea = (ring) => Math.abs(ring.reduce((a, [x, y], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    return a + (x * y2 - x2 * y);
  }, 0) / 2);
  const biggest = polys.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best), polys[0]);

  const [labelX, labelY] = polylabel(biggest, 1.0);
  if (!inGeometry([labelX, labelY], f.geometry)) {
    fail(`${cfg.label}: polylabel anchor (${labelX}, ${labelY}) fell outside its own polygon`);
  }

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) for (const [x, y] of p[0]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }

  return {
    id: cfg.id,
    label: cfg.label,
    official: cfg.official,
    localities: cfg.localities,
    labelX: r(labelX),
    labelY: r(labelY),
    bbox: [r(x0), r(y0), r(x1), r(y1)],
    area: Math.round(polys.reduce((a, p) => a + ringArea(p[0]), 0)),
    path: geometryToPath(f.geometry),
    review: cfg.review,
    _geom: f.geometry,
  };
});
ok('label anchors placed inside their own polygons (pole of inaccessibility)');

/**
 * DOM order is keyboard traversal order, so sort the way a reader scans the
 * city: north to south, west to east, banded so near-level districts read as
 * one row rather than zig-zagging.
 */
const BAND = H * 0.08;
districts.sort((a, b) => {
  const band = Math.floor(a.labelY / BAND) - Math.floor(b.labelY / BAND);
  return band !== 0 ? band : a.labelX - b.labelX;
});
ok(`ordered north→south, west→east: ${districts.map((d) => d.label).join(' · ')}`);

/* ── 8. Ground-truth manifest ─────────────────────────────────────────── */

const projectsSrc = readFileSync(PROJECTS_TS, 'utf8');

/**
 * Split into records first, then read each field independently.
 *
 * A single regex spanning `locality` → `coordinates` looks tidier but is
 * brittle: any comment or field inserted between them silently drops the
 * project from this reconciliation, which is precisely the check that is
 * supposed to catch mistakes. (It has already happened once.)
 */
const seeds = projectsSrc
  .split(/\n  \{\n/)
  .slice(1)
  .map((record) => {
    const locality = record.match(/locality:\s*'([^']+)'/);
    const coords = record.match(/coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}/);
    if (!locality || !coords) return null;
    return { locality: locality[1], lat: Number(coords[1]), lng: Number(coords[2]) };
  })
  .filter(Boolean);

if (seeds.length !== 10) {
  fail(
    `Expected to parse 10 projects from projects.ts, parsed ${seeds.length}.\n` +
      `  Either a project lost its locality/coordinates, or the record shape changed.`,
  );
}

const siteSrc = readFileSync(SITE_TS, 'utf8');
const siteM = siteSrc.match(/coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}/);
if (!siteM) fail('Could not parse SITE.coordinates from constants/site.ts');
seeds.push({ locality: '(office)', lat: Number(siteM[1]), lng: Number(siteM[2]), isOffice: true });

// Editorial resolution: locality -> district, via ZONES[].localities then OVERRIDES.
const localityToDistrict = {};
for (const z of Object.values(ZONES)) for (const loc of z.localities) localityToDistrict[loc.toLowerCase()] = z.id;
for (const [loc, o] of Object.entries(OVERRIDES)) {
  if (o.district === null) delete localityToDistrict[loc.toLowerCase()];
  else localityToDistrict[loc.toLowerCase()] = o.district;
}

const unreachable = KNOWN_PROJECT_LOCALITIES.filter(
  (loc) => !(loc.toLowerCase() in localityToDistrict) && !(loc in OVERRIDES),
);
if (unreachable.length) {
  fail(
    `These project localities resolve to nothing and are not explained in OVERRIDES:\n` +
      unreachable.map((l) => `    - ${l}`).join('\n') +
      `\n  Add them to a zone's localities[], or to OVERRIDES with a reason.`,
  );
}

console.log('\n  GROUND TRUTH — editorial district vs point-in-polygon on raw geometry');
console.log('  ' + '─'.repeat(96));
console.log('  ' + 'locality'.padEnd(26) + 'editorial'.padEnd(24) + 'point-in-polygon'.padEnd(24) + 'verdict');
console.log('  ' + '─'.repeat(96));

/**
 * The office is not a project and has no editorial mapping — it is an
 * *independent* control point. `districts.config.mjs` never mentions
 * C-Scheme/Civil Lines coordinates, so if the projection or the zone join were
 * subtly wrong this probe would land somewhere else. Asserting it is a cheap
 * check that the whole pipeline is registered to real-world geography.
 */
const OFFICE_EXPECTED_DISTRICT = 'c-scheme-bani-park';

const unexplained = [];
for (const s of seeds) {
  const pt = project(s.lng, s.lat);
  const hit = districts.find((d) => inGeometry(pt, d._geom));
  const pip = hit ? hit.id : null;

  if (s.isOffice) {
    const good = pip === OFFICE_EXPECTED_DISTRICT;
    console.log('  ' + s.locality.padEnd(26) + `(control: ${OFFICE_EXPECTED_DISTRICT})`.padEnd(24) + String(pip ?? '— outside —').padEnd(24) + (good ? 'CONTROL OK' : '✗ CONTROL FAILED'));
    if (!good) {
      fail(
        `The office control point (${s.lat}, ${s.lng}) projected into "${pip ?? 'nothing'}" but should\n` +
          `  land in ${OFFICE_EXPECTED_DISTRICT}. The projection or the zone join is wrong.`,
      );
    }
    continue;
  }

  const editorial = localityToDistrict[s.locality.toLowerCase()] ?? null;
  let verdict;
  if (editorial === pip) verdict = 'MATCH';
  else if (s.locality in OVERRIDES) verdict = 'OVERRIDE';
  else { verdict = '✗ UNEXPLAINED'; unexplained.push(s.locality); }

  console.log(
    '  ' + s.locality.padEnd(26) + String(editorial ?? '— outside —').padEnd(24) + String(pip ?? '— outside —').padEnd(24) + verdict,
  );
}
console.log('  ' + '─'.repeat(96));

if (unexplained.length) {
  fail(
    `The editorial layer disagrees with the geometry for: ${unexplained.join(', ')}.\n` +
      `  Either fix ZONES[].localities, or add an OVERRIDES entry with a written reason.`,
  );
}
ok('every project reconciles with the raw geometry; office control point verified');

for (const [loc, note] of Object.entries(REVIEW_NOTES)) console.log(`\n  NOTE · ${loc}\n    ${note.replace(/(.{88})\s/g, '$1\n    ')}`);
for (const [loc, o] of Object.entries(OVERRIDES)) console.log(`\n  OVERRIDE · ${loc}\n    ${o.reason.replace(/(.{88})\s/g, '$1\n    ')}`);

const pending = districts.filter((d) => d.review === 'PENDING_CLIENT');
if (pending.length) {
  console.log(`\n  ⚠ ${pending.length}/10 district labels are still PENDING_CLIENT sign-off:`);
  for (const d of pending) console.log(`      ${d.label.padEnd(24)} (JMC "${d.official}")  ←  ${d.localities.join(', ')}`);
}

/* ── 9. Emit ──────────────────────────────────────────────────────────── */

const header = (what) => `/**
 * ${what}
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with:  npm run build:districts
 * Editorial labels live in scripts/districts.config.mjs.
 *
 * Source    DataMeet — Municipal Spatial Data (Jaipur zones)
 *           https://github.com/datameet/Municipal_Spatial_Data
 * Licence   CC BY 4.0 — attribution must remain VISIBLE in the rendered map.
 * Retrieved ${RETRIEVED}
 * sha256    ${EXPECTED_SHA}
 */
`;

const meta = `${header('Project Atlas — district metadata (no geometry; see jaipur-districts.geometry.ts).')}
export interface JaipurDistrict {
  /** Stable slug. Used in URLs (?district=…) and as Project.districtId. */
  id: string;
  /** Customer-facing name — what a Jaipur buyer calls this part of the city. */
  label: string;
  /** Official JMC zone name. Shown as secondary text so nothing is invented. */
  official: string;
  /** Localities this zone covers. Drives locality → district resolution. */
  localities: string[];
  /** Pole of inaccessibility — the label anchor, guaranteed inside the polygon. */
  labelX: number;
  labelY: number;
  /** [x0, y0, x1, y1] in frame units. */
  bbox: [number, number, number, number];
  /** Projected area, used to decide whether a district is big enough to label. */
  area: number;
}

/**
 * Equirectangular projection with the cos(mid-latitude) correction applied.
 * Dropping that correction stretches the city 12.1% horizontally.
 */
export const MAP_FRAME = {
  width: ${W},
  height: ${r(H)},
  lon0: ${lon0.toFixed(6)},
  lon1: ${lon1.toFixed(6)},
  lat0: ${lat0.toFixed(6)},
  lat1: ${lat1.toFixed(6)},
  cosMidLat: ${cosMidLat.toFixed(6)},
} as const;

/** Ordered north→south, west→east — this is also the keyboard traversal order. */
export const JAIPUR_DISTRICTS: JaipurDistrict[] = ${JSON.stringify(
  districts.map(({ id, label, official, localities, labelX, labelY, bbox, area }) => ({ id, label, official, localities, labelX, labelY, bbox, area })),
  null,
  2,
).replace(/"([a-zA-Z]\w*)":/g, '$1:').replace(/"/g, "'")};

/** Lower-cased locality → district id. Localities with no zone are absent, not guessed. */
export const LOCALITY_TO_DISTRICT: Record<string, string> = ${JSON.stringify(localityToDistrict, null, 2).replace(/"/g, "'")};

/** CC BY 4.0 requires this to be visible to the reader. ProjectAtlas renders it. */
export const ATLAS_SOURCE = {
  title: 'Jaipur municipal zones',
  publisher: 'DataMeet',
  url: 'https://github.com/datameet/Municipal_Spatial_Data',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  retrieved: '${RETRIEVED}',
  /** These are the pre-2019 unified JMC zones, before the Heritage/Greater split. */
  vintage: 'Pre-2019 JMC zones',
} as const;
`;

const geom = `${header('Project Atlas — SVG path data. Imported only by AtlasCanvas.tsx.')}
/** Keyed by JaipurDistrict.id. Coordinates are in MAP_FRAME units. */
export const DISTRICT_PATHS: Record<string, string> = {
${districts.map((d) => `  '${d.id}':\n    '${d.path}',`).join('\n')}
};

/** The JMC limit, dissolved from the simplified districts so the edges coincide exactly. */
export const JMC_OUTLINE =
  '${geometryToPath(outlineGeom)}';
`;

writeFileSync(OUT_META, meta);
writeFileSync(OUT_GEOM, geom);

const { gzipSync } = await import('node:zlib');
const size = (s) => `${(s.length / 1024).toFixed(1)} KB raw, ${(gzipSync(Buffer.from(s), { level: 9 }).length / 1024).toFixed(1)} KB gzip`;
console.log('');
ok(`wrote src/data/jaipur-districts.ts           (${size(meta)})`);
ok(`wrote src/data/jaipur-districts.geometry.ts  (${size(geom)})`);
console.log('');

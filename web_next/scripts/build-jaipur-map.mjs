/**
 * The home page's project map — art generator.
 *
 *   npm run build:map                     rebuild from the vendored cache (offline)
 *   npm run build:map:fetch               refetch every query from Overpass
 *   npm run build:map:fetch -- <name>…    refetch only these (e.g. patch-<slug>)
 *
 * Reads OpenStreetMap data (vendored in scripts/data/osm, see lib/overpass.mjs),
 * the editorial layer in jaipur-map.config.mjs and the seed projects, and emits:
 *
 *   public/map/jaipur.<sha8>.svg   the art: one standalone SVG, fetched and
 *                                  injected by the page (never in the JS bundle)
 *   src/data/jaipur-map.ts         the frame, the art's url and the credit
 *
 * Output is committed, like the district atlas's; this is not part of `npm run build`.
 *
 * The art is drawn at three precisions (config EXTENTS / PATCH / SIMPLIFY): the
 * region the zoom-out shows, the city the band rests on, and a patch of every
 * street round each project, where the camera dives. Paths are merged per style
 * class per tile, in integer metres with relative commands: the page repaints
 * this SVG every frame of a dive, so the element count matters as much as bytes.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0.
 */

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import mapshaper from 'mapshaper';
import {
  FRAME, EXTENTS, PATCH, SIMPLIFY, SIMPLIFY_CLASS, MIN_AREA, TILE, ROAD_CLASSES, RING_ROAD,
  QUERIES, patchQuery, LOCALITIES, LANDMARKS, ROAD_NAMES, STATIONS, TOWN_EXCLUDE,
} from './jaipur-map.config.mjs';
import { openCache } from './lib/overpass.mjs';
import { osmToFeatures } from './lib/osm-to-geojson.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(HERE, 'data/osm');
const PROJECTS_TS = join(HERE, '../src/data/projects.ts');
const SITE_TS = join(HERE, '../src/constants/site.ts');
const OUT_DIR = join(HERE, '../public/map');
const OUT_TS = join(HERE, '../src/data/jaipur-map.ts');

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ⚠ ${msg}`);

/* ── 0. Projects: the patch centres ──────────────────────────────────── */

/** Split into records first, then read each field independently (see build-districts.mjs for why). */
const seeds = readFileSync(PROJECTS_TS, 'utf8')
  .split(/\n  \{\n/)
  .slice(1)
  .map((record) => {
    const slug = record.match(/slug:\s*'([^']+)'/);
    const coords = record.match(/coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}/);
    if (!slug || !coords) return null;
    return { slug: slug[1], lat: Number(coords[1]), lng: Number(coords[2]) };
  })
  .filter(Boolean);
if (seeds.length < 1) fail('Parsed no projects with coordinates from projects.ts');
const centres = [...seeds, ...PATCH.extraCentres];

const allQueries = { ...QUERIES };
for (const c of centres) allQueries[`patch-${c.slug}`] = patchQuery(c.lat, c.lng);

/* ── 1. Fetch (only when asked) ───────────────────────────────────────── */

const cache = openCache(CACHE_DIR);
const args = process.argv.slice(2);
if (args.includes('--fetch')) {
  const named = args.filter((a) => !a.startsWith('--'));
  const todo = named.length ? named : Object.keys(allQueries);
  const unknown = todo.filter((n) => !(n in allQueries));
  if (unknown.length) fail(`Unknown query name(s): ${unknown.join(', ')}. Known: ${Object.keys(allQueries).join(', ')}`);
  console.log(`\n  Fetching ${todo.length} quer${todo.length === 1 ? 'y' : 'ies'} from Overpass…`);
  const failed = [];
  for (const name of todo) {
    // one overloaded query must not cost the others: carry on, and report it at the end
    try { await cache.fetchAndStore(name, allQueries[name]); } catch (err) { failed.push(name); console.log(`  ✗ ${err.message}`); }
  }
  if (failed.length) fail(`Not fetched: ${failed.join(' ')}\n  Retry with: npm run build:map:fetch -- ${failed.join(' ')}`);
  if (args.includes('--fetch-only')) process.exit(0);
}

/* ── 2. Read the cache ────────────────────────────────────────────────── */

const data = {};
const problems = [];
for (const [name, query] of Object.entries(allQueries)) {
  const r = cache.read(name, query);
  if (r.missing) problems.push(`${name}: not fetched yet`);
  else if (r.stale) problems.push(`${name}: its query changed since it was fetched`);
  else data[name] = r.data;
}
if (problems.length) {
  fail(
    `The OSM cache is not complete:\n${problems.map((p) => `    - ${p}`).join('\n')}\n` +
      `  Run: npm run build:map:fetch -- ${problems.map((p) => p.split(':')[0]).join(' ')}`,
  );
}
ok(`${Object.keys(data).length} cached Overpass responses verified (sha256, query text)`);

/* ── 3. Projection: metres about the frame's centre ───────────────────── */

const PHI = (FRAME.lat0 * Math.PI) / 180;
/** WGS84 metres per degree of latitude / longitude at φ0. */
const MY = 111132.954 - 559.822 * Math.cos(2 * PHI) + 1.175 * Math.cos(4 * PHI);
const MX = 111412.84 * Math.cos(PHI) - 93.5 * Math.cos(3 * PHI) + 0.118 * Math.cos(5 * PHI);
const project = (lat, lng) => [(lng - FRAME.lng0) * MX, (FRAME.lat0 - lat) * MY];

{
  const hav = ([la1, lo1], [la2, lo2]) => {
    const r = Math.PI / 180, R = 6371008.8;
    const a = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  };
  // East–west, north–south and diagonal control pairs across the city. Haversine is spherical, and at this
  // latitude the sphere and the WGS84 ellipsoid disagree by up to ~0.4% (north–south), so the limit is 0.6%:
  // ample to catch the error this exists for — a cos φ multiplied instead of divided is 20%.
  const PAIRS = [[[26.9239, 75.7400], [26.9239, 75.8700]], [[26.7800, 75.8000], [26.9600, 75.8000]], [[26.9432, 75.7473], [26.8129, 75.8447]]];
  for (const [a, b] of PAIRS) {
    const [x1, y1] = project(...a), [x2, y2] = project(...b);
    const planar = Math.hypot(x2 - x1, y2 - y1), truth = hav(a, b);
    if (Math.abs(planar / truth - 1) > 0.006) fail(`Projection off by ${((planar / truth - 1) * 100).toFixed(2)}% on ${a} → ${b} (limit 0.6%)`);
  }
  ok(`projection: ${MX.toFixed(1)} m/° lng, ${MY.toFixed(1)} m/° lat; control distances within 0.6% of (spherical) haversine`);
}

/** [south, west, north, east] → [x0, y0, x1, y1] in metres. */
const toBox = ([s, w, n, e]) => {
  const [x0, y1] = project(s, w);
  const [x1, y0] = project(n, e);
  return [x0, y0, x1, y1];
};
const REGION = toBox(EXTENTS.region);
const CITY = toBox(EXTENTS.city);
const boxArg = (b) => b.map((v) => v.toFixed(1)).join(',');

/* ── 4. Classify ──────────────────────────────────────────────────────── */

const MAJOR = /^(motorway|trunk|primary|secondary)(_link)?$/;
function roadClass(tags) {
  const hw = tags.highway;
  if (!hw) return null;
  if (MAJOR.test(hw) && RING_ROAD.test(tags.name ?? '')) return 'ring';
  for (const [cls, { from }] of Object.entries(ROAD_CLASSES)) if (from.test(hw)) return cls;
  return null;
}
function areaClass(tags) {
  if (tags.natural === 'water' || tags.landuse === 'reservoir' || tags.waterway === 'riverbank') return 'water';
  if (tags.aeroway === 'aerodrome') return 'airport';
  if (tags.landuse === 'forest' || /^(wood|scrub)$/.test(tags.natural ?? '') || tags.leisure === 'nature_reserve' || tags.boundary === 'protected_area') return 'forest';
  if (/^(park|garden|pitch|playground)$/.test(tags.leisure ?? '') || /^(recreation_ground|grass|meadow)$/.test(tags.landuse ?? '')) return 'park';
  return null;
}
function lineClass(tags) {
  if (/^(river|canal)$/.test(tags.waterway ?? '')) return 'river';
  if (tags.railway === 'rail') return 'rail';
  if (/^(subway|light_rail)$/.test(tags.railway ?? '')) return 'metro';
  if (tags.aeroway === 'runway') return 'runway';
  return roadClass(tags);
}
const classify = (tags, kind) => (kind === 'poly' ? areaClass(tags) : kind === 'line' ? lineClass(tags) : null);

const collect = (names, filter = () => true) => {
  const out = [];
  let dropped = 0;
  for (const n of names) {
    const r = osmToFeatures(data[n], project, classify);
    dropped += r.dropped;
    out.push(...r.features.filter(filter));
  }
  return { features: out, dropped };
};

/* ── 5. Shape each zone with mapshaper ────────────────────────────────── */

const ms = (cmd, inputs) =>
  new Promise((resolve, reject) => mapshaper.applyCommands(cmd, inputs, (err, out) => (err ? reject(err) : resolve(out))));
const fc = (features) => JSON.stringify({ type: 'FeatureCollection', features });
const readOut = (o) => {
  const g = JSON.parse(o['out.json'].toString());
  return g.type === 'FeatureCollection' ? g.features : g.type === 'GeometryCollection' ? g.geometries.map((geometry) => ({ type: 'Feature', properties: {}, geometry })) : [];
};

/**
 * Clip to the zone, merge overlapping areas of one class, drop slivers, simplify.
 * `clip` / `erase` are a bbox string or a polygon list (the patch circles); `interval` overrides the zone's.
 */
async function shape(features, { zone, clip, erase, interval = SIMPLIFY[zone], minArea = MIN_AREA[zone], clipAreas = true }) {
  const polys = features.filter((f) => /Polygon/.test(f.geometry.type));
  const lines = features.filter((f) => /LineString/.test(f.geometry.type));
  const inputs = {};
  const arg = (v, file, verb) => {
    if (!v) return '';
    if (typeof v === 'string') return `${verb} bbox=${v}`;
    inputs[file] = fc(v);
    return `${verb} ${file}`;
  };
  const cut = `${arg(erase, 'erase.json', '-erase')} ${arg(clip, 'clip.json', '-clip')}`;
  const areaCut = clipAreas ? cut : arg(erase, 'erase.json', '-erase');
  const out = [];
  if (polys.length) {
    const o = await ms(
      `-i in.json ${areaCut} -dissolve2 cls -explode -filter 'this.area >= ${minArea}' -simplify interval=${interval} planar keep-shapes -o out.json`,
      { ...inputs, 'in.json': fc(polys) },
    );
    out.push(...readOut(o));
  }
  if (lines.length) {
    const o = await ms(`-i in.json ${cut} -simplify interval=${interval} planar -o out.json`, { ...inputs, 'in.json': fc(lines) });
    out.push(...readOut(o));
  }
  return out.filter((f) => f.geometry);
}

const circle = ([cx, cy], r, n = 96) => {
  const ring = Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);
  ring.push(ring[0]);
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
};
const patchCircles = centres.map((c) => circle(project(c.lat, c.lng), PATCH.radius));
const isRoad = (f) => /LineString/.test(f.geometry.type) && (f.properties.cls in ROAD_CLASSES || f.properties.cls === 'ring');
const coarse = new Set(Object.keys(SIMPLIFY_CLASS));

const region = collect(['region-roads', 'region-rail', 'region-water', 'region-green']);
const city = collect(['city-roads', 'city-water', 'city-green', 'city-rail', 'city-airport'], (f) => f.geometry.type !== 'Point');
// Inside the patches the roads come from the patches' own, finer data (below), so the city's are cut out there.
const cityRoads = city.features.filter(isRoad);
const cityRest = city.features.filter((f) => !isRoad(f));
const shaped = {
  region: await shape(region.features, { zone: 'region', clip: boxArg(REGION), erase: boxArg(CITY) }),
  city: [
    // areas are not cut at the city's edge (Overpass returns them whole): a forest sliced straight would show
    // on the zoom-out. The city-only road classes are faded there instead (globals.css, --lod-city).
    ...(await shape(cityRest, { zone: 'city', clip: boxArg(CITY), clipAreas: false })),
    ...(await shape(cityRoads.filter((f) => !coarse.has(f.properties.cls)), { zone: 'city', clip: boxArg(CITY), erase: patchCircles })),
    ...(await Promise.all([...coarse].map((cls) =>
      shape(cityRoads.filter((f) => f.properties.cls === cls), { zone: 'city', clip: boxArg(CITY), erase: patchCircles, interval: SIMPLIFY_CLASS[cls] }),
    ))).flat(),
  ],
};
ok(`region: ${shaped.region.length} shapes · city: ${shaped.city.length} shapes (${region.dropped + city.dropped} unclosable relation rings skipped)`);

/**
 * A patch per project: every street within PATCH.radius at patch precision. The minor streets and small
 * green and water are feathered at the edge (a mask); the major roads continue the city's, unmasked.
 */
const patches = [];
const patchRoads = [];
for (const c of centres) {
  const at = project(c.lat, c.lng);
  const { features } = collect([`patch-${c.slug}`]);
  const small = features.filter((f) => f.properties.cls === 'minor' || (/Polygon/.test(f.geometry.type) && (f.properties.cls === 'park' || f.properties.cls === 'water')));
  const shapes = await shape(small, { zone: 'patch', clip: [circle(at, PATCH.radius)] });
  // big parks and lakes are the city layer's already
  const kept = shapes.filter((f) => f.properties.cls === 'minor' || areaOf(f.geometry) < MIN_AREA.city);
  const majors = features.filter((f) => isRoad(f) && f.properties.cls !== 'minor');
  patchRoads.push(...(await shape(majors, { zone: 'patch', clip: [circle(at, PATCH.radius)] })));
  const streets = kept.filter((f) => f.properties.cls === 'minor').length;
  if (!streets) fail(`patch-${c.slug}: no streets inside its circle — check the coordinates or the patch query`);
  patches.push({ slug: c.slug, x: at[0], y: at[1], r: PATCH.radius, shapes: kept });
}
shaped.patchRoads = patchRoads;
ok(`${patches.length} project patches (${patches.map((p) => p.shapes.length).join('/')} shapes, ${patchRoads.length} major road pieces)`);

function areaOf(g) {
  const ring = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + (x * y2 - x2 * y); }, 0) / 2);
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.reduce((a, p) => a + ring(p[0]) - p.slice(1).reduce((h, r) => h + ring(r), 0), 0);
}

/* ── 6. Labels: only what OpenStreetMap can place ─────────────────────── */

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const namesOf = (tags) => [tags.name, tags['name:en'], ...String(tags.alt_name ?? '').split(';'), ...String(tags.old_name ?? '').split(';')].filter(Boolean);
const inBox = ([x, y], [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const [CX, CY] = [(CITY[0] + CITY[2]) / 2, (CITY[1] + CITY[3]) / 2];
const labels = [];
const missing = [];

// Localities: place=suburb|quarter|neighbourhood nodes, best-ranked match nearest the city centre.
const placeNodes = data.places.elements.filter((e) => e.type === 'node' && e.tags);
const RANK = { suburb: 0, quarter: 1, neighbourhood: 2 };
for (const L of LOCALITIES) {
  const want = [L.name, ...(L.alt ?? [])].map(norm);
  const hits = placeNodes
    .filter((e) => e.tags.place in RANK && namesOf(e.tags).some((n) => want.includes(norm(n))))
    .map((e) => ({ e, xy: project(e.lat, e.lon) }))
    .filter((h) => inBox(h.xy, CITY))
    .sort((a, b) => RANK[a.e.tags.place] - RANK[b.e.tags.place] || Math.hypot(a.xy[0] - CX, a.xy[1] - CY) - Math.hypot(b.xy[0] - CX, b.xy[1] - CY));
  if (!hits.length) { missing.push(`locality "${L.name}"`); continue; }
  // A name OSM has in two places is two colonies, and a label could land on the lesser-known one (there are
  // two "Pratap Nagar" neighbourhoods, neither the well-known one in Sanganer): left off, not guessed.
  const far = hits.some((h) => Math.hypot(h.xy[0] - hits[0].xy[0], h.xy[1] - hits[0].xy[1]) > 1500);
  if (far) { missing.push(`locality "${L.name}" (ambiguous: ${hits.length} places of that name)`); continue; }
  labels.push({ kind: 'loc', text: L.name, xy: hits[0].xy });
}

// Towns for the zoom-out, and the city's own name.
for (const e of placeNodes) {
  if (e.tags.place !== 'town' && e.tags.place !== 'city') continue;
  const text = e.tags['name:en'] || e.tags.name;
  const xy = project(e.lat, e.lon);
  if (!inBox(xy, REGION)) continue;
  if (/^jaipur$/i.test(text)) { labels.push({ kind: 'city', text: 'Jaipur', xy }); continue; }
  if (TOWN_EXCLUDE.some((re) => re.test(text)) || inBox(xy, CITY)) continue;
  labels.push({ kind: 'town', text, xy });
}

// Landmarks: prefer an element tagged tourism/historic; fall back to the configured position (reported).
const landmarkEls = data.landmarks.elements.filter((e) => e.tags?.name);
for (const L of LANDMARKS) {
  const hits = landmarkEls.filter((e) => namesOf(e.tags).some((n) => L.match.test(n)));
  hits.sort((a, b) => Number(!(a.tags.tourism || a.tags.historic)) - Number(!(b.tags.tourism || b.tags.historic)));
  const at = hits[0] ? (hits[0].center ?? { lat: hits[0].lat, lon: hits[0].lon }) : null;
  if (!at) warn(`landmark "${L.as}" not found in OSM — using the configured position`);
  labels.push({ kind: 'mark', text: L.as, xy: at ? project(at.lat, at.lon) : project(...L.at) });
}

// Stations: railway=station nodes (not metro), matched by name.
const stationEls = data['city-stations'].elements.filter((e) => e.type === 'node' && e.tags?.railway === 'station' && e.tags.station !== 'subway');
for (const S of STATIONS) {
  const hit = stationEls.find((e) => namesOf(e.tags).some((n) => S.match.test(n)));
  if (!hit) { missing.push(`station "${S.as}"`); continue; }
  labels.push({ kind: 'station', text: S.as, xy: project(hit.lat, hit.lon) });
}

// Road names: on the longest connected run of the named road, turned to follow it.
{
  const roads = collect(['city-roads']).features.filter((f) => f.geometry.type === 'LineString' && f.properties.name);
  const key = ([x, y]) => `${Math.round(x)},${Math.round(y)}`;
  const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  for (const R of ROAD_NAMES) {
    const segs = roads.filter((f) => R.match.test(f.properties.name)).map((f) => f.geometry.coordinates.slice());
    if (!segs.length) { missing.push(`road "${R.as}"`); continue; }
    // stitch segments that share an end into chains
    const chains = [];
    const pool = segs.slice();
    while (pool.length) {
      let chain = pool.shift();
      for (let grew = true; grew; ) {
        grew = false;
        for (let i = 0; i < pool.length; i++) {
          const s = pool[i];
          const [a, b] = [key(chain[0]), key(chain[chain.length - 1])];
          if (key(s[0]) === b) chain = chain.concat(s.slice(1));
          else if (key(s[s.length - 1]) === b) chain = chain.concat(s.slice(0, -1).reverse());
          else if (key(s[s.length - 1]) === a) chain = s.slice(0, -1).concat(chain);
          else if (key(s[0]) === a) chain = s.slice(1).reverse().concat(chain);
          else continue;
          pool.splice(i, 1);
          grew = true;
          break;
        }
      }
      chains.push(chain);
    }
    const best = chains.map((c) => ({ c, l: len(c) })).sort((a, b) => b.l - a.l)[0];
    // the point half-way along, and the direction over ±300 m around it
    const at = (d) => {
      let acc = 0;
      for (let i = 1; i < best.c.length; i++) {
        const [x0, y0] = best.c[i - 1], [x1, y1] = best.c[i];
        const s = Math.hypot(x1 - x0, y1 - y0);
        if (acc + s >= d) { const t = (d - acc) / s; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]; }
        acc += s;
      }
      return best.c[best.c.length - 1];
    };
    const mid = best.l / 2;
    const p = at(mid), a = at(Math.max(0, mid - 300)), b = at(Math.min(best.l, mid + 300));
    let deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (deg > 90) deg -= 180;
    if (deg <= -90) deg += 180;
    labels.push({ kind: 'road', text: R.as, xy: p, deg });
  }
}
if (missing.length) warn(`not on the map (no OSM match, left off rather than guessed): ${missing.join(', ')}`);
const unplaced = labels.filter((l) => !l.xy.every(Number.isFinite));
if (unplaced.length) fail(`Labels without a position (an Overpass "out tags" query returns no node coordinates?): ${unplaced.map((l) => l.text).join(', ')}`);
ok(`${labels.length} labels: ${['loc', 'mark', 'road', 'station', 'town', 'city'].map((k) => `${labels.filter((l) => l.kind === k).length} ${k}`).join(', ')}`);

// Control point: the office (C-Scheme) should sit near the C-Scheme label, if there is one.
{
  const m = readFileSync(SITE_TS, 'utf8').match(/coordinates:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}/);
  const cs = labels.find((l) => l.kind === 'loc' && l.text === 'C-Scheme');
  if (m && cs) {
    const [ox, oy] = project(Number(m[1]), Number(m[2]));
    const d = Math.hypot(ox - cs.xy[0], oy - cs.xy[1]);
    if (d > 2500) fail(`Control point: the office projects ${Math.round(d)} m from the C-Scheme label (limit 2.5 km) — the projection or the place match is wrong`);
    ok(`control point: office ${Math.round(d)} m from the C-Scheme label`);
  }
}

/* ── 7. Serialise: one path per class per tile, integer metres, relative ── */

/** Numbers joined the way SVG allows: a minus sign needs no space before it. */
const nums = (arr) => arr.reduce((s, n, i) => s + (i === 0 || n < 0 ? '' : ' ') + n, '');
const rnd = (pts) => {
  const r = [];
  for (const [x, y] of pts) {
    const p = [Math.round(x), Math.round(y)];
    if (!r.length || p[0] !== r[r.length - 1][0] || p[1] !== r[r.length - 1][1]) r.push(p);
  }
  return r;
};

/** Join lines that share an end into longer runs: each run costs one move instead of one per OSM way. */
function stitch(lines) {
  const key = (p) => `${p[0]},${p[1]}`;
  const ends = new Map();
  lines.forEach((l, i) => {
    for (const p of [l[0], l[l.length - 1]]) {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(i);
    }
  });
  const used = new Uint8Array(lines.length);
  const next = (k) => (ends.get(k) ?? []).find((j) => !used[j]) ?? -1;
  const runs = [];
  for (let i = 0; i < lines.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    let run = lines[i].slice();
    for (let j; (j = next(key(run[run.length - 1]))) >= 0; ) {
      used[j] = 1;
      const l = lines[j], k = key(run[run.length - 1]);
      run = key(l[0]) === k ? run.concat(l.slice(1)) : run.concat(l.slice(0, -1).reverse());
    }
    for (let j; (j = next(key(run[0]))) >= 0; ) {
      used[j] = 1;
      const l = lines[j], k = key(run[0]);
      run = key(l[l.length - 1]) === k ? l.slice(0, -1).concat(run) : l.slice(1).reverse().concat(run);
    }
    runs.push(run);
  }
  return runs;
}

/**
 * One class in one tile as path data, in integer metres: lines stitched into runs, areas as rings (filled
 * even-odd, so holes need no particular winding), every subpath after the first a relative move from where
 * the last one ended, taken nearest-first so those moves stay short.
 */
function groupD(geoms) {
  const lines = [], rings = [];
  for (const g of geoms) {
    if (g.type === 'LineString') lines.push(rnd(g.coordinates));
    else if (g.type === 'MultiLineString') g.coordinates.forEach((c) => lines.push(rnd(c)));
    else if (g.type === 'Polygon') g.coordinates.forEach((c) => rings.push(rnd(c.slice(0, -1))));
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach((c) => rings.push(rnd(c.slice(0, -1)))));
  }
  const parts = [
    ...stitch(lines.filter((l) => l.length >= 2)).map((pts) => ({ pts, close: false })),
    ...rings.filter((r) => r.length >= 3).map((pts) => ({ pts, close: true })),
  ];
  let d = '';
  let pen = null;
  const left = new Set(parts.keys());
  while (left.size) {
    // nearest start (or end, for a line, which can be drawn backwards) to the pen
    let best = -1, bestD = Infinity, rev = false;
    for (const i of left) {
      const p = parts[i].pts;
      if (!pen) { best = i; break; }
      const d0 = Math.abs(p[0][0] - pen[0]) + Math.abs(p[0][1] - pen[1]);
      if (d0 < bestD) { bestD = d0; best = i; rev = false; }
      if (!parts[i].close) {
        const e = p[p.length - 1];
        const d1 = Math.abs(e[0] - pen[0]) + Math.abs(e[1] - pen[1]);
        if (d1 < bestD) { bestD = d1; best = i; rev = true; }
      }
    }
    left.delete(best);
    const { close } = parts[best];
    const pts = rev ? parts[best].pts.slice().reverse() : parts[best].pts;
    d += pen ? `m${nums([pts[0][0] - pen[0], pts[0][1] - pen[1]])}` : `M${nums(pts[0])}`;
    const rel = [];
    for (let i = 1; i < pts.length; i++) rel.push(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (rel.length) d += `l${nums(rel)}`;
    // `z` returns the pen to the subpath's start
    pen = close ? pts[0] : pts[pts.length - 1];
    if (close) d += 'z';
  }
  return d;
}

const firstXY = (g) => {
  let c = g.coordinates;
  while (Array.isArray(c[0])) c = c[0];
  return c;
};
/** Group shapes into {cls → {tile → path data}}. */
function tiles(shapes, size) {
  const by = new Map();
  for (const f of shapes) {
    const [x, y] = firstXY(f.geometry);
    const t = size ? `${Math.floor(x / size)}_${Math.floor(y / size)}` : 'all';
    const k = f.properties.cls;
    if (!by.has(k)) by.set(k, new Map());
    const m = by.get(k);
    if (!m.has(t)) m.set(t, []);
    m.get(t).push(f.geometry);
  }
  for (const m of by.values()) for (const [t, geoms] of m) {
    const d = groupD(geoms);
    if (d) m.set(t, d);
    else m.delete(t);
  }
  return by;
}
const REGION_TILE = TILE * 5;
const zoneTiles = { region: tiles(shaped.region, REGION_TILE), city: tiles(shaped.city, TILE), patch: tiles(shaped.patchRoads, TILE) };

/** Bottom to top. Areas, then lines, then roads by class. */
const AREA_ORDER = ['forest', 'park', 'airport', 'water'];
const LINE_ORDER = ['river', 'runway', 'rail', 'metro'];
const ROAD_ORDER = ['minor', 'tertiary', 'secondary', 'primary', 'trunk', 'ring'];
const CASED = new Set(['trunk', 'ring']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let idN = 0;
const out = [];
let elements = 0;
/** Bytes per class, for the report: what to simplify first when the budget is tight. */
const sizes = new Map();
const tally = (k, d) => sizes.set(k, (sizes.get(k) ?? 0) + d.length);
const emit = (cls, kindPrefix, zones) => {
  for (const z of zones) {
    const m = zoneTiles[z].get(cls);
    if (!m) continue;
    for (const d of m.values()) {
      tally(`${z} ${kindPrefix}-${cls}`, d);
      if (CASED.has(cls)) {
        const id = `jm-${++idN}`;
        out.push(`<use href="#${id}" class="rc rc-${cls}"/><path id="${id}" class="${kindPrefix} ${kindPrefix}-${cls}" d="${d}"/>`);
        elements += 2;
      } else {
        out.push(`<path class="${kindPrefix} ${kindPrefix}-${cls}" d="${d}"/>`);
        elements++;
      }
    }
  }
};

const [RX0, RY0, RX1, RY1] = REGION.map(Math.round);
out.push(`<rect class="ground" x="${RX0}" y="${RY0}" width="${RX1 - RX0}" height="${RY1 - RY0}"/>`);
for (const c of AREA_ORDER) emit(c, 'a', ['region', 'city']);
for (const c of LINE_ORDER) emit(c, 'l', ['region', 'city']);

// The patches: under the city's roads, each feathered at its edge by a radial mask.
const defs = [
  `<radialGradient id="jm-pf"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>`,
];
out.push(`<g class="patches">`);
patches.forEach((p, i) => {
  const [x, y, r] = [Math.round(p.x), Math.round(p.y), p.r];
  defs.push(`<mask id="jm-pm${i}" maskUnits="userSpaceOnUse" x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#jm-pf)"/></mask>`);
  const t = tiles(p.shapes, 0);
  for (const [c, m] of t) tally(`patch ${c}`, m.get('all'));
  const parts = [];
  for (const c of ['park', 'water']) if (t.get(c)) parts.push(`<path class="a a-${c}" d="${t.get(c).get('all')}"/>`);
  if (t.get('minor')) parts.push(`<path class="r r-minor" d="${t.get('minor').get('all')}"/>`);
  out.push(`<g class="patch" data-patch="${esc(p.slug)}" data-x="${x}" data-y="${y}" data-r="${r}" mask="url(#jm-pm${i})">${parts.join('')}</g>`);
  elements += parts.length + 1;
});
out.push(`</g>`);
for (const c of ROAD_ORDER) emit(c, 'r', ['region', 'city', 'patch']);

// Labels and station markers, positioned in metres; the page sizes them per viewport.
out.push(`<g class="labels">`);
for (const l of labels) {
  const [x, y] = l.xy.map(Math.round);
  if (l.kind === 'station') {
    out.push(`<g class="st" data-x="${x}" data-y="${y}"><circle class="st-dot" cx="${x}" cy="${y}" r="90"/><text class="lb lb-station" x="${x}" y="${y}">${esc(l.text)}</text></g>`);
    elements += 3;
    continue;
  }
  const rot = l.deg ? ` transform="rotate(${l.deg.toFixed(1)} ${x} ${y})"` : '';
  out.push(`<text class="lb lb-${l.kind}" x="${x}" y="${y}"${rot}>${esc(l.text)}</text>`);
  elements++;
}
out.push(`</g>`);

const retrieved = Object.values(cache.manifest).map((e) => e.retrieved).sort().pop();
const osmBase = Object.values(cache.manifest).map((e) => e.osmBase).filter(Boolean).sort().pop();
/** Stand-alone styling, so the file can be opened and checked on its own. The page ignores it (globals.css, "Project map"). */
const QA_STYLE = `
.ground{fill:#C3C9D6}.a{fill-rule:evenodd}.a-forest{fill:#ACC4CE}.a-park{fill:#BBD0DA}.a-airport{fill:#C9CEDA}.a-water{fill:#92AEC9}
.l,.r,.rc{fill:none;stroke-linecap:round;stroke-linejoin:round}
.l-river{stroke:#92AEC9;stroke-width:24}.l-runway{stroke:#DCE0E8;stroke-width:45}.l-rail{stroke:#7E8699;stroke-width:12}.l-metro{stroke:#6E7FA0;stroke-width:12}
.r-minor{stroke:#E6EAF0;stroke-width:9}.r-tertiary{stroke:#EEF1F6;stroke-width:24}.r-secondary{stroke:#F5F7FB;stroke-width:36}.r-primary{stroke:#F9FAFD;stroke-width:48}
.r-trunk,.r-ring{stroke:#fff;stroke-width:60}.rc{stroke:#B1B7C6;stroke-width:90}
.lb{font:600 360px Inter,system-ui,sans-serif;fill:#2E3C5D;text-anchor:middle;dominant-baseline:central}
.lb-loc{letter-spacing:.2em;text-transform:uppercase;font-size:300px}.lb-mark,.lb-station{font-weight:500;fill:#445069}.lb-road{font-weight:500;font-size:260px;fill:#445069}
.lb-town{font-size:900px;letter-spacing:.2em;text-transform:uppercase}.lb-city{font-size:1600px;letter-spacing:.2em;text-transform:uppercase}
.st-dot{fill:#fff;stroke:#445069;stroke-width:30}.lb-station{text-anchor:start;transform:translate(160px,0)}
`.trim();

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${RX0} ${RY0} ${RX1 - RX0} ${RY1 - RY0}">` +
  `<metadata>Map data © OpenStreetMap contributors, available under the Open Database License (ODbL) 1.0, https://www.openstreetmap.org/copyright. ` +
  `Derived for neetuarchstone.com; OSM snapshot ${osmBase ?? 'unknown'}, retrieved ${retrieved ?? 'unknown'}. Units: metres from ${FRAME.lat0}°N ${FRAME.lng0}°E.</metadata>` +
  `<style>${QA_STYLE}</style><defs>${defs.join('')}</defs><g id="jm-art">${out.join('')}</g></svg>\n`;

/* ── 8. Budget, write ─────────────────────────────────────────────────── */

const raw = Buffer.from(svg);
const gz = gzipSync(raw, { level: 9 }).length;
const br = brotliCompressSync(raw).length;
console.log('\n  by class (KB raw): ' + [...sizes].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / 1024).toFixed(0)}`).join(' · '));
console.log(`\n  art: ${(raw.length / 1024).toFixed(0)} KB raw · ${(gz / 1024).toFixed(0)} KB gzip · ${(br / 1024).toFixed(0)} KB brotli · ${elements} elements`);
const BUDGET = { gz: 200 * 1024, raw: 600 * 1024, elements: 700 };
if (gz > BUDGET.gz || raw.length > BUDGET.raw || elements > BUDGET.elements) {
  fail(`Over budget (limits: ${BUDGET.gz / 1024} KB gzip, ${BUDGET.raw / 1024} KB raw, ${BUDGET.elements} elements). Raise SIMPLIFY or MIN_AREA, or shrink PATCH.radius.`);
}
if (gz > 160 * 1024) warn('over the 150 KB gzip target');

const sha8 = createHash('sha256').update(raw).digest('hex').slice(0, 8);
mkdirSync(OUT_DIR, { recursive: true });
for (const f of readdirSync(OUT_DIR)) if (/^jaipur\.[0-9a-f]{8}\.svg$/.test(f)) rmSync(join(OUT_DIR, f));
writeFileSync(join(OUT_DIR, `jaipur.${sha8}.svg`), raw);
ok(`public/map/jaipur.${sha8}.svg`);

const ts = `/**
 * The home page's project map — frame, art and credit.
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with:  npm run build:map   (refetch: npm run build:map:fetch)
 * Editorial layer:  scripts/jaipur-map.config.mjs
 *
 * Source    OpenStreetMap, via the Overpass API
 * Licence   ODbL 1.0 — "© OpenStreetMap contributors" must stay VISIBLE on the map.
 * Snapshot  ${osmBase ?? 'unknown'} (retrieved ${retrieved ?? 'unknown'})
 */

/** Equirectangular, in metres about (lat0, lng0): x east, y south. See projectCity in lib/geo.ts. */
export const CITY_FRAME = { lat0: ${FRAME.lat0}, lng0: ${FRAME.lng0}, mx: ${MX.toFixed(3)}, my: ${MY.toFixed(3)} } as const;

/** The art: fetched once and injected into the map's SVG. Its viewBox is the region, in frame metres. */
export const MAP_ART = {
  url: '/map/jaipur.${sha8}.svg',
  viewBox: [${RX0}, ${RY0}, ${RX1 - RX0}, ${RY1 - RY0}],
  city: [${CITY.map(Math.round).join(', ')}],
  bytes: ${raw.length},
  gzBytes: ${gz},
} as const;

/** The street patches, one per seeded project (frame metres). A project added since has no patch until the map is rebuilt. */
export const MAP_PATCHES = [
${patches.map((p) => `  { slug: '${p.slug}', x: ${Math.round(p.x)}, y: ${Math.round(p.y)}, r: ${p.r} },`).join('\n')}
] as const;

export const OSM_SOURCE = {
  text: '© OpenStreetMap contributors',
  url: 'https://www.openstreetmap.org/copyright',
  licence: 'ODbL 1.0',
  retrieved: '${retrieved ?? ''}',
  osmBase: '${osmBase ?? ''}',
} as const;
`;
writeFileSync(OUT_TS, ts);
ok('src/data/jaipur-map.ts');

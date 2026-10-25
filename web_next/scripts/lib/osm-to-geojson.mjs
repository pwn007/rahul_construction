/**
 * Overpass `out geom` JSON → GeoJSON features, already projected.
 *
 * Small on purpose: ways become lines or polygons, and multipolygon relations
 * get their member ways stitched into rings. It handles what the map's queries
 * return and nothing else; a ring that will not close (a relation cut by the
 * query's bounding box) is dropped and counted rather than guessed at.
 */

/** Tags that make a closed way an area rather than a loop of road. */
const AREA_KEYS = ['natural', 'landuse', 'leisure', 'waterway', 'aeroway', 'boundary', 'amenity', 'building'];
const isAreaWay = (tags = {}) =>
  tags.area === 'yes' || (tags.area !== 'no' && !tags.highway && !tags.railway && AREA_KEYS.some((k) => k in tags) && tags.waterway !== 'river' && tags.waterway !== 'canal');

const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];

/**
 * @param {object} osm      Overpass JSON
 * @param {(lat:number,lng:number)=>[number,number]} project
 * @param {(tags:object, kind:'line'|'poly'|'point')=>string|null} classify  style class, or null to drop
 */
export function osmToFeatures(osm, project, classify) {
  const features = [];
  let dropped = 0;
  const pts = (geom) => geom.filter(Boolean).map((g) => project(g.lat, g.lon));

  for (const el of osm.elements ?? []) {
    const tags = el.tags ?? {};
    if (el.type === 'node') {
      const cls = classify(tags, 'point');
      if (cls) features.push(point(project(el.lat, el.lon), cls, tags));
      continue;
    }
    if (el.type === 'way') {
      if (!el.geometry || el.geometry.length < 2) continue;
      const line = pts(el.geometry);
      const closed = line.length > 3 && samePt(line[0], line[line.length - 1]);
      const kind = closed && isAreaWay(tags) ? 'poly' : 'line';
      const cls = classify(tags, kind);
      if (!cls) continue;
      features.push(
        kind === 'poly'
          ? { type: 'Feature', properties: { cls, name: tags.name ?? '', id: el.id }, geometry: { type: 'Polygon', coordinates: [line] } }
          : { type: 'Feature', properties: { cls, name: tags.name ?? '', id: el.id }, geometry: { type: 'LineString', coordinates: line } },
      );
      continue;
    }
    if (el.type === 'relation') {
      if (tags.type !== 'multipolygon' && tags.type !== 'boundary') continue;
      const cls = classify(tags, 'poly');
      if (!cls) continue;
      const outer = stitch((el.members ?? []).filter((m) => m.type === 'way' && m.role !== 'inner' && m.geometry).map((m) => pts(m.geometry)));
      const inner = stitch((el.members ?? []).filter((m) => m.type === 'way' && m.role === 'inner' && m.geometry).map((m) => pts(m.geometry)));
      dropped += outer.open + inner.open;
      if (!outer.rings.length) continue;
      // Each outer ring becomes a polygon; holes are assigned to the outer that contains their first vertex.
      const polys = outer.rings.map((r) => [r]);
      for (const hole of inner.rings) {
        const host = polys.find((p) => inRing(hole[0], p[0]));
        if (host) host.push(hole);
      }
      features.push({
        type: 'Feature',
        properties: { cls, name: tags.name ?? '', id: el.id },
        geometry: polys.length === 1 ? { type: 'Polygon', coordinates: polys[0] } : { type: 'MultiPolygon', coordinates: polys },
      });
    }
  }
  return { features, dropped };
}

function point(xy, cls, tags) {
  return { type: 'Feature', properties: { cls, name: tags.name ?? '', tags }, geometry: { type: 'Point', coordinates: xy } };
}

/** Join way segments end to end into closed rings. Returns the rings and how many pieces would not close. */
function stitch(segments) {
  const pool = segments.filter((s) => s.length >= 2).map((s) => s.slice());
  const rings = [];
  let open = 0;
  while (pool.length) {
    let ring = pool.shift();
    let grew = true;
    while (!samePt(ring[0], ring[ring.length - 1]) && grew) {
      grew = false;
      const end = ring[ring.length - 1];
      for (let i = 0; i < pool.length; i++) {
        const s = pool[i];
        if (samePt(s[0], end)) ring = ring.concat(s.slice(1));
        else if (samePt(s[s.length - 1], end)) ring = ring.concat(s.slice(0, -1).reverse());
        else continue;
        pool.splice(i, 1);
        grew = true;
        break;
      }
    }
    if (ring.length > 3 && samePt(ring[0], ring[ring.length - 1])) rings.push(ring);
    else open++;
  }
  return { rings, open };
}

export function inRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

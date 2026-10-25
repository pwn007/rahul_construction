/**
 * The home page's project map — the editorial layer.
 *
 * Everything hand-chosen about the map lives here: the frame, the three
 * extents and how finely each is drawn, the OpenStreetMap queries, the palette
 * classes, and the names the map is allowed to print. The generator
 * (build-jaipur-map.mjs) does the rest.
 *
 * The map exists for one band: the home page's projects chapter, a port of the
 * precinct map on residences.loamhouse.com.au (client's benchmark, Oct 2026).
 * There, a camera dives from the city into a project's dot until the dot fills
 * the screen, so the art is drawn at three precisions — finest where a dive
 * can take the camera (a patch round each project), coarser across the city,
 * coarsest for the region the zoom-out shows.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0. The credit is printed on the map.
 */

/**
 * Projected frame: metres, equirectangular about the frame's own centre.
 *
 * The scales are WGS84 metres per degree at φ0, so one unit is one metre on
 * the ground in both directions — the Ring Road keeps its true shape, and road
 * widths can be given in real metres. (The project atlas's frame, in
 * src/data/jaipur-districts.ts, multiplies by cos φ where it should divide —
 * see the note in src/lib/geo.ts — which is why this map does not reuse it.)
 */
export const FRAME = {
  lat0: 26.88,
  lng0: 75.79,
};

/** [south, west, north, east]. */
export const EXTENTS = {
  /** Everything the zoom-out and the entry's far view can show, with room to spare. */
  region: [26.2, 75.0, 27.55, 76.55],
  /** The city at rest — what the camera shows when the band settles. */
  city: [26.66, 75.56, 27.1, 76.0],
};

/** Each project's patch: every street, drawn finely, as far as a dive can see. */
export const PATCH = {
  /**
   * metres drawn. A dive's last visible map (Loam altitude ~5) is about 2 km across; the queries fetch
   * 1300 m (patchQuery), so this can be tuned without refetching.
   */
  radius: 1100,
  /** Extra centres with a patch but no project — none yet. */
  extraCentres: [],
};

/** Douglas–Peucker tolerance per zone, in metres (mapshaper `interval`). */
export const SIMPLIFY = {
  patch: 3,
  city: 10,
  region: 80,
};
/**
 * Coarser for the city's tertiary roads, the heaviest layer (190 KB at 8 m): the camera only gets close to
 * them inside a patch, where the patch's own copy of them is drawn instead.
 */
export const SIMPLIFY_CLASS = {
  // at rest a pixel is ~30 m, so 24 m never shows there; on a dive's way in (~6 m/px) it is a few pixels
  tertiary: 24,
};

/** Polygons smaller than this (m²) are dropped, per zone. */
export const MIN_AREA = {
  patch: 400,
  city: 6000,
  region: 400000,
};

/** Tile size for merging paths (m): one <path> per class per tile, so browsers can cull by bounds. */
export const TILE = 6000;

/**
 * Road classes, drawn bottom to top. `w` is the real width in metres; the page
 * sets a pixel floor per class at run time (globals.css, "Project map").
 */
export const ROAD_CLASSES = {
  minor: { w: 7, from: /^(residential|unclassified|living_street|pedestrian)$/ },
  tertiary: { w: 12, from: /^tertiary(_link)?$/ },
  secondary: { w: 18, from: /^secondary(_link)?$/ },
  primary: { w: 24, from: /^primary(_link)?$/ },
  trunk: { w: 30, from: /^(trunk|motorway)(_link)?$/ },
};
/** A road of any class whose name matches this is drawn as the ring road. */
export const RING_ROAD = /\bring road\b/i;

/* ── OpenStreetMap queries ──────────────────────────────────────────────── */

const bbox = ([s, w, n, e]) => `${s},${w},${n},${e}`;
const C = bbox(EXTENTS.city);
const R = bbox(EXTENTS.region);
/**
 * Modest declared limits on purpose: Overpass admits a query by what it declares, so a query asking
 * for 1 GB and four minutes waits longest (or is turned away) whenever the public servers are busy.
 * The largest response here (the city's roads) is about 4 MB.
 */
const HEAD = '[out:json][timeout:120][maxsize:134217728];';

/**
 * One cached response per query (scripts/data/osm/<name>.json.gz). Change a
 * query and the generator refuses to run until it is refetched with
 * `npm run build:map:fetch -- <name>`, so the cache can never silently
 * disagree with the text that is supposed to have produced it.
 */
export const QUERIES = {
  'city-roads': `${HEAD}way["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"](${C});out tags geom qt;`,
  'city-water': `${HEAD}(way["natural"="water"](${C});relation["natural"="water"](${C});way["landuse"="reservoir"](${C});way["waterway"="riverbank"](${C});way["waterway"~"^(river|canal)$"](${C}););out tags geom qt;`,
  'city-green': `${HEAD}(way["leisure"~"^(park|garden|nature_reserve)$"](${C});relation["leisure"~"^(park|garden|nature_reserve)$"](${C});way["landuse"~"^(forest|recreation_ground|grass|meadow)$"](${C});relation["landuse"="forest"](${C});way["natural"~"^(wood|scrub)$"](${C});relation["natural"~"^(wood|scrub)$"](${C});way["boundary"="protected_area"](${C});relation["boundary"="protected_area"](${C}););out tags geom qt;`,
  // rail and stations apart: together they outlast the public servers' gateway timeout when those are busy
  'city-rail': `${HEAD}way["railway"~"^(rail|subway|light_rail)$"](${C});out tags geom qt;`,
  'city-stations': `${HEAD}node["railway"="station"](${C});out body qt;`,
  'city-airport': `${HEAD}(way["aeroway"~"^(aerodrome|runway)$"](${C});relation["aeroway"="aerodrome"](${C}););out tags geom qt;`,
  // `out body`, not `out tags`: tags-only output carries no coordinates for a node
  places: `${HEAD}(node["place"~"^(suburb|neighbourhood|quarter|city)$"](${C});node["place"~"^(city|town)$"](${R}););out body qt;`,
  landmarks: `${HEAD}nwr["name"~"^(Hawa Mahal|City Palace|Amber Fort|Amer Fort|Amber Palace|Nahargarh Fort|Jaigarh Fort|Jal Mahal|Albert Hall|Albert Hall Museum|Birla Mandir|Lakshmi Narayan Temple|Sawai Mansingh Stadium|Sawai Man Singh Stadium|Jaipur International Airport|Central Park|Galtaji|Galta Ji|Galta Temple|World Trade Park|Patrika Gate|Jantar Mantar)$",i](${C});out body center qt;`,
  'region-roads': `${HEAD}way["highway"~"^(motorway|trunk|primary)$"](${R});out tags geom qt;`,
  'region-rail': `${HEAD}way["railway"="rail"](${R});out tags geom qt;`,
  'region-water': `${HEAD}(way["natural"="water"]["water"~"^(lake|reservoir)$"](${R});relation["natural"="water"]["water"~"^(lake|reservoir)$"](${R});way["landuse"="reservoir"](${R});relation["landuse"="reservoir"](${R}););out tags geom qt;`,
  'region-green': `${HEAD}(relation["boundary"="protected_area"](${R});relation["landuse"="forest"](${R});relation["leisure"="nature_reserve"](${R}););out tags geom qt;`,
};

/** A patch query: every street within `radius` of one centre. */
export function patchQuery(lat, lng, radius = 1300) {
  const at = `around:${radius},${lat},${lng}`;
  return (
    `${HEAD}(way["highway"~"^(residential|unclassified|living_street|pedestrian)$"]["access"!~"^(private|no)$"](${at});` +
    `way["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"](${at});` +
    `way["leisure"~"^(park|garden|pitch|playground)$"](${at});way["natural"="water"](${at}););out tags geom qt;`
  );
}

/* ── What the map may print ─────────────────────────────────────────────── */

/**
 * Localities: printed only if OpenStreetMap has a place node for them (matched
 * on name, name:en or alt_name, case-insensitive). A name that is not found is
 * reported and left off — a label in the wrong place would cost the map the
 * trust of anyone who lives in Jaipur. `as` is what the map prints.
 */
export const LOCALITIES = [
  { name: 'Vaishali Nagar' },
  { name: 'Mansarovar', alt: ['Mansarovar Colony'] },
  { name: 'Malviya Nagar' },
  { name: 'Jagatpura' },
  { name: 'Sanganer' },
  { name: 'Pratap Nagar' },
  { name: 'Jhotwara' },
  { name: 'C-Scheme', alt: ['C Scheme'] },
  { name: 'Bani Park' },
  { name: 'Raja Park' },
  { name: 'Civil Lines' },
  { name: 'Vidhyadhar Nagar', alt: ['Vidyadhar Nagar'] },
  { name: 'Shastri Nagar' },
  { name: 'Sodala' },
  { name: 'Durgapura' },
  { name: 'Tilak Nagar' },
  { name: 'Adarsh Nagar' },
  { name: 'Gopalpura' },
  { name: 'Murlipura', alt: ['Muralipura'] },
  { name: 'Nirman Nagar' },
  { name: 'Shyam Nagar' },
  { name: 'Sitapura' },
  { name: 'Jawahar Nagar' },
  { name: 'Bapu Nagar' },
  { name: 'Mahesh Nagar' },
  { name: 'Khatipura' },
  { name: 'Gandhi Nagar' },
];

/** Landmarks: OSM position preferred; `at` is the fallback, used and reported only if the query finds nothing. */
export const LANDMARKS = [
  { as: 'Amber Fort', match: /^(amber fort|amer fort|amber palace)$/i, at: [26.98547, 75.85131] },
  { as: 'Jaigarh Fort', match: /^jaigarh fort$/i, at: [26.98511, 75.84563] },
  { as: 'Nahargarh Fort', match: /^nahargarh fort$/i, at: [26.9373, 75.8155] },
  { as: 'Jal Mahal', match: /^jal mahal$/i, at: [26.9534, 75.8462] },
  { as: 'Hawa Mahal', match: /^hawa mahal$/i, at: [26.92388, 75.82673] },
  { as: 'City Palace', match: /^city palace$/i, at: [26.92578, 75.82366] },
  { as: 'Albert Hall', match: /^albert hall( museum)?$/i, at: [26.91162, 75.81951] },
  { as: 'Birla Mandir', match: /^(birla mandir|lakshmi narayan temple)$/i, at: [26.89213, 75.81552] },
  { as: 'SMS Stadium', match: /^sawai man ?singh stadium$/i, at: [26.89417, 75.80667] },
  { as: 'Central Park', match: /^central park$/i, at: [26.904, 75.809] },
  { as: 'Galta Ji', match: /^(galtaji|galta ji|galta temple)$/i, at: [26.9169, 75.8583] },
  { as: 'World Trade Park', match: /^world trade park$/i, at: [26.8539, 75.8049] },
  { as: 'Patrika Gate', match: /^patrika gate$/i, at: [26.8423, 75.8255] },
  { as: 'Airport', match: /^jaipur international airport$/i, at: [26.8242, 75.8122] },
];

/** Roads whose names the map prints, matched against OSM `name`. One label each, on its longest run. */
export const ROAD_NAMES = [
  { as: 'Tonk Road', match: /^tonk road$/i },
  { as: 'JLN Marg', match: /^(jawahar ?lal nehru marg|jln marg)$/i },
  { as: 'Ajmer Road', match: /^ajmer road$/i },
  { as: 'Sikar Road', match: /^sikar road$/i },
  { as: 'Agra Road', match: /^agra road$/i },
  { as: 'Delhi Road', match: /^(delhi road|amer road)$/i },
  { as: 'Gopalpura Bypass', match: /^gopalpura bypass( road)?$/i },
  { as: 'New Sanganer Road', match: /^new sanganer road$/i },
  { as: 'Ring Road', match: RING_ROAD },
  { as: 'Kalwar Road', match: /^kalwar road$/i },
];

/** Railway stations the map marks (the zoom-out's markers, like Loam's), matched on name. */
export const STATIONS = [
  { as: 'Jaipur Junction', match: /^jaipur( junction)?$/i },
  { as: 'Gandhinagar', match: /^gandhinagar jaipur$|^gandhi nagar jaipur$|^gandhinagar$/i },
  { as: 'Durgapura', match: /^durgapura$/i },
  { as: 'Sanganer', match: /^sanganer$/i },
  { as: 'Jagatpura', match: /^jagatpura$/i },
];

/** Towns for the zoom-out: any OSM place=town in the region, except these. */
export const TOWN_EXCLUDE = [/^jaipur$/i];

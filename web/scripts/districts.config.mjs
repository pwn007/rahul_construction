/**
 * Project Atlas — the editorial layer.
 *
 * This is the only hand-authored file in the atlas pipeline, and the one that
 * decides whether the map earns a Jaipur reader's trust.
 *
 * The source geometry (DataMeet, CC BY 4.0) is labelled with official Jaipur
 * Municipal Corporation zone names. Two of those names are administrative
 * artefacts rather than places anybody says out loud:
 *
 *   - "BAGRU ANSIK" is the south-east zone containing Jagatpura and Sitapura.
 *     Bagru town itself is ~30 km west. ("Ansik" = partial.)
 *   - "JHOTWARA ANSIK" is the western zone containing Vaishali Nagar and outer
 *     Ajmer Road. Jhotwara proper falls in the VIDHYADHAR NAGAR zone.
 *
 * So we rename for the reader — but nothing is invented and nothing is hidden:
 * `official` is rendered as secondary text in the tooltip, the chip and the
 * accessible name, so anyone who knows the JMC zoning can reconcile the two.
 *
 * `localities` is doing real work, not documentation: it is the lookup that
 * maps a project's free-text `locality` onto a district, and the generator
 * cross-checks every one of those assignments against point-in-polygon on the
 * raw geometry. A disagreement fails the build unless OVERRIDES explains it.
 */

/** Projected frame. 1000 wide; the height falls out of the cosine correction. */
export const FRAME = {
  width: 1000,
  /** Breathing room so the JMC outline stroke is never clipped by the viewBox. */
  padPct: 0.015,
  /** Coordinate decimal places. At W=1000 one decimal is 0.1px — sub-pixel anywhere. */
  round: 1,
};

export const SIMPLIFY = {
  /**
   * Snap first: municipal shapefiles routinely have non-coincident vertices on
   * shared borders. Without this, simplification pulls adjacent zones apart and
   * you get hairline gaps between districts.
   */
  snapPrecision: 0.01,
  /**
   * Visvalingam interval, in projected px (frame is 1000 wide). Measured on this
   * dataset — 3694 raw vertices down to:
   *   1.0 → 1653 verts, 7.8 KB gzip
   *   1.5 → 1301 verts, 6.4 KB gzip   ← chosen
   *   2.0 → 1100 verts, 5.5 KB gzip
   *   3.0 →  853 verts, 4.4 KB gzip
   * At the largest size the atlas is ever rendered (~700 px) 1.5 frame-units is
   * roughly one displayed pixel of error, so this is visually lossless while
   * still shedding two thirds of the payload. Going coarser starts rounding the
   * corners off the Walled City zones, which are the smallest and most
   * recognisable shapes on the map.
   */
  interval: 1.5,
};

/** Customer-facing labels are drawn on the map, so they must not wrap. */
export const MAX_LABEL_LENGTH = 22;

/**
 * Keyed by the `Zone_Name` property in jaipur-zones.geojson, verbatim.
 *
 * `review` gates client sign-off: every entry is PENDING_CLIENT until Neetu
 * Archstone confirms the locality groupings read correctly to a Jaipur buyer.
 * The generator prints a sign-off manifest listing everything still pending.
 */
export const ZONES = {
  'AMER ANSIK': {
    id: 'amer',
    label: 'Amer',
    official: 'Amer Ansik',
    localities: ['Amer', 'Amber', 'Kunda', 'Delhi Road'],
    review: 'PENDING_CLIENT',
  },
  'VIDHYADHAR NAGAR': {
    id: 'vidhyadhar-jhotwara',
    label: 'Vidhyadhar & Jhotwara',
    official: 'Vidhyadhar Nagar',
    localities: ['Vidhyadhar Nagar', 'Jhotwara', 'Murlipura', 'Sikar Road', 'Harmara'],
    review: 'PENDING_CLIENT',
  },
  'HAWA MAHAL': {
    id: 'hawa-mahal',
    label: 'Hawa Mahal',
    official: 'Hawa Mahal',
    localities: ['Hawa Mahal', 'Brahmpuri', 'Amer Road', 'Jal Mahal', 'Johari Bazaar'],
    review: 'PENDING_CLIENT',
  },
  'KISHAN POLE': {
    id: 'kishanpole',
    label: 'Kishanpole',
    official: 'Kishan Pole',
    localities: ['Kishanpole', 'Chandpole', 'Tripolia', 'Walled City', 'Pink City'],
    review: 'PENDING_CLIENT',
  },
  'JHOTWARA ANSIK': {
    id: 'vaishali-ajmer-road',
    label: 'Vaishali & Ajmer Rd',
    official: 'Jhotwara Ansik',
    localities: ['Vaishali Nagar', 'Ajmer Road', 'Nirman Nagar', 'Chitrakoot', 'Queens Road'],
    review: 'PENDING_CLIENT',
  },
  'CIVIL LINES': {
    id: 'c-scheme-bani-park',
    label: 'C-Scheme & Bani Park',
    official: 'Civil Lines',
    localities: ['C-Scheme', 'Civil Lines', 'Bani Park', 'Sodala', 'Shyam Nagar', 'Ashok Nagar'],
    review: 'PENDING_CLIENT',
  },
  'ADARSH NAGAR': {
    id: 'adarsh-nagar',
    label: 'Adarsh Nagar',
    official: 'Adarsh Nagar',
    localities: ['Adarsh Nagar', 'Raja Park', 'Jawahar Nagar', 'Transport Nagar', 'Agra Road', 'Ghat Gate'],
    review: 'PENDING_CLIENT',
  },
  'MALVIYA NAGAR': {
    id: 'malviya-nagar',
    label: 'Malviya Nagar',
    official: 'Malviya Nagar',
    localities: ['Malviya Nagar', 'Tonk Road', 'Gandhi Nagar', 'Durgapura', 'Jawahar Circle', 'Gopalpura'],
    review: 'PENDING_CLIENT',
  },
  'SANGANER': {
    id: 'mansarovar-sanganer',
    label: 'Mansarovar & Sanganer',
    official: 'Sanganer',
    localities: ['Mansarovar', 'Sanganer', 'Pratap Nagar (Gaushala)', 'Shipra Path', 'Sanganer Airport'],
    review: 'PENDING_CLIENT',
  },
  'BAGRU ANSIK': {
    id: 'jagatpura-sitapura',
    label: 'Jagatpura & Sitapura',
    official: 'Bagru Ansik',
    localities: ['Jagatpura', 'Sitapura', 'Goner Road', 'Ramchandrapura', 'Bagru'],
    review: 'PENDING_CLIENT',
  },
};

/**
 * Localities whose editorial district disagrees with point-in-polygon, or that
 * deliberately resolve to no district at all. Each needs a written reason —
 * the generator fails the build on an unexplained disagreement, so this file
 * cannot drift silently away from the geometry.
 */
export const OVERRIDES = {
  'Pratap Nagar': {
    district: null,
    reason:
      'Pratap Nagar is a JDA-developed township south of the old JMC limit, so it sits ' +
      'outside every zone polygon — in the real notch between the Sanganer and Bagru Ansik ' +
      'zones. Point-in-polygon agrees. Rendered on the out-of-boundary ground with a dashed ' +
      'pin rather than snapped into the nearest zone, because snapping would assert a ' +
      'municipal fact that is false.',
  },
};

/**
 * Notes surfaced in the sign-off manifest. These are not overrides — the
 * geometry and the editorial layer agree — but they are the assignments most
 * likely to look wrong to someone reading only the official zone names.
 */
export const REVIEW_NOTES = {
  Jhotwara:
    'Resolves to the VIDHYADHAR NAGAR zone, not the zone named "Jhotwara Ansik". That is ' +
    'correct per JMC zoning: the Jhotwara Ansik zone covers Vaishali Nagar and outer Ajmer ' +
    'Road. Both zone labels name their actual localities to keep this from reading as a bug.',
  Jagatpura:
    'Resolves to the zone officially named "Bagru Ansik", which covers the whole south-east ' +
    'quadrant including Jagatpura and Sitapura. Labelled "Jagatpura & Sitapura" for readers.',
};

/**
 * Project localities the atlas must be able to resolve. The generator asserts
 * every one of these is either reachable through ZONES[].localities or listed
 * in OVERRIDES, so adding a project in a new locality fails loudly at build
 * time instead of silently dropping its pin.
 */
export const KNOWN_PROJECT_LOCALITIES = [
  'Ajmer Road',
  'Jagatpura',
  'Jhotwara',
  'Malviya Nagar',
  'Mansarovar',
  'Pratap Nagar',
  'Pratap Nagar (Gaushala)',
  'Sanganer',
  'Tonk Road',
  'Vaishali Nagar',
];

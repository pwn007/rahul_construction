/**
 * Project Atlas — district metadata (no geometry; see jaipur-districts.geometry.ts).
 *
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Regenerate with:  npm run build:districts
 * Editorial labels live in scripts/districts.config.mjs.
 *
 * Source    DataMeet — Municipal Spatial Data (Jaipur zones)
 *           https://github.com/datameet/Municipal_Spatial_Data
 * Licence   CC BY 4.0 — attribution must remain VISIBLE in the rendered map.
 * Retrieved 2026-08-06
 * sha256    8dc41b6e756a8d9ad14bcd9b5d2e23ce5e316d6b904694c5506729f8f3ada1c3
 */

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
  width: 1000,
  height: 988.2,
  lon0: 75.685410,
  lon1: 75.915163,
  lat0: 26.770979,
  lat1: 27.025574,
  cosMidLat: 0.891811,
} as const;

/** Ordered north→south, west→east — this is also the keyboard traversal order. */
export const JAIPUR_DISTRICTS: JaipurDistrict[] = [
  {
    id: 'vidhyadhar-jhotwara',
    label: 'Vidhyadhar & Jhotwara',
    official: 'Vidhyadhar Nagar',
    localities: [
      'Vidhyadhar Nagar',
      'Jhotwara',
      'Murlipura',
      'Sikar Road',
      'Harmara'
    ],
    labelX: 347.1,
    labelY: 224,
    bbox: [
      194,
      14.4,
      555.2,
      418.5
    ],
    area: 87388
  },
  {
    id: 'amer',
    label: 'Amer',
    official: 'Amer Ansik',
    localities: [
      'Amer',
      'Amber',
      'Kunda',
      'Delhi Road'
    ],
    labelX: 743.9,
    labelY: 178,
    bbox: [
      644.4,
      82.3,
      850.1,
      276
    ],
    area: 28903
  },
  {
    id: 'hawa-mahal',
    label: 'Hawa Mahal',
    official: 'Hawa Mahal',
    localities: [
      'Hawa Mahal',
      'Brahmpuri',
      'Amer Road',
      'Jal Mahal',
      'Johari Bazaar'
    ],
    labelX: 646.5,
    labelY: 325.9,
    bbox: [
      469.5,
      235.2,
      985.3,
      397.6
    ],
    area: 39678
  },
  {
    id: 'vaishali-ajmer-road',
    label: 'Vaishali & Ajmer Rd',
    official: 'Jhotwara Ansik',
    localities: [
      'Vaishali Nagar',
      'Ajmer Road',
      'Nirman Nagar',
      'Chitrakoot',
      'Queens Road'
    ],
    labelX: 140.1,
    labelY: 473.2,
    bbox: [
      14.6,
      228.3,
      369.8,
      591.1
    ],
    area: 67582
  },
  {
    id: 'c-scheme-bani-park',
    label: 'C-Scheme & Bani Park',
    official: 'Civil Lines',
    localities: [
      'C-Scheme',
      'Civil Lines',
      'Bani Park',
      'Sodala',
      'Shyam Nagar',
      'Ashok Nagar'
    ],
    labelX: 411.3,
    labelY: 440.3,
    bbox: [
      263.3,
      274,
      540.8,
      615.5
    ],
    area: 37988
  },
  {
    id: 'kishanpole',
    label: 'Kishanpole',
    official: 'Kishan Pole',
    localities: [
      'Kishanpole',
      'Chandpole',
      'Tripolia',
      'Walled City',
      'Pink City'
    ],
    labelX: 553.8,
    labelY: 397.2,
    bbox: [
      472.2,
      339.9,
      694.7,
      426.2
    ],
    area: 8550
  },
  {
    id: 'adarsh-nagar',
    label: 'Adarsh Nagar',
    official: 'Adarsh Nagar',
    localities: [
      'Adarsh Nagar',
      'Raja Park',
      'Jawahar Nagar',
      'Transport Nagar',
      'Agra Road',
      'Ghat Gate'
    ],
    labelX: 730.3,
    labelY: 495.3,
    bbox: [
      591.1,
      304.6,
      970,
      578.9
    ],
    area: 47758
  },
  {
    id: 'malviya-nagar',
    label: 'Malviya Nagar',
    official: 'Malviya Nagar',
    localities: [
      'Malviya Nagar',
      'Tonk Road',
      'Gandhi Nagar',
      'Durgapura',
      'Jawahar Circle',
      'Gopalpura'
    ],
    labelX: 522.8,
    labelY: 564.9,
    bbox: [
      386.9,
      419.5,
      655.6,
      727.2
    ],
    area: 45536
  },
  {
    id: 'jagatpura-sitapura',
    label: 'Jagatpura & Sitapura',
    official: 'Bagru Ansik',
    localities: [
      'Jagatpura',
      'Sitapura',
      'Goner Road',
      'Ramchandrapura',
      'Bagru'
    ],
    labelX: 709.4,
    labelY: 758.3,
    bbox: [
      423.7,
      520,
      971.5,
      923.4
    ],
    area: 119994
  },
  {
    id: 'mansarovar-sanganer',
    label: 'Mansarovar & Sanganer',
    official: 'Sanganer',
    localities: [
      'Mansarovar',
      'Sanganer',
      'Pratap Nagar (Gaushala)',
      'Shipra Path',
      'Sanganer Airport'
    ],
    labelX: 372.1,
    labelY: 830.7,
    bbox: [
      83.8,
      553.9,
      632.8,
      973.9
    ],
    area: 94026
  }
];

/** Lower-cased locality → district id. Localities with no zone are absent, not guessed. */
export const LOCALITY_TO_DISTRICT: Record<string, string> = {
  'amer': 'amer',
  'amber': 'amer',
  'kunda': 'amer',
  'delhi road': 'amer',
  'vidhyadhar nagar': 'vidhyadhar-jhotwara',
  'jhotwara': 'vidhyadhar-jhotwara',
  'murlipura': 'vidhyadhar-jhotwara',
  'sikar road': 'vidhyadhar-jhotwara',
  'harmara': 'vidhyadhar-jhotwara',
  'hawa mahal': 'hawa-mahal',
  'brahmpuri': 'hawa-mahal',
  'amer road': 'hawa-mahal',
  'jal mahal': 'hawa-mahal',
  'johari bazaar': 'hawa-mahal',
  'kishanpole': 'kishanpole',
  'chandpole': 'kishanpole',
  'tripolia': 'kishanpole',
  'walled city': 'kishanpole',
  'pink city': 'kishanpole',
  'vaishali nagar': 'vaishali-ajmer-road',
  'ajmer road': 'vaishali-ajmer-road',
  'nirman nagar': 'vaishali-ajmer-road',
  'chitrakoot': 'vaishali-ajmer-road',
  'queens road': 'vaishali-ajmer-road',
  'c-scheme': 'c-scheme-bani-park',
  'civil lines': 'c-scheme-bani-park',
  'bani park': 'c-scheme-bani-park',
  'sodala': 'c-scheme-bani-park',
  'shyam nagar': 'c-scheme-bani-park',
  'ashok nagar': 'c-scheme-bani-park',
  'adarsh nagar': 'adarsh-nagar',
  'raja park': 'adarsh-nagar',
  'jawahar nagar': 'adarsh-nagar',
  'transport nagar': 'adarsh-nagar',
  'agra road': 'adarsh-nagar',
  'ghat gate': 'adarsh-nagar',
  'malviya nagar': 'malviya-nagar',
  'tonk road': 'malviya-nagar',
  'gandhi nagar': 'malviya-nagar',
  'durgapura': 'malviya-nagar',
  'jawahar circle': 'malviya-nagar',
  'gopalpura': 'malviya-nagar',
  'mansarovar': 'mansarovar-sanganer',
  'sanganer': 'mansarovar-sanganer',
  'pratap nagar (gaushala)': 'mansarovar-sanganer',
  'shipra path': 'mansarovar-sanganer',
  'sanganer airport': 'mansarovar-sanganer',
  'jagatpura': 'jagatpura-sitapura',
  'sitapura': 'jagatpura-sitapura',
  'goner road': 'jagatpura-sitapura',
  'ramchandrapura': 'jagatpura-sitapura',
  'bagru': 'jagatpura-sitapura'
};

/** CC BY 4.0 requires this to be visible to the reader. ProjectAtlas renders it. */
export const ATLAS_SOURCE = {
  title: 'Jaipur municipal zones',
  publisher: 'DataMeet',
  url: 'https://github.com/datameet/Municipal_Spatial_Data',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  retrieved: '2026-08-06',
  /** These are the pre-2019 unified JMC zones, before the Heritage/Greater split. */
  vintage: 'Pre-2019 JMC zones',
} as const;

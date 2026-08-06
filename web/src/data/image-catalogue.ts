/**
 * Generated image catalogue — do not edit by hand.
 *
 * Curated from Wikimedia Commons (including its Unsplash CC0 imports), verified to
 * load and be >=1400px, downsized to 1500px/q58, and committed to public/images.
 * Regenerate with the harvest script; attribution: public/images/ATTRIBUTION.md
 */

export const IMAGE_POOLS = {
  "residential": [
    "residential-01.jpg",
    "residential-02.jpg",
    "residential-03.jpg",
    "residential-04.jpg",
    "residential-05.jpg",
    "residential-06.jpg",
    "residential-07.jpg",
    "residential-08.jpg",
    "residential-09.jpg"
  ],
  "interior": [
    "interior-01.jpg",
    "interior-02.jpg",
    "interior-03.jpg",
    "interior-04.jpg",
    "interior-05.jpg",
    "interior-06.jpg",
    "interior-07.jpg",
    "interior-08.jpg",
    "interior-09.jpg"
  ],
  "construction": [
    "construction-01.jpg",
    "construction-02.jpg",
    "construction-03.jpg",
    "construction-04.jpg",
    "construction-05.jpg",
    "construction-06.jpg",
    "construction-07.jpg",
    "construction-08.jpg",
    "construction-09.jpg"
  ],
  "mepf": [
    "mepf-01.jpg",
    "mepf-02.jpg",
    "mepf-03.jpg",
    "mepf-04.jpg",
    "mepf-05.jpg",
    "mepf-06.jpg",
    "mepf-07.jpg"
  ],
  "jaipur": [
    "jaipur-01.jpg",
    "jaipur-02.jpg",
    "jaipur-03.jpg",
    "jaipur-04.jpg",
    "jaipur-05.jpg",
    "jaipur-06.jpg",
    "jaipur-07.jpg",
    "jaipur-08.jpg"
  ],
  "commercial": [
    "commercial-01.jpg",
    "commercial-02.jpg",
    "commercial-03.jpg",
    "commercial-04.jpg",
    "commercial-05.jpg"
  ],
  "detail": [
    "detail-01.jpg",
    "detail-02.jpg",
    "detail-03.jpg",
    "detail-04.jpg",
    "detail-05.jpg",
    "detail-06.jpg",
    "detail-07.jpg"
  ]
} as const;

export type ImagePool = keyof typeof IMAGE_POOLS;

/**
 * The camera: the map SVG's viewBox, [x, y, width, height] in frame metres.
 *
 * `camPath` is the benchmark's, verbatim: Van Wijk & Nuij's smooth zoom-and-pan
 * ("Smooth and efficient zooming and panning", 2003), one arc-length-uniform
 * path between two viewBoxes that keeps the destination framed the whole way.
 * Its length S is in log-width units, so it does not care what the units are —
 * which is why the map can be in metres and still fly exactly like the
 * benchmark's.
 */

export type ViewBox = [number, number, number, number];

export interface CamPath {
  /** Path length; the flight's duration is derived from it. */
  S: number;
  at(t: number): ViewBox;
}

export function camPath(from: ViewBox, to: ViewBox): CamPath {
  const rho = Math.SQRT2, rho2 = 2, rho4 = 4, EPS = 1e-9;
  const c0 = [from[0] + from[2] / 2, from[1] + from[3] / 2], w0 = from[2], ar0 = from[3] / from[2];
  const c1 = [to[0] + to[2] / 2, to[1] + to[3] / 2], w1 = to[2], ar1 = to[3] / to[2];
  const dx = c1[0] - c0[0], dy = c1[1] - c0[1], d2 = dx * dx + dy * dy;
  let S: number;
  let pos: (t: number) => [number, number, number];
  if (d2 < EPS * w0 * w0) {
    // pure zoom, no pan
    S = Math.abs(Math.log(w1 / w0)) / rho;
    pos = (t) => [c0[0], c0[1], w0 * Math.pow(w1 / w0, t)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    const coshr0 = Math.cosh(r0), sinhr0 = Math.sinh(r0);
    pos = (t) => {
      const s = t * S;
      const u = (w0 / rho2) * (coshr0 * Math.tanh(r0 + rho * s) - sinhr0); // along-path distance, 0 → d1
      const k = u / d1; // fraction along the line, 0 → 1
      return [c0[0] + k * dx, c0[1] + k * dy, (w0 * coshr0) / Math.cosh(r0 + rho * s)];
    };
  }
  return {
    S,
    at(t) {
      const [cx, cy, w] = pos(t);
      const ar = ar0 + (ar1 - ar0) * t, h = w * ar;
      return [cx - w / 2, cy - h / 2, w, h];
    },
  };
}

/** A viewBox of the given aspect (h/w), centred on (cx, cy), `w` wide. */
export const boxAt = (cx: number, cy: number, w: number, aspect: number): ViewBox => [cx - w / 2, cy - (w * aspect) / 2, w, w * aspect];

/** Scale a viewBox about its own centre. */
export const scaleBox = (b: ViewBox, k: number): ViewBox => boxAt(b[0] + b[2] / 2, b[1] + b[3] / 2, b[2] * k, b[3] / b[2]);

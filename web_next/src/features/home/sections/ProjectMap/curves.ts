/** Level-of-detail helpers: everything the map does with altitude is a function of the camera's width. */

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
/** 0 at `lo`, 1 at `hi`, clamped. */
export const ramp = (w: number, lo: number, hi: number) => clamp((w - lo) / (hi - lo), 0, 1);

/** [camera width, target pixel radius] anchors, interpolated log-log: a smooth power law between anchors. */
export type Curve = ReadonlyArray<readonly [number, number]>;

export function curveAt(c: Curve, w: number): number {
  if (w >= c[0][0]) return c[0][1];
  if (w <= c[c.length - 1][0]) return c[c.length - 1][1];
  const lw = Math.log(w);
  for (let i = 0; i < c.length - 1; i++) {
    const [w0, r0] = c[i];
    const [w1, r1] = c[i + 1];
    if (w <= w0 && w >= w1) {
      const t = (lw - Math.log(w0)) / (Math.log(w1) - Math.log(w0));
      return Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * t);
    }
  }
  return c[c.length - 1][1];
}

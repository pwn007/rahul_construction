import { EASES } from './ease';

/**
 * ScrollTrigger's numeric `scrub`, ported: the animation's playhead never jumps
 * to the scroll position, it is tweened there over `seconds` with GSAP's
 * "expo" (out) ease, and every new scroll position restarts that tween from
 * wherever the playhead is (gsap 3.13 ScrollTrigger, `scrubTween.resetTo`). The
 * benchmark's map runs `scrub: 6`.
 */
export class Scrub {
  private from = 0;
  private to = 0;
  private t0 = 0;

  constructor(private readonly ms: number) {}

  /** Jump straight to `v` (first read, or while the band is off screen). */
  snap(v: number) {
    this.from = this.to = v;
    this.t0 = -1e12;
  }

  /** A new scroll position. A no-op when it has not changed. */
  seek(v: number, now: number) {
    if (v === this.to) return;
    this.from = this.value(now);
    this.to = v;
    this.t0 = now;
  }

  value(now: number) {
    const p = Math.min(1, (now - this.t0) / this.ms);
    return this.from + (this.to - this.from) * EASES['expo.out'](p);
  }

  /** Still catching up. */
  busy(now: number) {
    return now - this.t0 < this.ms && this.from !== this.to;
  }

  /** Finish the catch-up now (a user flight takes the camera; benchmark: `tween.progress(1)`). */
  finish() {
    this.snap(this.to);
  }

  get target() {
    return this.to;
  }
}

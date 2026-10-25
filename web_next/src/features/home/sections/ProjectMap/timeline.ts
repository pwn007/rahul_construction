import { EASES, reverseEase, type Ease, type EaseName } from './ease';

/**
 * A seekable tween list — the part of a GSAP timeline the map needs, and no
 * more. The benchmark drives its entry by scroll (seeked, scrubbed) and its
 * panels by time; both are just "sample the timeline at t", so one structure
 * serves both and runs on the map's one animation frame.
 *
 * Override semantics are GSAP's: for each element and property the tweens run
 * in start order, a later one takes over from the moment it starts, and a
 * `fromTo` that renders immediately shows its start value before it begins
 * (an exit tween does not — it waits, leaving the entrance's end state).
 */

export type Prop = 'x' | 'y' | 'opacity' | 'blur';
const SHOWN: Record<Prop, number> = { x: 0, y: 0, opacity: 1, blur: 0 };

export interface Tween {
  target: number;
  prop: Prop;
  from: number;
  to: number;
  start: number;
  dur: number;
  ease: Ease;
  immediate: boolean;
}

export type State = Partial<Record<Prop, number>>;

export class Timeline {
  readonly tweens: Tween[] = [];
  private byKey = new Map<string, Tween[]>();
  duration = 0;

  add(tw: Tween) {
    this.tweens.push(tw);
    const key = `${tw.target}:${tw.prop}`;
    const list = this.byKey.get(key) ?? [];
    list.push(tw);
    list.sort((a, b) => a.start - b.start);
    this.byKey.set(key, list);
    this.duration = Math.max(this.duration, tw.start + tw.dur);
    return this;
  }

  /** Every target's state at time `t`. Targets with no tween yet started (and none rendering immediately) are absent. */
  sample(t: number): Map<number, State> {
    const out = new Map<number, State>();
    for (const [key, list] of this.byKey) {
      let v: number | undefined;
      for (const tw of list) {
        if (t >= tw.start) {
          const p = tw.dur > 0 ? Math.min(1, (t - tw.start) / tw.dur) : 1;
          v = tw.from + (tw.to - tw.from) * tw.ease(p);
        } else if (tw.immediate && v === undefined) {
          v = tw.from;
        }
      }
      if (v === undefined) continue;
      const [target, prop] = key.split(':') as [string, Prop];
      const s = out.get(+target) ?? {};
      s[prop] = v;
      out.set(+target, s);
    }
    return out;
  }
}

/** One entrance move of a reveal, in the benchmark's vocabulary (editorial.js `reveal()`). */
export interface Move {
  /** Target indices. */
  els: number[];
  /** The hidden state; a function gets the element's index within the move. */
  from: Partial<Record<Prop, number | ((i: number) => number)>>;
  dur: number;
  ease: EaseName;
  at: number;
  stagger?: number;
  /** Where the exit starts, in beats after the hold — for moves whose entrance is early but whose exit must stay late. */
  outAt?: number;
}

/**
 * The benchmark's reveal: every move plays in as authored, and leaves by its
 * mirror — shown → hidden, reversed ease, mirrored time, reversed stagger — so
 * scrolling back through the band plays the entrance in reverse. `hold` beats
 * of stillness sit between the two.
 */
export function buildReveal(moves: Move[], hold = 0) {
  const tl = new Timeline();
  let inEnd = 0;
  for (const m of moves) {
    const s = m.stagger ?? 0;
    inEnd = Math.max(inEnd, m.at + m.dur + s * (m.els.length - 1));
  }
  const holdEnd = inEnd + hold;
  for (const m of moves) {
    const s = m.stagger ?? 0;
    const n = m.els.length;
    const outAt = m.outAt != null ? holdEnd + m.outAt : holdEnd + (inEnd - (m.at + m.dur)) - s * (n - 1);
    m.els.forEach((target, i) => {
      for (const [prop, f] of Object.entries(m.from) as [Prop, number | ((i: number) => number)][]) {
        const hidden = typeof f === 'function' ? f(i) : f;
        tl.add({ target, prop, from: hidden, to: SHOWN[prop], start: m.at + i * s, dur: m.dur, ease: EASES[m.ease], immediate: true });
        tl.add({ target, prop, from: SHOWN[prop], to: hidden, start: outAt + (n - 1 - i) * s, dur: m.dur, ease: EASES[reverseEase(m.ease)], immediate: false });
      }
    });
  }
  return { tl, inEnd, total: holdEnd + inEnd };
}

/** A timed performance (the panels): `fromTo` tweens at seconds, all scaled by `timeScale`. */
export function timed(
  timeScale: number,
  specs: Array<{ els: number[]; prop: Prop; from: number | ((i: number) => number); to: number | ((i: number) => number); at: number; dur: number; ease: EaseName; stagger?: number }>,
) {
  const tl = new Timeline();
  for (const sp of specs) {
    sp.els.forEach((target, i) => {
      const val = (v: number | ((i: number) => number)) => (typeof v === 'function' ? v(i) : v);
      tl.add({
        target,
        prop: sp.prop,
        from: val(sp.from),
        to: val(sp.to),
        start: (sp.at + i * (sp.stagger ?? 0)) / timeScale,
        dur: sp.dur / timeScale,
        ease: EASES[sp.ease],
        immediate: true,
      });
    });
  }
  return tl;
}

/** What was last written to each element, so an unchanged frame writes nothing (the browser normalises what it reads back). */
const written = new WeakMap<Element, { t: string; o: string; f: string }>();

/** Write a state to an element: HTML gets a transform, opacity and filter; an SVG group its transform attribute. */
export function applyState(el: Element, s: State, svg = false) {
  const x = s.x ?? 0;
  const y = s.y ?? 0;
  const last = written.get(el) ?? { t: '', o: '', f: '' };
  const o = s.opacity != null ? String(+s.opacity.toFixed(3)) : '';
  if (svg) {
    const t = x || y ? `translate(${x.toFixed(2)} ${y.toFixed(2)})` : '';
    if (last.t !== t) t ? el.setAttribute('transform', t) : el.removeAttribute('transform');
    if (last.o !== o) (el as SVGElement).style.opacity = o;
    written.set(el, { t, o, f: '' });
    return;
  }
  const st = (el as HTMLElement).style;
  const t = x || y ? `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` : '';
  const f = s.blur ? `blur(${s.blur.toFixed(2)}px)` : '';
  if (last.t !== t) st.transform = t;
  if (last.o !== o) st.opacity = o;
  if (last.f !== f) st.filter = f;
  written.set(el, { t, o, f });
}

/** Forget what was written (after styles were cleared by hand). */
export function forget(el: Element) {
  written.delete(el);
}

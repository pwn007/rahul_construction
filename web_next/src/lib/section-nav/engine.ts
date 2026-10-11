/**
 * Section navigation: one section per swipe on phones and tablets.
 *
 * Ported from the finalized design's prototype (proto2/app.js, "Section
 * navigation"), where it was tuned and tested; the numbers below are its
 * numbers. What it does:
 *
 * - On touch-first devices — `(hover: none) and (pointer: coarse)` — with motion
 *   allowed, touch, wheel and keys move the page exactly one section per
 *   intentional gesture, and it always comes to rest aligned to a section.
 * - With a mouse or trackpad (desktop), and under reduced motion, it does
 *   nothing at all: the page scrolls natively (and Lenis, on desktop, smooths
 *   the wheel — see hooks/useLenis.ts). A tablet that gains a mouse, or devtools
 *   switching device mode, flips it on or off live.
 *
 * Why a takeover and not CSS scroll-snap: with native scrolling one fling's
 * momentum runs through as many sections as it has energy for and can stop
 * anywhere; `scroll-snap-stop: always` fixes the skipping but snaps hard and
 * cannot hand a tall section its own free scrolling. So, as in the design:
 *
 * - a touch drag follows the finger 1:1 but can never reach past the
 *   neighbouring section;
 * - on release, distance + release speed decide: next, previous or back home —
 *   never anything in between;
 * - every move is a velocity-matched glide (a cubic Hermite: it leaves at the
 *   finger's speed and lands at rest);
 * - a new gesture during a glide can reverse it or carry on one more section;
 *   a tap lets it finish — and, as with a native fling, is not a click: the
 *   link that happened to be passing under the finger does not open;
 * - sections taller than the screen scroll freely inside, with their own
 *   inertia, and hand over only from their edge;
 * - wheel: one section per wheel gesture, a trackpad's inertia tail absorbed;
 *   keys likewise.
 *
 * The scroll position stays the browser's own (`window.scrollTo`); only the
 * input is taken over. Sideways swipes are left alone, so horizontal rails
 * (`data-hscroll`, or anything that scrolls sideways) and the hero's photo
 * swipe keep working.
 *
 * ── Stops ────────────────────────────────────────────────────────────────────
 * Every element with `data-section` that is not inside another one, in page
 * order. Two rules the prototype did not need, because every band there was a
 * full screen:
 *
 * - a band shorter than half a screen (the trust strip) is not a stop of its
 *   own — it travels with the section after it, unless that section is drawn
 *   as a screen (a chapter or the hero: `min-height` of a full screen), which
 *   always keeps its own stop;
 * - consecutive bands that fit on one screen together are one stop.
 *
 * A stop that is still taller than the screen becomes a "tall" zone: the page
 * rests at its top arriving from above, at its bottom arriving from below, and
 * scrolls freely in between.
 *
 * Positions are layout positions (`offsetTop`), not `getBoundingClientRect`, so
 * the page-enter transition's transform (app/(public)/template.tsx) never
 * shifts a stop.
 */

type Zone = { a: number; b: number; els: HTMLElement[] };

type Glide = {
  kind: 'nav' | 'settle';
  y0: number;
  y1: number;
  t0: number;
  dur: number;
  m: number;
  from?: number;
  to?: number;
};
type Free = { kind: 'free'; y0: number; v: number; t0: number; to: number };
type Inner = { kind: 'inner'; y: number; target: number; last: number; to: number };
type Anim = Glide | Free | Inner;

/** The leg a glide is on: the zone just ahead, the one just behind, how far between. */
type Leg = { d: number; to: number; from: number; p: number; final?: number; origin?: number };

type Gesture = {
  id: number;
  x0: number;
  y0: number;
  sy0: number;
  k: number;
  leg: Leg | null;
  lo: number;
  hi: number;
  hx: boolean;
  axis: 'x' | 'y' | null;
  off: number;
  p: number;
  S: { t: number; p: number }[];
  multi: boolean;
  native: boolean;
  /** The finger landed on a page that was still moving. */
  caught: boolean;
};

type WheelGesture = {
  t0: number;
  t: number;
  s: number;
  peak: number;
  low: number;
  lastAdy: number;
  falling: boolean;
  sum: number;
  mode: 'nav' | 'inner' | 'done' | null;
  k: number;
};

export interface SectionNavOptions {
  /** What marks a stop. */
  stops?: string;
  /** The fixed site header, for the offset when a link targets something inside a section. */
  header?: string;
  /** Exposes `window.__nav` for the tests (the page's `?navdebug`). */
  debug?: boolean;
}

export interface SectionNav {
  /** Glide to an element (a stop, or something inside one). Native scroll when the engine is off. */
  goTo(el: Element): void;
  /** True while the engine owns the page's vertical scroll. */
  readonly active: boolean;
  destroy(): void;
}

const COAST_T = 360; // ms, inertia time constant inside tall sections (iOS sits around 325–500)
const SLOP = 6; // px of finger travel before a touch counts as a drag
const SHORT = 0.5; // a band under half a screen travels with the next one

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const elOf = (t: EventTarget | null): Element | null => (t instanceof Element ? t : null);

/** Cubic Hermite 0→1 leaving with slope m (1 = the move's average speed) and arriving at rest.
    m ≤ 3 never overshoots; negative m first carries on the old way a little (momentum), then returns. */
const herm = (s: number, m: number) => m * (s * s * s - 2 * s * s + s) + 3 * s * s - 2 * s * s * s;

/** Distance from the top of the document, ignoring transforms. */
function pageTop(el: HTMLElement): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}

/** The element under the finger, or an ancestor, scrolls sideways. */
function scrollsSideways(t: Element | null): boolean {
  for (let n = t; n && n !== document.body; n = n.parentElement) {
    if (n.hasAttribute('data-hscroll')) return true;
    if (n.scrollWidth > n.clientWidth + 1) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
  }
  return false;
}

export function createSectionNav(opts: SectionNavOptions = {}): SectionNav {
  const SEL = opts.stops ?? '[data-section]';
  const HDR = opts.header ?? '[data-site-header]';
  const DEBUG = !!opts.debug;

  const html = document.documentElement;
  const touchMq = window.matchMedia('(hover: none) and (pointer: coarse)');
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const want = () => touchMq.matches && !reduceMq.matches;

  const VH = () => window.innerHeight;
  const sy = () => window.scrollY;
  const scroller = () => document.scrollingElement || html;

  let NAV = false;
  let iv: Zone[] = []; // navigable zones: rest at a arriving from above, at b arriving from below (a < b only when taller than the screen)
  let cur = 0; // the zone at rest, or the one being travelled to
  let anim: Anim | null = null; // the running motion
  let wrote = NaN; // the last position this engine wrote, to tell its own scrolls from anyone else's
  let g: Gesture | null = null; // the live touch gesture
  let wg: WheelGesture | null = null; // the live wheel gesture
  let dirty = false; // layout changed mid-motion: re-measure at rest
  let focusT = -1e9;
  let mouseDown = false;
  let extT: ReturnType<typeof setTimeout> | undefined;
  let extPending = false;
  let swallowUntil = 0; // a tap that caught a moving page is not a click
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  let prevRestoration: ScrollRestoration | null = null;
  let ro: ResizeObserver | null = null;
  let observed = new Set<Element>();
  let raf = 0;
  let running = false;
  let destroyed = false;
  const dbg: { frames: [number, number, string][]; release: unknown } = { frames: [], release: null };

  const stopsNow = () =>
    Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter(
      (el) => !el.parentElement?.closest(SEL) && el.offsetHeight > 0,
    );
  const hdrH = () => (document.querySelector<HTMLElement>(HDR)?.offsetHeight ?? 0);

  function setVh() {
    html.style.setProperty('--vh', `${VH() / 100}px`);
  }
  function setY(y: number) {
    wrote = y;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  /* ── Zones ─────────────────────────────────────────────────── */
  function measure() {
    const vh = VH();
    const maxY = Math.max(0, scroller().scrollHeight - vh);
    // a few px of bottom padding past the screen is not "tall"
    const tol = Math.min(40, vh * 0.06);
    const secs = stopsNow().map((el) => {
      const top = pageTop(el);
      // drawn as one screen (a chapter, the hero): never folded into another stop
      const screen = parseFloat(getComputedStyle(el).minHeight) >= vh - 1;
      return { el, top, bot: top + el.offsetHeight, screen };
    });
    const out: Zone[] = [];
    let i = 0;
    while (i < secs.length) {
      const grp = { top: secs[i].top, bot: secs[i].bot, els: [secs[i].el] };
      let j = i + 1;
      while (
        j < secs.length &&
        ((grp.bot - grp.top < SHORT * vh && !secs[j].screen) || secs[j].bot - grp.top <= vh + tol)
      ) {
        grp.bot = Math.max(grp.bot, secs[j].bot);
        grp.els.push(secs[j].el);
        j++;
      }
      i = j;
      let a = out.length === 0 ? 0 : Math.round(grp.top);
      let b = grp.bot - grp.top - vh > tol ? Math.round(grp.bot - vh) : a;
      if (i >= secs.length) b = Math.max(b, maxY); // the last one runs to the end of the page
      a = Math.min(a, maxY);
      b = clamp(b, a, maxY);
      const prev = out[out.length - 1];
      if (prev && a <= prev.b + 1) {
        prev.b = Math.max(prev.b, b);
        prev.els.push(...grp.els);
        continue;
      }
      out.push({ a, b, els: grp.els });
    }
    iv = out;
    cur = clamp(cur, 0, Math.max(0, iv.length - 1));
    dirty = false;
    observe(secs.map((s) => s.el));
  }
  function zoneOf(el: Element | null): number {
    const s = el?.closest(SEL) ?? null;
    let top = s as HTMLElement | null;
    while (top?.parentElement?.closest(SEL)) top = top.parentElement.closest(SEL) as HTMLElement;
    const i = top ? iv.findIndex((v) => v.els.includes(top as HTMLElement)) : -1;
    return i < 0 ? 0 : i;
  }
  function nearest(y: number): number {
    let best = 0;
    let bd = Infinity;
    iv.forEach((v, i) => {
      const d = y < v.a ? v.a - y : y > v.b ? y - v.b : 0;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }
  const land = (t: number, from: number) => (t >= from ? iv[t].a : iv[t].b);
  /* Overlays (the mobile menu, dialogs, the preloader) lock the body; the engine stands back. */
  const blocked = () =>
    document.body.style.overflow === 'hidden' ||
    html.style.overflow === 'hidden' ||
    !!document.querySelector('[aria-modal="true"]');
  const zoomed = () => !!window.visualViewport && window.visualViewport.scale > 1.02;

  /* ── Motion ────────────────────────────────────────────────── */
  function glide(
    y1: number,
    o: { kind: 'nav' | 'settle'; v?: number; dur: number; match?: boolean; min?: number; m0?: number; from?: number; to?: number },
  ) {
    const y0 = sy();
    const D = y1 - y0;
    const AD = Math.abs(D);
    if (o.to != null) cur = o.to;
    if (AD < 0.5) {
      setY(y1);
      anim = null;
      return;
    }
    const along = (o.v || 0) * Math.sign(D); // current speed along the move, px/ms
    let dur = o.dur;
    if (o.match && along > 0) dur = clamp((2.4 * AD) / along, o.min || 360, o.dur); // hard flicks arrive sooner
    const m = o.m0 != null && !o.v ? o.m0 : clamp((along * dur) / AD, -0.8, 2.6);
    anim = { kind: o.kind, y0, y1, t0: performance.now(), dur, m, from: o.from, to: o.to };
    kick();
  }
  function animSpeed(): number {
    // px/ms, signed
    const A = anim;
    if (!A || A.kind === 'inner') return 0;
    const t = performance.now() - A.t0;
    if (A.kind === 'free') return A.v * Math.exp(-t / COAST_T);
    const s = clamp(t / A.dur);
    return ((A.y1 - A.y0) * (A.m * (3 * s * s - 4 * s + 1) + 6 * s - 6 * s * s)) / A.dur;
  }
  function navStep(): boolean {
    const A = anim;
    if (!A) return false;
    const now = performance.now();
    let y: number;
    let done: boolean;
    if (A.kind === 'free') {
      const e = Math.exp(-Math.max(0, now - A.t0) / COAST_T);
      y = A.y0 + A.v * COAST_T * (1 - e);
      done = Math.abs(A.v) * e < 0.012;
    } else if (A.kind === 'inner') {
      const dt = Math.min(64, Math.max(0, now - A.last));
      A.last = now;
      A.y += (A.target - A.y) * (1 - Math.exp(-dt / 95));
      done = Math.abs(A.target - A.y) < 0.4;
      if (done) A.y = A.target;
      y = A.y;
    } else {
      const s = clamp((now - A.t0) / A.dur);
      done = s >= 1;
      y = done ? A.y1 : A.y0 + (A.y1 - A.y0) * herm(s, A.m);
    }
    setY(y);
    if (DEBUG) {
      dbg.frames.push([Math.round(now), +y.toFixed(2), A.kind]);
      if (dbg.frames.length > 2000) dbg.frames.splice(0, 1000);
    }
    if (done) {
      anim = null;
      rested();
    }
    return !done;
  }
  function rested() {
    if (dirty && !g) relayout();
    warm(cur);
  }
  /* Fetch and decode the photographs either side of where the page rests, so the next glide never waits on one. */
  const warmed = new WeakSet<HTMLImageElement>();
  function warm(k: number) {
    for (let j = Math.max(0, k - 1); j <= Math.min(iv.length - 1, k + 2); j++) {
      iv[j].els.forEach((s) =>
        s.querySelectorAll('img').forEach((im) => {
          if (warmed.has(im)) return;
          warmed.add(im);
          if (im.loading === 'lazy') im.loading = 'eager';
          im.decode?.().catch(() => {});
        }),
      );
    }
  }

  /* One step between zones. from/to are zone indexes; m0 is the start slope when there is no speed to match. */
  function travel(to: number, from: number, v: number, m0: number, brisk = false) {
    to = clamp(to, 0, iv.length - 1);
    const y1 = land(to, from);
    const jumps = Math.abs(to - from);
    const D = Math.abs(y1 - sy());
    // touch: 0.54–0.84 s by distance; wheel and keys a touch brisker, since nothing carries the page there
    const dur =
      jumps > 1
        ? Math.min(1600, 860 + 140 * (jumps - 1))
        : brisk
          ? 460 + 240 * Math.min(1, D / VH())
          : 540 + 300 * Math.min(1, D / VH());
    glide(y1, { kind: 'nav', v, dur, match: true, min: 420, m0, from, to });
  }
  function settle(k: number, v: number) {
    // back onto the nearest point of zone k
    const { a, b } = iv[k];
    const y = sy();
    const y1 = clamp(y, a, b);
    glide(y1, {
      kind: 'settle',
      v,
      dur: 380 + 280 * Math.min(1, Math.abs(y1 - y) / (0.5 * VH())),
      match: true,
      min: 260,
      m0: 0,
      to: k,
    });
  }
  function coast(k: number, v: number) {
    // inertia inside a tall section, never past its edges
    const y0 = sy();
    const { a, b } = iv[k];
    const end = y0 + v * COAST_T;
    cur = k;
    if (end > a && end < b) {
      anim = { kind: 'free', y0, v, t0: performance.now(), to: k };
      kick();
      return;
    }
    glide(clamp(end, a, b), { kind: 'settle', v, dur: 900, match: true, min: 240, to: k });
  }
  function legOf(A: Glide): Leg {
    const d = Math.sign(A.y1 - A.y0) || 1;
    const y = sy();
    const n = iv.length;
    let to: number;
    let from: number;
    let p: number;
    if (d > 0) {
      to = 0;
      while (to < n - 1 && iv[to].a < y - 1) to++;
      from = Math.max(0, to - 1);
      const s0 = iv[from].b;
      const s1 = iv[to].a;
      p = s1 > s0 ? clamp((y - s0) / (s1 - s0)) : 1;
    } else {
      to = n - 1;
      while (to > 0 && iv[to].b > y + 1) to--;
      from = Math.min(n - 1, to + 1);
      const s0 = iv[from].a;
      const s1 = iv[to].b;
      p = s0 > s1 ? clamp((s0 - y) / (s0 - s1)) : 1;
    }
    return { d, to, from, p, final: A.to, origin: A.from };
  }
  /* Wheel or key while travelling: every deliberate gesture counts. The other way → straight back; the
     same way → one more section, but never more than one past the section that is arriving. */
  function more(s: number, L: Leg, v: number) {
    if (s === -L.d) return travel(L.from, L.to, v, 1.2, true);
    if (L.final != null && (L.final - L.to) * L.d > 1) return; // a long jump already goes further
    const t = clamp(L.to + L.d, 0, iv.length - 1);
    if (t !== L.final) travel(t, L.from, v, 1.2, true);
  }
  /* A fresh touch while travelling: the other way → straight back; the same way → one more section, but
     only once the current one is more than half on screen (a quick double swipe stays one). A long jump keeps its target. */
  function redirect(s: number, L: Leg, v: number, m0: number) {
    if (s === -L.d) return travel(L.from, L.to, v, m0);
    let t = s === L.d && L.p >= 0.5 ? L.to + L.d : L.to;
    if (L.final != null && (L.final - t) * L.d > 0) t = L.final;
    travel(t, L.from, v, m0);
  }

  /* Distance moved (+ = on through the page) and release speed → +1 / -1 / 0 */
  function intentOf(d: number, v: number): number {
    const s = Math.sign(d);
    const ad = Math.abs(d);
    const along = v * s;
    if (ad < 10 || along < -0.1) return 0; // a twitch, or pulled back before letting go
    if (ad > 0.3 * VH() || along > 0.35 || (ad > 0.1 * VH() && along > 0.05)) return s;
    return 0;
  }
  /* Release speed: finger travel over the last 80 ms, px/ms. A finger that stopped before lifting reads 0. */
  function releaseSpeed(S: Gesture['S'], tEnd: number): number {
    if (S.length < 2) return 0;
    const last = S[S.length - 1];
    const t0 = Math.max(S[0].t, tEnd - 80);
    let p0 = S[0].p;
    for (let i = S.length - 1; i > 0; i--) {
      if (S[i - 1].t <= t0) {
        const A = S[i - 1];
        const B = S[i];
        p0 = A.p + (B.p - A.p) * clamp((t0 - A.t) / Math.max(1e-3, B.t - A.t));
        break;
      }
    }
    const dt = tEnd - t0;
    return dt > 8 ? (last.p - p0) / dt : 0;
  }

  /* ── Touch ─────────────────────────────────────────────────── */
  function tStart(e: TouchEvent) {
    if (!NAV) return;
    swallowUntil = 0; // a new touch: whatever the last tap was, it is over
    if (e.touches.length > 1) {
      if (g) g.multi = true;
      return;
    }
    if (blocked() || zoomed()) {
      g = null;
      return;
    }
    if (dirty && !anim) relayout();
    if (!iv.length) return;
    const t = e.touches[0];
    let k: number;
    let leg: Leg | null = null;
    const caught = !!anim;
    if (anim) {
      if (anim.kind === 'nav') leg = legOf(anim);
      k = anim.to != null ? anim.to : nearest(sy());
      anim = null; // the finger catches the page where it is
    } else k = nearest(sy());
    const y = sy();
    const n = iv.length;
    let lo: number;
    let hi: number;
    if (leg) {
      const far = clamp(leg.to + leg.d, 0, n - 1);
      const ends = [land(leg.from, leg.to), land(leg.to, leg.from), land(far, leg.from)];
      lo = Math.min(y, ...ends);
      hi = Math.max(y, ...ends);
    } else {
      lo = Math.min(y, k > 0 ? iv[k - 1].b : iv[0].a);
      hi = Math.max(y, k < n - 1 ? iv[k + 1].a : iv[n - 1].b);
    }
    const now = performance.now();
    g = {
      id: t.identifier,
      x0: t.clientX,
      y0: t.clientY,
      sy0: y,
      k,
      leg,
      lo,
      hi,
      hx: scrollsSideways(elOf(e.target)),
      axis: null,
      off: 0,
      p: y,
      S: [{ t: now, p: y }],
      multi: false,
      native: false,
      caught,
    };
  }
  function tMove(e: TouchEvent) {
    if (!NAV || !g || g.native) return;
    if (e.touches.length > 1) {
      g.multi = true; // pinch-zoom belongs to the browser
      return;
    }
    if (g.multi) {
      if (e.cancelable) e.preventDefault();
      return;
    }
    let t = e.touches[0];
    for (let i = 0; i < e.touches.length; i++) if (e.touches[i].identifier === g.id) t = e.touches[i];
    const dx = t.clientX - g.x0;
    const dy = t.clientY - g.y0;
    if (!g.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SLOP) {
        if (!g.hx && e.cancelable) e.preventDefault();
        return;
      }
      g.axis = Math.abs(dy) >= Math.abs(dx) ? 'y' : 'x';
      g.off = Math.sign(dy) * SLOP;
    }
    if (g.axis === 'x') {
      if (!g.hx && e.cancelable) e.preventDefault(); // sideways: rails scroll natively, the hero swipes
      return;
    }
    if (!e.cancelable) {
      g.native = true; // the browser already owns this touch
      return;
    }
    e.preventDefault();
    const p = g.sy0 - (dy - g.off);
    g.p = p;
    g.S.push({ t: performance.now(), p });
    if (g.S.length > 32) g.S.shift();
    setY(clamp(p, g.lo, g.hi));
  }
  function tEnd(e: TouchEvent) {
    if (!NAV) return;
    if (!g || (e.touches && e.touches.length)) return; // wait for the last finger
    const G = g;
    g = null;
    if (G.native) {
      clearTimeout(extT);
      extT = setTimeout(tidy, 160);
      return;
    }
    if (!iv.length) return;
    const drag = G.axis === 'y' && !G.multi;
    if (G.caught && !G.axis) swallowUntil = performance.now() + 500;
    const v = drag && e.type === 'touchend' ? releaseSpeed(G.S, performance.now()) : 0;
    if (DEBUG) dbg.release = { v: +v.toFixed(3), moved: Math.round(G.p - G.sy0), samples: G.S.length, leg: G.leg && { ...G.leg } };
    if (G.leg) {
      const s = drag ? intentOf(G.p - G.sy0, v) : 0;
      redirect(s, G.leg, v, 0);
      return;
    }
    const k = Math.min(G.k, iv.length - 1);
    const { a, b } = iv[k];
    const y = sy();
    const d = y > b ? y - b : y < a ? y - a : 0;
    if (!d) {
      // inside a tall section: plain scrolling with inertia
      if (drag && Math.abs(v) > 0.05) coast(k, v);
      else cur = k;
      return;
    }
    const s = Math.sign(d);
    const fromEdge = s > 0 ? G.sy0 >= b - 2 : G.sy0 <= a + 2;
    // from the edge: the normal intent rule. From inside a tall section: only a deliberate pull past the edge hands over.
    const go = drag && (fromEdge ? intentOf(d, v) === s : Math.abs(d) > 0.18 * VH() && v * s > -0.1);
    if (go && k + s >= 0 && k + s < iv.length) travel(k + s, k, v, 0);
    else settle(k, v);
  }

  /* ── Wheel and keys (a tablet with a keyboard or a trackpad) ─ */
  function wheel(e: WheelEvent) {
    if (!NAV || e.ctrlKey || blocked() || zoomed() || !iv.length) return; // ctrl+wheel is a pinch-zoom
    let dy = e.deltaY;
    let dx = e.deltaX;
    if (e.deltaMode === 1) {
      dy *= 16;
      dx *= 16;
    } else if (e.deltaMode === 2) {
      dy *= VH();
      dx *= VH();
    }
    if (Math.abs(dx) > Math.abs(dy)) return; // sideways: rails scroll natively
    if (e.cancelable) e.preventDefault();
    const ady = Math.abs(dy);
    if (ady < 0.5) return;
    const now = performance.now();
    const s = Math.sign(dy);
    // A new gesture: after a pause, on a change of direction, or — inside a trackpad's fading inertia — when the
    // deltas climb well clear of the trough again (a new swipe on top of the old one's momentum).
    const rise = !!wg && wg.falling && now - wg.t0 > 120 && ady > Math.max(wg.low * 2.5, wg.low + 18);
    // A mouse wheel's notches (big, discrete deltas) a beat apart are separate gestures; a fast spin is one.
    const notch = !!wg && now - wg.t > 90 && ady >= 50 && wg.lastAdy >= 50;
    const fresh = !wg || now - wg.t > 180 || s !== wg.s || rise || notch;
    if (fresh) {
      wg = { t0: now, t: now, s, peak: ady, low: ady, lastAdy: ady, falling: false, sum: 0, mode: null, k: 0 };
      if (anim && anim.kind === 'nav') {
        wg.mode = 'done';
        more(s, legOf(anim), animSpeed());
        return;
      }
      const y = anim && anim.kind === 'inner' ? anim.target : sy();
      const k = anim && anim.to != null ? anim.to : nearest(y);
      if (anim && anim.kind !== 'inner') anim = null;
      const { a, b } = iv[k];
      wg.k = k;
      wg.mode = (s > 0 ? y >= b - 1 : y <= a + 1) ? 'nav' : 'inner';
    } else if (wg) {
      wg.t = now;
      if (ady < wg.peak * 0.6) wg.falling = true;
      wg.peak = Math.max(wg.peak, ady);
      wg.low = wg.falling ? Math.min(wg.low, ady) : ady;
      wg.lastAdy = ady;
    }
    if (!wg || wg.mode === 'done') return; // the rest of this gesture is spent
    if (wg.mode === 'nav') {
      wg.sum += dy;
      if (Math.abs(wg.sum) >= 14) {
        wg.mode = 'done';
        if (wg.k + s >= 0 && wg.k + s < iv.length) travel(wg.k + s, wg.k, 0, 1.2, true);
      }
      return;
    }
    inner(wg.k, dy); // inside a tall section: scroll it and stop at its edge
  }
  function inner(k: number, delta: number) {
    const { a, b } = iv[k];
    if (!anim || anim.kind !== 'inner') anim = { kind: 'inner', y: sy(), target: sy(), last: performance.now(), to: k };
    anim.target = clamp(anim.target + delta, a, b);
    cur = k;
    kick();
  }
  function key(e: KeyboardEvent) {
    if (!NAV || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || blocked() || zoomed() || !iv.length) return;
    const tg = elOf(e.target);
    if (tg?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], video')) return;
    let s = 0;
    let frac = 0;
    switch (e.key) {
      case 'ArrowDown':
        s = 1;
        frac = 0.22;
        break;
      case 'ArrowUp':
        s = -1;
        frac = 0.22;
        break;
      case 'PageDown':
        s = 1;
        frac = 0.86;
        break;
      case 'PageUp':
        s = -1;
        frac = 0.86;
        break;
      case ' ':
      case 'Spacebar':
        if (tg?.closest('button, summary, a, [role="button"]')) return;
        s = e.shiftKey ? -1 : 1;
        frac = 0.86;
        break;
      case 'Home':
      case 'End': {
        e.preventDefault();
        const from = anim && anim.to != null ? anim.to : nearest(sy());
        const to = e.key === 'Home' ? 0 : iv.length - 1;
        const jumps = Math.max(1, Math.abs(to - from));
        glide(to ? iv[to].b : 0, { kind: 'nav', v: animSpeed(), dur: Math.min(1600, 860 + 140 * (jumps - 1)), m0: 1.2, from, to });
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    if (anim && anim.kind === 'nav') {
      more(s, legOf(anim), animSpeed());
      return;
    }
    const y = anim && anim.kind === 'inner' ? anim.target : sy();
    const k = anim && anim.to != null ? anim.to : nearest(y);
    const { a, b } = iv[k];
    if (s > 0 ? y < b - 1 : y > a + 1) {
      inner(k, s * frac * VH()); // a screenful inside a tall section
      return;
    }
    if (anim && anim.kind !== 'inner') anim = null;
    if (k + s >= 0 && k + s < iv.length) travel(k + s, k, 0, 1.2, true);
  }

  /* ── Links to places on the page glide there ──────────────── */
  function goTo(el: Element) {
    if (!NAV || !(el instanceof HTMLElement)) {
      el.scrollIntoView({ block: 'start', behavior: reduceMq.matches ? 'auto' : 'smooth' });
      return;
    }
    if (dirty || !iv.length) measure();
    if (!iv.length) return;
    const k = zoneOf(el);
    const { a, b, els } = iv[k];
    const sec = els.find((s) => s.contains(el));
    const top = pageTop(el);
    // a stop rests at its own top (the header floats over the photograph); anything inside one clears the header
    const y1 = clamp(Math.round(sec === el ? top : top - hdrH() - 24), a, b);
    const from = anim && anim.to != null ? anim.to : nearest(sy());
    const jumps = Math.max(1, Math.abs(k - from));
    glide(y1, { kind: 'nav', v: animSpeed(), dur: Math.min(1600, 860 + 140 * (jumps - 1)), m0: 1.2, from, to: k });
  }
  function focusTarget(t: HTMLElement) {
    if (!t.matches('a, button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }
  /* Same-page `#id` links (the MEPF cards, and any other) — captured before
     React and next/link see the click, so the glide replaces the browser's jump.
     Also where a tap that only caught a moving page is swallowed (see tEnd). */
  function onClick(e: MouseEvent) {
    if (!NAV) return;
    if (swallowUntil && performance.now() < swallowUntil) {
      swallowUntil = 0;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    swallowUntil = 0;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = elOf(e.target)?.closest<HTMLAnchorElement>('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    let url: URL;
    try {
      url = new URL(a.href, location.href);
    } catch {
      return;
    }
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const t = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!t || !t.closest(SEL)) return; // not a section, nor inside one: the browser's own behaviour
    e.preventDefault();
    goTo(t);
    focusTarget(t);
  }

  /* ── Someone else moved the page ───────────────────────────────
     The scrollbar, find-in-page, keyboard focus, assistive tech: once it stops, put it on a section. */
  function onScroll() {
    if (!NAV || Math.abs(sy() - wrote) <= 2) return; // our own write
    if (g && g.axis === 'y' && !g.native) return;
    anim = null;
    extPending = true;
    clearTimeout(extT);
    extT = setTimeout(tidy, 160);
  }
  function tidy() {
    if (!NAV) return;
    if (mouseDown) {
      extT = setTimeout(tidy, 160);
      return;
    }
    extPending = false;
    if (g || anim || blocked() || zoomed()) return;
    relayout(true);
    if (!iv.length) return;
    const y = sy();
    const ae = document.activeElement as HTMLElement | null;
    if (ae && ae !== document.body && ae.closest(SEL) && performance.now() - focusT < 1500) {
      const k = zoneOf(ae); // keep the focused element in view
      const { a, b } = iv[k];
      const y1 = a === b ? a : clamp(Math.round(ae.getBoundingClientRect().top + y - VH() * 0.3), a, b);
      glide(y1, { kind: 'settle', v: 0, dur: 520, m0: 0, to: k });
      return;
    }
    settle(nearest(y), 0);
  }
  /* Re-measure after any layout change and keep the page where it was within its section.
     The place is taken from the engine's own last write: the browser may already have shifted scrollY. */
  function relayout(keepY = false) {
    if (!NAV) return;
    if ((g || anim || extPending) && !keepY) {
      dirty = true;
      return;
    }
    const k = Math.min(cur, Math.max(0, iv.length - 1));
    const rel = iv.length ? (Number.isFinite(wrote) ? wrote : sy()) - iv[k].a : 0;
    measure();
    if (!iv.length || keepY) return;
    const t = Math.min(k, iv.length - 1);
    cur = t;
    const y1 = clamp(iv[t].a + rel, iv[t].a, iv[t].b);
    if (Math.abs(y1 - sy()) > 0.5) setY(y1);
  }
  function onResize() {
    if (!NAV) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ae = document.activeElement;
    const typing = !!ae?.matches('input, textarea, select');
    if (w === lastW && (h === lastH || typing)) return; // soft keyboard or nothing: leave the layout alone
    lastW = w;
    lastH = h;
    const A = anim;
    setVh();
    const k = A && A.to != null ? A.to : cur;
    const rel = iv.length ? (Number.isFinite(wrote) ? wrote : sy()) - iv[Math.min(k, iv.length - 1)].a : 0;
    anim = null;
    measure();
    if (!iv.length) return;
    cur = Math.min(k, iv.length - 1);
    const y1 = A && A.kind === 'nav' && A.from != null ? land(cur, A.from) : clamp(iv[cur].a + rel, iv[cur].a, iv[cur].b);
    setY(y1); // turned or resized: the same section, aligned, at once
  }

  /* ── The frame loop: runs only while something moves ─────── */
  function frame() {
    if (navStep()) raf = requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    if (running || destroyed) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  /* Web fonts, images and late data change section heights: re-measure, keep the place. */
  let roFirst = true;
  function observe(els: HTMLElement[]) {
    if (!ro) return;
    const next = new Set<Element>([document.body, ...els]);
    observed.forEach((el) => {
      if (!next.has(el)) ro?.unobserve(el);
    });
    next.forEach((el) => {
      if (!observed.has(el)) ro?.observe(el);
    });
    observed = next;
  }
  const onRO = () => {
    if (roFirst) {
      roFirst = false;
      return;
    }
    relayout();
  };
  const onLoad = () => relayout();
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) relayout();
  };
  const onMouseDown = () => {
    mouseDown = true;
  };
  const onMouseUp = () => {
    mouseDown = false;
  };
  const onFocusIn = () => {
    focusT = performance.now();
  };

  const nonPassive: AddEventListenerOptions = { passive: false };
  const passive: AddEventListenerOptions = { passive: true };

  function navOn(first: boolean) {
    NAV = true;
    html.classList.add('snapnav');
    if ('scrollRestoration' in history) {
      prevRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
    }
    lastW = window.innerWidth;
    lastH = window.innerHeight;
    setVh();
    if ('ResizeObserver' in window) {
      roFirst = true;
      observed = new Set();
      ro = new ResizeObserver(onRO);
    }
    document.addEventListener('touchstart', tStart, passive);
    document.addEventListener('touchmove', tMove, nonPassive);
    document.addEventListener('touchend', tEnd, passive);
    document.addEventListener('touchcancel', tEnd, passive);
    window.addEventListener('wheel', wheel, nonPassive);
    document.addEventListener('keydown', key);
    window.addEventListener('click', onClick, true);
    window.addEventListener('scroll', onScroll, passive);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('load', onLoad);
    window.addEventListener('pageshow', onPageShow);
    document.fonts?.ready.then(() => relayout());

    measure();
    if (!iv.length) return;
    const h0 =
      first && location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (h0 && h0.closest(SEL)) {
      cur = zoneOf(h0);
      setY(iv[cur].a);
    } else if (first) {
      cur = nearest(sy());
      setY(clamp(sy(), iv[cur].a, iv[cur].b));
    } else {
      cur = nearest(sy());
      settle(cur, 0);
    }
    warm(cur);
  }
  function navOff() {
    // back to plain native scrolling
    NAV = false;
    anim = null;
    g = null;
    wg = null;
    extPending = false;
    clearTimeout(extT);
    cancelAnimationFrame(raf);
    running = false;
    html.classList.remove('snapnav');
    html.style.removeProperty('--vh');
    if (prevRestoration && 'scrollRestoration' in history) history.scrollRestoration = prevRestoration;
    prevRestoration = null;
    ro?.disconnect();
    ro = null;
    observed = new Set();
    document.removeEventListener('touchstart', tStart, passive);
    document.removeEventListener('touchmove', tMove, nonPassive);
    document.removeEventListener('touchend', tEnd, passive);
    document.removeEventListener('touchcancel', tEnd, passive);
    window.removeEventListener('wheel', wheel, nonPassive);
    document.removeEventListener('keydown', key);
    window.removeEventListener('click', onClick, true);
    window.removeEventListener('scroll', onScroll, passive);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('focusin', onFocusIn);
    window.removeEventListener('load', onLoad);
    window.removeEventListener('pageshow', onPageShow);
  }

  // a tablet gains a mouse, devtools switches device mode, or motion is turned off: follow it
  const flip = () => {
    const on = want();
    if (on !== NAV) {
      if (on) navOn(false);
      else navOff();
    }
  };
  touchMq.addEventListener('change', flip);
  reduceMq.addEventListener('change', flip);
  if (want()) navOn(true);

  type NavDebug = {
    iv: () => [number, number, string][];
    cur: () => number;
    busy: () => boolean;
    kind: () => string | null;
    on: () => boolean;
    release: () => unknown;
    frames: [number, number, string][];
  };
  const w = window as unknown as { __nav?: NavDebug };
  if (DEBUG) {
    w.__nav = {
      iv: () => iv.map((v) => [v.a, v.b, v.els.map((el) => el.id || el.dataset.section || el.tagName.toLowerCase()).join('+')]),
      cur: () => cur,
      busy: () => !!(anim || g),
      kind: () => (anim ? anim.kind : null),
      on: () => NAV,
      release: () => dbg.release,
      frames: dbg.frames,
    };
  }

  return {
    goTo,
    get active() {
      return NAV;
    },
    destroy() {
      if (destroyed) return;
      if (NAV) navOff();
      destroyed = true;
      touchMq.removeEventListener('change', flip);
      reduceMq.removeEventListener('change', flip);
      if (DEBUG) delete w.__nav;
    },
  };
}

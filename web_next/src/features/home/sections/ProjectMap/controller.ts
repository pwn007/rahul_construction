import { camPath, boxAt, scaleBox, type CamPath, type ViewBox } from './camera';
import { clamp, curveAt, ramp, type Curve } from './curves';
import { EASES, easeInOutPow } from './ease';
import { Scrub } from './scrub';
import { applyState, buildReveal, forget, timed, type Move, type State, type Timeline } from './timeline';

/**
 * The project map's engine — a port of the precinct map on
 * residences.loamhouse.com.au (`map.js`, and the map part of `editorial.js`),
 * the client's benchmark (Oct 2026).
 *
 * One camera: the SVG's viewBox. Every place is a target with a parent — the
 * rest view (every project), the zoom-out (the region), and one per project:
 * the viewBox in which that project's dot fills the screen. Moving is flying
 * the camera along a Van Wijk path; everything else — dot sizes, the lens that
 * opens the photograph, what fades and when — is a function of the camera's
 * width, recomputed every frame by `render()`.
 *
 * React draws the structure once (index.tsx). This writes attributes, styles
 * and CSS variables directly, on one animation frame, and never re-renders.
 *
 * ── Loam units ──────────────────────────────────────────────────────────────
 * The benchmark's numbers (marker sizes, fades, the fill width) are in its own
 * map units, in which its rest view is 117 wide (94 on a phone, which it frames
 * 0.8× closer). This map is in metres, so every one of them is compared against
 * `wL = width / U`, where U = this rest width ÷ 117: the same picture at the
 * same moment of every flight, at any size. The flight's length S is in log
 * units and needs no conversion, so the durations come out the same too.
 */

/* ── The benchmark's constants (map.js, editorial.js `MAP_T`, tuned there 2 Sep 2026) ── */
const LOAM_REST = 117;
const MOB_ZOOM = 0.8;
/** Camera width (Loam units) at which a dot truly covers the viewport. */
const FILL_W = 0.88;
const MAX_SPIN = 4;
const HALO_FADE_W = 40;
const AMENITY: Curve = [[500, 1.5], [80, 24], [0.88, 1600]];
const STATION: Curve = [[2000, 6], [500, 6], [80, 3]];
const DIVE_DUR = 1.6;
const DIVE_POW = 4;
const PHOTO_IN = 2;
const PHOTO_OUT = 22;
const PHOTO_CURVE = 1.3;
/** ms before landing that the copy starts. */
const TEXT_LEAD = 600;
const TEXT_SPEED = 2;
const CAM_DIST = 2.4;
const CAM_ROT = 15;
const SCRUB_MS = 6000;
/** The band's scroll range, as the benchmark's ScrollTrigger: 'top 85%' → 'top -85%'. */
const BAND = 0.85;
const T = { dotsAt: 3.333, dotsDur: 7.333, dotsStag: 0.333, dotsTravel: 0.4, dotsOut: 1, chromeAt: 9.167, noteAt: 8.333, noteDur: 2 };

/* ── This map's own ── */
/** The zoom-out: the benchmark's goes from a building to its suburb; ours from the projects to the region. */
const AREA_FACTOR = 2.5;
/** Local radius of a dot's core (the benchmark's DOT_R): everything in a dot is drawn about it. */
const DOT_R = 10;
/** Station marker radius in the art (metres). */
const STATION_R = 90;
/** Road widths: [real metres, floor in screen px]. */
const STROKES: Record<string, [number, number]> = {
  minor: [7, 0.5],
  tertiary: [12, 0.8],
  secondary: [18, 1.1],
  primary: [24, 1.6],
  trunk: [30, 2.0],
  ring: [30, 2.2],
  rail: [10, 1.0],
  metro: [10, 1.2],
  river: [24, 1.0],
  runway: [45, 1.5],
};
/** Declutter: at rest no two dots closer than this many radii; the spread is gone by the time a dive gets close. */
const SPREAD = 2.3;
const SPREAD_GONE = [35, 82] as const;

export interface MapDot {
  slug: string;
  /** Frame metres (lib/geo `projectCity`). */
  x: number;
  y: number;
  photo: string;
}

export interface MapOptions {
  dots: MapDot[];
  artUrl: string;
  reduced: boolean;
  /** The project whose photograph and panel are open, or null. */
  onActive?: (slug: string | null) => void;
  /** 'rest' or 'area' — the journey button's label. */
  onMode?: (mode: 'rest' | 'area') => void;
  /** Hover / focus whisper: the dot's name, or null. */
  onWhisper?: (slug: string | null) => void;
  /** A project's panel has started to come up. */
  onPanel?: (slug: string) => void;
}

export interface ProjectMapController {
  flyTo(id: string): void;
  back(): void;
  journey(): void;
  isDived(): boolean;
  isVisible(): boolean;
  focus(): string;
  destroy(): void;
}

type Focus = 'rest' | 'area' | string;
const isGecko = () => typeof CSS !== 'undefined' && CSS.supports('-moz-appearance', 'none');
let artCache: Promise<string> | null = null;
const loadArt = (url: string) => (artCache ??= fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`map art ${r.status}`)))));

export function createProjectMap(root: HTMLElement, opts: MapOptions): ProjectMapController {
  const $ = <E extends Element>(sel: string) => root.querySelector<E>(sel);
  const stage = $<HTMLElement>('[data-map-stage]')!;
  const svg = $<SVGSVGElement>('[data-map-svg]')!;
  const defs = $<SVGDefsElement>('[data-map-defs]')!;
  const spinG = $<SVGGElement>('[data-map-spin]')!;
  const artG = $<SVGGElement>('[data-map-art]')!;
  const dotsG = $<SVGGElement>('[data-map-dots]')!;
  const photo = $<HTMLElement>('[data-map-photo]')!;
  const photoImg = photo.querySelector('img')!;
  const note = $<HTMLElement>('[data-map-note]')!;
  const nav = $<HTMLElement>('[data-map-nav]')!;
  const navIn = $<HTMLElement>('[data-map-nav-in]')!;
  const credit = $<HTMLElement>('[data-map-credit]');
  const content = $<HTMLElement>('[data-map-content]')!;

  const dots = opts.dots.map((d) => {
    const g = dotsG.querySelector<SVGGElement>(`[data-slug="${CSS.escape(d.slug)}"]`)!;
    return { ...d, g, reveal: g.querySelector<SVGGElement>('.dot-reveal')!, off: [0, 0] as [number, number] };
  });
  const bySlug = new Map(dots.map((d) => [d.slug, d]));
  const isDot = (id: Focus | null): id is string => id != null && bySlug.has(id);

  /* ── state ── */
  let W = 1, H = 1, phone = false;
  let rest: ViewBox = [0, 0, 1, 1];
  let area: ViewBox = [0, 0, 1, 1];
  let far: ViewBox = [0, 0, 1, 1];
  let U = 1;
  let camVB: ViewBox = [0, 0, 1, 1];
  let focus: Focus = 'rest';
  let active: string | null = null;
  let spinAng = 0;
  let entryOwned = true;
  let visible = false;
  let raf = 0;
  let destroyed = false;
  let flight: null | { t0: number; dur: number; path: CamPath; dotMove: boolean; spin: number; prevLW: number | null; prevT: number } = null;
  let panelTimer = 0;
  let panelAnim: null | { tl: Timeline; t0: number; els: Element[]; slug: string; out: boolean; last: Map<number, State> } = null;
  let panelOpen: string | null = null;
  let openPhoto: { x: number; y: number } | null = null;
  let stations: { g: SVGGElement; x: number; y: number }[] = [];
  let patches: { g: SVGGElement; x: number; y: number; r: number }[] = [];
  let labelsNear: SVGElement[] = [];
  const vars = new Map<string, string>();

  /* ── entry (scroll-linked reveal) ── */
  const scrub = new Scrub(SCRUB_MS);
  let reveal: ReturnType<typeof buildReveal> | null = null;
  let revealEls: { el: Element; svg: boolean }[] = [];
  let entryPath: CamPath | null = null;
  let lastBeat = -1;

  /**
   * A CSS variable, written only when it changes: a variable restyles everything under the element it is
   * set on, so each lives as low as it can (the dots' on the dots, the art's on the SVG).
   */
  /** An inline style property, written only when it changes. */
  const styles = new WeakMap<Element, Map<string, string>>();
  const setStyle = (el: HTMLElement | SVGElement, k: 'opacity' | 'pointerEvents' | 'display' | 'clipPath' | 'filter', v: string) => {
    let m = styles.get(el);
    if (!m) styles.set(el, (m = new Map()));
    if (m.get(k) === v) return;
    m.set(k, v);
    el.style[k] = v;
  };
  const setVar = (el: HTMLElement | SVGElement, k: string, v: string) => {
    const key = `${el === svg ? 's' : el === dotsG ? 'd' : 'r'}${k}`;
    if (vars.get(key) === v) return;
    vars.set(key, v);
    el.style.setProperty(k, v);
  };

  /* ── layout: targets, U, declutter ── */
  function layout() {
    W = Math.max(1, stage.clientWidth);
    H = Math.max(1, stage.clientHeight);
    phone = W <= 800;
    const aspect = H / W;
    // where the dots go on screen: right of the note on a wide screen, under it on a phone
    const navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 76;
    let rx0: number, rx1: number, ry0: number, ry1: number;
    if (!phone) {
      rx0 = 0.47 * W; rx1 = 0.93 * W; ry0 = navH + 40; ry1 = H - 130;
    } else {
      const inner = note.querySelector<HTMLElement>('.chapter__inner') ?? note;
      const bottom = inner.offsetTop + inner.offsetHeight + note.offsetTop;
      // down to just above the journey button (44 px, 24 px off the foot)
      rx0 = 16; rx1 = W - 16; ry0 = Math.min(bottom + 16, H * 0.6); ry1 = H - 84;
    }
    const PAD = phone ? 22 : 30;
    const xs = dots.map((d) => d.x), ys = dots.map((d) => d.y);
    const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
    const bw = Math.max(2000, bx1 - bx0), bh = Math.max(2000, by1 - by0);
    const s = Math.max(bw / Math.max(40, rx1 - rx0 - 2 * PAD), bh / Math.max(40, ry1 - ry0 - 2 * PAD)); // metres per px
    const w = W * s;
    const cx = (bx0 + bx1) / 2 - ((rx0 + rx1) / 2 - W / 2) * s;
    const cy = (by0 + by1) / 2 - ((ry0 + ry1) / 2 - H / 2) * s;
    rest = boxAt(cx, cy, w, aspect);
    area = scaleBox(rest, AREA_FACTOR);
    far = scaleBox(rest, CAM_DIST);
    U = w / (phone ? LOAM_REST * MOB_ZOOM : LOAM_REST);
    entryPath = camPath(far, rest);
    // labels are sized to read at rest: px → metres at the rest view
    setVar(svg, '--map-upx', (w / W).toFixed(3));
    declutter();
    buildEntry();
  }

  /** Spread dots that sit on top of each other at rest (two projects 800 m apart are 12 px apart on a phone). */
  function declutter() {
    const s = W / rest[2];
    const R = curveAt(AMENITY, rest[2] / U) * Math.sqrt(Math.min(W, H) / 800);
    const min = SPREAD * R;
    const p = dots.map((d) => [(d.x - rest[0]) * s, (d.y - rest[1]) * s]);
    const o = p.map((q) => q.slice());
    for (let it = 0; it < 60; it++) {
      let moved = false;
      for (let i = 0; i < p.length; i++)
        for (let j = i + 1; j < p.length; j++) {
          let dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
          let d = Math.hypot(dx, dy);
          if (d >= min) continue;
          if (d < 0.01) { dx = Math.cos(i + j); dy = Math.sin(i + j); d = 1; }
          const push = (min - d) / 2 + 0.01;
          p[i][0] -= (dx / d) * push; p[i][1] -= (dy / d) * push;
          p[j][0] += (dx / d) * push; p[j][1] += (dy / d) * push;
          moved = true;
        }
      if (!moved) break;
    }
    dots.forEach((d, i) => (d.off = [p[i][0] - o[i][0], p[i][1] - o[i][1]]));
  }

  const target = (id: Focus): ViewBox => {
    if (id === 'rest') return rest;
    if (id === 'area') return area;
    const d = bySlug.get(id)!;
    return boxAt(d.x, d.y, FILL_W * U, 1);
  };
  const parentOf = (id: Focus): Focus | null => (id === 'area' ? null : id === 'rest' ? 'area' : 'rest');

  /* ── the entry: the benchmark's chapter reveal and camera, driven by the band's scroll position ── */
  function buildEntry() {
    const lines = Array.from(note.querySelectorAll<HTMLElement>('.chapter-title .ln'));
    const eyebrow = note.querySelector<HTMLElement>('.chapter-eyebrow');
    const lede = note.querySelector<HTMLElement>('.chapter-lede');
    const links = note.querySelector<HTMLElement>('.chapter-links');
    const els: { el: Element; svg: boolean }[] = [];
    const idx = (el: Element | null, isSvg = false) => (el ? els.push({ el, svg: isSvg }) - 1 : -1);
    const dotIdx = dots.map((d) => idx(d.reveal, true));
    const lineIdx = lines.map((l) => idx(l));
    const ebIdx = idx(eyebrow), ledeIdx = idx(lede), linksIdx = idx(links), chromeIdx = idx(navIn);
    const dir = (k: number) => (i: number) => (i % 2 ? 1 : -1) * W * k;
    const nk = T.noteDur;
    const moves: Move[] = [
      { els: dotIdx, from: { x: dir(T.dotsTravel), opacity: 0 }, dur: T.dotsDur, ease: 'sine.inOut', at: T.dotsAt, stagger: T.dotsStag, outAt: T.dotsOut },
      { els: lineIdx, from: { x: dir(0.28), opacity: 0 }, dur: 4.4 * nk, ease: 'power3.out', at: T.noteAt },
      { els: lineIdx, from: { blur: 22 }, dur: 4.5 * nk, ease: 'power1.out', at: T.noteAt },
    ];
    if (ebIdx >= 0) moves.push(
      { els: [ebIdx], from: { x: 220, opacity: 0 }, dur: 1.8 * nk, ease: 'power3.out', at: T.noteAt + 1.5 * nk },
      { els: [ebIdx], from: { blur: 9 }, dur: 2.2 * nk, ease: 'power1.out', at: T.noteAt + 1.5 * nk },
    );
    // the lede, and (ours, not the benchmark's) the "All projects" link right behind it
    const ledeEls = [ledeIdx, linksIdx].filter((i) => i >= 0);
    if (ledeEls.length) moves.push(
      { els: ledeEls, from: { y: 46, opacity: 0 }, dur: 2.2 * nk, ease: 'power2.out', at: T.noteAt + 1.7 * nk, stagger: 0.15 },
      { els: ledeEls, from: { blur: 7 }, dur: 2.6 * nk, ease: 'power1.out', at: T.noteAt + 1.7 * nk, stagger: 0.15 },
    );
    moves.push({ els: [chromeIdx], from: { opacity: 0, blur: 8 }, dur: 3, ease: 'power2.out', at: T.chromeAt });
    // a phone gets no animated blur: iOS Safari pops a blur that resolves while the page scrolls (the benchmark found the same)
    const useMoves = phone
      ? moves.map((m) => ({ ...m, from: Object.fromEntries(Object.entries(m.from).filter(([k]) => k !== 'blur')) })).filter((m) => Object.keys(m.from).length)
      : moves;
    reveal = buildReveal(useMoves, 0);
    revealEls = els;
    lastBeat = -1;
  }

  /** Where the band's scroll puts the reveal: 0 entering at 85% down the screen, ½ resting at the top, 1 gone. */
  function bandProgress() {
    const vh = window.innerHeight || H;
    const top = root.getBoundingClientRect().top;
    return clamp((BAND * vh - top) / (2 * BAND * vh), 0, 1);
  }

  function applyEntry(now: number) {
    if (!reveal) return;
    const beat = opts.reduced ? reveal.inEnd : scrub.value(now) * reveal.total;
    if (Math.abs(beat - lastBeat) < 1e-4) return;
    lastBeat = beat;
    const states = reveal.tl.sample(beat);
    revealEls.forEach((r, i) => applyState(r.el, states.get(i) ?? {}, r.svg));
    // the camera rides the same clock: IN over the reveal's first half, mirrored OUT over the second
    if (entryOwned && !flight && !active && entryPath) {
      const t = opts.reduced ? 1 : beat <= reveal.inEnd ? EASES['sine.inOut'](beat / reveal.inEnd) : 1 - EASES['sine.inOut']((beat - reveal.inEnd) / reveal.inEnd);
      camVB = entryPath.at(t);
      spinAng = isGecko() ? 0 : CAM_ROT * (1 - t);
      setVB();
    }
  }

  /* ── camera writes ── */
  function setVB() {
    svg.setAttribute('viewBox', `${camVB[0].toFixed(2)} ${camVB[1].toFixed(2)} ${camVB[2].toFixed(3)} ${camVB[3].toFixed(3)}`);
    // the rotation lives inside the SVG's own paint (#spin), never as a CSS transform on <svg> (benchmark: compositor seams)
    if (!spinAng || Math.abs(spinAng) < 0.05) spinG.removeAttribute('transform');
    else {
      const cx = camVB[0] + camVB[2] / 2, cy = camVB[1] + camVB[3] / 2, s = 1 + 0.03 * Math.abs(spinAng);
      spinG.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${spinAng.toFixed(2)}) scale(${s.toFixed(3)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`);
    }
  }

  /* ── render: every level-of-detail decision, from the camera's width ── */
  let renderKey = '';
  function render(force = false) {
    const key = `${camVB.join(',')}|${spinAng}|${active}|${W}x${H}|${openPhoto ? 1 : 0}|${photoImg.style.visibility}|${entryOwned}`;
    if (!force && key === renderKey) return;
    renderKey = key;
    const [vx, vy, w, h] = camVB;
    const wL = w / U;
    const ppu = Math.max(W / w, H / h); // px per metre (slice fit)
    const dev = Math.sqrt(Math.min(W, H) / 800);
    // The benchmark fades its dots out toward the zoom-out, where its building stands in for them. Here the
    // projects are the point of the context view: once the visitor has the camera, they stay, never under 6 px.
    const own = !entryOwned;
    const dOp = own ? 1 : 1 - ramp(wL, 190, 360);
    const spread = ramp(wL, SPREAD_GONE[0], SPREAD_GONE[1]);
    const rDot = Math.max(curveAt(AMENITY, wL), own ? 6 : 0) * dev;
    const k = rDot / ppu / DOT_R;
    for (const d of dots) {
      const on = d.slug === active;
      const x = d.x + (d.off[0] * spread) / ppu, y = d.y + (d.off[1] * spread) / ppu;
      d.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toPrecision(5)})`);
      setStyle(d.g, 'opacity', on ? '1' : String(+dOp.toFixed(3)));
      setStyle(d.g, 'pointerEvents', !active && dOp > 0.5 ? '' : 'none');
    }
    const pOp = active ? 1 - ramp(wL, FILL_W * 1.3, FILL_W * 2.8) : 0;
    note.classList.toggle('dived', active != null && (isDot(focus) || wL < HALO_FADE_W * 1.5));
    const chromeOp = active && pOp > 0.5 ? '0' : '';
    setStyle(nav, 'opacity', chromeOp);
    if (credit) setStyle(credit, 'opacity', chromeOp);
    dotsG.classList.toggle('diving', wL < HALO_FADE_W);
    // numerals leave early on a dive (benchmark), and on a dot too small to carry them
    setVar(dotsG, '--num-op', (ramp(wL, 12, 45) * ramp(rDot, 7, 10)).toFixed(2));
    setVar(dotsG, '--breath-scale', (1 + 0.2 * ramp(wL, 45, 100)).toFixed(3));

    // the map's own detail
    // a road is its real width, or a floor in screen pixels when zoomed out — in 3% steps, so a flight
    // restyles the art a few dozen times rather than every frame
    const q = (v: number) => Math.exp(Math.round(Math.log(v) / 0.03) * 0.03).toFixed(1);
    for (const [cls, [real, floor]] of Object.entries(STROKES)) setVar(svg, `--sw-${cls}`, q(Math.max(real, floor / ppu)));
    setVar(svg, '--sw-case', q(Math.max(4, 0.7 / ppu)));
    const areaW = area[2];
    const near = 1 - ramp(w, rest[2] * 1.3, rest[2] * 2);
    const farOp = ramp(w, areaW * 0.5, areaW * 0.95);
    setVar(svg, '--lb-near', near.toFixed(3));
    setVar(svg, '--lod-city', (1 - ramp(w, rest[2] * 1.4, rest[2] * 2.2)).toFixed(3));
    setVar(svg, '--lb-far', farOp.toFixed(3));
    svg.classList.toggle('near-off', near <= 0);
    svg.classList.toggle('far-off', farOp <= 0);
    if (stations.length && farOp > 0) {
      const sc = (curveAt(STATION, wL) * dev) / ppu / STATION_R;
      for (const s of stations) s.g.setAttribute('transform', `translate(${s.x} ${s.y}) scale(${sc.toPrecision(4)}) translate(${-s.x} ${-s.y})`);
    }
    const pFade = 1 - ramp(wL, 30, 58);
    for (const p of patches) {
      const inView = p.x + p.r > vx && p.x - p.r < vx + w && p.y + p.r > vy && p.y - p.r < vy + h;
      const show = pFade > 0 && inView;
      setStyle(p.g, 'display', show ? '' : 'none');
      if (show) setStyle(p.g, 'opacity', pFade.toFixed(2));
    }

    // the lens: the open project's photograph, through a circle that rides its dot
    const covered = !!active && rDot >= Math.hypot(W, H) * 0.75;
    svg.classList.toggle('occluded', covered);
    let photoOp = openPhoto ? 1 - ramp(wL, PHOTO_IN, PHOTO_OUT) : 0;
    if (photoOp > 0 && photoOp < 1) photoOp = photoOp ** PHOTO_CURVE;
    if (openPhoto) {
      let mx = openPhoto.x, my = openPhoto.y, r = rDot;
      if (spinAng) {
        const ccx = vx + w / 2, ccy = vy + h / 2, th = (spinAng * Math.PI) / 180, sc = 1 + 0.03 * Math.abs(spinAng);
        const dx = mx - ccx, dy = my - ccy;
        mx = ccx + (dx * Math.cos(th) - dy * Math.sin(th)) * sc;
        my = ccy + (dx * Math.sin(th) + dy * Math.cos(th)) * sc;
        r *= sc;
      }
      const x = (mx - vx) * ppu + (W - w * ppu) / 2;
      const y = (my - vy) * ppu + (H - h * ppu) / 2;
      setStyle(photo, 'clipPath', `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`);
    }
    setStyle(photo, 'opacity', String(covered ? 1 : +photoOp.toFixed(3)));
  }

  /* ── flights ── */
  function flyTo(id: Focus) {
    if (destroyed || !(id === 'rest' || id === 'area' || isDot(id))) return;
    if (entryOwned) {
      // a flight completes the entry: the reveal jumps to where the scroll is, and the camera is the visitor's now
      scrub.finish();
      applyEntry(performance.now());
    }
    entryOwned = false;
    if (panelOpen && panelOpen !== id) panelOut();
    const dotMove = isDot(id) || isDot(focus);
    focus = id;
    if (isDot(id)) setActive(id);
    opts.onMode?.(focus === 'area' ? 'area' : 'rest');
    syncPhoto();
    window.clearTimeout(panelTimer);
    if (opts.reduced) {
      // reduced motion: a cut, the photograph and copy cross-fading in place of the flight
      flight = null;
      camVB = target(id).slice() as ViewBox;
      spinAng = 0;
      setVB();
      if (!isDot(focus)) setActive(null);
      syncPhoto();
      render();
      if (isDot(id)) panelIn(id);
      return;
    }
    const path = camPath(camVB.slice() as ViewBox, target(id));
    const dur = clamp(path.S * 520, 750, 2200) * (dotMove ? DIVE_DUR : 1);
    if (isDot(id)) panelTimer = window.setTimeout(() => focus === id && panelIn(id), Math.max(0, dur - TEXT_LEAD));
    const t0 = performance.now();
    flight = { t0, dur, path, dotMove, spin: dotMove && !isGecko() ? (Math.random() * 2 - 1) * MAX_SPIN : 0, prevLW: null, prevT: t0 };
    kick();
  }

  function stepFlight(now: number) {
    if (!flight) return;
    const f = flight;
    const p = Math.min(1, (now - f.t0) / f.dur);
    const e = f.dotMove ? easeInOutPow(p, DIVE_POW) : EASES['sine.inOut'](p);
    camVB = f.path.at(e);
    const w = camVB[2];
    if (f.dotMove) {
      // no blur on a dive; the sway swings while the map is legible and is gone as the dot fills the frame
      svg.style.filter = '';
      spinAng = f.spin * Math.sin(Math.PI * p) * ramp(w / U, FILL_W * 4, FILL_W * 12);
    } else {
      // a map move: motion blur tied to the speed of the zoom, no rotation
      const lw = Math.log(w);
      if (f.prevLW === null) f.prevLW = lw;
      const dt = Math.max(1, now - f.prevT), vel = Math.abs(lw - f.prevLW) / dt;
      f.prevLW = lw;
      f.prevT = now;
      const blur = Math.min(6, vel * 1400);
      svg.style.filter = p < 1 && blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : '';
      spinAng = 0;
    }
    setVB();
    if (p >= 1) {
      flight = null;
      svg.style.filter = '';
      spinAng = 0;
      setVB();
      if (!isDot(focus)) setActive(null);
      syncPhoto();
    }
  }

  function back() {
    const p = parentOf(focus);
    if (p) flyTo(p);
  }

  function setActive(slug: string | null) {
    if (active === slug) return;
    active = slug;
    opts.onActive?.(slug);
  }

  function syncPhoto() {
    const d = active ? bySlug.get(active) : null;
    if (!d) {
      openPhoto = null;
      return;
    }
    openPhoto = { x: d.x, y: d.y };
    if (photoImg.getAttribute('src') !== d.photo) {
      photoImg.style.visibility = 'hidden';
      photoImg.src = d.photo;
    }
  }
  const onPhotoLoad = () => {
    photoImg.style.visibility = '';
    kick();
  };
  const onPhotoError = () => (photoImg.style.visibility = 'hidden');
  photoImg.addEventListener('load', onPhotoLoad);
  photoImg.addEventListener('error', onPhotoError);

  /* ── the panels: the benchmark's copy performance (destPanelIn / destPanelOut) ── */
  function panelParts(slug: string) {
    const p = content.querySelector<HTMLElement>(`[data-map-panel][data-slug="${CSS.escape(slug)}"]`);
    if (!p) return null;
    splitPanelTitle(p);
    const lines = Array.from(p.querySelectorAll<HTMLElement>('.map-panel__title .pl'));
    const eb = p.querySelector<HTMLElement>('.map-panel__eyebrow')!;
    const body = p.querySelector<HTMLElement>('.map-panel__body')!;
    const lockup = p.querySelector<HTMLElement>('.map-panel__lockup')!;
    return { p, lines, eb, body, lockup };
  }

  function panelIn(slug: string) {
    const parts = panelParts(slug);
    if (!parts) return;
    panelOpen = slug;
    const { p, lines, eb, body, lockup } = parts;
    const els: Element[] = [p, ...lines, eb, body, lockup];
    const L = lines.map((_, i) => i + 1);
    const EB = lines.length + 1, BODY = [EB + 1, EB + 2];
    const dir = (i: number) => (i % 2 ? 1 : -1) * W * 0.28;
    p.style.pointerEvents = 'auto';
    const tl = opts.reduced
      ? timed(1, [{ els: [0], prop: 'opacity', from: 0, to: 1, at: 0, dur: 0.25, ease: 'power1.out' }])
      : timed(TEXT_SPEED, [
          { els: [0], prop: 'opacity', from: 0, to: 1, at: 0, dur: 0.6, ease: 'power1.out' },
          { els: L, prop: 'x', from: dir, to: 0, at: 0.05, dur: 2.6, ease: 'expo.out' },
          { els: L, prop: 'opacity', from: 0, to: 1, at: 0.05, dur: 2.6, ease: 'expo.out' },
          { els: [EB], prop: 'y', from: 46, to: 0, at: 1.6, dur: 1.82, ease: 'power3.out' },
          { els: [EB], prop: 'opacity', from: 0, to: 1, at: 1.6, dur: 1.82, ease: 'power3.out' },
          { els: BODY, prop: 'y', from: 46, to: 0, at: 1.6, dur: 1.82, ease: 'power3.out', stagger: 0.15 },
          { els: BODY, prop: 'opacity', from: 0, to: 1, at: 1.6, dur: 1.82, ease: 'power3.out', stagger: 0.15 },
          { els: L, prop: 'blur', from: 16, to: 0, at: 0.05, dur: 3.06, ease: 'power1.out' },
          { els: [EB], prop: 'blur', from: 9, to: 0, at: 1.6, dur: 2.9, ease: 'power1.out' },
          { els: BODY, prop: 'blur', from: 9, to: 0, at: 1.6, dur: 2.9, ease: 'power1.out', stagger: 0.15 },
        ]);
    panelAnim = { tl, t0: performance.now(), els, slug, out: false, last: new Map() };
    opts.onPanel?.(slug);
    kick();
  }

  function panelOut() {
    if (!panelOpen) return;
    const slug = panelOpen;
    panelOpen = null;
    const parts = panelParts(slug);
    if (!parts) return;
    const { p, lines, eb, body, lockup } = parts;
    p.style.pointerEvents = 'none';
    const els: Element[] = [p, ...lines, eb, body, lockup];
    // an exit starts from wherever the entrance had got to (GSAP `.to()`)
    const was = panelAnim && panelAnim.slug === slug ? panelAnim.last : new Map<number, State>();
    const cur = (i: number, prop: keyof State, dflt: number) => was.get(i)?.[prop] ?? dflt;
    const L = lines.map((_, i) => i + 1);
    const EB = lines.length + 1, BODY = [EB + 1, EB + 2];
    const dir = (i: number) => (i % 2 ? 1 : -1) * W * 0.28;
    const tl = opts.reduced
      ? timed(1, [{ els: [0], prop: 'opacity', from: cur(0, 'opacity', 1), to: 0, at: 0, dur: 0.25, ease: 'power1.in' }])
      : timed(1.5, [
          { els: L, prop: 'x', from: (i) => cur(L[i], 'x', 0), to: dir, at: 0, dur: 1.0, ease: 'power2.out' },
          { els: L, prop: 'opacity', from: (i) => cur(L[i], 'opacity', 1), to: 0, at: 0, dur: 1.0, ease: 'power2.out' },
          { els: [EB], prop: 'y', from: cur(EB, 'y', 0), to: 46, at: 0, dur: 0.6, ease: 'power2.in' },
          { els: [EB], prop: 'opacity', from: cur(EB, 'opacity', 1), to: 0, at: 0, dur: 0.6, ease: 'power2.in' },
          { els: BODY, prop: 'y', from: (i) => cur(BODY[i], 'y', 0), to: -26, at: 0.1, dur: 0.7, ease: 'power2.in', stagger: 0.08 },
          { els: BODY, prop: 'opacity', from: (i) => cur(BODY[i], 'opacity', 1), to: 0, at: 0.1, dur: 0.7, ease: 'power2.in', stagger: 0.08 },
          { els: [0], prop: 'opacity', from: cur(0, 'opacity', 1), to: 0, at: 0.9, dur: 0.35, ease: 'power1.in' },
          { els: L, prop: 'blur', from: (i) => cur(L[i], 'blur', 0), to: 14, at: 0, dur: 0.5, ease: 'power2.out' },
          { els: [EB], prop: 'blur', from: cur(EB, 'blur', 0), to: 9, at: 0, dur: 0.6, ease: 'power2.in' },
          { els: BODY, prop: 'blur', from: (i) => cur(BODY[i], 'blur', 0), to: 7, at: 0.1, dur: 0.7, ease: 'power2.in', stagger: 0.08 },
        ]);
    panelAnim = { tl, t0: performance.now(), els, slug, out: true, last: new Map() };
    kick();
  }

  function stepPanel(now: number) {
    if (!panelAnim) return;
    const a = panelAnim;
    const t = (now - a.t0) / 1000;
    const states = a.tl.sample(t);
    a.els.forEach((el, i) => applyState(el, states.get(i) ?? {}));
    a.last = states;
    if (t >= a.tl.duration) {
      if (a.out) clearPanel(a.els);
      panelAnim = null;
    }
  }

  function clearPanel(els: Element[]) {
    for (const el of els) {
      const st = (el as HTMLElement).style;
      st.transform = st.opacity = st.filter = '';
      forget(el);
    }
  }

  /** Split a panel's title into measured lines once its fonts are in (the benchmark: SplitText at build, behind document.fonts.ready). */
  function splitPanelTitle(p: HTMLElement) {
    const h = p.querySelector<HTMLElement>('.map-panel__title');
    if (!h) return;
    const width = Math.round(h.clientWidth);
    if (h.dataset.splitW === String(width)) return;
    const text = h.dataset.text ?? h.textContent ?? '';
    h.dataset.text = text;
    h.textContent = '';
    const words = text.split(/\s+/).filter(Boolean).map((wd) => {
      const s = document.createElement('span');
      s.textContent = wd;
      s.style.display = 'inline-block';
      h.append(s, ' ');
      return s;
    });
    const rows: string[][] = [];
    let top = -1;
    for (const s of words) {
      if (s.offsetTop !== top) { rows.push([]); top = s.offsetTop; }
      rows[rows.length - 1].push(s.textContent ?? '');
    }
    h.textContent = '';
    rows.forEach((r, i) => {
      const ln = document.createElement('span');
      ln.className = 'pl';
      ln.textContent = r.join(' ');
      h.append(ln);
      if (i < rows.length - 1) h.append(' ');
    });
    h.dataset.splitW = String(width);
  }

  /** Back to rest at once: the band left the screen (a swipe or a scroll while dived). */
  function reset() {
    window.clearTimeout(panelTimer);
    flight = null;
    svg.style.filter = '';
    if (panelAnim) clearPanel(panelAnim.els);
    panelAnim = null;
    if (panelOpen) {
      const parts = panelParts(panelOpen);
      if (parts) { parts.p.style.pointerEvents = 'none'; clearPanel([parts.p, ...parts.lines, parts.eb, parts.body, parts.lockup]); }
    }
    panelOpen = null;
    focus = 'rest';
    setActive(null);
    openPhoto = null;
    entryOwned = true;
    opts.onMode?.('rest');
    camVB = rest.slice() as ViewBox;
    spinAng = 0;
    scrub.snap(bandProgress());
    lastBeat = -1;
    applyEntry(performance.now());
    if (!entryOwned || active) setVB();
    render();
  }

  /* ── the frame ── */
  function frame(now: number) {
    raf = 0;
    if (destroyed) return;
    if (visible) scrub.seek(bandProgress(), now);
    if (debug) {
      frames.push([Math.round(now), +scrub.target.toFixed(4), +scrub.value(now).toFixed(4), Math.round(camVB[2])]);
      if (frames.length > 2000) frames.splice(0, 1000);
    }
    stepFlight(now);
    applyEntry(now);
    stepPanel(now);
    render();
    if (visible || flight || panelAnim) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && !destroyed) raf = requestAnimationFrame(frame);
  }

  /* ── input ── */
  const onDotClick = (e: Event) => {
    const g = (e.target as Element).closest<SVGGElement>('.dot');
    if (!g) return;
    e.stopPropagation();
    flyTo(g.dataset.slug!);
  };
  const onMapClick = () => {
    if (isDot(focus)) back();
  };
  const onContentClick = (e: Event) => {
    if ((e.target as Element).closest('a')) return; // "View project" is a link, not a return
    back();
  };
  const onEnter = (e: Event) => {
    const g = (e.target as Element).closest<SVGGElement>('.dot');
    if (g && !active) opts.onWhisper?.(g.dataset.slug ?? null);
  };
  const onLeave = (e: Event) => {
    if ((e.target as Element).closest('.dot')) opts.onWhisper?.(null);
  };
  dotsG.addEventListener('click', onDotClick);
  dotsG.addEventListener('pointerover', onEnter);
  dotsG.addEventListener('pointerout', onLeave);
  svg.addEventListener('click', onMapClick);
  content.addEventListener('click', onContentClick);

  /* ── observers ── */
  // 1 px in from every edge: a band that only touches the screen's edge (where the section engine parks the
  // band before or after it) counts as gone — an observer otherwise reports edge-adjacent as intersecting
  const io = new IntersectionObserver(
    ([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (!visible && was) reset();
      if (visible) {
        if (!was) scrub.snap(bandProgress());
        kick();
      }
      root.classList.toggle('is-off', !visible);
    },
    { rootMargin: '-1px' },
  );
  io.observe(root);

  // the art and the photographs, fetched only when the band first comes near (benchmark: loadAmenityPhotos)
  const near = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      for (const d of dots) {
        const im = new Image();
        im.decoding = 'async';
        im.src = d.photo;
      }
      loadArt(opts.artUrl)
        .then((text) => !destroyed && inject(text))
        .catch(() => root.classList.add('map-art-failed'));
    },
    { rootMargin: '150% 0px' },
  );
  near.observe(root);

  function inject(text: string) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const art = doc.getElementById('jm-art');
    const srcDefs = doc.querySelector('defs');
    if (!art) return;
    if (srcDefs) for (const n of Array.from(srcDefs.childNodes)) defs.appendChild(document.importNode(n, true));
    artG.replaceChildren(document.importNode(art, true));
    stations = Array.from(artG.querySelectorAll<SVGGElement>('.st')).map((g) => ({ g, x: +g.dataset.x!, y: +g.dataset.y! }));
    patches = Array.from(artG.querySelectorAll<SVGGElement>('.patch')).map((g) => ({ g, x: +g.dataset.x!, y: +g.dataset.y!, r: +g.dataset.r! }));
    labelsNear = Array.from(artG.querySelectorAll<SVGElement>('.lb'));
    root.classList.add('map-art-ready');
    placeLabels();
    render(true);
  }

  /**
   * Hide labels that would collide at rest — with each other, the dots, the copy or the chrome — in priority
   * order (the city, then localities as listed, landmarks, roads, stations, towns). Label sizes are fixed in
   * screen px at rest, so one pass per layout holds at every zoom.
   */
  function placeLabels() {
    if (!labelsNear.length) return;
    // measure with every layer drawable; render() puts the level of detail back
    svg.classList.remove('near-off', 'far-off');
    renderKey = '';
    const s = W / rest[2];
    const toPx = (x: number, y: number) => [(x - rest[0]) * s, (y - rest[1]) * s];
    const taken: [number, number, number, number][] = [];
    const sr = stage.getBoundingClientRect();
    for (const el of [note.querySelector('.chapter__inner'), nav, credit, root.querySelector('.chapter-plate__label')]) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width) taken.push([r.left - sr.left, r.top - sr.top, r.right - sr.left, r.bottom - sr.top]);
    }
    // the site header across the top
    const navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 76;
    taken.push([0, 0, W, navH + 8]);
    const ui = taken.length; // the copy and chrome: obstacles at every framing
    for (const d of dots) {
      const [x, y] = toPx(d.x, d.y);
      const R = 22;
      taken.push([x + d.off[0] - R, y + d.off[1] - R, x + d.off[0] + R, y + d.off[1] + R]);
    }
    const hits = (b: [number, number, number, number]) => taken.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    const PRI = ['lb-city', 'lb-loc', 'lb-mark', 'lb-road', 'lb-station', 'lb-town'];
    // the zoom-out's own labels (and a station's name, which lives in its marker) are judged below, at its framing
    const nearEls = labelsNear.filter((l) => !l.classList.contains('lb-town') && !l.classList.contains('lb-city') && !l.classList.contains('lb-station'));
    nearEls.sort((a, b) => PRI.findIndex((c) => a.classList.contains(c)) - PRI.findIndex((c) => b.classList.contains(c)));
    for (const el of nearEls) {
      el.classList.remove('lb-hidden');
      const t = el as unknown as SVGGraphicsElement;
      let bb: DOMRect;
      try { bb = t.getBBox(); } catch { continue; }
      if (!bb.width) continue;
      // a rotated road name: the box of its rotated corners
      const rot = /rotate\(([-\d.]+)/.exec(el.getAttribute('transform') ?? '');
      const ax = +(el.getAttribute('x') ?? 0), ay = +(el.getAttribute('y') ?? 0);
      const corners = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => {
        if (!rot) return toPx(x, y);
        const th = (+rot[1] * Math.PI) / 180, dx = x - ax, dy = y - ay;
        return toPx(ax + dx * Math.cos(th) - dy * Math.sin(th), ay + dx * Math.sin(th) + dy * Math.cos(th));
      });
      const pad = 4;
      const box: [number, number, number, number] = [
        Math.min(...corners.map((c) => c[0])) - pad, Math.min(...corners.map((c) => c[1])) - pad,
        Math.max(...corners.map((c) => c[0])) + pad, Math.max(...corners.map((c) => c[1])) + pad,
      ];
      const offScreen = box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H;
      if (offScreen) continue; // outside the rest view: no conflict to judge here, and it may be seen when zoomed
      if (hits(box)) el.classList.add('lb-hidden');
      else taken.push(box);
    }

    // The zoom-out's labels — the city, the stations, the towns — judged the same way at its own framing.
    const sA = W / area[2];
    const toPxA = (x: number, y: number) => [(x - area[0]) * sA, (y - area[1]) * sA];
    const takenA = taken.slice(0, ui);
    for (const d of dots) {
      const [x, y] = toPxA(d.x, d.y);
      takenA.push([x - 12, y - 12, x + 12, y + 12]);
    }
    const hitsA = (b: [number, number, number, number]) => takenA.some((t) => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
    const place = (el: Element, box: [number, number, number, number]) => {
      if (box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H) return;
      if (hitsA(box)) el.classList.add('lb-hidden');
      else takenA.push(box);
    };
    const dev = Math.sqrt(Math.min(W, H) / 800);
    const stPx = (curveAt(STATION, area[2] / U) * dev) / STATION_R; // screen px per local unit of a station group
    const farEls = [
      ...labelsNear.filter((l) => l.classList.contains('lb-city')),
      ...stations.map((s) => s.g),
      ...labelsNear.filter((l) => l.classList.contains('lb-town')),
    ];
    for (const el of farEls) {
      el.classList.remove('lb-hidden');
      if (el.classList.contains('st')) {
        const s = stations.find((q) => q.g === el)!;
        const txt = el.querySelector<SVGTextElement>('text');
        let bb: DOMRect | null = null;
        try { bb = txt?.getBBox() ?? null; } catch { bb = null; }
        const [cx, cy] = toPxA(s.x, s.y);
        const r = STATION_R * stPx;
        // the dot, and its name 160 units to the right of it (the text's own CSS offset)
        const x1 = bb ? cx + (bb.x - s.x + 160 + bb.width) * stPx : cx + r;
        const y0 = bb ? cy + (bb.y - s.y) * stPx : cy - r;
        const y1 = bb ? cy + (bb.y + bb.height - s.y) * stPx : cy + r;
        place(el, [cx - r - 3, Math.min(cy - r, y0) - 3, x1 + 3, Math.max(cy + r, y1) + 3]);
        continue;
      }
      let bb: DOMRect;
      try { bb = (el as unknown as SVGGraphicsElement).getBBox(); } catch { continue; }
      if (!bb.width) continue;
      const [x0, y0] = toPxA(bb.x, bb.y);
      const [x1, y1] = toPxA(bb.x + bb.width, bb.y + bb.height);
      place(el, [x0 - 4, y0 - 4, x1 + 4, y1 + 4]);
    }
  }

  const ro = new ResizeObserver(() => {
    const was = [W, H];
    layout();
    if (was[0] === W && was[1] === H) return;
    if (!flight && !active) {
      camVB = (focus === 'area' ? area : rest).slice() as ViewBox;
      lastBeat = -1;
      applyEntry(performance.now());
      setVB();
    }
    placeLabels();
    render(true);
  });

  // fonts change the note's height (and so a phone's rest framing) and the panel titles' lines
  document.fonts?.ready.then(() => {
    if (destroyed) return;
    layout();
    content.querySelectorAll<HTMLElement>('[data-map-panel]').forEach(splitPanelTitle);
    lastBeat = -1;
    placeLabels();
    kick();
  });

  /* ── ?mapdebug: the engine's state for the tests (as the section engine's ?navdebug) ── */
  const debug = typeof location !== 'undefined' && /[?&]mapdebug\b/.test(location.search);
  const frames: [number, number, number, number][] = [];
  if (debug) {
    const w = window as unknown as { __map?: unknown };
    w.__map = {
      cam: () => camVB.slice(),
      rest: () => rest.slice(),
      U: () => U,
      focus: () => focus,
      active: () => active,
      beat: () => lastBeat,
      total: () => reveal?.total,
      inEnd: () => reveal?.inEnd,
      scrub: () => ({ target: scrub.target, value: scrub.value(performance.now()) }),
      progress: bandProgress,
      frames,
    };
  }

  /* ── boot ── */
  layout();
  camVB = rest.slice() as ViewBox;
  scrub.snap(bandProgress());
  applyEntry(performance.now());
  setVB();
  render();
  ro.observe(stage);

  return {
    flyTo,
    back,
    journey() {
      if (isDot(focus)) back();
      else flyTo(focus === 'area' ? 'rest' : 'area');
    },
    isDived: () => isDot(focus),
    isVisible: () => visible,
    focus: () => focus,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(panelTimer);
      io.disconnect();
      near.disconnect();
      ro.disconnect();
      dotsG.removeEventListener('click', onDotClick);
      dotsG.removeEventListener('pointerover', onEnter);
      dotsG.removeEventListener('pointerout', onLeave);
      svg.removeEventListener('click', onMapClick);
      content.removeEventListener('click', onContentClick);
      photoImg.removeEventListener('load', onPhotoLoad);
      photoImg.removeEventListener('error', onPhotoError);
    },
  };
}

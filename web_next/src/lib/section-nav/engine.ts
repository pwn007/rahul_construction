/**
 * Section navigation: one section per swipe on phones and tablets.
 *
 * Ported from the finalized design's prototype (proto2/app.js, "Section
 * navigation"), and since 11 Oct 2026 timed against the benchmark the client
 * named, Loam House's own mobile chapter navigation
 * (residences.loamhouse.com.au, editorial.js `touchNav`, read 11 Oct 2026:
 * GSAP Observer, drag 1:1, release → project the flick 0.25 s ahead → nearest
 * chapter, any flick over 250 px/s advances one; glide power3.out matched to
 * the release speed, at least 0.7 s, or sine.out 1.3 s per screen when the hand
 * is too slow to carry the distance). What it does:
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
 * - on release, Loam's rule decides: a flick faster than 250 px/s goes on;
 *   otherwise the page goes to whichever rest point the release would coast
 *   nearer to (half way, after a 0.25 s throw) — next, previous or back home,
 *   never anything in between, and never more than one section;
 * - every move is Loam's glide: a quartic ease-out ("power3.out") that leaves
 *   at the finger's speed and lands at rest over 0.7–1.6 s, or, when the hand
 *   was too slow to carry the distance, Loam's soft step (sine ease-out, 1.3 s
 *   per screen);
 * - a new gesture during a glide can reverse it or carry on one more section;
 *   a tap lets it finish — and, as with a native fling, is not a click: the
 *   link that happened to be passing under the finger does not open;
 * - sections taller than the screen scroll freely inside, with their own
 *   inertia, and hand over only from their edge;
 * - wheel: one section per wheel gesture, a trackpad's inertia tail absorbed;
 *   keys likewise.
 *
 * Where it parts from Loam, on purpose: a swipe never travels more than one
 * section (Loam's projection can skip one on a hard flick; the client asked for
 * one section per swipe); a section taller than the screen scrolls inside
 * (Loam has none on phones); a flick back after dragging forward comes home
 * rather than going to the previous section; pinch-zoom stays (Loam's
 * `touch-action: none` blocks it); and the page itself scrolls — Loam also
 * runs ScrollSmoother, which moves its content with a transform.
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
 *
 * And they are positions in the flow. Chapters in a stack
 * (components/chapter/ChapterStack.tsx) are `position: sticky`, and a stuck box
 * reports where it is stuck — every chapter of a stack the page has passed
 * would read as sitting at the same place. Stops are read through `inFlow`,
 * which unsticks them for the length of the read.
 *
 * ── Where the page is ────────────────────────────────────────────────────────
 * While the engine moves the page it trusts the position it last wrote, not
 * `window.scrollY`. On iPhones (WKWebView — Safari and Chrome alike) a
 * programmatic scroll reaches `scrollY` a frame or two late. The first port
 * compared the two to tell its own scrolls from anyone else's; on an iPhone
 * every glide looked like someone else's scroll once it moved more than 2px a
 * frame, so it stopped itself, restarted 160 ms later from rest, stopped again —
 * the page crept a few pixels every quarter second for seconds instead of
 * gliding, and a swipe that should have gone on fell back (client's screen
 * recording, 11 Oct 2026). Now:
 * - `here()` is the engine's own last write while it is in charge, and the
 *   browser's position only after someone else has moved the page;
 * - scroll events during a glide or a drag are never "someone else";
 * - a scroll event shortly after the engine's last write is that write arriving
 *   late; if the page is still not where the engine left it once that window
 *   has passed, it is treated as someone else's scroll and tidied.
 * The tests reproduce the iPhone by delaying `scrollTo` by two frames.
 *
 * ── The browser's bars ───────────────────────────────────────────────────────
 * A phone's browser (Safari and Chrome on an iPhone, Chrome on Android) folds
 * its address bar and toolbar away only for a scroll the finger made itself.
 * The engine's scroll is a script's, so on this page the bars stayed out for
 * the whole visit while every other page put them away on the first swipe
 * (client's screen recording, 26 Oct 2026). No API hides them.
 *
 * So while the bars are out and the page rests on the first section, the next
 * swipe is handed to the browser (`armed`, html.snapnav-native in globals.css):
 * the page takes the browser's own pans, and a mandatory scroll-snap with
 * `scroll-snap-stop: always` on two empty boxes the engine places at the first
 * two stops lands it on the second, never further, or back home after a short
 * drag. The bars fold as it goes. If the screen grows meanwhile, the sections
 * take the new height at once and the boxes move with the stop. Every later
 * swipe is the engine's, as before. Boxes of its own, not the sections: a stop
 * inside anything that clips is snapped by that box, not by the page (27 Oct
 * 2026, the About band's stop sat in one and every handed swipe went home). And
 * should the browser ever put a long handed swipe back home anyway, handing
 * over stops for good and the page goes where the swipe meant to.
 *
 * Whether the bars are out: the tallest inner height seen at this width, or the
 * large viewport (`100lvh`) where the browser reports it, against the height
 * now. With neither yet known, a phone hands over its first swipe once and
 * learns from it; a browser with no bars to fold (an iPad, a home-screen app)
 * is then left alone. That first swipe moves on the browser's snap curve, not
 * Loam's glide. Only from the first section: elsewhere the page is mid-story
 * and keeps the engine's feel, so a visit that starts lower down (a link to a
 * section, the back button) keeps the bars until it passes the top again.
 *
 * ── The stage ────────────────────────────────────────────────────────────────
 * `stage: true` (the page's `?navstage=1` until it has been compared on an
 * iPhone) changes one thing: what moves the page. Not the scroll position —
 * a transform, as on Loam, whose content sits in a fixed wrapper that
 * ScrollSmoother slides while its real scroll moves nothing on screen.
 *
 * Why: measured against Loam on 11 Oct 2026, this page is the lighter of the
 * two (under 4 ms of main thread a frame at six times slower CPU, no dropped
 * frames) and still the less smooth on an iPhone, in the drag, the glide and
 * the stop. The whole difference is this last step. A scroll position is a
 * whole number of CSS pixels — three device pixels on an iPhone — so the slow
 * tail of the glide ticks 1, 1, 0, 1 where a transform draws 0.9, 0.4, 0.1;
 * and a scroll position written from script reaches an iPhone's screen by way
 * of its UI process, a frame or two late and unevenly (see above), worst while
 * a finger is down. A transform takes neither road.
 *
 * With the stage up (`html.snapnav-stage`, globals.css):
 * - `[data-nav-stage]` is fixed over the screen and `[data-nav-surface]`, the
 *   page's content inside it, is what `setY` moves — to the exact position,
 *   fractions and all;
 * - the body is given the surface's height and the real scroll position
 *   follows every move, rounded, moving nothing: the header's hide-on-scroll,
 *   the progress bar and the hero's scroll-linked exit all still read it;
 * - a scroll from outside (find-in-page, the status-bar tap, assistive tech)
 *   is copied onto the stage as it happens, then tidied as before;
 * - `position: sticky` has nothing to stick to inside a fixed box, so the
 *   engine holds those boxes itself (`pins`): each is shifted by exactly what
 *   sticky would have shifted it, from the same inset and the same bounds.
 * Zones, gestures and timing are the same code either way. With the engine off
 * (a mouse, reduced motion) the wrappers are plain boxes and the page is as
 * it always was.
 */

type Zone = { a: number; b: number; els: HTMLElement[] };

type Ease = 'quart' | 'sine';
type Glide = {
  kind: 'nav' | 'settle';
  y0: number;
  y1: number;
  t0: number;
  dur: number;
  ease: Ease;
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
  /** Handed to the browser on purpose, so its bars fold (see "The browser's bars"). */
  handed: boolean;
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
  /** Exposes `window.__nav` for the tests, and puts the meter on screen (the page's `?navdebug`). */
  debug?: boolean;
  /**
   * Move the page with a transform instead of the scroll position — see "The stage". Needs the content
   * inside `[data-nav-stage] > [data-nav-surface]`; without them it is ignored.
   */
  stage?: boolean;
  /** The `position: sticky` boxes inside the surface, which the stage has to hold itself. */
  sticky?: string;
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

/* Loam House's mobile numbers (editorial.js: NAV_DUR, NAV_EASE, SETTLE_*, touchCoast, touchThrow). */
const THROW = 0.25; // px/ms (250 px/s): a release this fast always goes on, in its direction
const PROJECT = 250; // ms (0.25 s): how far ahead a release is projected to pick the nearer rest point
const SETTLE_MS = 700; // the softest a velocity-matched glide lands
const V0 = 4; // initial slope of the quartic ease-out, so the glide leaves at the release speed
const MAX_MS = 1600; // per screen: past this the hand cannot honestly carry the distance
const NAV_MS = 1300; // the soft step (sine ease-out), per screen of travel
const JUMP_MS = 180; // anchor links: per extra section, up to LINK_MAX_MS
const LINK_MAX_MS = 2200;

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** When the finger was actually there: the event's own time stamp (taken when the touch happened, on the
    performance.now() clock), so a busy main thread that hands over several moves at once — just after
    load, say — does not read as a finger that stopped before letting go. */
const evTime = (e: Event) => {
  const now = performance.now();
  const t = e.timeStamp;
  return t > 0 && t <= now + 1 && now - t < 1000 ? t : now;
};
const elOf = (t: EventTarget | null): Element | null => (t instanceof Element ? t : null);

/** Position 0→1 and its slope, per ease: Loam's power3.out (a quartic) and sine.out. */
const EASE: Record<Ease, (s: number) => number> = {
  quart: (s) => 1 - (1 - s) ** 4,
  sine: (s) => Math.sin((s * Math.PI) / 2),
};
const SLOPE: Record<Ease, (s: number) => number> = {
  quart: (s) => 4 * (1 - s) ** 3,
  sine: (s) => (Math.PI / 2) * Math.cos((s * Math.PI) / 2),
};

/** Distance from the top of the document — or of `root`, an offset parent of `el` — ignoring transforms. */
function pageTop(el: HTMLElement, root: HTMLElement | null = null): number {
  let y = 0;
  for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
}

/** A sticky box the stage holds: where it sits in the flow, its inset, and how far its container lets it go. */
type Pin = { el: HTMLElement; at: number; top: number; max: number; v: number };

/** How far down a box's own transforms draw it: its `transform` (framer's reveals) and its `translate` (the stage's hold). */
function ownShift(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const byTransform = cs.transform && cs.transform !== 'none' ? new DOMMatrixReadOnly(cs.transform).m42 : 0;
  const byTranslate = cs.translate && cs.translate !== 'none' ? parseFloat(cs.translate.split(' ')[1] ?? '0') || 0 : 0;
  return byTransform + byTranslate;
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
  const STAGE = !!opts.stage;
  const STICKY = opts.sticky ?? '.chapter-stack > .chapter, .note-pile > *, .note-band__head, .review-stage';

  const html = document.documentElement;
  const touchMq = window.matchMedia('(hover: none) and (pointer: coarse)');
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const want = () => touchMq.matches && !reduceMq.matches;

  const VH = () => window.innerHeight;
  const sy = () => window.scrollY;
  /** Where the page is: the engine's own last write while it is in charge (see "Where the page is"). */
  const here = () => (!ext && Number.isFinite(wrote) ? wrote : sy());
  const ECHO_MS = 220; // a scroll event this soon after the engine's own write is that write arriving late
  const scroller = () => document.scrollingElement || html;

  let NAV = false;
  let iv: Zone[] = []; // navigable zones: rest at a arriving from above, at b arriving from below (a < b only when taller than the screen)
  let cur = 0; // the zone at rest, or the one being travelled to
  let anim: Anim | null = null; // the running motion
  let wrote = NaN; // the last position this engine wrote
  let wroteT = -1e9; // when
  let ext = true; // someone else moved the page since (or the engine never has): read the browser's position
  let g: Gesture | null = null; // the live touch gesture
  let wg: WheelGesture | null = null; // the live wheel gesture
  let dirty = false; // layout changed mid-motion: re-measure at rest
  let focusT = -1e9;
  let mouseDown = false;
  let extT: ReturnType<typeof setTimeout> | undefined;
  let extPending = false;
  let verT: ReturnType<typeof setTimeout> | undefined;
  let swallowUntil = 0; // a tap that caught a moving page is not a click
  let nativeSwipe: { k: number; y0: number; handed: boolean; moved: number } | null = null; // a swipe the browser scrolled itself (see tidy)
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;
  let prevRestoration: ScrollRestoration | null = null;
  let ro: ResizeObserver | null = null;
  let observed = new Set<Element>();
  let raf = 0;
  let running = false;
  let destroyed = false;
  const dbg: { frames: [number, number, string][]; release: unknown; glide: unknown } = { frames: [], release: null, glide: null };
  let stage: { box: HTMLElement; surface: HTMLElement } | null = null; // while the stage is up
  let pins: Pin[] = [];
  let ghost = NaN; // the scroll position last written to follow the stage
  let stageRO: ResizeObserver | null = null;
  /* The browser's bars (see "The browser's bars"). */
  let armed = false; // html.snapnav-native is up: the next swipe from the first section is the browser's
  let handing = false; // a swipe handed to the browser is under way, until tidy has put the page to rest
  let marks: HTMLElement[] = []; // two empty boxes on the body, at the stops the browser's snap may land on
  let snapBroken = false; // the browser put a long handed swipe back home: its snap is not to be trusted here
  let tallest = 0; // the tallest inner height seen at this width: the screen with the bars away
  let tallW = 0;
  let tried = false; // a swipe has been handed over once: what the bars do is known from here on
  let probe: HTMLElement | null = null; // 100lvh, the large viewport, where the browser reports it
  let mo: MutationObserver | null = null;
  /** Where an element sits: in the document, or on the surface while that is what moves. */
  const topOf = (el: HTMLElement) => pageTop(el, stage?.surface ?? null);

  const stopsNow = () =>
    Array.from(document.querySelectorAll<HTMLElement>(SEL)).filter(
      (el) => !el.parentElement?.closest(SEL) && el.offsetHeight > 0,
    );
  const hdrH = () => (document.querySelector<HTMLElement>(HDR)?.offsetHeight ?? 0);
  /* Read positions with sticky stops (a chapter stack) where the flow puts them, not where they are
     stuck: html.snapnav-measure (globals.css) takes their inset away for the length of the read. The
     class comes and goes inside one task, so nothing of it is ever painted. */
  function inFlow<T>(read: () => T): T {
    html.classList.add('snapnav-measure');
    try {
      return read();
    } finally {
      html.classList.remove('snapnav-measure');
    }
  }

  function setVh() {
    html.style.setProperty('--vh', `${VH() / 100}px`);
  }
  // `behavior: 'instant'` beats the root's `scroll-smooth` even without the html.snapnav rule; a browser
  // that does not know the value throws, and then the plain form is used (snapnav's CSS keeps it instant).
  let instantOK = true;
  /* The stage: put the surface at exactly y, and each sticky box where sticky would have had it. */
  function render(y: number) {
    if (!stage) return;
    stage.surface.style.transform = `translate3d(0,${(-y).toFixed(3)}px,0)`;
    for (const p of pins) {
      const v = clamp(y + p.top - p.at, 0, p.max);
      if (v === p.v) continue;
      p.v = v;
      p.el.style.translate = v ? `0 ${v.toFixed(3)}px` : '';
    }
  }
  function setY(y: number) {
    // the engine moves the page from here: the browser's snap must not take its writes for a scroll of its own
    if (armed) {
      handing = false;
      disarm();
    }
    wrote = y;
    wroteT = performance.now();
    ext = false;
    if (stage) {
      render(y);
      // the real scroll position follows in whole pixels, and only when that changes
      y = Math.round(y);
      if (y === ghost) return;
      ghost = y;
    }
    if (instantOK) {
      try {
        window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior });
        return;
      } catch {
        instantOK = false;
      }
    }
    window.scrollTo(0, y);
  }

  /* ── Zones ─────────────────────────────────────────────────── */
  function measure() {
    const vh = VH();
    // the stage is out of the flow: the page is as long as the surface says
    if (stage) document.body.style.height = `${stage.surface.offsetHeight}px`;
    const maxY = Math.max(0, scroller().scrollHeight - vh);
    // a few px of bottom padding past the screen is not "tall"
    const tol = Math.min(40, vh * 0.06);
    const secs = inFlow(() =>
      stopsNow().map((el) => {
        const top = topOf(el);
        // drawn as one screen (a chapter, the hero): never folded into another stop
        const screen = parseFloat(getComputedStyle(el).minHeight) >= vh - 1;
        return { el, top, bot: top + el.offsetHeight, screen };
      }),
    );
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
    if (stage) {
      pins = pinsNow();
      render(here());
    }
  }
  /* The boxes the stage has to hold. Their insets are read as they stand, sticky; their places with the
     insets gone (inFlow), like the stops'. A box may travel until its foot meets the foot of its
     container's content — sticky's own bound. One that is not sticky just now (a width where it is not,
     a height that has not arrived) is let go.

     Places to the fraction of a pixel, not offsetTop's whole ones: a note in a pile sits at a fraction,
     and a pile held a pixel out of true shows a seam between two notes. So the container is placed by
     layout (which no transform can move), and the box within it by what is drawn — less what the box's
     own transforms add, the one thing it does not share with its container. */
  function pinsNow(): Pin[] {
    const surface = stage!.surface;
    const els = Array.from(surface.querySelectorAll<HTMLElement>(STICKY));
    const tops = els.map((el) => {
      const cs = getComputedStyle(el);
      return cs.position === 'sticky' ? parseFloat(cs.top) : NaN;
    });
    return inFlow(() =>
      els.flatMap((el, i): Pin[] => {
        const box = el.parentElement;
        if (!Number.isFinite(tops[i]) || !box || !el.offsetHeight) {
          if (el.style.translate) el.style.translate = '';
          return [];
        }
        const r = el.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        const cs = getComputedStyle(box);
        const rel = r.top - ownShift(el) - b.top; // from the container's top edge
        const foot = b.height - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
        return [{ el, at: pageTop(box, surface) + rel, top: tops[i], max: Math.max(0, foot - rel - r.height), v: NaN }];
      }),
    );
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
  /* html.snapnav takes pans away from the browser (globals.css) so a swipe is the engine's from its first
     pixel; once the visitor has pinched in, panning the zoomed page is theirs again. */
  const onZoom = () => {
    html.classList.toggle('snapnav-zoom', zoomed());
    arm();
  };

  /* ── The browser's bars ────────────────────────────────────── */
  function seeHeight() {
    const w = window.innerWidth;
    if (w !== tallW) {
      tallW = w; // turned: heights seen the other way round say nothing about this one
      tallest = 0;
    }
    tallest = Math.max(tallest, window.innerHeight);
  }
  const phone = () => Math.min(screen.width, screen.height) < 600;
  function barsOpen(): boolean {
    seeHeight();
    if (Math.max(tallest, probe?.offsetHeight ?? 0) > window.innerHeight + 24) return true; // known to be out
    return !tried && phone(); // not known yet: hand over one swipe and see
  }
  /* The boxes the browser's snap lands on, at the first two stops, in the document's own coordinates: a
     section's box may sit inside something that clips (it then snaps for that, not for the page). */
  function placeMarks() {
    if (!marks.length) {
      marks = [0, 1].map(() => {
        const m = document.createElement('div');
        m.setAttribute('aria-hidden', 'true');
        m.setAttribute('data-nav-snap', '');
        m.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
        document.body.append(m);
        return m;
      });
    }
    marks.forEach((m, i) => {
      const a = iv[i].a;
      m.style.top = `${a}px`;
      const off = m.getBoundingClientRect().top + window.scrollY - a; // a positioned body would shift it
      if (Math.abs(off) > 0.5) m.style.top = `${a - off}px`;
    });
  }
  function disarm() {
    if (!armed) return;
    armed = false;
    html.classList.remove('snapnav-native');
    marks.forEach((m) => m.remove());
    marks = [];
  }
  /* Up only while the page rests on the first section with the bars out; a swipe handed over keeps it up
     until tidy has put the page to rest, since the browser's snap is what lands it. */
  function arm() {
    if (handing) return;
    const on =
      NAV &&
      !stage &&
      !g &&
      !anim &&
      !extPending &&
      !blocked() &&
      !zoomed() &&
      iv.length > 1 &&
      cur === 0 &&
      iv[0].a === iv[0].b &&
      Math.abs(here() - iv[0].a) <= 1 &&
      !snapBroken &&
      barsOpen();
    if (!on) return disarm();
    placeMarks(); // first, so the snap the class turns on finds them where the stops are
    if (armed) return;
    armed = true;
    html.classList.add('snapnav-native');
    if (DEBUG) meterLine(`bars  out (inner ${window.innerHeight}, tallest ${Math.max(tallest, probe?.offsetHeight ?? 0)}): the next swipe is the browser's`);
  }

  /* ── Motion ────────────────────────────────────────────────── */
  function glide(y1: number, o: { kind: 'nav' | 'settle'; dur: number; ease: Ease; from?: number; to?: number }) {
    const y0 = here();
    if (o.to != null) cur = o.to;
    if (Math.abs(y1 - y0) < 0.5) {
      setY(y1);
      anim = null;
      return;
    }
    anim = { kind: o.kind, y0, y1, t0: performance.now(), dur: o.dur, ease: o.ease, from: o.from, to: o.to };
    if (DEBUG) meter.glide = []; // a glide cut short by the next one is not part of it
    if (DEBUG) dbg.glide = { kind: o.kind, ease: o.ease, dur: Math.round(o.dur), from: Math.round(y0), to: Math.round(y1) };
    kick();
  }
  /* Loam's release glide: leave at the hand's speed (v, px/ms, signed) on a quartic ease-out when that
     speed can honestly carry the distance, landing no sooner than 0.7 s; otherwise the soft step. */
  function release(y1: number, v: number, o: { kind: 'nav' | 'settle'; from?: number; to?: number }) {
    const AD = Math.abs(y1 - here());
    const screens = Math.max(1, AD / VH());
    const along = v * Math.sign(y1 - here());
    const dur = along > 0.06 ? (AD * V0) / along : NAV_MS;
    if (dur > MAX_MS * screens) glide(y1, { ...o, dur: NAV_MS * screens, ease: 'sine' });
    else glide(y1, { ...o, dur: Math.max(SETTLE_MS, dur), ease: 'quart' });
  }
  function animSpeed(): number {
    // px/ms, signed
    const A = anim;
    if (!A || A.kind === 'inner') return 0;
    const t = performance.now() - A.t0;
    if (A.kind === 'free') return A.v * Math.exp(-t / COAST_T);
    const s = clamp(t / A.dur);
    return ((A.y1 - A.y0) * SLOPE[A.ease](s)) / A.dur;
  }
  /* `now` is the frame's own time, not the moment this callback got its turn: other callbacks run first
     and take what they take, and a curve read at the later moment is read at an uneven one — an uneven
     step on screen, biggest where the page is fastest. (A glide begins on the clock of the event that
     started it, which can be a hair after the frame's: the clamps below read that as "not started".) */
  function navStep(now: number): boolean {
    const A = anim;
    if (!A) return false;
    const seen = DEBUG ? sy() : 0;
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
      y = done ? A.y1 : A.y0 + (A.y1 - A.y0) * EASE[A.ease](s);
    }
    setY(y);
    if (DEBUG) {
      dbg.frames.push([Math.round(now), +y.toFixed(2), A.kind]);
      if (dbg.frames.length > 2000) dbg.frames.splice(0, 1000);
      meter.glide.push([now, y, performance.now() - now, seen]);
    }
    if (done) {
      anim = null;
      if (DEBUG) meterGlide();
      rested();
    }
    return !done;
  }

  /* ── The meter (debug only): what this phone did, read off this phone ──────
     `?navdebug` writes the last few gestures in the corner of the screen. The numbers are the ones that
     cannot be had from a desk: how long the phone made a finger wait, how many frames of a glide came
     late, and how far behind the browser's own scroll position was running — the last is what the stage
     exists to take off the screen. Reading `scrollY` every frame costs a little, so it is debug's alone. */
  const meter = { drag: [] as number[][], glide: [] as number[][], lines: [] as string[], box: null as HTMLElement | null };
  function meterLine(text: string) {
    meter.lines = [...meter.lines.slice(-3), text];
    if (!meter.box) {
      const box = (meter.box = document.createElement('pre'));
      box.setAttribute('data-nav-meter', '');
      box.style.cssText =
        'position:fixed;left:6px;bottom:6px;z-index:400;margin:0;padding:6px 8px;max-width:calc(100vw - 12px);white-space:pre-wrap;' +
        'font:10px/1.35 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.74);border-radius:6px;pointer-events:none';
      document.body.append(box);
    }
    meter.box.textContent = meter.lines.join('\n');
  }
  /* A drag: [when the finger moved, when the page heard of it]. */
  function meterDrag() {
    const d = meter.drag;
    meter.drag = [];
    if (d.length < 3) return;
    let gap = 0;
    let late = 0;
    d.forEach((m, i) => {
      if (i) gap = Math.max(gap, m[0] - d[i - 1][0]);
      late = Math.max(late, m[1] - m[0]);
    });
    meterLine(`drag  ${d.length} moves, longest wait ${gap.toFixed(0)} ms, heard up to ${late.toFixed(0)} ms late`);
  }
  /* A glide: [frame time, position, how late the callback ran, scrollY as the browser had it before this frame's write]. */
  function meterGlide() {
    const f = meter.glide;
    meter.glide = [];
    if (f.length < 8) return;
    let slow = 0;
    let gap = 0;
    let behind = 0;
    let lag = 0;
    let late = 0;
    for (let i = 1; i < f.length; i++) {
      const dt = f[i][0] - f[i - 1][0];
      if (dt > 20) slow++;
      gap = Math.max(gap, dt);
      const off = Math.abs(f[i][3] - Math.round(f[i - 1][1])); // what it showed against what it had been given
      if (off > 1) behind++;
      lag = Math.max(lag, off);
      late += f[i][2];
    }
    const n = f.length - 1;
    meterLine(
      `glide ${f.length} frames in ${Math.round(f[n][0] - f[0][0])} ms, ${slow} slow (longest ${gap.toFixed(0)} ms), callback ${(late / n).toFixed(1)} ms late\n` +
        `      scrollY behind on ${Math.round((100 * behind) / n)}% (up to ${lag.toFixed(0)} px) · ${stage ? 'stage: drawn to the sub-pixel' : 'scroll: drawn in whole px'}`,
    );
  }
  function rested() {
    if (dirty && !g) relayout();
    warm(cur);
    arm();
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

  /* One step between zones; from/to are zone indexes. A touch release glides Loam's way; a wheel notch or a
     key (a tablet with a keyboard or trackpad) is briskER than Loam's desktop 1.3 s step, since several
     notches in a row each count and should not queue up behind a slow glide. */
  function travel(to: number, from: number, v: number, brisk = false) {
    to = clamp(to, 0, iv.length - 1);
    const y1 = land(to, from);
    if (!brisk) return release(y1, v, { kind: 'nav', from, to });
    const D = Math.abs(y1 - here());
    glide(y1, { kind: 'nav', dur: 460 + 240 * Math.min(1, D / VH()), ease: 'sine', from, to });
  }
  function settle(k: number, v: number) {
    // back onto the nearest point of zone k
    const { a, b } = iv[k];
    release(clamp(here(), a, b), v, { kind: 'settle', to: k });
  }
  /* Anchor links, Home/End: Loam's link glide — 1.3 s, +0.18 s per extra section, at most 2.2 s. */
  function linkGlide(y1: number, from: number, to: number) {
    const jumps = Math.max(1, Math.abs(to - from));
    glide(y1, { kind: 'nav', dur: Math.min(NAV_MS + JUMP_MS * (jumps - 1), LINK_MAX_MS), ease: 'sine', from, to });
  }
  function coast(k: number, v: number) {
    // inertia inside a tall section, never past its edges
    const y0 = here();
    const { a, b } = iv[k];
    const end = y0 + v * COAST_T;
    cur = k;
    if (end > a && end < b) {
      anim = { kind: 'free', y0, v, t0: performance.now(), to: k };
      kick();
      return;
    }
    release(clamp(end, a, b), v, { kind: 'settle', to: k });
  }
  function legOf(A: Glide): Leg {
    const d = Math.sign(A.y1 - A.y0) || 1;
    const y = here();
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
    if (s === -L.d) return travel(L.from, L.to, v, true);
    if (L.final != null && (L.final - L.to) * L.d > 1) return; // a long jump already goes further
    const t = clamp(L.to + L.d, 0, iv.length - 1);
    if (t !== L.final) travel(t, L.from, v, true);
  }
  /* A fresh touch while travelling: the other way → straight back; the same way → one more section, but
     only once the current one is more than half on screen (a quick double swipe stays one). A long jump keeps its target. */
  function redirect(s: number, L: Leg, v: number) {
    if (s === -L.d) return travel(L.from, L.to, v);
    let t = s === L.d && L.p >= 0.5 ? L.to + L.d : L.to;
    if (L.final != null && (L.final - t) * L.d > 0) t = L.final;
    travel(t, L.from, v);
  }

  /* A second swipe during a glide (distance moved, + = on; release speed) → +1 / -1 / 0, by Loam's
     rule: a flick goes its way; otherwise only a throw that would carry past half a screen counts. */
  function intentOf(d: number, v: number): number {
    if (Math.abs(d) < SLOP) return 0; // a touch that only caught the page
    if (Math.abs(v) > THROW) return Math.sign(v);
    const p = d + v * PROJECT;
    return Math.abs(p) > 0.5 * VH() ? Math.sign(p) : 0;
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
    nativeSwipe = null;
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
      k = anim.to != null ? anim.to : nearest(here());
      anim = null; // the finger catches the page where it is
    } else k = nearest(here());
    const y = here();
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
    const now = evTime(e);
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
      // the bars are out and the page is on the first section: this swipe is the browser's, so they fold
      native: armed,
      handed: armed,
      caught,
    };
    if (armed) {
      handing = true;
      ext = true;
    }
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
      ext = true;
      return;
    }
    e.preventDefault();
    const p = g.sy0 - (dy - g.off);
    g.p = p;
    g.S.push({ t: evTime(e), p });
    if (g.S.length > 32) g.S.shift();
    if (DEBUG) meter.drag.push([evTime(e), performance.now()]);
    setY(clamp(p, g.lo, g.hi));
  }
  function tEnd(e: TouchEvent) {
    if (!NAV) return;
    if (!g || (e.touches && e.touches.length)) return; // wait for the last finger
    const G = g;
    g = null;
    if (DEBUG) meterDrag();
    if (G.native) {
      ext = true;
      nativeSwipe = { k: G.k, y0: G.sy0, handed: G.handed, moved: sy() - G.sy0 };
      if (DEBUG) dbg.release = { native: true, handed: G.handed, moved: Math.round(sy() - G.sy0) };
      clearTimeout(extT);
      extT = setTimeout(tidy, 160);
      return;
    }
    if (!iv.length) return;
    const drag = G.axis === 'y' && !G.multi;
    if (G.caught && !G.axis) swallowUntil = performance.now() + 500;
    const v = drag && e.type === 'touchend' ? releaseSpeed(G.S, evTime(e)) : 0;
    if (DEBUG) dbg.release = { v: +v.toFixed(3), moved: Math.round(G.p - G.sy0), samples: G.S.length, leg: G.leg && { ...G.leg } };
    if (G.leg) {
      const s = drag ? intentOf(G.p - G.sy0, v) : 0;
      redirect(s, G.leg, v);
      return;
    }
    const k = Math.min(G.k, iv.length - 1);
    const { a, b } = iv[k];
    const y = here();
    const d = y > b ? y - b : y < a ? y - a : 0;
    if (!d) {
      // inside a tall section: plain scrolling with inertia
      if (drag && Math.abs(v) > 0.05) coast(k, v);
      else cur = k;
      return;
    }
    const s = Math.sign(d);
    const nb = k + s;
    if (!drag || nb < 0 || nb >= iv.length) {
      settle(k, v);
      return;
    }
    const fromEdge = s > 0 ? G.sy0 >= b - 2 : G.sy0 <= a + 2;
    let go: boolean;
    if (fromEdge) {
      // Loam's release: a flick on through the page goes on; a flick back comes home; otherwise the page
      // goes to whichever rest point — home or the neighbour — the release would coast nearer to.
      const home = s > 0 ? b : a;
      const span = Math.abs(land(nb, k) - home);
      const along = v * s;
      go = along > THROW || (along >= -THROW && Math.abs(d) + along * PROJECT > span / 2);
    } else {
      // started inside a tall section: only a deliberate pull past its edge hands over
      go = Math.abs(d) > 0.18 * VH() && v * s > -0.1;
    }
    if (go) travel(nb, k, v);
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
      const y = anim && anim.kind === 'inner' ? anim.target : here();
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
        if (wg.k + s >= 0 && wg.k + s < iv.length) travel(wg.k + s, wg.k, 0, true);
      }
      return;
    }
    inner(wg.k, dy); // inside a tall section: scroll it and stop at its edge
  }
  function inner(k: number, delta: number) {
    const { a, b } = iv[k];
    if (!anim || anim.kind !== 'inner') anim = { kind: 'inner', y: here(), target: here(), last: performance.now(), to: k };
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
        const from = anim && anim.to != null ? anim.to : nearest(here());
        const to = e.key === 'Home' ? 0 : iv.length - 1;
        linkGlide(to ? iv[to].b : 0, from, to);
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
    const y = anim && anim.kind === 'inner' ? anim.target : here();
    const k = anim && anim.to != null ? anim.to : nearest(y);
    const { a, b } = iv[k];
    if (s > 0 ? y < b - 1 : y > a + 1) {
      inner(k, s * frac * VH()); // a screenful inside a tall section
      return;
    }
    if (anim && anim.kind !== 'inner') anim = null;
    if (k + s >= 0 && k + s < iv.length) travel(k + s, k, 0, true);
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
    const top = inFlow(() => topOf(el));
    // a stop rests at its own top (the header floats over the photograph); anything inside one clears the header
    const y1 = clamp(Math.round(sec === el ? top : top - hdrH() - 24), a, b);
    const from = anim && anim.to != null ? anim.to : nearest(here());
    linkGlide(y1, from, k);
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
    if (!NAV) return;
    if (anim || (g && g.axis === 'y' && !g.native)) return; // the engine is moving the page: its own scroll
    if (!ext) {
      const late = performance.now() - wroteT < ECHO_MS;
      if (late || Math.abs(sy() - wrote) <= 2) {
        // the engine's own write, arriving late (iPhones): look again once it should have landed
        clearTimeout(verT);
        verT = setTimeout(verify, Math.max(40, ECHO_MS - (performance.now() - wroteT)) + 40);
        return;
      }
    }
    external();
  }
  function external() {
    ext = true;
    anim = null;
    ghost = NaN;
    render(sy()); // the stage goes where the page was taken
    extPending = true;
    clearTimeout(extT);
    extT = setTimeout(tidy, 160);
  }
  /* The page should be where the engine left it by now; if not, someone else moved it (or the browser
     put back a stale position): tidy it onto a section like any other outside scroll. */
  function verify() {
    if (!NAV || anim || g || ext) return;
    if (Math.abs(sy() - wrote) > 1.5) external();
  }
  function tidy() {
    if (!NAV) return;
    if (mouseDown) {
      extT = setTimeout(tidy, 160);
      return;
    }
    extPending = false;
    if (!g) handing = false; // a swipe handed to the browser has landed (a new touch would carry it on)
    if (g || anim || blocked() || zoomed()) return arm();
    relayout(true);
    try {
      tidyOnto();
    } finally {
      arm(); // back on the first section with the bars still out: the next swipe is the browser's again
    }
  }
  function tidyOnto() {
    if (!iv.length) return;
    const y = here(); // someone else moved the page: this is the browser's position
    // The browser took a swipe for itself (it had already begun scrolling — a busy page just after load,
    // say — so the swipe could not be held back). It still means one section that way: once its momentum
    // has died, finish on the neighbour it was headed for, never further and never back home.
    const N = nativeSwipe;
    nativeSwipe = null;
    // A handed swipe the browser carried more than half a screen and then put back home: its snap is not
    // landing on the stop here. Never hand one over again, and go where the swipe meant to.
    if (N && N.handed && Math.abs(y - N.y0) <= 2 * SLOP && Math.abs(N.moved) > 0.5 * VH()) {
      snapBroken = true;
      if (DEBUG) meterLine(`bars  the browser put the swipe (${Math.round(N.moved)} px) back home: no more handing over`);
      travel(clamp(N.k + Math.sign(N.moved), 0, iv.length - 1), N.k, N.moved / 400);
      return;
    }
    if (N && N.k < iv.length && Math.abs(y - N.y0) > 2 * SLOP) {
      if (N.handed) tried = true;
      const { a, b } = iv[N.k];
      if (y < a - 1 || y > b + 1) {
        const to = clamp(N.k + Math.sign(y - N.y0), 0, iv.length - 1);
        const y1 = land(to, N.k);
        if (DEBUG && N.handed)
          meterLine(`bars  after the browser's swipe: inner ${window.innerHeight}, tallest ${tallest}, landed ${Math.round(y)}, section ${to} at ${y1}`);
        // A handed swipe was landed by the browser's snap, on the section itself. Off it only when the bars
        // folding moved the section after the browser had picked its stop: close that gap briskly.
        if (N.handed && Math.abs(y1 - y) < 0.25 * VH()) glide(y1, { kind: 'settle', dur: SETTLE_MS, ease: 'quart', to });
        else travel(to, N.k, 0);
        return;
      }
    }
    const ae = document.activeElement as HTMLElement | null;
    if (ae && ae !== document.body && ae.closest(SEL) && performance.now() - focusT < 1500) {
      const k = zoneOf(ae); // keep the focused element in view
      const { a, b } = iv[k];
      const y1 = a === b ? a : clamp(Math.round(ae.getBoundingClientRect().top + y - VH() * 0.3), a, b);
      glide(y1, { kind: 'settle', dur: SETTLE_MS, ease: 'quart', to: k });
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
    const rel = iv.length ? here() - iv[k].a : 0;
    measure();
    if (!iv.length || keepY) return;
    const t = Math.min(k, iv.length - 1);
    cur = t;
    const y1 = clamp(iv[t].a + rel, iv[t].a, iv[t].b);
    if (Math.abs(y1 - here()) > 0.5) setY(y1);
  }
  /* A relayout at rest, from outside any gesture (not tStart's: a touch's pans are settled before it
     starts, so the handover is never taken up in the middle of one). */
  function relaid() {
    relayout();
    arm();
  }
  function onResize() {
    if (!NAV) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ae = document.activeElement;
    const typing = !!ae?.matches('input, textarea, select');
    seeHeight();
    if (w === lastW && (h === lastH || typing)) return; // soft keyboard or nothing: leave the layout alone
    // The bars folding under a swipe the browser is moving: the sections take the new screen at once, and
    // the stops are read again so the snap's box can follow its stop. A write of the engine's would fight
    // that snap.
    if (handing && w === lastW) {
      lastH = h;
      setVh();
      measure(); // reads only; no write of the engine's while the browser's snap is landing
      if (armed) placeMarks(); // the stop moved with the sections: so does the box the snap lands on
      return;
    }
    lastW = w;
    lastH = h;
    const A = anim;
    setVh();
    const k = A && A.to != null ? A.to : cur;
    const rel = iv.length ? here() - iv[Math.min(k, iv.length - 1)].a : 0;
    anim = null;
    measure();
    if (!iv.length) return;
    cur = Math.min(k, iv.length - 1);
    const y1 = A && A.kind === 'nav' && A.from != null ? land(cur, A.from) : clamp(iv[cur].a + rel, iv[cur].a, iv[cur].b);
    setY(y1); // turned or resized: the same section, aligned, at once
    arm();
  }

  /* ── The frame loop: runs only while something moves ─────── */
  function frame(now: number) {
    if (navStep(now)) raf = requestAnimationFrame(frame);
    else running = false;
  }
  function kick() {
    // a motion of the engine's own starts: a touch that catches it must be the engine's too
    if (armed) {
      handing = false;
      disarm();
    }
    if (running || destroyed) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  /* Web fonts, images and late data change section heights: re-measure, keep the place. */
  let roFirst = true;
  function observe(els: HTMLElement[]) {
    if (!ro) return;
    const next = new Set<Element>([document.body, ...(stage ? [stage.surface] : []), ...els]);
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
    relaid();
  };
  const onLoad = () => relaid();
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) relaid();
  };
  const onMouseDown = () => {
    mouseDown = true;
  };
  const onMouseUp = () => {
    mouseDown = false;
  };
  const onFocusIn = () => {
    focusT = performance.now();
    /* On the stage the browser cannot bring a focused link into view — scrolling the page moves nothing —
       so the engine does it, by the road an outside scroll takes (tidy keeps what has focus in view).
       Only for focus that came from the keyboard and landed off the screen: a tap focuses what is under
       the finger, and the page must not move for that. */
    const ae = document.activeElement;
    if (!stage || g || anim || !(ae instanceof HTMLElement) || !ae.matches(':focus-visible')) return;
    const r = ae.getBoundingClientRect();
    if (r.bottom > 0 && r.top < VH()) return;
    clearTimeout(extT);
    extT = setTimeout(tidy, 80);
  };
  /* The stage's box can still be scrolled from script — a browser bringing a field into view does it —
     and anything but 0 slides the whole page off its place. It stays at 0. */
  const pinBox = () => {
    if (stage && (stage.box.scrollTop || stage.box.scrollLeft)) stage.box.scrollTo(0, 0);
  };
  function stageUp() {
    if (!STAGE || stage) return;
    const box = document.querySelector<HTMLElement>('[data-nav-stage]');
    const surface = box?.querySelector<HTMLElement>('[data-nav-surface]');
    if (!box || !surface) return;
    // the page's length first, then the surface out of the flow: the scroll position never has to move
    document.body.style.height = `${surface.offsetHeight}px`;
    stage = { box, surface };
    ghost = NaN;
    html.classList.add('snapnav-stage');
    box.addEventListener('scroll', pinBox, passive);
    /* The page's length follows the surface's at once, on its own: zones can wait for the page to be at
       rest (relayout), but a body shorter than its content would stop the scroll position short of where
       the stage has gone. */
    if ('ResizeObserver' in window) {
      stageRO = new ResizeObserver(() => {
        if (stage) document.body.style.height = `${stage.surface.offsetHeight}px`;
      });
      stageRO.observe(surface);
    }
  }
  function stageDown() {
    if (!stage) return;
    stage.box.removeEventListener('scroll', pinBox, passive);
    stageRO?.disconnect();
    stageRO = null;
    stage.surface.style.transform = '';
    pins.forEach((p) => (p.el.style.translate = ''));
    pins = [];
    html.classList.remove('snapnav-stage');
    document.body.style.height = '';
    stage = null;
  }

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
    window.visualViewport?.addEventListener('resize', onZoom);
    // the large viewport, where the browser reports one: the screen's height with its bars away
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
    document.body.append(probe);
    seeHeight();
    // an overlay (the preloader, the menu) lets go of the page by its style: the bars' handover may be due then
    if ('MutationObserver' in window) {
      mo = new MutationObserver(() => arm());
      mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
      mo.observe(html, { attributes: true, attributeFilter: ['style'] });
    }
    onZoom();
    document.fonts?.ready.then(() => relaid());

    const y0 = sy(); // where the page is, read before the stage takes it out of the flow
    stageUp();
    measure();
    render(y0);
    if (!iv.length) return;
    const h0 =
      first && location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (h0 && h0.closest(SEL)) {
      cur = zoneOf(h0);
      setY(iv[cur].a);
    } else if (first) {
      cur = nearest(y0);
      setY(clamp(y0, iv[cur].a, iv[cur].b));
    } else {
      cur = nearest(y0);
      settle(cur, 0);
    }
    warm(cur);
    arm();
  }
  function navOff() {
    // back to plain native scrolling
    NAV = false;
    anim = null;
    g = null;
    wg = null;
    extPending = false;
    clearTimeout(extT);
    clearTimeout(verT);
    ext = true;
    cancelAnimationFrame(raf);
    running = false;
    html.classList.remove('snapnav', 'snapnav-zoom');
    handing = false;
    disarm();
    mo?.disconnect();
    mo = null;
    probe?.remove();
    probe = null;
    stageDown(); // the scroll position has followed the stage all along: the page is where it was
    window.visualViewport?.removeEventListener('resize', onZoom);
    nativeSwipe = null;
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
    stage: () => boolean;
    pos: () => number;
    put: (y: number) => void;
    meter: () => string[];
    release: () => unknown;
    glide: () => unknown;
    frames: [number, number, string][];
    bars: () => { armed: boolean; handing: boolean; tried: boolean; tallest: number; lvh: number; inner: number };
  };
  const w = window as unknown as { __nav?: NavDebug };
  if (DEBUG) {
    w.__nav = {
      iv: () => iv.map((v) => [v.a, v.b, v.els.map((el) => el.id || el.dataset.section || el.tagName.toLowerCase()).join('+')]),
      cur: () => cur,
      busy: () => !!(anim || g),
      kind: () => (anim ? anim.kind : null),
      on: () => NAV,
      stage: () => !!stage,
      pos: () => here(),
      put: (y: number) => setY(y), // the tests place the page, by whichever road is in use
      meter: () => meter.lines,
      release: () => dbg.release,
      glide: () => dbg.glide,
      frames: dbg.frames,
      bars: () => ({ armed, handing, tried, tallest, lvh: probe?.offsetHeight ?? 0, inner: window.innerHeight }),
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

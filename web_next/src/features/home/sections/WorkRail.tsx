'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui';
import { SectionHeader } from '@/components/common';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { CATEGORY_LABEL } from '@/data/projects';
import { formatNumber } from '@/lib/format';
import { usePrefersReducedMotion } from '@/hooks';
import type { Project } from '@/types/domain';

/**
 * Selected work, as a rail the visitor moves themselves.
 *
 * ── Why the page scroll does not drive this ─────────────────────────────────
 * It did, briefly: the section pinned and the rail travelled sideways as you
 * scrolled down. It was taken out because a visitor cannot tell what happened.
 * Scrolling down is a promise about going down the page, and answering it by
 * moving something sideways reads as the page having broken rather than as an
 * effect — you have to stop and work out what you did. That is the same
 * objection MepfSystemStack's header records against `MepfTwin`, and it holds
 * whatever the scroll budget is.
 *
 * So the wheel is left alone entirely. This section is exactly as tall as its
 * contents, the page scrolls past it normally, and the rail moves only when
 * someone moves it: swipe, trackpad, drag, the arrows, the dots, or the arrow
 * keys. Four affordances, because a hidden scrollbar means a mouse-only visitor
 * has no other way in.
 *
 * ── It is a native scroller, not a carousel ─────────────────────────────────
 * One `overflow-x-auto` box with scroll-snap, at every width. No transform
 * drives position, no index owns it, nothing to get out of step: the browser's
 * own momentum, snapping and focus-scrolling are better than anything written
 * here, and `scrollIntoView` on a link inside it just works. What is written
 * here is only the *reading* of that scroll — the progress bar, the counter and
 * the per-card parallax all derive from `scrollXProgress` and never write to it,
 * except through `goToIndex`, which sets `scrollLeft` like any other caller.
 *
 * ── Motion, and switching it off ────────────────────────────────────────────
 * `reduced` flattens the velocity skew and the image parallax to their neutral
 * values rather than removing the properties — the trap documented at length in
 * `Reveal` (components/motion/index.tsx), where a property framer wrote inline on
 * the first render is never cleared if the later variant stops mentioning it.
 * Nothing else here is animated, so there is no geometry to unwind: a
 * reduced-motion visitor gets the same rail, moved the same ways.
 */

/*
 * Why the card does not use `MaskImage`, and why these three numbers are a set.
 *
 * `MaskImage` gives its image room to move with a Tailwind *class*,
 * `scale-[1.12]`. It was briefly taught an `imgX` prop so this card could drive a
 * horizontal parallax through it, and that broke it: framer writes `x` as an
 * inline `transform`, an inline transform replaces the class transform outright,
 * and framer knows nothing about the scale — so the image rendered at
 * `matrix(1,0,0,1,3.7,0)`, exactly frame-sized with no headroom at all. Shifted
 * by the parallax it slid off its own frame and exposed a strip of `bg-navy-900`
 * down one edge of every card. The prop has been removed rather than patched,
 * because the same trap waits for any caller that passes a motion transform.
 *
 * Here both the translate and the scale are framer values on one element, so
 * neither can overwrite the other. What has to hold is:
 *
 *     BASE_SCALE ≥ 1 + 2 × (PARALLAX / 100)
 *
 * A scale of S leaves (S−1)/2 of overflow on each side. At 1.16 that is 8%,
 * against a 5% shift — 3% of margin. The old pairing was 1.12 against 6%, i.e.
 * exactly zero, which would have shown an edge at the extremes even had the
 * scale survived. `HOVER_SCALE` only ever adds headroom, so it is free.
 */
const BASE_SCALE = 1.16;
const HOVER_SCALE = 1.24;
const PARALLAX = 5;

/* The rail's own card, not `ProjectCard`.
 *
 * `ProjectCard` is shared with /projects and is deliberately one fixed size — a
 * `size` prop was removed so a bigger variant could not quietly come back. It is
 * also a 4:3 frame with service chips and a three-number footer *below* the
 * image, which is the right object for a grid and the wrong one for a rail: in a
 * rail the card is a tall full-bleed frame, everything sits inside it, and it
 * carries an index because "where am I in this" is the question a horizontal
 * list has to answer and a grid never does. Different object, not a variant. */
function RailCard({
  project,
  index,
  scrollX,
  metrics,
  skew,
  reduced,
}: {
  project: Project;
  index: number;
  scrollX: MotionValue<number>;
  metrics: { step: number; paneW: number; edge: number; cardW: number };
  skew: MotionValue<number>;
  reduced: boolean;
}) {
  /*
    Counter-parallax inside the frame.

    The window is this card's own: it begins entering when the scroll reaches its
    left edge minus a pane width, and has fully left one card width later. Those
    come from `metrics`, measured once in the parent, so seven cards cost one
    measurement rather than seven.

    The sign is the whole effect — the card travels left, so the image drifts
    *right* inside its frame to read as lagging behind it. Flip these and the
    image leads the card, which looks like a glitch rather than depth.

    `PARALLAX` against `BASE_SCALE` is the pair that matters; see the note on the
    constants.
  */
  const start = metrics.edge + index * metrics.step;
  const enter = start - metrics.paneW;
  const exit = start + metrics.cardW;
  const imgX = useTransform(
    scrollX,
    enter < exit ? [enter, exit] : [0, 1],
    reduced ? ['0%', '0%'] : [`-${PARALLAX}%`, `${PARALLAX}%`],
    { clamp: true },
  );

  /* The hover zoom is a motion value and not a Tailwind class, for the same
     reason the scale is — see the constants note. One spring, two setters. */
  const scale = useSpring(BASE_SCALE, { stiffness: 160, damping: 26, mass: 0.5 });

  return (
    <motion.li
      data-rail-index={index}
      style={{ skewX: skew }}
      className="w-[var(--rail-card)] shrink-0 snap-start"
    >
      <Link
        href={ROUTES.project(project.slug)}
        onMouseEnter={() => !reduced && scale.set(HOVER_SCALE)}
        onMouseLeave={() => scale.set(BASE_SCALE)}
        className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-500"
      >
        <div className="relative h-[var(--rail-h)] overflow-hidden rounded-2xl bg-navy-900">
          {/* The clip-path reveal `MaskImage` would have given us, inlined so the
              image's transform belongs to this component alone. Both variants
              name the same two properties — the stranding trap documented in
              `Reveal` (components/motion/index.tsx). */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{
              opacity: reduced ? 0 : 1,
              clipPath: reduced ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
            }}
            whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
            viewport={{ once: true, margin: '0px 0px -8% 0px' }}
            transition={{
              duration: reduced ? 0.2 : 1.1,
              delay: Math.min(index, 2) * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.img
              src={project.coverImage}
              alt={project.title}
              /* The two on screen at rest load eagerly. A lazy image in a
                 horizontal scroller resolves its intersection late, and the pop
                 is visible on exactly these two and no others. */
              loading={index < 2 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              style={{ x: imgX, scale }}
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* Two scrims, one per end, and the top one is not decoration: the
              bottom gradient fades to transparent long before the top edge, so
              white text up there sat directly on the photograph and vanished on
              any pale cover. The index number and the stage pill both live in
              that band. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-ink-950/55 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent transition-opacity duration-500 group-hover:opacity-95" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
            {/* A drawing callout, not a headline. The old numeral was 2.75rem at
                25% white in the opposite corner: too faint to read on a pale
                photograph and too large to be anything but noise when it did
                read. The rule extends on hover, which is the only movement. */}
            <span className="flex items-center gap-2" aria-hidden>
              <span className="num text-caption font-semibold tracking-widest text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="h-px w-6 bg-cyan-400 transition-all duration-500 ease-out-expo group-hover:w-10" />
            </span>

            {/* The only badge left on the card. A stage is a status; a locality is
                a label, and labels belong in the eyebrow below rather than as a
                chip stuck on top of the picture. */}
            {project.stage !== 'completed' && (
              <Badge variant="brand" size="sm" className="bg-cyan-500 text-white">
                {project.stage === 'ongoing' ? 'In progress' : 'Upcoming'}
              </Badge>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-caption uppercase tracking-wider text-white/60">
              {project.locality} · {CATEGORY_LABEL[project.category]} · {project.year}
            </p>
            <h3 className="mt-1.5 font-display text-heading-lg font-semibold">{project.title}</h3>

            {/* The meta row is always visible — area, floors and stage are what a
                visitor is scanning for. Only the subtitle is behind the hover,
                using the same grid-rows trick `ProjectCard` uses, so the two
                listings share a hover vocabulary. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-white/70">
              <span className="num">{formatNumber(project.areaSqft)} sq ft</span>
              <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
              <span>{project.floors}</span>
              <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden />
              <span className="capitalize">{project.stage}</span>
            </div>

            <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden opacity-0 transition-all duration-500 ease-out-expo group-hover:max-h-24 group-hover:grid-rows-[1fr] group-hover:opacity-100">
              <p className="min-h-0 pt-2 text-caption leading-relaxed text-white/60">{project.subtitle}</p>
            </div>
          </div>

          <span className="pointer-events-none absolute bottom-5 right-5 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white/95 text-navy-800 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

/* The rail has to end somewhere.
 *
 * A horizontal list with no terminator reads as broken — you keep pushing and
 * nothing tells you that was all of them.
 *
 * It does point at the same place as the header's "All projects" pill, and this
 * page has a stated allergy to that: MepfSystemStack refuses to make its four
 * cards links precisely because "four identical links a screen apart is noise".
 * Two is not four, and the two are not identical — the pill is the one a visitor
 * who never touches the rail can still see, and this card carries the archive's
 * actual size, which is a fact the pill does not have room for and the reason
 * someone who has just looked at six would click a seventh. */
function RailEndCard({
  total,
  index,
  skew,
}: {
  total: number;
  index: number;
  skew: MotionValue<number>;
}) {
  return (
    <motion.li
      data-rail-index={index}
      style={{ skewX: skew }}
      className="w-[var(--rail-card)] shrink-0 snap-start"
    >
      <Link
        href={ROUTES.projects}
        className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-500"
      >
        <div className="bg-grid-blueprint bg-grid relative flex h-[var(--rail-h)] flex-col justify-between overflow-hidden rounded-2xl bg-navy-800 p-6 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl transition-all duration-700 ease-out-expo group-hover:bg-cyan-500/30" />
          <p className="relative text-caption uppercase tracking-wider text-white/50">The rest of them</p>
          <div className="relative">
            <p className="num text-[length:clamp(2.5rem,4.5vw,3.75rem)] font-semibold leading-none tracking-tight">
              {total}
            </p>
            <p className="mt-3 font-display text-heading-lg font-semibold">projects in all</p>
            <p className="mt-2 max-w-[22ch] text-caption leading-relaxed text-white/60">
              Filter the full archive by market, locality and year.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
              Open the archive
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

const ZERO_METRICS = { step: 1, paneW: 1, edge: 0, cardW: 1 };

/*
 * Programmatic scroll, eased the way the rest of the site moves.
 *
 * `scrollTo({ behavior: 'smooth' })` is the browser's curve — short, flat, and
 * noticeably brisker than everything around it. This is the exact easing Lenis
 * runs the page with (hooks/useLenis.ts), so an arrow press and a page scroll
 * now decelerate identically.
 *
 * Returns its own cancel function: a tween that cannot be interrupted is worse
 * than no tween, because the rail then fights the hand that grabs it mid-flight.
 */
const EASE_OUT_EXPO = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

function animateScrollLeft(pane: HTMLElement, to: number, reduced: boolean, duration = 620) {
  const from = pane.scrollLeft;
  const distance = to - from;
  if (reduced || Math.abs(distance) < 1) {
    pane.scrollLeft = to;
    return () => {};
  }
  let raf = 0;
  const started = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - started) / duration);
    pane.scrollLeft = from + distance * EASE_OUT_EXPO(t);
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function WorkRail({
  projects,
  total,
  heading,
  lead,
}: {
  /** The featured few, already sliced by the caller. */
  projects: Project[];
  /** Everything in the archive, which is what the end card advertises. */
  total: number;
  heading: string;
  lead: string;
}) {
  const reduced = usePrefersReducedMotion();
  const paneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);

  const count = projects.length + 1; // + the end card
  const lastIndex = count - 1;

  /*
    Card pitch, pane width and the edge inset, measured once.

    The cards are all one width and one gap apart, so a single step is enough to
    place every one of them — `metrics` is what lets each card compute its own
    parallax window without reading its own box.
  */
  const [metrics, setMetrics] = useState(ZERO_METRICS);
  /*
    The scroll positions the rail can actually come to rest at.

    Not one per card. With four cards on screen at 1440, snapping card 5, 6 or 7
    to the left gutter all means the same thing — scroll to the end — so a dot
    per card gives three dots that do nothing, and a counter that reads "04" at
    the exact moment the progress bar is full. Deduplicating the clamped targets
    gives the stops a visitor can really reach, and every control below is driven
    from that one list, so they cannot disagree with each other.
  */
  const [stops, setStops] = useState<number[]>([]);

  useEffect(() => {
    const pane = paneRef.current;
    const track = trackRef.current;
    if (!pane || !track) return;

    const measure = () => {
      const items = Array.from(track.children) as HTMLElement[];
      const a = items[0];
      if (!a) return;
      const cardW = a.getBoundingClientRect().width;
      const step = items[1]
        ? items[1].getBoundingClientRect().left - a.getBoundingClientRect().left
        : cardW;
      const edge = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      setMetrics({ step: step || cardW || 1, paneW: pane.clientWidth || 1, edge, cardW: cardW || 1 });

      const max = Math.max(0, track.scrollWidth - pane.clientWidth);
      const paneLeft = pane.getBoundingClientRect().left;
      const next: number[] = [];
      items.forEach((li) => {
        const target = Math.min(
          max,
          Math.max(0, pane.scrollLeft + li.getBoundingClientRect().left - paneLeft - edge),
        );
        if (!next.some((t) => Math.abs(t - target) < 2)) next.push(target);
      });
      setStops(max > 1 ? next : []);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  const scrollable = stops.length > 1;

  /*
    Read-only views of the scroll the visitor is driving. Nothing here writes
    back to it — `goToStop` and `revealCard` move the rail, and they do it by
    setting `scrollLeft` like any other caller would.

    `layoutEffect: false` because the ref is attached below this call and framer
    warns (correctly) that it reads an unhydrated ref on the layout pass. The
    pane also has to be `relative`: `useScroll` measures the container's offset
    parent, and a static container silently gives wrong numbers rather than an
    error.
  */
  const { scrollX, scrollXProgress } = useScroll({ container: paneRef, layoutEffect: false });

  /* Velocity skew — the rail leans into the direction of travel and settles.
     Same instrument as the spirit level in `ScrollProgress`: velocity into a
     deliberately under-damped spring, so the settle overshoots slightly once.
     Flattened rather than removed under reduced motion; see the header. */
  const velocity = useVelocity(scrollXProgress);
  const skew = useSpring(
    useTransform(velocity, [-2.2, 0, 2.2], reduced ? [0, 0, 0] : [4, 0, -4], { clamp: true }),
    { stiffness: 110, damping: 16, mass: 0.5 },
  );
  const bar = useSpring(scrollXProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  /** Which stop we are nearest — drives the dots and the arrows. */
  const [stop, setStop] = useState(0);
  /*
    Which projects are on screen, as a range.

    The counter says "01–04 / 07" rather than a single number because four of
    them really are in front of you; naming only the leftmost would be the same
    half-truth the per-card dots were. A card counts as shown once more than 60%
    of it is inside the pane, so the sliver peeking past the right edge — which
    is there to advertise that the rail moves — does not claim to have been read.
  */
  const [range, setRange] = useState({ first: 0, last: 0 });
  /*
    Snapping is suspended while anything is moving, and comes back only once the
    rail has been still for a moment.

    It cannot simply be restored when a tween is cancelled. Re-enabling
    `scroll-snap-type` makes the browser re-snap *immediately* from wherever the
    rail happens to be, so a visitor who grabbed the rail mid-tween saw it jump
    to the nearest stop under their hand before their own gesture had moved it at
    all — measured at 268px → 367px. Tying the restore to 160ms of scroll silence
    means it can only ever happen at rest, where by definition it moves nothing.
  */
  const snapTimer = useRef(0);
  const suspendSnap = useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    window.clearTimeout(snapTimer.current);
    pane.style.scrollSnapType = 'none';
  }, []);

  const restoreSnapWhenIdle = useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => {
      pane.style.scrollSnapType = '';
    }, 160);
  }, []);

  useEffect(() => () => window.clearTimeout(snapTimer.current), []);

  const cancelMotion = useCallback(() => {
    motionRef.current();
    motionRef.current = () => {};
    /* Whatever interrupted us is now in charge, but it may also stop without
       ever scrolling — re-arm so snapping cannot stay suspended for good. */
    restoreSnapWhenIdle();
  }, [restoreSnapWhenIdle]);


  const onPaneScroll = useCallback(() => {
    const pane = paneRef.current;
    const track = trackRef.current;
    if (!pane || !track) return;

    const paneRect = pane.getBoundingClientRect();
    let first = -1;
    let last = 0;
    Array.from(track.children).forEach((node, i) => {
      const r = (node as HTMLElement).getBoundingClientRect();
      const shown = Math.min(r.right, paneRect.right) - Math.max(r.left, paneRect.left);
      if (shown > r.width * 0.6) {
        if (first < 0) first = i;
        last = i;
      }
    });
    if (first < 0) first = last;
    setRange((prev) => (prev.first === first && prev.last === last ? prev : { first, last }));

    let best = 0;
    let bestD = Infinity;
    stops.forEach((t, i) => {
      const d = Math.abs(t - pane.scrollLeft);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setStop((prev) => (prev === best ? prev : best));

    /* Every scroll event pushes the snap restore further out, so it lands only
       once the rail has actually come to rest — see `restoreSnapWhenIdle`. */
    restoreSnapWhenIdle();
  }, [restoreSnapWhenIdle, stops]);

  useEffect(onPaneScroll, [onPaneScroll]);

  /*
    Everything that moves the rail without a hand on it goes through here, and
    anything the visitor does cancels it. A tween the hand cannot interrupt is
    worse than none, because then the rail pulls against the grab.
  */
  const motionRef = useRef<() => void>(() => {});


  const scrollTo = useCallback(
    (to: number) => {
      const pane = paneRef.current;
      if (!pane) return;
      cancelMotion();
      suspendSnap();
      motionRef.current = animateScrollLeft(pane, to, reduced);
      /*
        Arm the restore now rather than waiting for the tween's scroll events to
        do it. Each frame the tween writes pushes the timer out, so during a real
        move this changes nothing — but a tween with nothing to move (already at
        the target) emits no scroll events at all, and without this snapping
        would stay suspended indefinitely.
      */
      restoreSnapWhenIdle();
    },
    [cancelMotion, reduced, restoreSnapWhenIdle, suspendSnap],
  );

  /** The one way the rail is moved programmatically: arrows, dots, arrow keys. */
  const goToStop = useCallback(
    (i: number) => {
      if (!stops.length) return;
      scrollTo(stops[Math.min(stops.length - 1, Math.max(0, i))]);
    },
    [scrollTo, stops],
  );

  const nearestStop = useCallback(
    (at: number) => {
      let best = 0;
      let bestD = Infinity;
      stops.forEach((t, i) => {
        const d = Math.abs(t - at);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    },
    [stops],
  );

  /*
    Focus scrolls its own card into view, which is a card index and not a stop.

    Measured as a delta from where the card is *now* rather than from
    `offsetLeft`: the track is not the offset parent, and a delta needs no
    assumption about which box the offsets are relative to. The scroller clamps
    the result, so the trailing cards simply land at the end.
  */
  const revealCard = useCallback(
    (i: number) => {
      const pane = paneRef.current;
      const track = trackRef.current;
      if (!pane || !track) return;
      const li = track.children[Math.min(lastIndex, Math.max(0, i))] as HTMLElement | undefined;
      if (!li) return;
      const delta = li.getBoundingClientRect().left - pane.getBoundingClientRect().left - metrics.edge;
      scrollTo(pane.scrollLeft + delta);
    },
    [lastIndex, metrics.edge, scrollTo],
  );

  /*
    Keyboard focus centres the card it lands on.

    The browser already scrolls a focused child into view, but it stops as soon
    as the element is barely visible, which leaves the card flush against the
    edge and half under the fade. Gated on `:focus-visible` so a *mouse* click on
    a card does not also slide the rail out from under the click.
  */
  const onFocusCapture = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      const el = e.target as HTMLElement;
      if (!el.matches(':focus-visible')) return;
      const item = el.closest<HTMLElement>('[data-rail-index]');
      if (!item) return;
      revealCard(Number(item.dataset.railIndex));
    },
    [revealCard],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      goToStop(stop + (e.key === 'ArrowRight' ? 1 : -1));
    },
    [goToStop, stop],
  );

  /*
    Grab-and-pull with a mouse.

    Mouse only, and deliberately: a touch screen already drags this with
    momentum and snapping the browser does better, and a trackpad already swipes
    it. What has nothing is a plain mouse — the scrollbar is hidden, and wheels
    without a horizontal axis cannot reach it at all. The arrows and dots below
    are the accessible route; this is the one that feels like the cards are
    objects.

    `data-dragged` is set once the pointer has actually travelled, and the
    capture-phase click handler below reads it: without that, letting go of a
    drag on top of a card opens that project.
  */
  const drag = useRef({
    active: false,
    startX: 0,
    startLeft: 0,
    moved: 0,
    /* A short trail of recent samples. Velocity taken from the last event pair
       alone is mostly noise — a slow finish to a fast drag would fling hard —
       so the fling reads the trailing ~80ms instead. */
    samples: [] as { x: number; t: number }[],
  });

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      const pane = paneRef.current;
      if (!pane) return;
      cancelMotion();
      drag.current = {
        active: true,
        startX: e.clientX,
        startLeft: pane.scrollLeft,
        moved: 0,
        samples: [{ x: e.clientX, t: performance.now() }],
      };
    },
    [cancelMotion],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const pane = paneRef.current;
      if (!drag.current.active || !pane) return;
      const dx = e.clientX - drag.current.startX;
      drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));

      const now = performance.now();
      drag.current.samples.push({ x: e.clientX, t: now });
      while (drag.current.samples.length > 2 && now - drag.current.samples[0].t > 80) {
        drag.current.samples.shift();
      }

      if (drag.current.moved <= 4) return;
      /*
        Snapping has to come off for the duration of the drag.

        Mandatory snap re-targets after *every* write to `scrollLeft`, so a drag
        applied in small increments is pulled back to the stop it started from on
        each frame and the rail simply does not move — silently, because nothing
        is throwing. It stays off through the fling as well, and comes back on
        its own once the rail is still.
      */
      suspendSnap();
      pane.setPointerCapture?.(e.pointerId);
      pane.scrollLeft = drag.current.startLeft - dx;
    },
    [suspendSnap],
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      const pane = paneRef.current;
      if (!pane) return;
      pane.releasePointerCapture?.(e.pointerId);

      if (drag.current.moved <= 4) {
        restoreSnapWhenIdle();
        return;
      }

      pane.setAttribute('data-dragged', 'true');
      /* Cleared on the next tick, after the click that ends this gesture has
         been swallowed by `onClickCapture` below. */
      setTimeout(() => pane.removeAttribute('data-dragged'), 0);

      /*
        The fling.

        Letting go used to stop the rail dead and then jump it to a stop, which
        is the single thing that made this feel like a widget rather than like
        weight. Now the release velocity carries, decays, and only then settles.

        `0.94` per frame is roughly a 250ms coast at 60fps — long enough to read
        as momentum, short enough that it never runs away from the pointer.
      */
      const s = drag.current.samples;
      const first = s[0];
      const last = s[s.length - 1];
      const dt = last && first ? last.t - first.t : 0;
      let v = dt > 0 ? -(last.x - first.x) / dt : 0; // px per ms, scroll-space

      const max = pane.scrollWidth - pane.clientWidth;
      /* Land on a stop under our own easing rather than letting snapping yank
         it there; snapping comes back by itself once this has come to rest. */
      const settle = () => {
        if (stops.length) scrollTo(stops[nearestStop(pane.scrollLeft)]);
        else restoreSnapWhenIdle();
      };

      if (reduced || Math.abs(v) < 0.05) {
        settle();
        return;
      }

      let raf = 0;
      let prev = performance.now();
      const glide = (now: number) => {
        /* Clamped: a backgrounded tab resumes with a huge delta, and an
           unclamped one would teleport the rail to an end on the first frame
           back. Frame-rate independent so a 120Hz display decays at the same
           rate per second as a 60Hz one, rather than twice as fast. */
        const dtMs = Math.min(50, now - prev) || 16.67;
        prev = now;
        v *= Math.pow(0.94, dtMs / 16.67);
        pane.scrollLeft = Math.min(max, Math.max(0, pane.scrollLeft + v * dtMs));
        const stuck = pane.scrollLeft <= 0 || pane.scrollLeft >= max;
        if (Math.abs(v) < 0.02 || stuck) {
          settle();
          return;
        }
        raf = requestAnimationFrame(glide);
      };
      raf = requestAnimationFrame(glide);
      motionRef.current = () => cancelAnimationFrame(raf);
    },
    [nearestStop, reduced, restoreSnapWhenIdle, scrollTo, stops],
  );

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (paneRef.current?.hasAttribute('data-dragged')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return (
    <section
      className={cn(
        /* `work-rail` styles nothing — it is the handle to grab in the
           inspector, and what the QA checks measure against. */
        'work-rail section-sm',
        /* Card width, gap and edge inset are the whole geometry. `--rail-edge`
           is measured off the *real* container rather than the configured one:
           tailwind.config.mjs asks for gutters of 1.25 / 1.5 / 2.5 / 4rem and
           only the first exists, because setting `theme.container.screens` to
           `{ '2xl': '1440px' }` replaces the screen list the container is built
           against and the other padding keys have no screen to attach to. Every
           `.container` on the site is 20px, at every width — check with
           `getComputedStyle` before changing this. The rail indents 20px to
           match, because what it has to line up with is the headline directly
           above it, not the config's intention.

           The one place it is not flat is where the container stops growing: at
           1440 it caps and centres, so the content edge becomes the centring
           offset plus the same 20px. That threshold is the *container's* 2xl
           (1440px), which is not Tailwind's `2xl:` variant (1536px) — hence the
           explicit media query. At 1440 exactly the offset is 0 and the two
           branches agree, so there is no step. */
        '[--rail-card:min(82vw,20rem)] [--rail-gap:1rem] [--rail-h:26rem]',
        'sm:[--rail-card:22rem] sm:[--rail-h:28rem]',
        /* 28rem and not 30: with `.section-sm`'s 64px bands, the header and the
           control row, 30rem put the section at 909px and pushed the arrows just
           off the bottom of a 900px laptop — the one screen where a visitor most
           needs to see that the rail moves. */
        'lg:[--rail-card:clamp(17rem,24vw,23rem)] lg:[--rail-gap:clamp(1rem,1.5vw,1.75rem)] lg:[--rail-h:28rem]',
        '[--rail-edge:1.25rem] [@media(min-width:1440px)]:[--rail-edge:calc((100vw-1440px)/2+1.25rem)]',
      )}
    >
      <div className="container">
        <SectionHeader
          overline="Selected work"
          title={heading}
          lead={lead}
          action={<CtaLink href={ROUTES.projects}>All projects</CtaLink>}
        />
      </div>

      <div
        ref={paneRef}
        role="region"
        aria-label="Selected projects"
        tabIndex={0}
        onScroll={onPaneScroll}
        onFocusCapture={onFocusCapture}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        /* A finger or a trackpad arriving mid-tween takes the rail over at
           once. Without these the visitor's own scroll and ours write
           `scrollLeft` on alternate frames and the rail judders. */
        onTouchStart={cancelMotion}
        onWheel={cancelMotion}
        className={cn(
          /* `relative` is not decoration — see the `useScroll` note above. */
          'no-scrollbar relative mt-8 overflow-x-auto overscroll-x-contain lg:mt-10',
          /*
            `scroll-px` at the same inset as the track is what parks a card
            against the gutter the headline starts at. Without it a snapped card
            lands flush to the viewport edge and reads as cropped. This is the
            codebase's first use of scroll-snap; there is no house pattern yet.

            Mandatory only on the narrowest screens. One card fills the view
            there, so every scroll *is* a move from one card to the next and
            mandatory is exactly right. From `sm` up several are visible at once
            and mandatory re-targets on every frame of a trackpad flick, which is
            the stickiness this rail was reported for — proximity snaps when you
            come to rest near a stop and otherwise leaves the gesture alone.
          */
          'snap-x snap-mandatory scroll-px-[var(--rail-edge)] sm:snap-proximity',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
          scrollable && 'cursor-grab active:cursor-grabbing',
        )}
      >
        <ol className="flex w-max gap-[var(--rail-gap)] px-[var(--rail-edge)]" ref={trackRef}>
          {projects.map((project, i) => (
            <RailCard
              key={project.id}
              project={project}
              index={i}
              scrollX={scrollX}
              metrics={metrics}
              skew={skew}
              reduced={reduced}
            />
          ))}
          <RailEndCard total={total} index={lastIndex} skew={skew} />
        </ol>
      </div>

      {/* Hidden when everything already fits: a progress bar that cannot move
          and arrows that cannot go anywhere are worse than no chrome at all. */}
      {scrollable && (
        <div className="container mt-6 flex items-center gap-4 lg:mt-8">
          <span className="num shrink-0 text-caption tabular-nums text-subtle">
            {String(range.first + 1).padStart(2, '0')}
            {range.last > range.first && `–${String(range.last + 1).padStart(2, '0')}`}
            <span className="text-subtle/50"> / </span>
            {String(count).padStart(2, '0')}
          </span>

          <div className="relative h-px flex-1 bg-[rgb(var(--c-border))]" aria-hidden>
            <motion.div style={{ scaleX: bar }} className="absolute inset-0 origin-left bg-cyan-500" />
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
            {stops.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToStop(i)}
                aria-label={`Go to view ${i + 1} of ${stops.length}`}
                aria-current={stop === i}
                className="group/dot grid h-6 w-4 place-items-center rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-500"
              >
                <span
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500 ease-out-expo',
                    stop === i
                      ? 'w-5 bg-cyan-500'
                      : 'w-1.5 bg-[rgb(var(--c-text))]/20 group-hover/dot:bg-[rgb(var(--c-text))]/40',
                  )}
                />
              </button>
            ))}
          </div>

          {/*
            The arrows are the affordance, not the decoration.

            With the scrollbar hidden, a visitor on a mouse with no horizontal
            wheel has no other way to discover that the rail moves. They are
            disabled rather than hidden at the ends so the control does not
            move under the cursor mid-traverse.
          */}
          <div className="flex shrink-0 items-center gap-2">
            {[
              { dir: -1, label: 'Previous projects', Icon: ArrowLeft, disabled: stop === 0 },
              { dir: 1, label: 'Next projects', Icon: ArrowRight, disabled: stop >= stops.length - 1 },
            ].map(({ dir, label, Icon, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={() => goToStop(stop + dir)}
                disabled={disabled}
                aria-label={label}
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-full border transition-all duration-300 ease-out-expo',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
                  disabled
                    ? 'cursor-not-allowed border-[rgb(var(--c-border))] text-subtle opacity-40'
                    : 'border-[rgb(var(--c-border))] text-[rgb(var(--c-text))] hover:border-cyan-600 hover:bg-cyan-500/[0.07] hover:text-cyan-700',
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

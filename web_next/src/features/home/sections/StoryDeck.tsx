'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Maximize2, Play } from 'lucide-react';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * The home page's deck of portrait cards — client stories, and the selected
 * work, which the client asked to look and move the same (Oct 2026).
 *
 * Built to the client's own prototype for the stories (a desktop screenshot
 * and a phone recording), on the page's light ground at the client's choice.
 *
 * ── Two layouts ─────────────────────────────────────────────────────────────
 * - From `md`: a row of portrait cards, four to the container on a laptop and
 *   three on a tablet, with arrows that move it a card at a time. It is a
 *   native scroller (snap, swipe, trackpad, shift-wheel), and the arrows only
 *   write `scrollLeft`.
 * - On a phone: the band is one screen, and one card fills it — 90% of the
 *   width, with the cards either side showing their outer 5%. Stepping (the
 *   arrows, the dots, a tap on a side card, a sideways swipe) cross-fades the
 *   card in place rather than sliding it, and runs round from the last card to
 *   the first, as the prototype does. For the section engine (lib/section-nav)
 *   the band is a screen-tall stop like a chapter; it leaves sideways strokes
 *   alone, so the swipe here never fights the page's.
 * A phone held sideways has no room for a screen-tall card and gets the row.
 * The two are swapped by CSS (globals.css, "Story deck"), so the server markup
 * is the same at every width and nothing changes after hydration.
 *
 * ── The labels ──────────────────────────────────────────────────────────────
 * The prototype's notes on its own proportions — "5% | 90% center … stage |
 * 5%", "5% · 90% center · 5%" — and its "Click any card for … Popup" hints were
 * kept word for word at the client's request (Oct 2026), and taken off on
 * 25 Oct 2026, when the band went neutral on the light page: they read as a
 * designer's annotations to a visitor. Restore them from git if the client
 * wants them back.
 *
 * Every card opens its deck's full-screen popup (StoryPopup) on itself — the
 * stories' player, the work's photograph — and the popup steps through the
 * rest.
 */
export function StoryDeck<T extends { id: string }>({
  items,
  dataSection,
  label,
  overline,
  title,
  aside,
  foot,
  face,
  nameOf,
  cardLabel,
  onOpen,
}: {
  items: T[];
  /** The band's stop name for the section engine. */
  dataSection: string;
  /** The row's accessible name, and the noun the stage's controls use ("Videos", "Projects"). */
  label: { row: string; items: string; item: string };
  overline: string;
  title: ReactNode;
  /** More of the header's right-hand side, after the arrows. */
  aside?: ReactNode;
  /** Under the phone's controls. */
  foot?: ReactNode;
  /** A card's face — usually a `DeckFace`. `on` is whether it is the one showing, where faces are stacked. */
  face: (item: T, index: number, stage: boolean, on: boolean) => ReactNode;
  nameOf: (item: T) => string;
  /** A card's accessible name. */
  cardLabel: (item: T) => string;
  onOpen: (index: number) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const count = items.length;

  /* The phone's card: which one is in the middle. */
  const [index, setIndex] = useState(0);
  const step = useCallback((by: number) => setIndex((i) => (count ? (i + by + count) % count : 0)), [count]);

  /* ── The row's scroll state, for its arrows ─────────────────────────────── */
  const paneRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const frame = useRef(0);

  const measure = useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const max = pane.scrollWidth - pane.clientWidth;
    /* 1px of slack: fractional scroll positions never quite reach `max`. */
    setEdges({ atStart: pane.scrollLeft <= 1, atEnd: pane.scrollLeft >= max - 1 });
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    measure();
    const pane = paneRef.current;
    if (!pane) return;
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [measure, count]);

  /* A card per press. The arrows stay on screen even when the row fits — the
     prototype draws them — and are disabled where they cannot go. */
  const scrollRow = useCallback(
    (dir: 1 | -1) => {
      const pane = paneRef.current;
      const card = pane?.querySelector('li');
      if (!pane || !card) return;
      const gap = parseFloat(getComputedStyle(card.parentElement!).columnGap) || 0;
      pane.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced],
  );

  /* A sideways swipe on the phone's card, as on the hero (Hero.tsx): only a
     clearly horizontal stroke counts, the listeners are passive, and a stroke
     that moved the page is a scroll whatever its angle — the section engine
     decides the axis in the first few pixels. */
  const touch = useRef<{ x: number; y: number; sy: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    if (count < 2 || e.touches.length !== 1) return;
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, sy: window.scrollY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    if (!from || Math.abs(window.scrollY - from.sy) > 4) return;
    const dx = e.changedTouches[0].clientX - from.x;
    const dy = e.changedTouches[0].clientY - from.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) step(dx < 0 ? 1 : -1);
  };

  if (!count) return null;

  const at = Math.min(index, count - 1);
  const prev = (at - 1 + count) % count;
  const next = (at + 1) % count;
  const faces = (on: number) => (
    <span className="cs-fade">
      {/* Fragments: the faces must be the fade's own children (globals.css, `.cs-fade > .cs-face`). */}
      {items.map((item, i) => (
        <Fragment key={item.id}>{face(item, i, true, i === on)}</Fragment>
      ))}
    </span>
  );
  /* A card's frame: a button that opens the deck's popup on it. */
  const card = (i: number, className: string, children: ReactNode) => (
    <button type="button" className={className} onClick={() => onOpen(i)} aria-label={cardLabel(items[i])}>
      {children}
    </button>
  );

  return (
    <section data-section={dataSection} className="story-deck section-sm">
      <div className="container cs-head">
        <div>
          <p className="overline cs-overline">{overline}</p>
          <h2 className="cs-title">{title}</h2>
        </div>
        <div className="cs-head__aside">
          {[
            { dir: -1 as const, text: `Previous ${label.items.toLowerCase()}`, Icon: ArrowLeft, disabled: edges.atStart },
            { dir: 1 as const, text: `Next ${label.items.toLowerCase()}`, Icon: ArrowRight, disabled: edges.atEnd },
          ].map(({ dir, text, Icon, disabled }) => (
            <button key={text} type="button" className="cs-arrow" onClick={() => scrollRow(dir)} disabled={disabled} aria-label={text}>
              <Icon className="h-5 w-5" />
            </button>
          ))}
          {aside}
        </div>
      </div>

      {/* ── The row (md and up, and a phone held sideways) ── */}
      <div
        ref={paneRef}
        role="region"
        aria-label={label.row}
        data-hscroll=""
        tabIndex={0}
        onScroll={onScroll}
        className="cs-rail no-scrollbar overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--c-text))]"
      >
        <ol>
          {items.map((item, i) => (
            <li key={item.id}>{card(i, 'cs-card cs-card--row', face(item, i, false, true))}</li>
          ))}
        </ol>
      </div>

      {/* ── The stage (a phone) ── */}
      <div className="cs-stage">
        <div className="cs-stage__area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {count > 1 && (
            <button
              type="button"
              className="cs-card cs-peek cs-peek--prev"
              onClick={() => step(-1)}
              aria-label={`Previous ${label.item.toLowerCase()}: ${nameOf(items[prev])}`}
            >
              {faces(prev)}
            </button>
          )}
          {card(at, 'cs-card cs-card--stage', faces(at))}
          {count > 1 && (
            <button
              type="button"
              className="cs-card cs-peek cs-peek--next"
              onClick={() => step(1)}
              aria-label={`Next ${label.item.toLowerCase()}: ${nameOf(items[next])}`}
            >
              {faces(next)}
            </button>
          )}
        </div>

        {count > 1 && (
          <div className="cs-stage__controls">
            <button type="button" className="cs-step" onClick={() => step(-1)} aria-label={`Previous ${label.item.toLowerCase()}`}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center" role="group" aria-label={label.items}>
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className="cs-dot"
                  onClick={() => setIndex(i)}
                  aria-label={`${label.item} ${i + 1} of ${count}: ${nameOf(item)}`}
                  aria-current={i === at ? 'true' : undefined}
                />
              ))}
            </div>
            <button type="button" className="cs-step" onClick={() => step(1)} aria-label={`Next ${label.item.toLowerCase()}`}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
        {foot && <div className="cs-stage__foot">{foot}</div>}
      </div>
    </section>
  );
}

/** "Dr. Ashok Verma" → ["Dr. Ashok", "Verma"]: the prototype sets the last word on a line of its own (in a lighter weight on the cards). */
export function splitName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [name.trim(), ''];
}

/**
 * What a card shows: the picture, its shade, the counter, the round button in
 * the middle and the name. The frame round it is the deck's — the row's card,
 * or the phone's card and side cards, where every face is stacked in one frame
 * and cross-fades (`on`), so the frame itself never moves.
 */
export function DeckFace({
  image,
  n,
  total,
  stage,
  on,
  icon,
  stageLabel,
  eyebrow,
  name,
}: {
  image: string;
  n: number;
  total: number;
  stage: boolean;
  on: boolean;
  /** `play` for a film, `expand` for a photograph. */
  icon: 'play' | 'expand';
  /** Under the button, on the phone's card. */
  stageLabel: string;
  /** A small line over the name. */
  eyebrow?: string;
  name: string;
}) {
  const [first, last] = splitName(name);
  return (
    <span className="cs-face" data-on={on ? '' : undefined} aria-hidden>
      <img src={image} alt="" loading="lazy" decoding="async" draggable={false} />
      <span className="cs-face__shade" />
      <span className="cs-face__count">
        {n}/{total}
      </span>
      <span className="cs-face__play">
        <span>
          {/* `ml-0.5` optically centres the triangle. */}
          {icon === 'play' ? <Play className="ml-0.5 h-5 w-5 fill-current" /> : <Maximize2 className="h-5 w-5" />}
        </span>
        {stage && <small>{stageLabel}</small>}
      </span>
      <span className="cs-face__name">
        {eyebrow && <span className="cs-face__eyebrow">{eyebrow}</span>}
        {first}
        {last && <span>{last}</span>}
      </span>
    </span>
  );
}

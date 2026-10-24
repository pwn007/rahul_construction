'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { resolveVideo } from '@/components/common/VideoLightbox';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks';
import { useClientVideos } from '@/hooks/useClientVideos';
import type { ClientVideo } from '@/types/domain';
import { ClientStoryPlayer, splitName } from './ClientStoryPlayer';

/**
 * Client stories — recorded client testimonials.
 *
 * Built to the client's own prototype (Oct 2026: a desktop screenshot and a
 * phone recording), on the page's light ground at the client's choice. Its
 * film data is its own resource (`client-videos`, Admin → Client videos), so
 * there can be more films than written quotes, or fewer.
 *
 * ── Two layouts ─────────────────────────────────────────────────────────────
 * - From `md`: a row of portrait cards, four to the container on a laptop and
 *   three on a tablet, with arrows that move it a card at a time. It is the
 *   native scroller it always was (snap, swipe, trackpad, shift-wheel), and the
 *   arrows only write `scrollLeft`.
 * - On a phone: the band is one screen, and one film fills it — the card
 *   takes 90% of the width and the cards either side show their outer 5%.
 *   Stepping (the arrows, the dots, a tap on a side card, a sideways swipe)
 *   cross-fades the card in place rather than sliding it, and runs round from
 *   the last film to the first, as the prototype does. For the section engine
 *   (lib/section-nav) the band is a screen-tall stop like a chapter; it leaves
 *   sideways strokes alone, so the swipe here never fights the page's.
 * A phone held sideways has no room for a screen-tall card and gets the row.
 * The two are swapped by CSS (globals.css, "Client stories"), so the server
 * markup is the same at every width and nothing changes after hydration.
 *
 * ── The labels ──────────────────────────────────────────────────────────────
 * "Desktop responsive layout", "5% | 90% center video stage | 5%",
 * "5% · 90% center · 5%" and the player's "100% full-screen reel" are the
 * prototype's notes on its own proportions. They are kept word for word at the
 * client's request (Oct 2026) — they are not placeholder copy left behind.
 *
 * ── Playing ─────────────────────────────────────────────────────────────────
 * Any card opens `ClientStoryPlayer`, the full-screen player, on that film.
 * The films are files (the client confirmed none will be YouTube), so the
 * player draws its own controls; a provider link still plays, in that
 * provider's player.
 */
export function ClientVideos() {
  const raw = useClientVideos();
  const reduced = usePrefersReducedMotion();

  /* A row with no playable URL would be a play button that does nothing. */
  const videos = useMemo(
    () => raw.filter((v) => v.videoUrl && resolveVideo(v.videoUrl)).sort((a, b) => a.order - b.order),
    [raw],
  );
  const count = videos.length;

  /* The phone's card: which film is in the middle. */
  const [index, setIndex] = useState(0);
  const step = useCallback((by: number) => setIndex((i) => (count ? (i + by + count) % count : 0)), [count]);
  /* The player: which film it is showing, or closed. */
  const [playing, setPlaying] = useState<number | null>(null);
  const close = useCallback(() => setPlaying(null), []);

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
  const faces = (on: number, stage: boolean) => (
    <span className="cs-fade">
      {videos.map((v, i) => (
        <StoryFace key={v.id} video={v} n={i + 1} total={count} stage={stage} on={i === on} />
      ))}
    </span>
  );

  return (
    <section data-section="client-videos" className="client-stories section-sm">
      <div className="container cs-head">
        <div>
          <p className="overline cs-overline">Desktop responsive layout</p>
          <h2 className="cs-title">
            <span className="text-[rgb(var(--c-brand-text))]">Client</span> Stories
          </h2>
        </div>
        <div className="cs-head__aside">
          <p className="text-sm font-semibold">Click any card for Cinema Popup</p>
          {[
            { dir: -1 as const, label: 'Previous videos', Icon: ArrowLeft, disabled: edges.atStart },
            { dir: 1 as const, label: 'Next videos', Icon: ArrowRight, disabled: edges.atEnd },
          ].map(({ dir, label, Icon, disabled }) => (
            <button
              key={label}
              type="button"
              className="cs-arrow"
              onClick={() => scrollRow(dir)}
              disabled={disabled}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── The row (md and up, and a phone held sideways) ── */}
      <div
        ref={paneRef}
        role="region"
        aria-label="Client videos"
        data-hscroll=""
        tabIndex={0}
        onScroll={onScroll}
        className="cs-rail no-scrollbar overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
      >
        <ol>
          {videos.map((v, i) => (
            <li key={v.id}>
              <button
                type="button"
                className="cs-card cs-card--row"
                onClick={() => setPlaying(i)}
                aria-label={`Play video from ${v.name}, ${v.locality}`}
              >
                <StoryFace video={v} n={i + 1} total={count} stage={false} on />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* ── The stage (a phone) ── */}
      <div className="cs-stage">
        <div className="cs-strip" aria-hidden>
          <span>5%</span>
          <span>
            <span>◂</span>
            90% Center Video Stage
            <span>▸</span>
          </span>
          <span>5%</span>
        </div>

        <div className="cs-stage__area" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {count > 1 && (
            <button
              type="button"
              className="cs-card cs-peek cs-peek--prev"
              onClick={() => step(-1)}
              aria-label={`Previous video: ${videos[prev].name}`}
            >
              {faces(prev, true)}
            </button>
          )}
          <button
            type="button"
            className="cs-card cs-card--stage"
            onClick={() => setPlaying(at)}
            aria-label={`Play video from ${videos[at].name}, ${videos[at].locality}`}
          >
            {faces(at, true)}
          </button>
          {count > 1 && (
            <button
              type="button"
              className="cs-card cs-peek cs-peek--next"
              onClick={() => step(1)}
              aria-label={`Next video: ${videos[next].name}`}
            >
              {faces(next, true)}
            </button>
          )}
        </div>

        {count > 1 && (
          <div className="cs-stage__controls">
            <button type="button" className="cs-step" onClick={() => step(-1)} aria-label="Previous video">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center" role="group" aria-label="Videos">
              {videos.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  className="cs-dot"
                  onClick={() => setIndex(i)}
                  aria-label={`Video ${i + 1} of ${count}: ${v.name}`}
                  aria-current={i === at ? 'true' : undefined}
                />
              ))}
            </div>
            <button type="button" className="cs-step" onClick={() => step(1)} aria-label="Next video">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="cs-note ml-auto" aria-hidden>
              • 5% • 90% Center • 5% •
            </span>
          </div>
        )}
      </div>

      <ClientStoryPlayer videos={videos} index={playing} onIndex={setPlaying} onClose={close} />
    </section>
  );
}

/**
 * What a card shows: the poster, its shade, the counter, the play button and
 * the name. The frame round it is the caller's — the row's card, or the phone's
 * card and side cards, where every film's face is stacked in one frame and
 * cross-fades (`on`), so the frame itself never moves.
 */
function StoryFace({ video, n, total, stage, on }: { video: ClientVideo; n: number; total: number; stage: boolean; on: boolean }) {
  const [first, last] = splitName(video.name);
  return (
    <span className="cs-face" data-on={on ? '' : undefined} aria-hidden>
      <img src={video.poster} alt="" loading="lazy" decoding="async" draggable={false} />
      <span className="cs-face__shade" />
      <span className="cs-face__count">
        {n}/{total}
      </span>
      <span className={cn('cs-face__play', stage && 'cs-face__play--stage')}>
        {/* `ml-0.5` optically centres the triangle. */}
        <span>
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
        {stage && <small>Video</small>}
      </span>
      <span className="cs-face__name">
        {first}
        {last && <span>{last}</span>}
      </span>
    </span>
  );
}

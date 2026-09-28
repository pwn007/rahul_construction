'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { SectionHeader } from '@/components/common';
import { VideoLightbox, resolveVideo } from '@/components/common/VideoLightbox';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks';
import { useClientVideos } from '@/hooks/useClientVideos';
import { useHomeSections } from '@/hooks/useHomeSections';
import { useProjects } from '@/features/projects/useProjects';
import type { ClientVideo } from '@/types/domain';

/**
 * Recorded client testimonials, as a rail the visitor moves themselves.
 *
 * Split out of the testimonials band at the client's request (Sep 2026): that
 * band is now words only, and every client's film lives here, directly below
 * it. The data is its own resource (`client-videos`, Admin → Client videos),
 * so there can be more films than written quotes, or fewer.
 *
 * ── Portrait cards ──────────────────────────────────────────────────────────
 * Client recordings are phone recordings, so the cards are 9:16 — the shape the
 * footage most often is, and narrow enough that four or five sit side by side
 * on a laptop. The lightbox is told to fit the film rather than assume 16:9,
 * because some will be landscape anyway.
 *
 * ── Deliberately not `WorkRail` ─────────────────────────────────────────────
 * It borrows that rail's geometry — the `--rail-edge` gutter that parks the
 * first card under the headline, `snap-mandatory` on phones and proximity
 * above — and its control row, but none of its parallax, drag or velocity
 * skew. Those are the project rail's showpiece; here the posters are the
 * content and the play button is the only thing that needs to move. Native
 * scrolling (swipe, trackpad, shift-wheel, arrow keys on the focused pane)
 * plus the two arrow buttons cover every input.
 */
export function ClientVideos() {
  const section = useHomeSections().find((s) => s.key === 'client-videos');
  const projects = useProjects();
  const raw = useClientVideos();
  const reduced = usePrefersReducedMotion();

  /* A row with no playable URL would be a play button that does nothing. */
  const videos = useMemo(
    () => raw.filter((v) => v.videoUrl && resolveVideo(v.videoUrl)).sort((a, b) => a.order - b.order),
    [raw],
  );

  const [active, setActive] = useState<ClientVideo | null>(null);
  /* Stable, because VideoLightbox's key/focus effect depends on it. */
  const close = useCallback(() => setActive(null), []);

  /* ── Scroll state for the control row ──────────────────────────────────── */
  const paneRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true, progress: 0 });
  const frame = useRef(0);

  const measure = useCallback(() => {
    const pane = paneRef.current;
    if (!pane) return;
    const max = pane.scrollWidth - pane.clientWidth;
    /* 1px of slack: fractional scroll positions never quite reach `max`. */
    setEdges({
      atStart: pane.scrollLeft <= 1,
      atEnd: pane.scrollLeft >= max - 1,
      progress: max > 0 ? pane.scrollLeft / max : 1,
    });
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
  }, [measure, videos.length]);

  /* Hidden when everything already fits — arrows that cannot go anywhere are
     worse than no arrows. */
  const scrollable = !(edges.atStart && edges.atEnd);

  /* One press moves by every card that is fully in view, less one, so the last
     card seen stays on screen as a landmark. Never less than one card. */
  const step = useCallback(
    (dir: 1 | -1) => {
      const pane = paneRef.current;
      const card = pane?.querySelector('li');
      if (!pane || !card) return;
      const gap = parseFloat(getComputedStyle(card.parentElement!).columnGap) || 0;
      const stride = card.getBoundingClientRect().width + gap;
      const cards = Math.max(1, Math.floor(pane.clientWidth / stride) - 1);
      pane.scrollBy({ left: dir * cards * stride, behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced],
  );

  if (videos.length === 0) return null;

  return (
    <section
      className={cn(
        'client-videos section-sm',
        /* The same gutter WorkRail measures against — see the long note on its
           <section>. 20px at every width, plus the centring offset once the
           container caps at 1440. */
        '[--rail-edge:1.25rem] [@media(min-width:1440px)]:[--rail-edge:calc((100vw-1440px)/2+1.25rem)]',
      )}
    >
      <div className="container">
        <SectionHeader
          overline="Client stories"
          title={section?.heading || 'Hear it from our clients'}
          lead={section?.subheading || 'In their own words, on camera — the people we built for, on what it was like.'}
        />
      </div>

      <div
        ref={paneRef}
        role="region"
        aria-label="Client videos"
        tabIndex={0}
        onScroll={onScroll}
        className={cn(
          'no-scrollbar mt-8 overflow-x-auto overscroll-x-contain lg:mt-10',
          /* Mandatory on phones, where one card fills the view and every swipe
             is a move to the next one; proximity above, where mandatory fights
             a trackpad flick. Same split as WorkRail, for the same reason. */
          'snap-x snap-mandatory scroll-px-[var(--rail-edge)] sm:snap-proximity',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
        )}
      >
        <ol className="flex w-max gap-4 px-[var(--rail-edge)] pb-1 lg:gap-5">
          {videos.map((video, i) => (
            <Reveal
              key={video.id}
              as="li"
              /* Capped: a card scrolled into view later should not wait half a
                 second for a stagger meant for the first screenful. */
              delay={Math.min(i, 4) * 0.07}
              className="w-[min(62vw,15rem)] shrink-0 snap-start sm:w-60 lg:w-64"
            >
              <VideoCard
                video={video}
                projectTitle={projects.find((p) => p.id === video.projectId)?.title}
                onPlay={() => setActive(video)}
              />
            </Reveal>
          ))}
        </ol>
      </div>

      {scrollable && (
        <div className="container mt-6 flex items-center gap-4 lg:mt-8">
          <div className="relative h-px flex-1 bg-[rgb(var(--c-border))]" aria-hidden>
            <div
              className="absolute inset-0 origin-left bg-cyan-500 transition-transform duration-150"
              style={{ transform: `scaleX(${Math.max(edges.progress, 0.04)})` }}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {[
              { dir: -1 as const, label: 'Previous videos', Icon: ArrowLeft, disabled: edges.atStart },
              { dir: 1 as const, label: 'Next videos', Icon: ArrowRight, disabled: edges.atEnd },
            ].map(({ dir, label, Icon, disabled }) => (
              <button
                key={label}
                type="button"
                onClick={() => step(dir)}
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

      <VideoLightbox
        open={active !== null}
        onClose={close}
        url={active?.videoUrl ?? ''}
        title={active ? `${active.name} — ${active.locality}` : ''}
        poster={active?.poster}
        fitToVideo
      />
    </section>
  );
}

function VideoCard({
  video,
  projectTitle,
  onPlay,
}: {
  video: ClientVideo;
  projectTitle?: string;
  onPlay: () => void;
}) {
  const subline = [video.title, video.locality].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play video from ${video.name}, ${video.locality}`}
      className={cn(
        'group/v relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-ink-950 text-left shadow-sm',
        'transition-shadow duration-500 ease-out-expo hover:shadow-md',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
      )}
    >
      <img
        src={video.poster}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover/v:scale-105"
      />
      {/* Heavier at the foot, where the name sits over whatever the poster is. */}
      <span className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/10 to-ink-950/20" aria-hidden />

      {video.duration && (
        <span className="num absolute right-3 top-3 rounded bg-ink-950/70 px-2 py-0.5 text-[0.7rem] text-white backdrop-blur-sm">
          {video.duration}
        </span>
      )}

      {/* The site's one play button — same markup the testimonial card used
          when it still carried films. `ml-0.5` optically centres the triangle. */}
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-navy-800 shadow-md transition-transform duration-500 ease-out-expo group-hover/v:scale-110">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 p-4 text-white">
        <span className="block truncate text-sm font-semibold">{video.name}</span>
        {subline && <span className="mt-0.5 block truncate text-caption text-white/70">{subline}</span>}
        {projectTitle && (
          <span className="mt-2 inline-block max-w-full truncate rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-medium text-white backdrop-blur-sm">
            {projectTitle}
          </span>
        )}
      </span>
    </button>
  );
}

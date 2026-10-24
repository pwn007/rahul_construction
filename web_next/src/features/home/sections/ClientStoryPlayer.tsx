'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { LogoLockup } from '@/components/common/Logo';
import { resolveVideo } from '@/components/common/VideoLightbox';
import { useLockBodyScroll } from '@/hooks';
import { cn } from '@/lib/cn';
import type { ClientVideo } from '@/types/domain';

/**
 * The client stories' full-screen player — the prototype's "100% popup".
 *
 * It takes the whole screen on every device: the lockup and the close button
 * across the top, the band's title, the film in a frame that fills what is
 * left, and the client's name under it. In the frame: the sound chip, the
 * counter, play/pause, the previous and next films (running round, like the
 * band), and the time with a seek bar. On a laptop the frame is the film's
 * own upright shape, centred; the prototype only drew the phone.
 *
 * The plumbing is `VideoLightbox`'s: a portal, mounted only while open, the
 * body locked (which also stands the section engine down — lib/section-nav
 * `blocked()`), Escape to leave, and focus handed back to the card that
 * opened it. `data-lenis-prevent` because Lenis ignores the body lock — see
 * the preloader in Chrome.tsx.
 *
 * It starts muted, as browsers require for a film that starts itself; the chip
 * turns the sound on, and the choice holds for the next film.
 */
export function ClientStoryPlayer({
  videos,
  index,
  onIndex,
  onClose,
}: {
  videos: ClientVideo[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = videos.length;
  const open = index !== null && count > 0;
  const at = open ? Math.min(index, count - 1) : 0;
  const [muted, setMuted] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    /* Send focus back where it came from — the card that opened this. */
    return () => opener?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) onIndex((at - 1 + count) % count);
      else if (e.key === 'ArrowRight' && count > 1) onIndex((at + 1) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, at, count, onIndex, onClose]);

  if (typeof document === 'undefined') return null;

  const video = videos[at];
  const [first, last] = video ? splitName(video.name) : ['', ''];

  return createPortal(
    <AnimatePresence>
      {open && video && (
        <motion.div
          key="client-story-player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="cs-player"
          role="dialog"
          aria-modal="true"
          aria-label={`Client story — ${video.name}, ${video.locality}`}
          data-lenis-prevent
        >
          <div className="cs-player__bar">
            <span className="w-11" aria-hidden />
            <LogoLockup tone="light" className="h-8" />
            <button ref={closeRef} type="button" className="cs-player__close" onClick={onClose} aria-label="Close Full-Screen Video">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="cs-player__title">Client Stories</p>

          <div className="cs-player__stage">
            <Reel
              key={video.id}
              video={video}
              n={at + 1}
              total={count}
              muted={muted}
              onMuted={setMuted}
              onStep={count > 1 ? (by) => onIndex((at + by + count) % count) : undefined}
            />
          </div>

          <div className="cs-player__name">
            <p>
              {first}
              {last && <span>{last}</span>}
            </p>
            <p>Client Story</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** "Dr. Ashok Verma" → ["Dr. Ashok", "Verma"]: the prototype sets the last word on a line of its own (in cyan on the cards). */
export function splitName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [name.trim(), ''];
}

const time = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/** One film in its frame, with its controls. Keyed by film, so each starts from the top with fresh state. */
function Reel({
  video,
  n,
  total,
  muted,
  onMuted,
  onStep,
}: {
  video: ClientVideo;
  n: number;
  total: number;
  muted: boolean;
  onMuted: (muted: boolean) => void;
  onStep?: (by: 1 | -1) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(0);
  /* An upright film fills the frame; a wide one is shown whole, letterboxed, rather than cropped to a sliver. */
  const [wide, setWide] = useState(false);
  const source = resolveVideo(video.videoUrl);

  /* React does not keep the `muted` attribute in step with the prop, and a browser decides whether a film
     may start itself from the element's own state — so it is written here as well. */
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const counter = <span className="cs-reel__count">{`${n}/${total}`}</span>;
  const steps = onStep && (
    <>
      <button type="button" className="cs-reel__step left-3" onClick={() => onStep(-1)} aria-label="Previous video">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" className="cs-reel__step right-3" onClick={() => onStep(1)} aria-label="Next video">
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
  );

  if (source?.kind === 'embed') {
    return (
      <div className="cs-reel">
        <iframe
          src={source.src}
          title={`${video.name} — ${video.locality}`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {counter}
        {steps}
      </div>
    );
  }

  return (
    <div className="cs-reel">
      {/* Behind a wide film, its poster, blurred, so the letterbox is not two slabs of black. */}
      {wide && <img src={video.poster} alt="" className="cs-reel__backdrop" aria-hidden />}
      <video
        ref={ref}
        src={video.videoUrl}
        poster={video.poster}
        className={cn('absolute inset-0 h-full w-full', wide ? 'object-contain' : 'object-cover')}
        autoPlay
        muted={muted}
        playsInline
        preload="metadata"
        onClick={toggle}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setLength(Number.isFinite(v.duration) ? v.duration : 0);
          setWide(v.videoWidth > v.videoHeight);
        }}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <span className="cs-reel__scrim cs-reel__scrim--top" aria-hidden />
      <span className="cs-reel__scrim cs-reel__scrim--bottom" aria-hidden />

      <button
        type="button"
        className="cs-reel__chip"
        onClick={() => onMuted(!muted)}
        aria-pressed={!muted}
        aria-label={muted ? 'Turn sound on' : 'Mute'}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        {muted ? 'Muted' : 'Sound on'}
      </button>
      {counter}

      <button type="button" className="cs-reel__play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
      </button>
      {steps}

      <div className="cs-reel__foot">
        <div className="cs-reel__times">
          <span>{time(at)}</span>
          <span className="cs-note">100% Full-Screen Reel</span>
          <span>{time(length)}</span>
        </div>
        <input
          type="range"
          className="cs-range"
          min={0}
          max={length || 0}
          step={0.1}
          value={Math.min(at, length || 0)}
          onChange={(e) => {
            const t = Number(e.target.value);
            if (ref.current) ref.current.currentTime = t;
            setAt(t);
          }}
          aria-label="Seek"
          aria-valuetext={`${time(at)} of ${time(length)}`}
          style={{ '--p': `${length ? (Math.min(at, length) / length) * 100 : 0}%` } as CSSProperties}
        />
      </div>
    </div>
  );
}

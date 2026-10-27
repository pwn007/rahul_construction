'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { resolveVideo } from '@/components/common/VideoLightbox';
import { cn } from '@/lib/cn';
import type { ClientVideo } from '@/types/domain';
import { PopupSteps, StoryPopup, useSwipeStep } from './StoryPopup';

/**
 * The client stories' full-screen player: the decks' popup (StoryPopup) with a
 * film in its frame. In the frame: the sound chip, the counter, play/pause,
 * the previous and next films (running round, like the deck, and by a sideways
 * swipe), and the time with a seek bar.
 *
 * On a phone it is a reel (client, 27 Oct 2026): the film is the whole screen,
 * the lockup, title and name on it (StoryPopup `reel`).
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
  const at = index === null ? 0 : Math.min(index, count - 1);
  const video = index === null ? undefined : videos[at];
  const [muted, setMuted] = useState(true);
  const step = count > 1 ? (by: 1 | -1) => onIndex((at + by + count) % count) : undefined;

  return (
    <StoryPopup
      open={!!video}
      title="Client Stories"
      label={video ? `Client story — ${video.name}, ${video.locality}` : ''}
      closeLabel="Close Full-Screen Video"
      name={video?.name ?? ''}
      line="Client Story"
      reel
      onClose={onClose}
      onStep={step}
    >
      {video && <Reel key={video.id} video={video} n={at + 1} total={count} muted={muted} onMuted={setMuted} onStep={step} />}
    </StoryPopup>
  );
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
  const backdrop = useRef<HTMLCanvasElement>(null);
  const swipe = useSwipeStep(onStep);
  const source = resolveVideo(video.videoUrl);

  /* React does not keep the `muted` attribute in step with the prop, and a browser decides whether a film
     may start itself from the element's own state — so it is written here as well. */
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  /* A wide film's backdrop is the film itself, a few pixels across and blurred, painted as it plays — its
     poster need not be a still of it (27 Oct 2026). The canvas is only drawn to, never read back, so a film
     from another origin without CORS still paints. */
  useEffect(() => {
    const v = ref.current;
    const ctx = backdrop.current?.getContext('2d');
    if (!wide || !v || !ctx) return;
    const paint = () => {
      if (v.readyState >= 2) ctx.drawImage(v, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };
    /* Every frame where the browser offers it; otherwise the few times a second `timeupdate` fires. */
    const perFrame = typeof v.requestVideoFrameCallback === 'function';
    const events = perFrame ? ['loadeddata', 'seeked'] : ['loadeddata', 'seeked', 'timeupdate'];
    let frame = 0;
    const loop = () => {
      paint();
      frame = v.requestVideoFrameCallback(loop);
    };
    events.forEach((t) => v.addEventListener(t, paint));
    if (perFrame) frame = v.requestVideoFrameCallback(loop);
    paint();
    return () => {
      events.forEach((t) => v.removeEventListener(t, paint));
      if (perFrame) v.cancelVideoFrameCallback(frame);
    };
  }, [wide]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const counter = <span className="cs-reel__count">{`${n}/${total}`}</span>;
  const steps = onStep && <PopupSteps onStep={onStep} noun="video" />;

  if (source?.kind === 'embed') {
    return (
      <div className="cs-reel" {...swipe}>
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
    <div className="cs-reel" {...swipe}>
      {/* Behind a wide film, the film, blurred, so the letterbox is not two slabs of black. */}
      {wide && <canvas ref={backdrop} width={32} height={18} className="cs-reel__backdrop" aria-hidden />}
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

'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks';
import { cn } from '@/lib/cn';

/**
 * The site's video player. Click-to-play, and nothing before that.
 *
 * ── Why a lightbox and not an inline player ─────────────────────────────────
 * A paused embed is a few hundred KB of player before a single frame is
 * watched; the poster it replaces is a few KB. So the card ships an image, and
 * the player is mounted only once someone asks for it. That is also why the
 * whole component returns `null` while closed rather than hiding a mounted
 * iframe — a hidden iframe has already paid for itself.
 *
 * ── Why no autoplay with sound ──────────────────────────────────────────────
 * Sound a visitor did not ask for is the fastest way to lose them, and browsers
 * block it anyway. The direct-file branch autoplays *muted with controls*, which
 * is permitted and lets someone unmute deliberately; the embed branch hands
 * control to the provider.
 *
 * ── Providers ──────────────────────────────────────────────────────────────
 * YouTube is the case that will actually be used — the client already has a
 * channel (SITE.socials.youtube), so a real testimonial will be a pasted watch
 * URL. `youtube-nocookie.com` keeps that from setting tracking cookies on a
 * visitor who never pressed play on anything.
 */

/** `tall` marks a YouTube Shorts link — the one embed whose ratio the URL gives away. */
type Embed = { kind: 'embed'; src: string; tall?: boolean } | { kind: 'file'; src: string };

/** Exported for the cards, which use it to decide whether to show a play badge. */
export function resolveVideo(url: string): Embed | null {
  const raw = url.trim();
  if (!raw) return null;

  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(raw);
  if (yt) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`, tall: /youtube\.com\/shorts\//.test(raw) };

  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(raw);
  if (vimeo) return { kind: 'embed', src: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` };

  /* Anything else is treated as a playable file. A wrong URL fails visibly in
     the player rather than silently hiding the play button. */
  return { kind: 'file', src: raw };
}

export function VideoLightbox({
  open,
  onClose,
  url,
  title,
  poster,
  fitToVideo = false,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  poster?: string;
  /**
   * Size the frame to the film instead of assuming 16:9 — for client
   * recordings, which are as likely to be shot upright on a phone as not. A
   * file is shown at its own ratio; a YouTube Shorts link gets a 9:16 frame;
   * any other embed stays 16:9, since the URL says nothing about its shape and
   * the provider's player letterboxes inside it anyway.
   */
  fitToVideo?: boolean;
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      /* Send focus back where it came from — the play button that opened this. */
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const video = resolveVideo(url);

  return createPortal(
    <AnimatePresence>
      {open && video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          /* Same shell as the gallery viewer and the projects lightbox, so the
             site has one way of going full-screen over its own content. */
          className="fixed inset-0 z-[120] flex flex-col bg-ink-950/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 text-white">
            <p className="font-display font-semibold">{title}</p>
            <button
              onClick={onClose}
              aria-label="Close video"
              /* p-3 around a 20px icon is a 44px target — the floor for the
                 control whose whole job is letting someone out. */
              className="rounded-md p-3 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <div
              className={cn(
                'overflow-hidden rounded-xl bg-black shadow-xl',
                !fitToVideo
                  ? 'w-full max-w-5xl'
                  : video.kind === 'file'
                    /* Shrink-wraps the <video>, which sizes itself from the file.
                       `min(64rem,100%)` rather than two max-widths so a wide file
                       on a phone cannot push the frame past the screen. */
                    ? 'max-w-[min(64rem,100%)]'
                    : video.tall
                      /* Height-led: the height comes from the viewport and the
                         width from the ratio, so an upright film fits a laptop
                         screen instead of running off the bottom of it. */
                      ? 'aspect-[9/16] h-[min(80vh,42rem)] max-w-full'
                      : 'w-full max-w-5xl',
              )}
            >
              {video.kind === 'embed' ? (
                <iframe
                  src={video.src}
                  title={title}
                  className={cn('w-full', fitToVideo && video.tall ? 'h-full' : 'aspect-video')}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.src}
                  poster={poster}
                  className={cn('bg-black', fitToVideo ? 'block max-h-[80vh] max-w-full' : 'aspect-video w-full')}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

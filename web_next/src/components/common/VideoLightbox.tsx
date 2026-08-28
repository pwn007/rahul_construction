'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks';

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

type Embed = { kind: 'embed'; src: string } | { kind: 'file'; src: string };

/** Exported for the card, which uses it to decide whether to show a play badge. */
export function resolveVideo(url: string): Embed | null {
  const raw = url.trim();
  if (!raw) return null;

  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(raw);
  if (yt) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1` };

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
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  poster?: string;
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
            <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-xl">
              {video.kind === 'embed' ? (
                <iframe
                  src={video.src}
                  title={title}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={video.src}
                  poster={poster}
                  className="aspect-video w-full bg-black"
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

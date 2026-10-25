'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { LogoLockup } from '@/components/common/Logo';
import { useLockBodyScroll } from '@/hooks';
import { splitName } from './StoryDeck';

/**
 * The decks' full-screen popup — the prototype's "100% popup" — around
 * whatever a deck shows in it: a client's film (ClientStoryPlayer) or a
 * project's photograph (ProjectPhotoViewer). One shell, so the two cannot
 * drift apart.
 *
 * It takes the whole screen on every device: the lockup and the close button
 * across the top, the deck's title, the frame (the caller's) filling what is
 * left, and the name under it. On a laptop the frame is an upright 9:16,
 * centred (globals.css, `.cs-reel`); the prototype only drew the phone.
 *
 * The plumbing is `VideoLightbox`'s: a portal, mounted only while open, the
 * body locked (which also stands the section engine down — lib/section-nav
 * `blocked()`), Escape to leave, ← → to step, and focus handed back to the
 * card that opened it. `data-lenis-prevent` because Lenis ignores the body
 * lock — see the preloader in Chrome.tsx.
 */
export function StoryPopup({
  open,
  title,
  label,
  closeLabel,
  name,
  line,
  action,
  onClose,
  onStep,
  children,
}: {
  open: boolean;
  /** The deck's title, over the frame. */
  title: string;
  /** The dialog's accessible name. */
  label: string;
  closeLabel: string;
  /** Under the frame, set on two lines (`splitName`). */
  name: string;
  /** The small line under the name. */
  line: string;
  /** Under the name, e.g. a link to the page behind it. */
  action?: ReactNode;
  onClose: () => void;
  /** The previous or next of the deck's cards; absent with only one. */
  onStep?: (by: 1 | -1) => void;
  /** The frame. */
  children: ReactNode;
}) {
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
      else if (e.key === 'ArrowLeft') onStep?.(-1);
      else if (e.key === 'ArrowRight') onStep?.(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onStep]);

  if (typeof document === 'undefined') return null;

  const [first, last] = splitName(name);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="story-popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="cs-player"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          data-lenis-prevent
        >
          <div className="cs-player__bar">
            <span className="w-11" aria-hidden />
            <LogoLockup tone="light" className="h-8" />
            <button ref={closeRef} type="button" className="cs-player__close" onClick={onClose} aria-label={closeLabel}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="cs-player__title">{title}</p>

          <div className="cs-player__stage">{children}</div>

          <div className="cs-player__name">
            <p>
              {first}
              {last && <span>{last}</span>}
            </p>
            <p>{line}</p>
            {action && <div className="cs-player__action">{action}</div>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** The frame's previous and next buttons, at its sides. */
export function PopupSteps({ onStep, noun }: { onStep: (by: 1 | -1) => void; noun: string }) {
  return (
    <>
      <button type="button" className="cs-reel__step left-3" onClick={() => onStep(-1)} aria-label={`Previous ${noun}`}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" className="cs-reel__step right-3" onClick={() => onStep(1)} aria-label={`Next ${noun}`}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </>
  );
}

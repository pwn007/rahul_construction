import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, MoveHorizontal, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui';
import type { Project, ProjectImage } from '@/types/domain';

/* ==================================================================== */
/* BeforeAfterSlider                                                     */
/* ==================================================================== */

export function BeforeAfterSlider({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      updateFromClientX(clientX);
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [updateFromClientX]);

  return (
    <div
      ref={ref}
      className={cn('relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl', className)}
      onMouseDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        updateFromClientX(e.touches[0]?.clientX ?? 0);
      }}
    >
      <img src={after} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" loading="lazy" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img
          src={before}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${(100 / position) * 100}%`, maxWidth: 'none' }}
          loading="lazy"
          draggable={false}
        />
        <span className="absolute left-4 top-4 rounded-full bg-ink-950/70 px-3 py-1 text-caption text-white backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>

      <span className="absolute right-4 top-4 rounded-full bg-ink-950/70 px-3 py-1 text-caption text-white backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Handle */}
      <div className="absolute inset-y-0 w-0.5 cursor-ew-resize bg-white shadow-lg" style={{ left: `${position}%` }}>
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy-800 shadow-lg">
          <MoveHorizontal className="h-5 w-5" />
        </span>
      </div>

      {/* Keyboard access */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Compare before and after"
        className="absolute inset-x-0 bottom-0 h-8 w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

/* ==================================================================== */
/* Lightbox gallery                                                      */
/* ==================================================================== */

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: ProjectImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length, onClose, onNavigate]);

  if (index === null) return null;
  const image = images[index];
  if (!image) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-ink-950/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <p className="num text-caption text-white/50">
          {index + 1} / {images.length}
        </p>
        <button onClick={onClose} aria-label="Close viewer" className="rounded-md p-2 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        <button
          onClick={() => onNavigate((index - 1 + images.length) % images.length)}
          aria-label="Previous image"
          className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <motion.img
          key={image.id}
          src={image.url}
          alt={image.alt}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-h-full max-w-full rounded-lg object-contain"
        />

        <button
          onClick={() => onNavigate((index + 1) % images.length)}
          aria-label="Next image"
          className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {image.caption && <p className="px-6 pb-6 text-center text-sm text-white/60">{image.caption}</p>}
    </motion.div>
  );
}

export function GalleryGrid({ images, onOpen }: { images: ProjectImage[]; onOpen: (i: number) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((image, i) => (
        <button
          key={image.id}
          onClick={() => onOpen(i)}
          className={cn('group relative overflow-hidden rounded-lg', i === 0 && 'sm:col-span-2')}
          aria-label={`View ${image.alt}`}
        >
          <img
            src={image.url}
            alt={image.alt}
            loading="lazy"
            className={cn(
              'w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105',
              i === 0 ? 'aspect-[16/9]' : 'aspect-[4/3]',
            )}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition-colors duration-500 group-hover:bg-ink-950/30">
            <ZoomIn className="h-8 w-8 scale-90 text-white opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100" />
          </span>
          {image.caption && (
            <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink-950/90 to-transparent p-4 text-left text-caption text-white transition-transform duration-500 ease-out-expo group-hover:translate-y-0">
              {image.caption}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ==================================================================== */
/* Project Atlas                                                         */
/* ==================================================================== */

/**
 * The Jaipur district map used to live here as `ProjectMap` — a schematic with
 * an invented ellipse for a "ring road" and pins projected against a guessed
 * bounding box. It has been replaced by the Project Atlas, which draws the real
 * municipal zone geometry. Re-exported from this module so the three existing
 * call sites keep importing from one place.
 */
export { ProjectAtlas } from './atlas';
export type { ProjectAtlasProps, AtlasVariant } from './atlas';

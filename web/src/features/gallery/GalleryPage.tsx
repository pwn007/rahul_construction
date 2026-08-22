import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Play, Rotate3d, X, Plane } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { CtaBand, PageHero } from '@/components/common';
import { Badge, EmptyState, Tabs } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLockBodyScroll } from '@/hooks';
import { gallery } from '@/data/content';
import type { GalleryItem, GalleryKind } from '@/types/domain';

const KIND_META: Record<GalleryKind, { label: string; icon: typeof Camera }> = {
  photo: { label: 'Photos', icon: Camera },
  video: { label: 'Video', icon: Play },
  drone: { label: 'Drone', icon: Plane },
  '360': { label: '360°', icon: Rotate3d },
};

export default function GalleryPage() {
  const [kind, setKind] = useState<'all' | GalleryKind>('all');
  const [active, setActive] = useState<GalleryItem | null>(null);

  /*
   * The viewer is a fullscreen `aria-modal` overlay, and it was doing neither of
   * the two things that makes one behave: the page kept scrolling underneath it,
   * so on a phone a swipe moved the gallery behind the image instead of doing
   * nothing, and Escape did not close it.
   *
   * The projects `Lightbox` in features/projects/components.tsx has always had
   * both. The two viewers are *not* the same component — this one shows a title,
   * a category and a 360°/video affordance, that one shows an index and
   * prev/next arrows — so the duplication worth removing is the behaviour, not
   * the markup. Hence the shared hook here rather than one component with modes.
   */
  useLockBodyScroll(active !== null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);

  const items = useMemo(() => (kind === 'all' ? gallery : gallery.filter((g) => g.kind === kind)), [kind]);

  const tabs = [
    { value: 'all', label: 'Everything', count: gallery.length },
    ...(Object.keys(KIND_META) as GalleryKind[]).map((k) => ({
      value: k,
      label: KIND_META[k].label,
      count: gallery.filter((g) => g.kind === k).length,
    })),
  ];

  return (
    <>
      <Seo
        title="Gallery — Photos, Video, Drone & 360° Walkthroughs"
        description="Photography, video walkthroughs, drone footage and 360° views from completed and ongoing Neetu Archstone projects across Jaipur."
      />

      <PageHero
        overline="Gallery"
        title="Look closer"
        lead="Photography, video walkthroughs, drone footage and 360° views from our sites — completed and in progress."
        breadcrumbs={[{ label: 'Gallery' }]}
        stats={(Object.keys(KIND_META) as GalleryKind[]).map((k) => ({
          value: gallery.filter((g) => g.kind === k).length,
          label: KIND_META[k].label,
        }))}
        aside={
          <div className="grid grid-cols-2 gap-3">
            {gallery.slice(0, 4).map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className="group relative overflow-hidden rounded-xl shadow-md ring-1 ring-navy-800/[0.06]"
                aria-label={`Open ${item.title}`}
              >
                <img
                  src={item.thumbnail}
                  alt=""
                  aria-hidden
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-0 p-3 text-left text-caption text-white/85">{item.title}</span>
              </button>
            ))}
          </div>
        }
      />

      <section className="section-sm">
        <div className="container">
          <Tabs tabs={tabs} value={kind} onChange={(v) => setKind(v as typeof kind)} variant="pill" className="inline-flex" />

          {items.length === 0 ? (
            <EmptyState icon={<Camera className="h-6 w-6" />} title="Nothing here yet" description="We are adding media for this category shortly." className="mt-10" />
          ) : (
            /* A plain grid, not CSS multi-column masonry.

                Masonry sized every tile differently by design — the container
                flowed them into columns and the crop cycled by position
                (`i % 5`, `i % 3`), so no two neighbours matched. A uniform frame
                is the point now. Portrait photographs are centre-cropped to
                landscape as a result; the lightbox still opens the full image,
                so nothing is lost, but the thumbnail is a crop. */
            <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => {
                  const Meta = KIND_META[item.kind];
                  return (
                    <motion.button
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.25), ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setActive(item)}
                      className="group relative block w-full overflow-hidden rounded-xl"
                      aria-label={`Open ${item.title}`}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-95" />

                      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 backdrop-blur-sm">
                        <Meta.icon className="h-3 w-3 text-cyan-400" />
                        <span className="text-[0.75rem] font-medium uppercase tracking-wide text-white">{Meta.label}</span>
                      </span>

                      {item.duration && (
                        <span className="num absolute right-3 top-3 rounded bg-ink-950/70 px-2 py-0.5 text-[0.75rem] text-white backdrop-blur-sm">
                          {item.duration}
                        </span>
                      )}

                      {(item.kind === 'video' || item.kind === 'drone') && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/90 text-navy-800 opacity-0 transition-all duration-500 ease-out-expo group-hover:scale-100 group-hover:opacity-100">
                            <Play className="ml-0.5 h-5 w-5 fill-current" />
                          </span>
                        </span>
                      )}

                      <span className="absolute inset-x-0 bottom-0 p-4 text-left">
                        <span className="block font-display text-[0.95rem] font-semibold text-white">{item.title}</span>
                        <span className="mt-0.5 block text-caption capitalize text-white/55">{item.category.replace('-', ' ')}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Viewer */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col bg-ink-950/95 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            onClick={() => setActive(null)}
          >
            <div className="flex items-center justify-between px-5 py-4 text-white">
              <div>
                <p className="font-display font-semibold">{active.title}</p>
                <p className="text-caption capitalize text-white/45">
                  {KIND_META[active.kind].label} · {active.category.replace('-', ' ')}
                </p>
              </div>
              <button onClick={() => setActive(null)} aria-label="Close" className="rounded-md p-3 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full max-w-5xl">
                <img src={active.url} alt={active.title} className="w-full rounded-xl object-contain" />

                {active.kind === '360' && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 rounded-b-xl bg-gradient-to-t from-ink-950/90 to-transparent p-5">
                    <Rotate3d className="h-4 w-4 text-cyan-400" />
                    <p className="text-caption text-white/70">
                      360° walkthrough — interactive viewer connects in Phase 2
                    </p>
                  </div>
                )}
                {(active.kind === 'video' || active.kind === 'drone') && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 rounded-b-xl bg-gradient-to-t from-ink-950/90 to-transparent p-5">
                    <Play className="h-4 w-4 text-cyan-400" />
                    <p className="text-caption text-white/70">Video playback connects in Phase 2 · {active.duration}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CtaBand title="Want to see a site in person?" lead="We are happy to walk you around a live project so you can judge the work yourself." />
    </>
  );
}

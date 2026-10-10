'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, List, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { ProjectCard, CtaBand } from '@/components/common';
import { ProjectsHero } from './ProjectsHero';
import { Badge, Button, EmptyState, Select } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { scrollToTarget } from '@/hooks/useLenis';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/lib/format';
import { IMG } from '@/lib/media';
import { OUTSIDE_DISTRICT, districtLabel, resolveDistrictId } from '@/lib/geo';
import { ProjectAtlas } from './components';
import { PROJECT_CATEGORIES } from '@/data/projects';
import { useProjects } from './useProjects';
import type { Project } from '@/types/domain';

/* "All work" is a filter affordance, not a category, so it is prepended here
   rather than living in the shared vocabulary. */
const CATEGORIES = [{ value: 'all', label: 'All work' }, ...PROJECT_CATEGORIES];

const STAGES = [
  { value: 'all', label: 'Any status' },
  { value: 'completed', label: 'Completed' },
  { value: 'ongoing', label: 'In progress' },
  { value: 'upcoming', label: 'Upcoming' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'largest', label: 'Largest area' },
  { value: 'smallest', label: 'Smallest area' },
];

export function ProjectsView() {
  /*
   * Next's `useSearchParams` is read-only, so writes go through the router.
   * `scroll: false` matters: react-router's `setParams` never moved the page,
   * and without it every filter click would jump the grid back to the top.
   *
   * Reading search params opts a route into client rendering unless it sits
   * under a Suspense boundary — the one in app/(public)/projects/page.tsx.
   */
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setParams = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const [view, setView] = useState<'grid' | 'map'>('grid');
  /* Ephemeral cross-highlighting between the map and the card list. Not URL
     state — it is pointer feedback, not something anyone would want to share. */
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  /* Live list — compiled-in on first paint, API-fresh right after. */
  const allProjects = useProjects();

  const category = params.get('category') ?? 'all';
  const stage = params.get('stage') ?? 'all';
  const locality = params.get('locality') ?? 'all';
  const district = params.get('district') ?? 'all';
  const sort = params.get('sort') ?? 'newest';

  const localities = useMemo(() => [...new Set(allProjects.map((p) => p.locality))].sort(), [allProjects]);

  /**
   * Everything except the district filter.
   *
   * The atlas is fed from here rather than from `filtered`, because it has to
   * show a count for *every* district. Give it the district-filtered list and
   * the moment one district is selected every other count reads zero — the map
   * would appear to say we have built nowhere else.
   */
  const byFacets = useMemo(
    () =>
      allProjects.filter(
        (p) =>
          (category === 'all' || p.category === category) &&
          (stage === 'all' || p.stage === stage) &&
          (locality === 'all' || p.locality === locality),
      ),
    [allProjects, category, stage, locality],
  );

  const filtered = useMemo(() => {
    const out = byFacets.filter(
      (p) => district === 'all' || (district === OUTSIDE_DISTRICT.id ? !resolveDistrictId(p) : resolveDistrictId(p) === district),
    );

    return [...out].sort((a, b) => {
      if (sort === 'oldest') return a.year - b.year;
      if (sort === 'largest') return b.areaSqft - a.areaSqft;
      if (sort === 'smallest') return a.areaSqft - b.areaSqft;
      return b.year - a.year;
    });
  }, [byFacets, district, sort]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all' || (key === 'sort' && value === 'newest')) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  const activeFilters = [
    category !== 'all' && { key: 'category', label: CATEGORIES.find((c) => c.value === category)?.label },
    stage !== 'all' && { key: 'stage', label: STAGES.find((s) => s.value === stage)?.label },
    locality !== 'all' && { key: 'locality', label: locality },
    district !== 'all' && { key: 'district', label: districtLabel(district === OUTSIDE_DISTRICT.id ? null : district) },
  ].filter(Boolean) as { key: string; label: string }[];

  const totalArea = filtered.reduce((sum, p) => sum + p.areaSqft, 0);

  return (
    <>
      <ProjectsHero
        projects={allProjects}
        totalArea={allProjects.reduce((s, p) => s + p.areaSqft, 0)}
        localityCount={localities.length}
        categories={CATEGORIES}
        activeCategory={category}
        onJumpToCategory={(value) => {
          setFilter('category', value);
          scrollToTarget('#project-grid', -110);
        }}
      />

      <section id="project-grid" className="section-sm">
        <div className="container">
          {/* Filter bar.

              Sticky only from `sm`. On a phone the pinned rounded card hung over
              the project photos as the page scrolled — a floating island with
              content sliding behind its side margins (the client sent two
              screenshots). Chrome that spans the viewport can stick; a card
              can't. The short list (ten projects) makes scroll-back-to-filter
              cheap, so mobile simply lets it scroll away. */}
          <div className="surface z-20 rounded-xl border p-4 shadow-sm max-sm:p-3 sm:sticky sm:top-[calc(var(--nav-h)+8px)]">
            <div className="flex flex-wrap items-center gap-3">
              <SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-subtle sm:block" />

              {/*
                Wraps at every width, and no longer competes for space.

                As a `flex-1` scroller this row was squeezed by the three selects
                beside it: measured client width was 72px at 768, 204px at 900 and
                328px at 1024 against the 563px the six chips need — so anywhere
                from a small phone to a laptop, most of the categories sat behind a
                sideways scroll with nothing to indicate it. 468px was hidden at
                320px, 491px at 768px.

                Wrapping removes the scroller outright, and dropping `flex-1` stops
                the selects starving it. The chips take the rows they need; the
                parent already wraps, so the selects fall below when space runs out.

                Below `sm` the trade reverses and the rail comes back: the selects
                sit *under* the chips there, so nothing competes for the row and
                the rail gets the full container (~342px at 390) instead of the
                72px that killed it at 768. Wrapped chips on a phone cost two rows
                of a sticky card that already stood ~470px tall — the client sent
                a screenshot. A cut-off chip at the right edge is the scroll cue.
              */}
              <div className="no-scrollbar flex flex-wrap gap-1.5 max-sm:w-full max-sm:flex-nowrap max-sm:overflow-x-auto">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFilter('category', c.value)}
                    aria-pressed={category === c.value}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors',
                      category === c.value
                        ? 'bg-navy-800 text-white dark:bg-cyan-500 dark:text-navy-950'
                        : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* A native select with `w-auto` sizes to its longest option — the locality
                  list pushed this row to 559px and took the document with it.

                  Every Select is wrapped in a sizing div because the component
                  wraps its <select> in a plain `relative` div of its own: classes
                  passed to Select land on the inner element, so the *flex item*
                  here is a div nothing was controlling — which is why phones got
                  one select per row (each wrapper shrink-wrapped its longest
                  option and wrapped). Below `sm` the wrappers lay out as two
                  compact rows — locality beside the view toggle, then status and
                  sort as halves (readable labels beat a one-row cram that left
                  ~55px of text). `max-sm:order-*` does the pairing; from `sm` the
                  DOM order and shrink-wrap sizing are exactly what they were. */}
              <div className="flex flex-wrap items-center gap-2 max-sm:w-full">
                {/* basis is the wrap decider: flex-1's basis-0 let the status
                    select join this line and squeeze "All localities" to two
                    letters — a wide basis (full width minus the toggle) claims
                    the row, and grow absorbs the rounding. */}
                <div className="min-w-0 max-sm:order-1 max-sm:flex-1 max-sm:basis-[calc(100%-4.75rem)]">
                  <Select value={locality} onChange={(e) => setFilter('locality', e.target.value)} aria-label="Filter by locality" className="h-11 w-full min-w-0 max-sm:h-10 max-sm:text-sm sm:w-auto lg:text-caption">
                    <option value="all">All localities</option>
                    {localities.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="min-w-0 max-sm:order-3 max-sm:w-[calc(50%-0.25rem)]">
                  <Select value={stage} onChange={(e) => setFilter('stage', e.target.value)} aria-label="Filter by status" className="h-11 w-full min-w-0 max-sm:h-10 max-sm:text-sm sm:w-auto lg:text-caption">
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="min-w-0 max-sm:order-4 max-sm:w-[calc(50%-0.25rem)]">
                  <Select value={sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort projects" className="h-11 w-full min-w-0 max-sm:h-10 max-sm:text-sm sm:w-auto lg:text-caption">
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex shrink-0 rounded-md border p-0.5 max-sm:order-2">
                  <button
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    aria-pressed={view === 'grid'}
                    className={cn('rounded p-1.5 transition-colors', view === 'grid' ? 'bg-[rgb(var(--c-text))]/[0.08]' : 'text-subtle')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView('map')}
                    aria-label="Map view"
                    aria-pressed={view === 'map'}
                    className={cn('rounded p-1.5 transition-colors', view === 'map' ? 'bg-[rgb(var(--c-text))]/[0.08]' : 'text-subtle')}
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                <span className="text-caption text-subtle">Filtering by:</span>
                {activeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key, 'all')}
                    className="flex items-center gap-1.5 rounded-full bg-cyan-500/12 px-2.5 py-1 text-caption text-cyan-700 transition-colors hover:bg-cyan-500/20 dark:text-cyan-300"
                  >
                    {f.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                <button onClick={() => setParams(new URLSearchParams())} className="text-caption text-subtle underline underline-offset-2 hover:text-cyan-700">
                  Clear all
                </button>
              </div>
            )}
          </div>

          <p className="num mt-6 text-caption text-subtle">
            {filtered.length} project{filtered.length === 1 ? '' : 's'} · {formatNumber(totalArea)} sq ft
          </p>

          {/* Results */}
          <div className="mt-6">
            {view === 'map' ? (
              <Reveal>
                <ProjectAtlas
                  variant="explorer"
                  projects={byFacets}
                  districtId={district === 'all' ? null : district}
                  onDistrictChange={(id) => setFilter('district', id ?? 'all')}
                  activeProjectId={hoveredProject ?? undefined}
                  onHoverDistrict={setHoveredDistrict}
                  /* The project list below is the map's text equivalent — that
                     is what makes the SVG's long description requirement free. */
                  describedById="atlas-project-list"
                  className="w-full"
                />
                <div id="atlas-project-list" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(ROUTES.project(p.slug))}
                      /* Hovering a card lights its district on the map, and vice
                         versa — the cheapest interaction that makes the two read
                         as one thing rather than two. */
                      onMouseEnter={() => setHoveredProject(p.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className={cn(
                        'surface rounded-lg border p-4 text-left transition-all hover:border-cyan-500/50 hover:shadow-sm',
                        hoveredDistrict && resolveDistrictId(p) === hoveredDistrict && 'border-cyan-500/60 shadow-sm',
                      )}
                    >
                      <p className="text-caption text-cyan-700 dark:text-cyan-400">{p.locality}</p>
                      <p className="mt-1 font-display font-semibold">{p.title}</p>
                      <p className="num mt-1 text-caption text-subtle">
                        {formatNumber(p.areaSqft)} sq ft · {p.year}
                      </p>
                    </button>
                  ))}
                </div>
              </Reveal>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<SlidersHorizontal className="h-6 w-6" />}
                title="No projects match these filters"
                description="Try widening your selection — or tell us what you are looking for and we will show you something relevant."
                action={
                  <Button variant="secondary" onClick={() => setParams(new URLSearchParams())}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((project, i) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ProjectCard project={project} index={i} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      <CtaBand
        title="Have a plot and a plan in mind?"
        lead="Tell us the size and locality, and we will show you exactly what it costs and how long it takes."
      />
    </>
  );
}

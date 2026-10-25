'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ChapterEyebrow,
  ChapterLede,
  ChapterLink,
  ChapterLinks,
  ChapterPlate,
  ChapterTitle,
  chapterLines,
} from '@/components/chapter/Chapter';
import { ROUTES } from '@/constants/routes';
import { MAP_ART, OSM_SOURCE } from '@/data/jaipur-map';
import { CATEGORY_LABEL } from '@/data/projects';
import { useProjects } from '@/features/projects/useProjects';
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks';
import { useHomeSections } from '@/hooks/useHomeSections';
import { projectCity } from '@/lib/geo';
import { createProjectMap, type MapDot, type ProjectMapController } from './controller';

/**
 * Built across Jaipur — the home page's projects, as a map you dive into.
 *
 * A port of the precinct map on residences.loamhouse.com.au, the client's
 * benchmark (Oct 2026: "ekdm replication chahiye"): one screen of illustrated
 * map, a numbered dot per project, each breathing. Hover one and its name
 * whispers above the heading; click (or tap) it and the camera flies into the
 * dot until it fills the screen, the project's photograph opening through the
 * growing circle and its story setting itself over it. Click anywhere, or
 * Escape, to fly back out. The corner button zooms out to the region. Scrolling
 * into the band flies the map in from far away and turned, and slides the dots
 * in from either side; scrolling on mirrors it. The band is an ordinary screen —
 * nothing here holds or moves the page.
 *
 * What is the benchmark's and what is ours:
 * - The motion is the benchmark's, number for number — the flight path, its
 *   ease and length, the sway, the lens, every fade and its altitude, the
 *   breathing dots, the copy's entrance and exit, the scroll-linked entry and
 *   its six-second catch-up. See controller.ts for each, and its "Loam units".
 * - The look is ours: the map is drawn from OpenStreetMap in the home page's
 *   navy-hue mist (scripts/build-jaipur-map.mjs), the dots are the brand navy,
 *   type is Outfit and Inter, upright (the benchmark's serif italics have no
 *   place in our four families).
 * - Added for this site: "View project" in each panel and "All projects" under
 *   the heading (the deck this band replaced had it); dots that sit on top of
 *   each other at rest are spread apart there and nowhere else; the zoom-out
 *   keeps the projects on it; and reduced motion gets cuts and cross-fades.
 *
 * The map's photographs are the projects' covers; the map art and they are
 * fetched only when the band comes near.
 */
export function ProjectMapChapter() {
  const section = useHomeSections().find((s) => s.key === 'projects');
  const projects = useProjects();
  const reduced = usePrefersReducedMotion();
  const touch = useMediaQuery('(hover: none) and (pointer: coarse)');

  /* North to south, then west to east (in 1.5 km bands): the dots' numbers and the keyboard's order. */
  const items = useMemo(() => {
    const placed = projects
      .filter((p) => p.coordinates)
      .map((p) => ({ p, ...projectCity(p.coordinates!.lat, p.coordinates!.lng) }));
    placed.sort((a, b) => Math.floor(a.y / 1500) - Math.floor(b.y / 1500) || a.x - b.x);
    return placed;
  }, [projects]);
  const key = items.map((i) => `${i.p.slug}@${Math.round(i.x)},${Math.round(i.y)}`).join('|');

  const rootRef = useRef<HTMLElement>(null);
  const ctl = useRef<ProjectMapController | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [mode, setMode] = useState<'rest' | 'area'>('rest');
  const [whisper, setWhisper] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [live, setLive] = useState('');
  /** The dot to give focus back to once a return from it has landed (keyboard users: Escape, or the return button). */
  const refocus = useRef<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !items.length) return;
    const dots: MapDot[] = items.map(({ p, x, y }) => ({ slug: p.slug, x, y, photo: p.coverImage }));
    const focusDot = (slug: string) => root.querySelector<SVGGElement>(`.dot[data-slug="${CSS.escape(slug)}"]`)?.focus({ preventScroll: true });
    // after React has committed (an `inert` panel, or a map hidden under the photograph, cannot take focus)
    const later = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));
    const c = createProjectMap(root, {
      dots,
      artUrl: MAP_ART.url,
      reduced,
      onActive: (slug) => {
        setActive(slug);
        const back = refocus.current;
        if (slug === null && back) {
          refocus.current = null;
          later(() => focusDot(back));
        }
      },
      onMode: (m) => {
        setMode(m);
        setLive(m === 'area' ? 'Showing the Jaipur region' : '');
      },
      onWhisper: setWhisper,
      // a panel that has come up takes the focus, so Tab reaches "View project"
      onPanel: (slug) =>
        later(() => root.querySelector<HTMLElement>(`[data-map-panel][data-slug="${CSS.escape(slug)}"] .map-panel__title`)?.focus({ preventScroll: true })),
    });
    ctl.current = c;
    return () => {
      c.destroy();
      ctl.current = null;
    };
    // `key` stands for `items` (a new array whenever the projects query refreshes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);

  // Escape flies back a level while the band is on screen (and from a dive, focus returns to its dot)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const c = ctl.current;
      if (e.key !== 'Escape' || !c?.isVisible() || c.focus() === 'rest') return;
      if (c.isDived()) refocus.current = c.focus();
      c.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!items.length) return null;

  const heading = chapterLines(section?.heading, ['Built across', { text: 'Jaipur', em: true }]);
  const lede = section?.subheading?.trim();
  const whispered = whisper ? items.find((i) => i.p.slug === whisper)?.p.title : null;

  const onDotKey = (i: number) => (e: KeyboardEvent<SVGGElement>) => {
    const n = items.length;
    const move = (to: number) => {
      e.preventDefault();
      e.stopPropagation(); // the section engine reads arrows as "next section"
      const k = (to + n) % n;
      setCursor(k);
      rootRef.current?.querySelectorAll<SVGGElement>('.map-dots .dot')[k]?.focus({ preventScroll: true });
    };
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(i - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(n - 1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      ctl.current?.flyTo(items[i].p.slug);
    }
  };

  return (
    <section
      ref={rootRef}
      className="chapter on-dark map-chapter"
      data-section="projects"
      data-mode={mode}
      aria-labelledby="projects-h"
    >
      <div className="map-stage" data-map-stage>
        <svg className="map-svg" data-map-svg preserveAspectRatio="xMidYMid slice" role="group" aria-label="Map of Jaipur with our projects">
          <defs data-map-defs />
          <g data-map-spin>
            <g data-map-art aria-hidden />
            <g className="map-dots" data-map-dots>
              {items.map(({ p }, i) => {
                const phase = phaseOf(p.slug);
                return (
                  <g
                    key={p.slug}
                    className="dot"
                    data-slug={p.slug}
                    role="button"
                    tabIndex={i === cursor ? 0 : -1}
                    aria-label={`${p.title}, ${p.locality}`}
                    onKeyDown={onDotKey(i)}
                    onFocus={() => {
                      setCursor(i);
                      setWhisper(p.slug);
                    }}
                    onBlur={() => setWhisper(null)}
                  >
                    <g className="dot-reveal">
                      <circle className="hit" r={13.5} />
                      <g className="halo">
                        <circle className="ping" r={10} style={{ animationDelay: `${((-phase + PING_PHASE) * PULSE_S).toFixed(2)}s` }} />
                      </g>
                      <g className="pulse" style={{ animationDelay: `${(-phase * PULSE_S).toFixed(2)}s` }}>
                        <circle className="core" r={10} />
                        <text className="num" dy="0.36em">
                          {String(i + 1).padStart(2, '0')}
                        </text>
                      </g>
                      <circle className="ring" r={15} />
                    </g>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
        <div className="map-photo" data-map-photo aria-hidden>
          <img alt="" decoding="async" />
        </div>
      </div>

      <ChapterPlate label="Projects" />

      <div className="chapter__copy map-note" data-map-note>
        <div className="chapter-gutters">
          <div className="chapter__inner">
            <p className="map-dotname" data-on={whispered ? '' : undefined} aria-hidden>
              {whispered}
            </p>
            <ChapterEyebrow>Selected work</ChapterEyebrow>
            <ChapterTitle id="projects-h" lines={heading} />
            {lede && <ChapterLede>{lede}</ChapterLede>}
            <ChapterLinks>
              <ChapterLink href={ROUTES.projects}>All projects</ChapterLink>
            </ChapterLinks>
          </div>
        </div>
      </div>

      <div className="map-content" data-map-content>
        {items.map(({ p }) => {
          const on = active === p.slug;
          return (
            <div key={p.slug} className="map-panel" data-map-panel data-slug={p.slug} inert={!on} aria-hidden={!on}>
              <div className="chapter-gutters">
                <div className="map-panel__in">
                  <p className="map-panel__eyebrow">
                    {CATEGORY_LABEL[p.category]} · {p.locality}
                  </p>
                  {/* The controller splits this into measured lines for the entrance; React must leave its children alone. */}
                  <h3 className="map-panel__title" tabIndex={-1} dangerouslySetInnerHTML={{ __html: escapeHtml(p.title) }} />
                  <p className="map-panel__body">{p.excerpt}</p>
                  <div className="map-panel__lockup">
                    <ChapterLink href={ROUTES.project(p.slug)}>View project</ChapterLink>
                    <button type="button" className="map-panel__back" onClick={() => (refocus.current = p.slug)}>
                      {touch ? 'Tap' : 'Click'} anywhere to return
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <nav className="map-nav" data-map-nav aria-label="Map view">
        <div className="map-nav__in" data-map-nav-in>
          <button
            type="button"
            className="map-journey"
            onClick={() => ctl.current?.journey()}
            aria-label={mode === 'area' ? 'Back to the projects' : 'See the wider Jaipur region'}
            title={mode === 'area' ? 'Back to the projects' : 'See it in context'}
          >
            <svg className="mj-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {mode === 'area' ? (
                <>
                  <g className="mj-tr mj-in"><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /></g>
                  <g className="mj-bl mj-in"><polyline points="4 14 10 14 10 20" /><line x1="3" y1="21" x2="10" y2="14" /></g>
                </>
              ) : (
                <>
                  <g className="mj-tr"><polyline points="15 3 21 3 21 9" /><line x1="21" y1="3" x2="14" y2="10" /></g>
                  <g className="mj-bl"><polyline points="9 21 3 21 3 15" /><line x1="3" y1="21" x2="10" y2="14" /></g>
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      <a className="map-credit" data-map-credit href={OSM_SOURCE.url} target="_blank" rel="noopener noreferrer">
        {OSM_SOURCE.text}
      </a>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </section>
  );
}

/** The benchmark's tuned pulse: a 4.1 s breath, the ping released 35% of the way through it. */
const PULSE_S = 4.1;
const PING_PHASE = 0.35;

/** Each dot's place in the shared pulse — random-looking, but the same on the server and the client. */
function phaseOf(slug: string) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

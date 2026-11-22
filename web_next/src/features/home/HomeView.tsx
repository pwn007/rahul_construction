'use client';

import { useLayoutEffect, useRef } from 'react';
import { Hero } from './template/Hero';
import { ClientStories } from './template/ClientStories';
import { MaterialBrands } from './template/MaterialBrands';
import { Stats } from './template/Stats';
import { WhatWeDo } from './template/WhatWeDo';
import { SelectedWorkPlaceholder, WorkflowPlaceholder } from './template/Placeholder';
import { Consultation } from './template/Consultation';
import { Testimonial } from './template/Testimonial';
import { useHomeSections } from '@/hooks/useHomeSections';

export function HomeView() {
  /* Admin's "Home page sections" rows gate the bands they still describe.
     `!== false` is fail-open: a missing row shows the band — hiding is an
     explicit act, and an API hiccup must not blank the home page. */
  const sections = useHomeSections();
  const on = (key: string) => sections.find((s) => s.key === key)?.enabled !== false;

  /* Entrances only once React is running (globals.css, "HOME TEMPLATE"). After
     the blocks' own effects, which have already marked whatever is on screen. */
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    root.current?.setAttribute('data-motion', '');
  }, []);

  /*
    The client's own design: the Figma Make file "Interactive Neetu Archstone
    Slides" (v10, Nov 2026), band for band — its code ported class for class
    into ./template — with its dummies kept until they send the real thing
    (the two holding bands, the story cards). The header and footer are its
    too (SiteChrome swaps them in on this route only). It succeeded their PDF
    of the same page (19 Nov 2026), which this file followed for three days.

    Before both, this was the chapter page — photo hero, OneSystem, How we
    work, the services cards, MEPF chapters, the Jaipur project map, the
    figures, reviews, Why choose us and the client films. Those components are
    still in ./sections and features/mepf, rendered nowhere; git history has
    this file's notes on why each was there. With them went the section engine
    (one screen per swipe on phones): the design's bands are not screen-sized,
    so phones scroll normally.
  */
  return (
    <div ref={root} className="ht mx-auto w-full max-w-[1920px]">
      <Hero />
      {on('client-videos') && <ClientStories />}
      {on('trust') && <MaterialBrands />}
      <Stats />
      {on('services-index') && <WhatWeDo />}
      <WorkflowPlaceholder />
      <Consultation />
      <SelectedWorkPlaceholder />
      {on('testimonials') && <Testimonial />}
    </div>
  );
}

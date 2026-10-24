'use client';

import { Hero } from './sections/Hero';
import { TrustBar, OneSystem } from './sections/Narrative';
import { ServicesChapters } from './sections/ServicesChapters';
import { MepfChapters } from '@/features/mepf/MepfChapters';
// Published rates are hidden for now — see the commented `<Packages />` below.
// import { Packages } from './sections/Packages';
import { FeaturedProjects, Testimonials } from './sections/Showcase';
import { ClientVideos } from './sections/ClientVideos';
import { useHomeSections } from '@/hooks/useHomeSections';
import { useSectionNav } from '@/hooks/useSectionNav';

export function HomeView() {
  /* Phones and tablets move through this page one section per swipe; desktop
     and reduced motion scroll natively. Every band below is a stop
     (`data-section` on its root) and so is the footer. See lib/section-nav. */
  useSectionNav();

  /* Admin's "Home page sections" rows gate each band below. `!== false` is
     fail-open: a missing row shows the band — hiding is an explicit act, and
     an API hiccup must not blank the home page. */
  const sections = useHomeSections();
  const on = (key: string) => sections.find((s) => s.key === key)?.enabled !== false;

  return (
    <>
      {/*
        Eight sections, down from fourteen (the eighth, client videos, was split out of testimonials in Sep 2026).
        --------------------------------------------------------------
        The page was not long because any one section was verbose — it was long
        because four of them made the same argument. `Approach` restated
        `OneSystem`; `SmartConstruction` restated process step 04; `VastuTeaser`
        and `LatestInsights` were full sections for pages that already exist.

        `WhyChooseUs` was the last of them and went the same way, at the client's
        request. It was `OneSystem`'s argument a second time: its four
        differentiator cards mapped one-to-one onto the four disciplines'
        guarantees, its five chips restated those again, and its maintenance card
        repeated process step 06 almost word for word. "Single point of
        responsibility" was asserted five times on one page; the maintenance
        promise four. Both now appear once. Its two homes — the `/vastu` link and
        the maintenance promise — moved into `OneSystem`, which is why that
        section carries two CTAs.

        `ProcessSection` — the six-stage rail — came out last, also at the
        client's request, and `OneSystem` moved down into the slot it left. The
        stages themselves are not lost: `/services` renders all six from the same
        `PROCESS_STEPS` constant, under the same "How we work" overline. What the
        landing page no longer says anywhere is stage 04's live-camera line.

        A services index went back in above all of it, at the client's request —
        but as an index rather than the card grid that was taken out, and
        without MEPF, which has its own band immediately below it. See the note
        at the top of `ServicesIndex`.

        What is left is one pass down the funnel with no repetition:
          who we are → what you can hire us for → what we engineer →
          what we have built → who vouches for us (in writing, then on camera).

        `OneSystem` led that pass from Sep 2026, at the client's request; before
        that it sat after the projects, in the slot `ProcessSection` left.

        The pass used to end on "what it costs"; that section is commented out at
        the bottom of this file while published rates are hidden.

        Nothing was deleted from the site. `LivingSystems` moved to
        /services/mepf-consultancy, Vastu and the live cameras are linked from
        `WhyChooseUs`, and the "What we offer" grid came out in favour of the
        /services page itself — see the services note above for what came back in
        its place, and why it is not that grid. Testimonials were briefly folded
        into `WhyChooseUs` and are back on their own band.
      */}
      <Hero />
      {on('trust') && <TrustBar />}
      {/* Who we are, before what we sell — moved above the services index at the
          client's request (Sep 2026); it used to close the page's argument after
          the projects. Still the page's only dark band. */}
      {on('one-system') && <OneSystem />}
      {/* The offer. Three services, not four — MEPF is the section immediately
          below, and listing it here as well would put it on this page three
          times. Four chapters since the design migration (the offer, then one
          per service); `ServicesIndex` (the photo rows) is no longer rendered. */}
      {on('services-index') && <ServicesChapters />}
      {/* MEPF expands the one service the index deliberately leaves out: it is
          the firm's core discipline and the thing a visitor is least able to
          picture, so it gets a band rather than a line. `OneSystem` above names the
          four disciplines it belongs to. Five chapters since the design
          migration — the promise, then one per system; `MepfTeaser` (the
          stacked cards) is no longer rendered here. */}
      {on('mepf') && <MepfChapters />}
      {on('projects') && <FeaturedProjects />}
      {/* The claims, then the people backing them. This band is `--c-surface-2`,
          sitting between the projects rail and the client videos, both on page
          ground. (If the videos band is switched off it becomes the page's last
          band and the tint carries straight into the footer, which is fine.) */}
      {on('testimonials') && <Testimonials />}
      {/* The same people on camera. Split out of the testimonials band at the
          client's request (Sep 2026): the band above is words only now, and
          every recorded testimonial lives here — a row of cards from `md`, and
          on a phone one screen with one film filling it (the client's
          prototype, Oct 2026). Page ground, not `--c-surface-2`, so the two
          read as separate bands. */}
      {on('client-videos') && <ClientVideos />}
      {/*
        Published rates, hidden at the client's request.

        The section itself and every link into `/pricing` were commented out
        together — see `constants/routes.ts` for the nav and footer entries, and
        `components/common/Chrome.tsx`, `features/estimator/EstimatorPage.tsx`
        and `features/legal/NotFoundPage.tsx` for the rest. The `/pricing` route
        is still live and unchanged; nothing links to it. Uncomment this line and
        the import above to bring the rates back.
      */}
      {/* <Packages /> */}
    </>
  );
}

'use client';

import { Hero } from './sections/Hero';
import { TrustBar, OneSystem } from './sections/Narrative';
import { ServicesIndex } from './sections/ServicesIndex';
import { MepfTeaser } from '@/features/mepf/MepfTeaser';
// Published rates are hidden for now — see the commented `<Packages />` below.
// import { Packages } from './sections/Packages';
import { FeaturedProjects, Testimonials } from './sections/Showcase';

export function HomeView() {
  return (
    <>
      {/*
        Seven sections, down from fourteen.
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
          what you can hire us for → what we engineer → what we have built →
          who we are → who vouches for us.

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
      <TrustBar />
      {/* The offer, before any argument about it. Three rows, not four — MEPF is
          the section immediately below, and listing it here as well would put it
          on this page three times. */}
      <ServicesIndex />
      {/* MEPF expands the one service the index deliberately leaves out: it is
          the firm's core discipline and the thing a visitor is least able to
          picture, so it gets a band rather than a line. `OneSystem` names the
          four disciplines it belongs to further down. */}
      <MepfTeaser />
      <FeaturedProjects />
      {/* The claim, now made after the evidence rather than before it. This is
          the page's only dark band and its last argument before the people who
          vouch for it. */}
      <OneSystem />
      {/* The claims, then the people backing them. This band is `--c-surface-2`,
          and with `Packages` switched off below it is now the page's last one —
          the tint carries straight into the footer, which is fine, but restoring
          `Packages` is what puts it back between two sections on page ground. */}
      <Testimonials />
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

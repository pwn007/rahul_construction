'use client';

import { Hero } from './sections/Hero';
import { TrustBar, OneSystem, HowWeWork } from './sections/Narrative';
import { ServicesRows } from './sections/ServicesRows';
import { MepfChapters } from '@/features/mepf/MepfChapters';
// Published rates are hidden for now — see the commented `<Packages />` below.
// import { Packages } from './sections/Packages';
import { Testimonials } from './sections/Showcase';
import { WhyChooseUs } from './sections/WhyChooseUs';
import { ProjectMapChapter } from './sections/ProjectMap';
import { ClientVideos } from './sections/ClientVideos';
import { AchievementsBanner } from './sections/AchievementsBanner';
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
        The page's colours, since 25 Oct 2026: two kinds of band, each always
        dressed the same way. Full-screen photographs (the hero and the chapters)
        under one light grade, and content bands on "mist" — a cool off-white
        drawn from the logo navy's own hue — with navy-black text and cyan
        accents. The footer is the one solid navy. The client had found the page
        inconsistent: three different darks, and a warm cream that is neither
        brand colour.

        This marker turns the mist ground on (globals.css, "The home page's
        ground"). A marker rather than a wrapper: the chapter stacks need the
        page itself as their sticky container.
      */}
      <span hidden data-ground="mist" />
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
        section carries two CTAs. It came back on 27 Oct 2026, at the client's
        request, as the PDF's four promises alone, above the client stories —
        see the note there.

        `ProcessSection` — the six-stage rail — came out last, also at the
        client's request, and `OneSystem` moved down into the slot it left. The
        stages themselves are not lost: `/services` renders all six from the same
        `PROCESS_STEPS` constant, under the same "How we work" overline. The six
        came back on 27 Oct 2026, again at the client's request, as the second
        half of `OneSystem`, and became a band of their own the next day
        (`HowWeWork`).

        A services index went back in above all of it, at the client's request —
        but as an index rather than the card grid that was taken out, and
        without MEPF, which has its own band immediately below it. See the note
        at the top of `ServicesIndex`.

        What is left is one pass down the funnel with no repetition:
          who we are → what you can hire us for → what we engineer →
          what we have built → what it adds up to → who vouches for us in
          writing → what we promise → who vouches for it on camera.

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
      {on('trust') && <TrustBar alone={!on('one-system')} />}
      {/* Who we are, before what we sell — moved above the services index at the
          client's request (Sep 2026); it used to close the page's argument after
          the projects. On the mist ground since 25 Oct 2026 (it was the page's
          one dark band, in saturated navy with blurred glows). */}
      {on('one-system') && <OneSystem logos={on('trust')} />}
      {/* How the claim is kept: the six stages (PDF page 7). Half of the band
          above for a day (27 Oct 2026), a section of its own since 28 Oct at the
          user's word — on mist-2, so the two read as two. Code only, like the
          promises and the figures, so no admin row gates it. */}
      <HowWeWork />
      {/* The offer. Three services, not four — MEPF is the section immediately
          below, and listing it here as well would put it on this page three
          times. A band of its own since 27 Oct 2026 (its heading, then a photo
          card per service, the words over the photograph since 28 Oct); before
          that four chapters, stacked. On the page's mist since 28 Oct, when How
          we work above took mist-2. `ServicesIndex` (the older photo rows) is
          not rendered. */}
      {on('services-index') && <ServicesRows />}
      {/* MEPF expands the one service the index deliberately leaves out: it is
          the firm's core discipline and the thing a visitor is least able to
          picture, so it gets a band rather than a line. `OneSystem` above names the
          four disciplines it belongs to. Five chapters since the design
          migration — the promise, then one per system; `MepfTeaser` (the
          stacked cards) is no longer rendered here. */}
      {on('mepf') && <MepfChapters />}
      {/* The projects as a map you dive into (client's benchmark, residences.loamhouse.com.au —
          25 Oct 2026). It replaced the card deck (`FeaturedProjects`, still in Showcase.tsx,
          rendered nowhere now): one screen of Jaipur, a dot per project; a click flies into the
          dot and opens the project's photograph and story. A chapter like the ones above it. */}
      {on('projects') && <ProjectMapChapter />}
      {/* The figures — 80+ projects, 30+ years, 10+ professionals, 98% — once
          hidden from the hero, back at the client's request (27 Oct 2026) as a
          section of their own: a navy card on the page's ground, the numbers
          only, and one screen (one stop) on a phone. At the foot of the page,
          above the footer, until 29 Oct 2026, when the user moved them here:
          what the projects add up to, before the clients say so in words. Code
          only, so no admin row gates it. */}
      <AchievementsBanner />
      {/* The claims, then the people backing them. This band is `--c-surface-2`
          (mist-2, one step darker than the mist around it), sitting between the
          figures and the promises, both on page ground: a change of topic,
          marked quietly. */}
      {on('testimonials') && <Testimonials />}
      {/* Why choose us — the PDF's four promises (page 4), back at the client's
          request (27 Oct 2026) directly above the client stories: what we
          promise, then the people who can say on camera whether we kept it.
          Page ground (mist), like the stories below; the reviews above are
          mist-2. Code only, like the figures, so no admin row gates it. */}
      <WhyChooseUs />
      {/* The same people on camera. Split out of the testimonials band at the
          client's request (Sep 2026): the band above is words only now, and
          every recorded testimonial lives here — a row of cards from `md`, and
          on a phone one screen with one film filling it (the client's
          prototype, Oct 2026). Page ground (mist), not `--c-surface-2`, so the
          two read as separate bands. */}
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

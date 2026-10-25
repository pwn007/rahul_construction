'use client';

import { useCallback, useState } from 'react';
import { Counter, Reveal, SplitText } from '@/components/motion';
import { StatTile } from '@/components/common';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { DeckFace, StoryDeck } from './StoryDeck';
import { ProjectPhotoViewer } from './ProjectPhotoViewer';
import { ClientReviews } from './ClientReviews';
import { ACHIEVEMENTS } from '@/constants/site';
import { useProjects } from '@/features/projects/useProjects';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useHomeSections } from '@/hooks/useHomeSections';

/* ==================================================================== */
/* Featured projects                                                     */
/* ==================================================================== */

/**
 * Rendered nowhere since 25 Oct 2026: the home page's projects band is the map
 * now (ProjectMap/, a port of the client's benchmark). Kept, as the repo keeps
 * retired sections, in case the deck is wanted back — here or on /projects.
 */
export function FeaturedProjects() {
  const section = useHomeSections().find((s) => s.key === 'projects');
  /*
    Six.

    It used to be six for a grid reason — the band was a three-across grid, where
    the count decides whether the last row is complete, and six fills 2+2+2 on
    tablet and 3+3 on desktop with no empty cell. (Before that it was a bento
    with one project at `lg:col-span-7`, which the client rejected: no card was
    to be bigger than its neighbours.)

    It is the client stories' deck now (StoryDeck, at the client's request, Oct
    2026 — it was a rail of its own, `WorkRail`, with parallax and an end card),
    so the number is an editorial one: four on a laptop screen and two more
    behind the arrows, or six cards to step through on a phone.
  */
  const projects = useProjects();
  const featured = projects.filter((p) => p.featured).slice(0, 6);
  /* The admin's heading, set like "Client Stories": its first word in cyan. */
  const heading = (section?.heading || 'Built across Jaipur').trim();
  const [first, ...rest] = heading.split(/\s+/);
  /* The full-screen photograph: which card it is showing, or closed. */
  const [viewing, setViewing] = useState<number | null>(null);
  const close = useCallback(() => setViewing(null), []);

  if (!featured.length) return null;

  return (
    <>
      <StoryDeck
        items={featured}
        dataSection="projects"
        label={{ row: 'Selected projects', items: 'Projects', item: 'Project' }}
        overline="Selected work"
        title={
          <>
            <span className="text-[rgb(var(--c-brand-text))]">{first}</span> {rest.join(' ')}
          </>
        }
        aside={
          <CtaLink href={ROUTES.projects} className="ml-2">
            All projects
          </CtaLink>
        }
        /* The phone's way to the archive, which the header's button is not on. */
        foot={
          <CtaLink href={ROUTES.projects} size="sm">
            All projects
          </CtaLink>
        }
        face={(p, i, stage, on) => (
          <DeckFace
            image={p.coverImage}
            n={i + 1}
            total={featured.length}
            stage={stage}
            on={on}
            icon="expand"
            stageLabel="Photo"
            eyebrow={`${p.locality} · ${p.year}`}
            name={p.title}
          />
        )}
        nameOf={(p) => p.title}
        cardLabel={(p) => `Open photo of ${p.title}, ${p.locality}`}
        onOpen={setViewing}
      />
      <ProjectPhotoViewer projects={featured} title={heading} index={viewing} onIndex={setViewing} onClose={close} />
    </>
  );
}

/* ==================================================================== */
/* Achievements                                                          */
/* ==================================================================== */

/*
 * Exported, imported nowhere. Its headline — "Built on trust. Driven by
 * excellence." — was also `WhyChooseUs`'s, and that section has been merged
 * away, so this is now the only copy of a line the site no longer uses.
 */
export function Achievements() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="overline">Our achievements</p>
            </Reveal>
            <h2 className="mt-4 text-display-md">
              <SplitText text="Built on trust." />
              <br />
              <SplitText text="Driven by excellence." delay={0.12} />
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-4">
            {ACHIEVEMENTS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <StatTile
                  value={
                    <>
                      <Counter value={stat.value} />
                      <span className="text-cyan-500">{stat.suffix}</span>
                    </>
                  }
                  label={stat.label}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/*
 * `SmartConstruction` and `LatestInsights` used to live here too.
 *
 *  · SmartConstruction restated process step 04 ("Regular Updates") at full
 *    section width. Its "watch your site live" proof link used to survive in
 *    `WhyChooseUs`; that section has since been merged into `OneSystem` and the
 *    link was already commented out with the rest of /portal, so step 04 is now
 *    the only place the live cameras are mentioned on this page.
 *  · LatestInsights sent first-time construction leads into the blog halfway
 *    down the funnel. /blog is still linked from the nav and the footer.
 *
 * `Testimonials` was also folded away once — into the since-merged
 * `WhyChooseUs`, as a three-card row — and was split back out at the client's
 * request. Social proof earns its own band.
 */

/* ==================================================================== */
/* Testimonials                                                          */
/* ==================================================================== */

export function Testimonials() {
  /*
    Four. Each review is a scroll of its own here (ClientReviews), so the count
    is how many scrolls the band holds the page for — the client's prototype
    had four, and so does the seed. /about still shows every one, as the pile.
  */
  const testimonials = useTestimonials().slice(0, 4);
  const section = useHomeSections().find((s) => s.key === 'testimonials');

  return (
    <ClientReviews
      overline="What our clients say"
      title={section?.heading || 'Trusted by homeowners and businesses alike'}
      lead={section?.subheading || 'Four projects, four families, and the part they chose to say out loud.'}
      items={testimonials}
    />
  );
}

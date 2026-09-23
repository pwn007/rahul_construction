'use client';

import { Counter, Reveal, SplitText } from '@/components/motion';
import { StatTile, TestimonialBand } from '@/components/common';
import { WorkRail } from './WorkRail';
import { ACHIEVEMENTS } from '@/constants/site';
import { useProjects } from '@/features/projects/useProjects';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useHomeSections } from '@/hooks/useHomeSections';

/* ==================================================================== */
/* Featured projects                                                     */
/* ==================================================================== */

export function FeaturedProjects() {
  const section = useHomeSections().find((s) => s.key === 'projects');
  /*
    Six.

    It used to be six for a grid reason — the band was a three-across grid, where
    the count decides whether the last row is complete, and six fills 2+2+2 on
    tablet and 3+3 on desktop with no empty cell. (Before that it was a bento
    with one project at `lg:col-span-7`, which the client rejected: no card was
    to be bigger than its neighbours.)

    `WorkRail` has no rows to fill, so that constraint is gone and the number is
    now an editorial one — plus the end card, seven frames is what fits inside
    the scroll budget the rail argues for in its own header. Raising it is a
    change to that budget, not just to this line.
  */
  const projects = useProjects();
  const featured = projects.filter((p) => p.featured).slice(0, 6);

  return (
    <WorkRail
      projects={featured}
      total={projects.length}
      heading={section?.heading || 'Built across Jaipur'}
      lead={section?.subheading || 'From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly.'}
    />
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
  const testimonials = useTestimonials();
  const section = useHomeSections().find((s) => s.key === 'testimonials');

  return (
    <TestimonialBand
      overline="What our clients say"
      title={section?.heading || 'Trusted by homeowners and businesses alike'}
      lead={section?.subheading || 'Four projects, four families, and the part they chose to say out loud. Where a client has recorded their own, the film sits beside the words.'}
      items={testimonials}
    />
  );
}

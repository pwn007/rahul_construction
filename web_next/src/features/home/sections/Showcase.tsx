'use client';

import { Counter, Reveal, SplitText } from '@/components/motion';
import { ProjectCard, SectionHeader, StatTile, TestimonialBand, CtaLink } from '@/components/common';
import { ACHIEVEMENTS } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { useProjects } from '@/features/projects/useProjects';
import { useTestimonials } from '@/hooks/useTestimonials';

/* ==================================================================== */
/* Featured projects                                                     */
/* ==================================================================== */

export function FeaturedProjects() {
  /*
    Six, not five, and that is a layout constraint rather than an editorial one.

    This used to be a bento — one project at `lg:col-span-7` with a wider crop
    and the rest arranged around it — and the client did not want one card
    bigger than its neighbours. In a plain three-across grid the count decides
    whether the last row is complete: six fills 2+2+2 on tablet and 3+3 on
    desktop with no empty cell, where five leaves a hole at both.
  */
  const projects = useProjects();
  const featured = projects.filter((p) => p.featured).slice(0, 6);

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Selected work"
          title="Built across Jaipur"
          lead="From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly."
          action={
            <CtaLink href={ROUTES.projects}>All projects</CtaLink>
          }
        />

        {/* The same grid as /projects, so a project looks identical wherever it
            is listed. `index` still drives the staggered image reveal. */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
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

  return (
    <TestimonialBand
      overline="What our clients say"
      title="Trusted by homeowners and businesses alike"
      lead="Four projects, four families, and the part they chose to say out loud. Where a client has recorded their own, the film sits beside the words."
      items={testimonials}
    />
  );
}

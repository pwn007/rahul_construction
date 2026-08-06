import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Video } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { Badge, Button } from '@/components/ui';
import { Counter, MaskImage, Reveal, SplitText, StaggerGroup } from '@/components/motion';
import { ProjectCard, SectionHeader, StatTile, TestimonialCard } from '@/components/common';
import { ACHIEVEMENTS, PROCESS_STEPS, SMART_CONSTRUCTION } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { testimonials } from '@/data/people';
import { posts } from '@/data/content';
import { formatDate } from '@/lib/format';
import { IMG } from '@/lib/media';
import { usePrefersReducedMotion } from '@/hooks';
import { cn } from '@/lib/cn';

/* ==================================================================== */
/* Featured projects                                                     */
/* ==================================================================== */

export function FeaturedProjects() {
  const featured = projects.filter((p) => p.featured).slice(0, 5);
  const [hero, ...rest] = featured;

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Selected work"
          title="Built across Jaipur"
          lead="From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly."
          action={
            <Link to={ROUTES.projects} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
              All projects <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-12">
          {hero && (
            <div className="lg:col-span-7">
              <ProjectCard project={hero} size="lg" />
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5">
            {rest.slice(0, 2).map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i + 1} />
            ))}
          </div>
          {rest.slice(2).map((project, i) => (
            <div key={project.id} className="lg:col-span-4">
              <ProjectCard project={project} index={i + 3} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Process — pinned scroll narrative                                     */
/* ==================================================================== */

export function ProcessSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 90%'] });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={ref} className="on-dark grain relative overflow-hidden bg-ink-950 py-24 text-white md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" aria-hidden />

      <div className="container relative">
        <SectionHeader
          overline="How we work"
          title="Six stages, start to a year after handover"
          lead="A process designed so you always know what is happening, what happens next, and who is responsible."
          tone="light"
        />

        <div className="relative mt-16 md:mt-20">
          {/* Spine — desktop centre, mobile left */}
          <div className="absolute left-[19px] top-0 h-full w-px bg-white/12 md:left-1/2 md:-translate-x-1/2" aria-hidden />
          <motion.div
            className="absolute left-[19px] top-0 w-px origin-top bg-cyan-500 md:left-1/2 md:-translate-x-1/2"
            style={{ height: reduced ? '100%' : progressHeight }}
            aria-hidden
          />

          <div className="space-y-10 md:space-y-0">
            {PROCESS_STEPS.map((step, i) => {
              const isRight = i % 2 === 1;
              return (
                <Reveal key={step.step} delay={0.05} y={30}>
                  <div className={cn('relative flex items-start gap-6 pl-12 md:gap-0 md:pl-0', 'md:grid md:grid-cols-2 md:py-8')}>
                    {/* Node */}
                    <span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/40 bg-ink-950 md:left-1/2 md:top-10 md:-translate-x-1/2">
                      <Icon name={step.icon} className="h-[18px] w-[18px] text-cyan-500" />
                    </span>

                    <div className={cn('md:px-12', isRight ? 'md:col-start-2 md:text-left' : 'md:col-start-1 md:text-right')}>
                      <p className="num text-caption text-cyan-500">
                        {String(step.step).padStart(2, '0')} · {step.duration}
                      </p>
                      <h3 className="mt-2 font-display text-heading-lg font-semibold text-white">{step.title}</h3>
                      <p className={cn('mt-2 text-sm leading-relaxed text-white/55', isRight ? 'md:mr-auto' : 'md:ml-auto', 'md:max-w-[36ch]')}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Achievements                                                          */
/* ==================================================================== */

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

/* ==================================================================== */
/* Smart construction / live monitoring                                  */
/* ==================================================================== */

export function SmartConstruction() {
  return (
    <section className="section-sm">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <Reveal>
              <Badge variant="brand" size="lg" className="mb-5">
                <Video className="h-3.5 w-3.5" /> Smart construction
              </Badge>
            </Reveal>
            <h2 className="text-display-md">
              <SplitText text="Watch your building rise" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-lead text-body-lg text-muted">
                Real-time site monitoring and quality checks give you transparency, control and peace of mind
                throughout the construction process — whether you are in Jaipur or Dubai.
              </p>
            </Reveal>

            <StaggerGroup stagger={0.08} className="mt-10 grid gap-6 sm:grid-cols-2">
              {SMART_CONSTRUCTION.map((item) => (
                <div key={item.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-heading-md font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              ))}
            </StaggerGroup>

            <Reveal delay={0.4}>
              <Button href={ROUTES.portal} variant="secondary" size="lg" className="mt-9" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                See the client portal
              </Button>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.2}>
              <div className="relative overflow-hidden rounded-xl border shadow-lg">
                <img src={IMG.wide('camera-feed-live')} alt="Live site camera feed" className="aspect-video w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" aria-hidden />

                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink-950/70 px-3 py-1.5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                  </span>
                  <span className="text-[0.7rem] font-medium uppercase tracking-wider text-white">Live</span>
                </div>

                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                  <div>
                    <p className="text-caption text-white/60">NA-2025-114 · Vaishali Nagar</p>
                    <p className="font-display text-heading-md font-semibold">Camera 02 — North elevation</p>
                  </div>
                  <p className="num text-caption text-white/60">62% complete</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Testimonials                                                          */
/* ==================================================================== */

export function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="section-sm bg-[rgb(var(--c-surface-2))]">
      <div className="container">
        <SectionHeader
          overline="What our clients say"
          title="Trusted by homeowners and businesses alike"
          align="center"
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.07}>
              <div onMouseEnter={() => setActive(i)} className={cn('h-full transition-transform duration-500', active === i && 'md:-translate-y-1')}>
                <TestimonialCard testimonial={t} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================== */
/* Latest insights                                                       */
/* ==================================================================== */

export function LatestInsights() {
  const latest = posts.slice(0, 3);

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Insights"
          title="Guides on building in Jaipur"
          lead="Practical writing on costs, timelines and the decisions that actually change the outcome."
          action={
            <Link to={ROUTES.blog} className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400">
              All insights <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {latest.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08}>
              <Link to={ROUTES.post(post.slug)} className="group block">
                <MaskImage
                  src={post.coverImage}
                  alt={post.title}
                  ratio="aspect-[16/10]"
                  className="rounded-lg"
                  imgClassName="transition-transform duration-[1.1s] ease-out-expo group-hover:scale-105"
                />
                <div className="mt-5 flex items-center gap-3 text-caption text-subtle">
                  <Badge variant="brand" size="sm">
                    {post.category}
                  </Badge>
                  <span>{formatDate(post.publishedAt)}</span>
                  <span className="num">{post.readingMinutes} min</span>
                </div>
                <h3 className="mt-3 font-display text-heading-lg font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

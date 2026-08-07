import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, Layers, MapPin, Ruler } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Badge, Button } from '@/components/ui';
import { CtaBand, ProjectCard, SectionHeader } from '@/components/common';
import { MaskImage, Reveal, SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { services } from '@/data/services';
import { formatNumber } from '@/lib/format';
import { useRegisterHeroTone } from '@/app/hero-tone';
import { BeforeAfterSlider, GalleryGrid, Lightbox, ProjectAtlas } from './components';
import { HIGH_PRIORITY_IMG } from '@/lib/dom';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Full-bleed photographic hero — keep the navbar light-on-dark.
  useRegisterHeroTone('dark');

  const index = projects.findIndex((p) => p.slug === slug);
  const project = projects[index];

  if (!project) return <Navigate to={ROUTES.projects} replace />;

  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const related = projects.filter((p) => p.id !== project.id && p.category === project.category).slice(0, 3);
  const usedServices = services.filter((s) => project.services.includes(s.slug));

  return (
    <>
      <Seo
        title={project.title}
        description={project.excerpt}
        image={project.coverImage}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.excerpt,
          image: project.coverImage,
          dateCreated: String(project.year),
          locationCreated: { '@type': 'Place', name: `${project.locality}, ${project.city}` },
        }}
      />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[62vh] min-h-[440px] w-full overflow-hidden bg-ink-950">
          <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover opacity-70" {...HIGH_PRIORITY_IMG} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/60" aria-hidden />

          <div className="container absolute inset-x-0 bottom-0 pb-12">
            <Reveal>
              <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-caption text-white/50">
                <Link to={ROUTES.home} className="hover:text-cyan-400">
                  Home
                </Link>
                <span>/</span>
                <Link to={ROUTES.projects} className="hover:text-cyan-400">
                  Projects
                </Link>
                <span>/</span>
                <span className="text-white/80">{project.locality}</span>
              </nav>
            </Reveal>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="md" className="bg-cyan-500 text-white">
                {project.category.replace('-', ' ')}
              </Badge>
              {project.stage !== 'completed' && (
                // Solid rather than the default tinted warning badge: this sits
                // on a photograph, where a 12% fill is invisible and #D97706
                // text drops to ~3.2:1 over any bright part of the image. Amber
                // on ink is 6.3:1 and holds up whatever the cover photo is.
                <Badge variant="warning" size="md" className="bg-warning text-ink-950">
                  {project.stage === 'ongoing' ? 'In progress' : 'Upcoming'}
                </Badge>
              )}
              <Badge variant="outline" size="md" className="border-white/25 text-white/70">
                {project.year}
              </Badge>
            </div>

            <h1 className="mt-4 max-w-4xl text-display-lg text-white">
              <SplitText text={project.title} />
            </h1>
            <Reveal delay={0.15}>
              <p className="mt-3 max-w-prose text-body-lg text-white/60">{project.subtitle}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Sticky specs */}
            <aside className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <div className="surface rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-heading-md font-semibold">Project details</h2>
                  <dl className="mt-5 space-y-3.5">
                    {project.specs.map((spec) => (
                      <div key={spec.label} className="flex items-baseline justify-between gap-4 border-b pb-3.5 last:border-0 last:pb-0">
                        <dt className="text-caption text-subtle">{spec.label}</dt>
                        <dd className="text-right text-sm font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="surface rounded-xl border p-6 shadow-sm">
                  <h2 className="font-display text-heading-md font-semibold">Services used</h2>
                  <ul className="mt-4 space-y-2">
                    {usedServices.map((s) => (
                      <li key={s.id}>
                        <Link
                          to={ROUTES.service(s.slug)}
                          className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-cyan-500/[0.07] hover:text-cyan-700 dark:hover:text-cyan-400"
                        >
                          {s.shortTitle}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* All projects, not just this one: the atlas emphasises this project's
                    district and shows what else we have built there. */}
                <ProjectAtlas projects={projects} activeId={project.id} variant="single" />

                <Button href={ROUTES.estimator} variant="accent" size="lg" full rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                  Build something like this
                </Button>
              </div>
            </aside>

            {/* Narrative */}
            <div className="lg:col-span-8">
              <div className="flex flex-wrap gap-6 border-b pb-8">
                {[
                  { icon: Ruler, label: 'Built-up area', value: `${formatNumber(project.areaSqft)} sq ft` },
                  { icon: Layers, label: 'Configuration', value: project.floors },
                  { icon: Calendar, label: 'Duration', value: `${project.durationMonths} months` },
                  { icon: MapPin, label: 'Location', value: `${project.locality}, ${project.city}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                    <div>
                      <p className="text-caption text-subtle">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Reveal className="mt-10">
                <p className="max-w-prose text-body-lg leading-relaxed text-muted">{project.excerpt}</p>
              </Reveal>

              <div className="mt-12 space-y-10">
                {[
                  { title: 'The challenge', body: project.challenge },
                  { title: 'Our approach', body: project.approach },
                  { title: 'The outcome', body: project.outcome },
                ].map((block, i) => (
                  <Reveal key={block.title} delay={i * 0.08}>
                    <div className="border-l-2 border-l-cyan-500/40 pl-6">
                      <h2 className="font-display text-heading-lg font-semibold">{block.title}</h2>
                      <p className="mt-3 max-w-prose leading-relaxed text-muted">{block.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {project.tags.length > 0 && (
                <Reveal className="mt-10 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" size="md">
                      {tag}
                    </Badge>
                  ))}
                </Reveal>
              )}

              {/* Before / after */}
              {project.beforeImage && project.afterImage && (
                <Reveal className="mt-14">
                  <h2 className="font-display text-heading-lg font-semibold">Before and after</h2>
                  <p className="mt-1.5 text-caption text-muted">Drag the handle to compare. Keyboard users: focus the slider and use arrow keys.</p>
                  <div className="mt-5">
                    <BeforeAfterSlider before={project.beforeImage} after={project.afterImage} beforeLabel="Site before" afterLabel="Completed" />
                  </div>
                </Reveal>
              )}

              {/* Gallery */}
              {project.images.length > 0 && (
                <Reveal className="mt-14">
                  <h2 className="font-display text-heading-lg font-semibold">Gallery</h2>
                  <div className="mt-5">
                    <GalleryGrid images={project.images} onOpen={setLightbox} />
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Prev / next */}
      <section className="border-y">
        <div className="container grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          {prev && (
            <Link to={ROUTES.project(prev.slug)} className="group flex items-center gap-4 py-8 pr-6 md:py-10">
              <ArrowLeft className="h-5 w-5 shrink-0 text-subtle transition-transform group-hover:-translate-x-1" />
              <div>
                <p className="text-caption text-subtle">Previous project</p>
                <p className="font-display text-heading-md font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                  {prev.title}
                </p>
              </div>
            </Link>
          )}
          {next && (
            <Link to={ROUTES.project(next.slug)} className="group flex items-center justify-end gap-4 py-8 text-right md:py-10 md:pl-6">
              <div>
                <p className="text-caption text-subtle">Next project</p>
                <p className="font-display text-heading-md font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                  {next.title}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-subtle transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <SectionHeader overline="More like this" title={`Other ${project.category.replace('-', ' ')} work`} />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand title="Let's build yours next" lead="Start with an estimate, or talk to us about what you have in mind." />

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox images={project.images} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
        )}
      </AnimatePresence>
    </>
  );
}

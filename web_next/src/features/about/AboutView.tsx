'use client';

import { useState } from 'react';
import { Award, Check, Heart, Mail, Linkedin, Shield, Target, Users } from 'lucide-react';
import { CtaBand, PageHero, SectionHeader, StatTile, TestimonialBand } from '@/components/common';
import { Badge, Tabs } from '@/components/ui';
import { Counter, MaskImage, Reveal, SplitText, StaggerGroup } from '@/components/motion';
import { ACHIEVEMENTS, DIFFERENTIATORS, SITE } from '@/constants/site';
import { useTeam } from '@/hooks/useTeam';
import { useTestimonials } from '@/hooks/useTestimonials';
import { IMG } from '@/lib/media';
import { downloads } from '@/data/content';

const TIMELINE = [
  { year: '2018', title: 'The practice begins', body: 'Founded in Jaipur as an architectural design studio working on individual residences.' },
  { year: '2020', title: 'Execution brought in-house', body: 'After too many projects lost in the handover to contractors, we started building what we designed.' },
  { year: '2022', title: 'MEPF added as a discipline', body: 'An in-house MEP engineer joined, making services design part of the core offer rather than an outsourced afterthought.' },
  { year: '2023', title: 'Interiors and fabrication', body: 'A dedicated interiors team and workshop capability closed the last gap between drawing and installed reality.' },
  { year: '2024', title: 'Live site monitoring', body: 'Cameras, weekly reporting and a milestone system rolled out across every active project.' },
  { year: '2026', title: 'Eighty and counting', body: '80+ projects delivered across Jaipur, with commercial and mixed-use work now a growing share.' },
];

const VALUES = [
  { icon: Shield, title: 'Accountability', body: 'One contract, one team, one person who answers the phone. We never ask a client to referee between trades.' },
  { icon: Target, title: 'Precision', body: 'Coordinated drawings, load calculations, documented quality gates. Guesswork is expensive and we refuse to pass that cost on.' },
  { icon: Heart, title: 'Respect for the client', body: 'Your money, your home, your decision. We advise honestly, including when the honest advice costs us the upsell.' },
  { icon: Award, title: 'Durability', body: 'The building outlives the project. We specify for year fifteen, not for handover day.' },
];

const DEPARTMENTS = [
  { value: 'all', label: 'Everyone' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'site', label: 'Site' },
  { value: 'support', label: 'Support' },
];

export function AboutView() {
  const testimonials = useTestimonials();
  const team = useTeam();
  const [dept, setDept] = useState('all');
  const visibleTeam = dept === 'all' ? team : team.filter((m) => m.department === dept);
  const certificates = downloads.filter((d) => d.category === 'certificate');

  return (
    <>
      <PageHero
        overline="About Neetu Archstone"
        title="We build the way we would want our own home built"
        lead="Architecture, engineering and execution combined into one seamless system — thoughtfully following Vastu principles to create spaces that are balanced, efficient and harmonious."
        breadcrumbs={[{ label: 'About' }]}
        image={IMG.card('about-hero')}
        stats={ACHIEVEMENTS.map((s) => ({ value: s.value, label: s.label, suffix: s.suffix }))}
      />

      {/* Story */}
      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <MaskImage src={IMG.card('about-studio')} alt="Our studio" ratio="aspect-[4/5]" className="rounded-xl" parallax />
            </div>
            <div className="lg:col-span-6 lg:pt-8">
              <Reveal>
                <p className="overline">Our story</p>
              </Reveal>
              <h2 className="mt-4 text-display-md">
                <SplitText text="We started by drawing." />
                <br />
                <SplitText text="Then we started building." delay={0.12} />
              </h2>
              <Reveal delay={0.2}>
                <div className="mt-6 space-y-4 text-body-lg leading-relaxed text-muted">
                  <p>
                    We began as an architectural practice. We drew good buildings and handed the drawings to
                    contractors — and then watched, project after project, as the thing that got built drifted
                    away from the thing that was designed.
                  </p>
                  <p>
                    Not because anyone was dishonest. Because nobody owned the whole. The architect owned the
                    drawing, the contractor owned the concrete, the electrician owned the wiring, and the client
                    owned the argument between all three.
                  </p>
                  <p className="text-[rgb(var(--c-text))]">
                    So we brought it all in-house. Today one team draws it, engineers it, builds it and stands
                    behind it for a year afterwards. That is the entire idea.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="mt-8 font-deva text-xl text-cyan-700 dark:text-cyan-400">{SITE.taglineHi}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="section-sm">
        <div className="container grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="on-dark grain relative h-full overflow-hidden rounded-2xl bg-cyan-500 p-9 text-white">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-2xl" aria-hidden />
              <p className="relative text-overline uppercase text-white/70">Our mission</p>
              <h2 className="relative mt-4 font-display text-display-sm font-semibold">{SITE.mission}</h2>
              <p className="relative mt-5 leading-relaxed text-white/85">
                In today's fast-paced lifestyle, managing construction can be overwhelming. Our mission is to
                simplify this process by delivering transparent, reliable and stress-free construction services.
              </p>
              <p className="relative mt-4 italic leading-relaxed text-white/70">
                We handle every detail with professionalism, allowing you to focus on your life while we build
                your vision.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="on-dark grain relative h-full overflow-hidden rounded-2xl bg-navy-800 p-9 text-white">
              <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
              <p className="relative text-overline uppercase text-cyan-400">Our vision</p>
              <h2 className="relative mt-4 font-display text-display-sm font-semibold">
                To make integrated construction the default in Rajasthan
              </h2>
              <p className="relative mt-5 leading-relaxed text-white/70">
                Fragmented construction is not a law of nature — it is a habit. We want a Jaipur where hiring
                five separate parties to build one house feels as outdated as it actually is.
              </p>
              <p className="relative mt-4 leading-relaxed text-white/55">
                Measured by projects delivered on time, clients who refer us, and buildings that still perform
                fifteen years on.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Achievements */}
      <section className="section-sm border-y bg-[rgb(var(--c-surface-2))]">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENTS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.07}>
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
      </section>

      {/* Timeline */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Our journey" title="How we got here" lead="Six years, one direction: take on more of the problem, not less." />

          <div className="relative mt-14 pl-10 md:pl-0">
            <div className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))] md:left-1/2" aria-hidden />
            <StaggerGroup stagger={0.09} className="space-y-10 md:space-y-0">
              {TIMELINE.map((item, i) => {
                const right = i % 2 === 1;
                return (
                  <div key={item.year} className="relative md:grid md:grid-cols-2 md:py-6">
                    <span className="absolute -left-10 top-1 flex h-[31px] w-[31px] items-center justify-center rounded-full border-2 border-cyan-500/40 bg-[rgb(var(--c-bg))] md:left-1/2 md:top-8 md:-translate-x-1/2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    </span>
                    <div className={right ? 'md:col-start-2 md:pl-12' : 'md:col-start-1 md:pr-12 md:text-right'}>
                      <Badge variant="brand" size="sm">
                        {item.year}
                      </Badge>
                      <h3 className="mt-3 font-display text-heading-lg font-semibold">{item.title}</h3>
                      <p className={`mt-2 text-muted md:max-w-[40ch] ${right ? '' : 'md:ml-auto'}`}>{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Values" title="What we actually optimise for" align="center" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.07}>
                <div className="surface h-full rounded-xl border p-6 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sand-500/12 text-sand-600 dark:text-sand-400">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-heading-md font-semibold">{v.title}</h3>
                  <p className="mt-2 text-caption leading-relaxed text-muted">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.key} delay={i * 0.06}>
                <div className="flex items-start gap-3 rounded-lg border border-dashed p-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={3} />
                  <div>
                    <p className="text-sm font-semibold">{d.title}</p>
                    <p className="mt-1 text-caption leading-relaxed text-muted">{d.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader
            overline="Meet our experts"
            title="The people who do the work"
            lead="Experienced engineers, architects, project managers and support staff — all in-house."
          />

          <div className="mt-10">
            <Tabs
              tabs={DEPARTMENTS.map((d) => ({
                value: d.value,
                label: d.label,
                count: d.value === 'all' ? team.length : team.filter((m) => m.department === d.value).length,
              }))}
              value={dept}
              onChange={setDept}
              variant="pill"
              className="inline-flex"
            />
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleTeam.map((member, i) => (
              <Reveal key={member.id} delay={i * 0.05}>
                <div className="group">
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src={member.photo}
                      alt={member.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 opacity-0 transition-all duration-500 ease-out-expo group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-caption leading-relaxed text-white/80">{member.bio}</p>
                      <div className="mt-3 flex gap-2">
                        {member.socials?.linkedin && (
                          <a href={member.socials.linkedin} className="rounded bg-white/15 p-1.5 text-white" aria-label={`${member.name} on LinkedIn`}>
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {member.socials?.email && (
                          <a href={`mailto:${member.socials.email}`} className="rounded bg-white/15 p-1.5 text-white" aria-label={`Email ${member.name}`}>
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-heading-md font-semibold">{member.name}</h3>
                  <p className="text-caption text-cyan-700 dark:text-cyan-400">{member.role}</p>
                  <p className="num mt-1 text-caption text-subtle">{member.experienceYears} years experience</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-8">
            <p className="text-caption text-subtle">
              <Users className="mr-1.5 inline h-3.5 w-3.5" />
              Individual names, photographs and biographies are placeholders pending client confirmation. Roles
              are accurate to the company portfolio.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Testimonials — same band as the home page. The overline/title pair is
          swapped here on purpose: on /about the section IS "what our clients
          say", where on home that phrase is the label above a broader claim. */}
      <TestimonialBand
        overline="In their words"
        title="What our clients say"
        items={testimonials}
      />

      {/* Certifications */}
      <section className="section-sm">
        <div className="container">
          <SectionHeader overline="Compliance" title="Registrations & certifications" lead="Documentation available on request or from our downloads centre." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {certificates.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.07}>
                <div className="surface flex h-full items-start gap-4 rounded-xl border p-5 shadow-sm">
                  <Award className="mt-0.5 h-5 w-5 shrink-0 text-sand-500" />
                  <div>
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="mt-1 text-caption text-muted">{c.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Want to work with a team that owns the whole thing?" lead="Start with an estimate, or come and talk to us." />
    </>
  );
}

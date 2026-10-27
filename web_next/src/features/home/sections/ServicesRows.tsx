'use client';

import Link from 'next/link';
import { ArrowDown } from 'lucide-react';
import { chapterLines, type ChapterLine } from '@/components/chapter';
import { CtaLink } from '@/components/common/CtaLink';
import { ResponsiveImage } from '@/components/common/ResponsiveImage';
import { Reveal, SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { useHomeSections } from '@/hooks/useHomeSections';
import { useServices } from '@/hooks/useServices';
import { cn } from '@/lib/cn';
import { IMG } from '@/lib/media';

/**
 * "What we do" on the home page: a band of its own, then one row per service,
 * the photograph and the words side by side (27 Oct 2026).
 *
 * ── Why not chapters any more ────────────────────────────────────────────────
 * From 11 Oct the offer and its three services were full-screen photo chapters
 * in a `ChapterStack`, each sliding up over the last as MEPF's systems still
 * do. The client asked for ordinary sections with space between them, and two
 * things showed once they were: the offer's photograph rose under About with
 * its heading still a screen away, so it read as About's picture, not a new
 * section; and space between photographs that run edge to edge reads as a
 * seam, not a gap. So the services became an editorial band, the client's
 * pick of two layouts:
 *
 * - **Its own ground.** mist-2 (`--c-surface-2`), the page's quiet change of
 *   topic (the client reviews use it too), against About's mist, with its own
 *   heading in the page's two-voice style ("One system." / cyan second line).
 * - **Rows, not slides.** Each service is a contained, rounded photograph and
 *   its words on the light ground, sides alternating from `md`; the room
 *   between rows is ordinary whitespace, which is what the client asked for.
 *   The renders are landscape, so the frames are too (3:2, 4:3 on a tablet).
 * - **A phone keeps its rule** (one screen per stop, nothing peeking): the
 *   heading is a screen, and every service is a screen — its photograph taking
 *   whatever height the words leave. A tablet's heading screen also lists the
 *   three, each a glide away; a phone's does not (27 Oct 2026, user). The header block and every row carry `data-section` for the
 *   section engine; the band itself must not, or its stops would be ignored.
 *
 * Words and pictures are the ones the chapters settled — `SCOPE`, `PICK`,
 * `ALT`, the positions — and the admin's `services-index` row still sets the
 * heading and the lede. MEPF stays out: it has its own chapters below.
 *
 * Each service is reachable three ways that all go to the same page: its
 * heading, the "Explore service" pill, and the photograph. The photograph's
 * link is for the pointer only (out of the tab order and hidden from assistive
 * technology), so a keyboard meets each service twice, not three times.
 */

const OMIT_SLUG = 'mepf-consultancy';

/** One line each: what the service is for, in the visitor's terms. */
const SCOPE: Record<string, string> = {
  'architectural-design': 'Plans your site can actually build from.',
  'interior-design': 'Drawn and fitted by one team, so the room matches the drawing.',
  'project-management': 'Watch your own site live, from anywhere.',
};

/** Which three of each service's features to name (indexes into `features`). */
const PICK: Record<string, number[]> = {
  'architectural-design': [0, 1, 5], // Concept & massing · Vastu-aligned planning · Approval drawings
  'interior-design': [0, 1, 2], //     Modular kitchens · Wardrobes & joinery · False ceiling & lighting
  'project-management': [1, 2, 5], //  Milestone tracking · Daily reports · Single point of contact
};

const ALT: Record<string, string> = {
  'architectural-design': 'Design render of a two-storey house with a timber-framed upper floor, stone cladding and palms.',
  'interior-design': 'Design render of a living room: a curved sofa, a lounge chair, a brass screen and a fireplace.',
  'project-management': 'A site supervisor checking a tablet inside a room still under work.',
};

/** Where the subject sits, so a crop keeps it. */
const POSITION: Record<string, string> = {
  'architectural-design': '62% 50%',
  'interior-design': '40% 50%',
  'project-management': '72% 50%',
};

/* On phones these two are served as portrait crops already centred on the
   subject (scripts/image-variants.config.mjs), so they sit centred there. */
const POSITION_PORTRAIT: Record<string, string> = {
  'architectural-design': '50% 50%',
  'interior-design': '50% 50%',
};

const TITLE: ChapterLine[] = ['Hand us one part,', { text: 'or the whole build.', em: true }];
const LEDE = 'Each of these is a team that already sits in the same office as the others.';

/**
 * A service's name in two voices: the "& …" half, or else the last word, on a
 * line of its own. Works on whatever the admin calls the service, not only on
 * today's three names.
 */
function titleLines(title: string): ChapterLine[] {
  const amp = title.indexOf(' & ');
  if (amp > 0) return [title.slice(0, amp), { text: title.slice(amp + 1), em: true }];
  const space = title.lastIndexOf(' ');
  if (space > 0) return [title.slice(0, space), { text: title.slice(space + 1), em: true }];
  return [title];
}

const num = (i: number) => String(i + 1).padStart(2, '0');

export function ServicesRows() {
  const section = useHomeSections().find((s) => s.key === 'services-index');
  const listed = useServices().filter((s) => s.slug !== OMIT_SLUG);
  const heading = chapterLines(section?.heading, TITLE);

  return (
    <section aria-labelledby="services-h" className="services-band">
      {/* The heading's stop. `id="services"` is the band's anchor, as the offer chapter's was. */}
      <div id="services" className="services-head" data-section="">
        <div className="container">
          <div className="services-head__grid">
            <div>
              <Reveal>
                <p className="overline">What we do</p>
              </Reveal>
              <h2 id="services-h" className="mt-4 text-display-md text-[rgb(var(--c-text))]">
                {heading.map((line, i) => {
                  const text = typeof line === 'string' ? line : String(line.text);
                  const em = typeof line !== 'string' && line.em;
                  return (
                    <span key={i} className={cn('block', em && 'text-[rgb(var(--c-brand-text))]')}>
                      <SplitText text={text} delay={i * 0.15} />
                    </span>
                  );
                })}
              </h2>
            </div>
            <Reveal delay={0.2}>
              <p className="services-head__lede max-w-lead text-body-lg text-[rgb(var(--c-text-muted))]">
                {section?.subheading || LEDE}
              </p>
              <CtaLink href={ROUTES.services} className="mt-6">
                See all four services
              </CtaLink>
            </Reveal>
          </div>

          {/* A tablet's contents for the band (globals.css shows it there only): what is below, each a
              glide away — the section engine takes same-page links to a stop. */}
          {listed.length > 0 && (
            <ol className="services-index" aria-label="The services below">
              {listed.map((service, i) => (
                <li key={service.slug}>
                  <a href={`#service-${service.slug}`}>
                    <span className="services-index__num">{num(i)}</span>
                    <span className="services-index__name">{service.title}</span>
                    <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="services-rows container">
        {listed.map((service, i) => {
          const href = ROUTES.service(service.slug);
          const headingId = `service-${service.slug}-h`;
          const features = (PICK[service.slug] ?? [0, 1, 2])
            .map((n) => service.features[n]?.title)
            .filter((t): t is string => Boolean(t));
          return (
            <article
              key={service.slug}
              id={`service-${service.slug}`}
              className="service-row"
              /* Sides alternate, as the chapters did: photograph left, then right, … */
              data-flip={i % 2 ? '' : undefined}
              data-section=""
              aria-labelledby={headingId}
            >
              <Link href={href} className="service-row__media" tabIndex={-1} aria-hidden>
                <ResponsiveImage
                  src={IMG.card(`home-service-${service.slug}`)}
                  alt={ALT[service.slug] ?? service.title}
                  position={POSITION[service.slug]}
                  positionPortrait={POSITION_PORTRAIT[service.slug]}
                  sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
                />
              </Link>
              <Reveal className="service-row__body" delay={0.1}>
                <p className="overline">Service {num(i)}</p>
                <h3 id={headingId} className="service-row__title mt-4 text-display-sm">
                  <Link href={href}>
                    {titleLines(service.title).map((line, n) => (
                      <span key={n} className={cn('block', typeof line !== 'string' && line.em && 'font-normal')}>
                        {typeof line === 'string' ? line : line.text}
                      </span>
                    ))}
                  </Link>
                </h3>
                <p className="service-row__scope text-body-lg text-[rgb(var(--c-text-muted))]">
                  {SCOPE[service.slug] ?? service.tagline}
                </p>
                {features.length > 0 && (
                  <ul className="service-row__tags">
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
                <CtaLink href={href} className="service-row__cta" ariaLabel={`Explore ${service.title}`}>
                  Explore service
                </CtaLink>
              </Reveal>
            </article>
          );
        })}
      </div>
    </section>
  );
}

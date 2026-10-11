'use client';

import {
  Chapter,
  ChapterEyebrow,
  ChapterLede,
  ChapterLink,
  ChapterLinks,
  ChapterStack,
  ChapterTags,
  ChapterTitle,
  chapterLines,
  type ChapterLine,
} from '@/components/chapter';
import { ResponsiveImage } from '@/components/common/ResponsiveImage';
import { ROUTES } from '@/constants/routes';
import { useHomeSections } from '@/hooks/useHomeSections';
import { useServices } from '@/hooks/useServices';
import { IMG } from '@/lib/media';

/**
 * "What we do" on the home page, as the finalized design draws it: one chapter
 * that makes the offer, then one chapter per service.
 *
 * This replaces `ServicesIndex` (the heading over three photo rows) on the home
 * page. The words and the deliverables picked for each row are the ones that
 * index already settled — see the reasoning in ServicesIndex.tsx, which stays
 * in the repo. MEPF is still left out here: it has its own five chapters
 * directly below, and listing it here too would put it on the page twice.
 *
 * Photographs: Architectural and Interior show the client's own design renders
 * since 10 Oct 2026 (a timber-framed villa, a living room — `PINNED` in
 * lib/media.ts); Project Management's supervisor is still stock, because the
 * renders show no site. The intro is stock too: since 11 Oct 2026 a drawing
 * compass on a navy blueprint, in place of two engineers on a site whose
 * photograph was 1400 px wide and yellow where the page is navy. Deliberately
 * not a team: under "a team that already sits in the same office" a stock
 * photograph of strangers would read as ours.
 *
 * ── Legibility ───────────────────────────────────────────────────────────────
 * All four of the design's photographs were bright where the copy sits — the
 * yellow scaffold and a white drawing behind the intro, white paper under
 * "Plans your site…", a white wall behind "Interior Design", a pale plastered
 * room behind the site supervisor. Measured on the design, the small lines over them went as
 * low as 2.6:1 (the "Services" label on the scaffold) and the ledes to about
 * 4.2:1. So every chapter here takes `tone="deep"` (the brand navy multiplied
 * into the photograph, then a scrim deepest under the copy), and the contrast
 * of every line of copy against the brightest 5% of the photograph behind it
 * was measured at seven widths: all of it clears WCAG AA — 4.5:1 for the lede
 * and the labels, 3:1 for the headings — with the closest at 5.3:1.
 *
 * The intro was measured again over its new photograph, at seven sizes from a
 * 360 px phone to 1920 px: its copy sits on the blueprint's navy (the eyebrow
 * 8.4:1 at worst, the heading and lede above 12:1). The plate does not — it
 * sits on the pale paper along the top of the frame, where its label measured
 * 2.7:1 — so the intro asks for the plate's band (`plate.band`), and with it
 * the label is 4.5:1 at worst (a phone held sideways) and 4.8–6.0:1 elsewhere.
 *
 * The four are one `ChapterStack` (11 Oct 2026): the offer holds still while
 * the first service slides up over it, and so on down, and each carries the
 * "Services" plate with a tick per service — the same device as MEPF's
 * chapters below, so a visitor two screens in still knows whose part this is.
 *
 * Each service's name is its link, as in the design, with the arrow beside the
 * deliverables as the second, finger-sized way in. The headings are h3 under
 * the intro's h2. `heading` / `subheading` from the admin's home-sections row
 * still apply to the intro; `chapterLines` breaks an admin heading into lines.
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

/** Where the subject sits, so the copy side of the frame stays the quiet side. */
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
 * A service's name as the design sets it: the "& …" half, or else the last
 * word, on a line of its own in the heading's second voice. Works on whatever
 * the admin calls the service, not only on today's three names.
 */
function titleLines(title: string): ChapterLine[] {
  const amp = title.indexOf(' & ');
  if (amp > 0) return [title.slice(0, amp), { text: title.slice(amp + 1), em: true }];
  const space = title.lastIndexOf(' ');
  if (space > 0) return [title.slice(0, space), { text: title.slice(space + 1), em: true }];
  return [title];
}

export function ServicesChapters() {
  const section = useHomeSections().find((s) => s.key === 'services-index');
  const listed = useServices().filter((s) => s.slug !== OMIT_SLUG);
  /* One plate for the offer and its services: a tick per service beside the
     label, lit up to the one on screen, so each still reads as part of "Services". The
     name alone: the section's number ("02") came off on 11 Oct 2026. */
  const plate = { label: 'Services', parts: listed.length };

  return (
    <ChapterStack>
      <Chapter
        id="services"
        tone="deep"
        /* The band: this photograph is pale paper where the plate sits. */
        plate={{ ...plate, band: true }}
        aria-labelledby="services-h"
        media={<ResponsiveImage src={IMG.wide('home-services-intro')} alt="" position="50% 78%" />}
      >
        <ChapterEyebrow>What we do</ChapterEyebrow>
        <ChapterTitle id="services-h" lines={chapterLines(section?.heading, TITLE)} />
        <ChapterLede>{section?.subheading || LEDE}</ChapterLede>
        <ChapterLinks>
          <ChapterLink href={ROUTES.services}>See all four services</ChapterLink>
        </ChapterLinks>
      </Chapter>

      {listed.map((service, i) => {
        const href = ROUTES.service(service.slug);
        const headingId = `service-${service.slug}-h`;
        const features = (PICK[service.slug] ?? [0, 1, 2])
          .map((n) => service.features[n]?.title)
          .filter((t): t is string => Boolean(t));
        return (
          <Chapter
            key={service.slug}
            id={`service-${service.slug}`}
            /* Alternating sides, as in the design: Architectural left, Interior right, … */
            align={i % 2 ? 'right' : 'left'}
            tone="deep"
            plate={{ ...plate, part: i + 1 }}
            aria-labelledby={headingId}
            media={
              <ResponsiveImage
                src={IMG.card(`home-service-${service.slug}`)}
                alt={ALT[service.slug] ?? service.title}
                position={POSITION[service.slug]}
                positionPortrait={POSITION_PORTRAIT[service.slug]}
              />
            }
          >
            <ChapterTitle as="h3" id={headingId} href={href} lines={titleLines(service.title)} />
            <ChapterLede>{SCOPE[service.slug] ?? service.tagline}</ChapterLede>
            <ChapterTags items={features} />
            <ChapterLinks>
              <ChapterLink href={href} ariaLabel={service.title} />
            </ChapterLinks>
          </Chapter>
        );
      })}
    </ChapterStack>
  );
}

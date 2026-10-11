'use client';

import { Droplets, Fan, FlameKindling, Zap, type LucideIcon } from 'lucide-react';
import {
  Chapter,
  ChapterAside,
  ChapterCards,
  ChapterEyebrow,
  ChapterIndex,
  ChapterLede,
  ChapterLink,
  ChapterLinks,
  ChapterTags,
  ChapterTitle,
  chapterLines,
  type ChapterLine,
} from '@/components/chapter';
import { ResponsiveImage } from '@/components/common/ResponsiveImage';
import { ROUTES } from '@/constants/routes';
import { SYSTEMS, SYSTEM_CAPTION, SYSTEM_ORDER, SYSTEM_PAIN, type SystemKey } from '@/data/mepf';
import { useHomeSections } from '@/hooks/useHomeSections';
import { IMG } from '@/lib/media';

/**
 * MEPF on the home page, as the finalized design draws it: one chapter that
 * makes the promise, then one chapter per system.
 *
 * This replaces `MepfTeaser` (the heading over four stacked cards) on the home
 * page. The words are the ones that band already used and argued over — the
 * heading and lede from the teaser, each system's name, `what` and `legend`
 * from data/mepf.ts, and the one-line consequence and photo caption that now
 * live beside them there — so nothing a visitor reads has changed, only how
 * much room it gets. The four photographs are the same files too.
 *
 * Two departures from the design, both deliberate:
 *
 * - **The intro is graded into the navy** (`tone="deep"`). Its photograph is a
 *   bright grey-concrete ceiling, and in the design the centred heading sat on
 *   a light ground and looked washed out. The systems keep the ordinary scrim;
 *   their copy sits to one side, over the darker half of each frame.
 * - **The consequence line is white with a cyan hairline**, not coral, so the
 *   page keeps to its two brand colours (decision 7).
 *
 * The systems' headings are h3 under the intro's h2: they are four parts of one
 * answer, and the outline should say so. Their numerals are hidden from
 * assistive technology for the same reason.
 *
 * `heading` and `subheading` from the admin's home-sections row still apply to
 * the intro, as they do on every band built on SectionHeader (see
 * `chapterLines` for how an admin heading is broken into lines).
 */

/** Where the subject sits in each frame; the board in mepf-13 is high in a portrait. */
const POSITION: Record<SystemKey, string> = {
  hvac: '50% 50%',
  plumbing: '50% 50%',
  electrical: '50% 30%',
  fire: '50% 50%',
};

const TITLE: ChapterLine[] = ['Four systems', { text: 'you will never see again.', em: true }];
/* The data names each system's icon (data/mepf.ts `icon`); the four used here. */
const ICON: Record<SystemKey, LucideIcon> = { hvac: Fan, plumbing: Droplets, electrical: Zap, fire: FlameKindling };

const LEDE =
  'Air, water, power and fire safety run through every wall of your house. Designed together, you never notice them. Designed separately, you live with the result for thirty years.';

export function MepfChapters() {
  const section = useHomeSections().find((s) => s.key === 'mepf');

  return (
    <>
      <Chapter
        id="mepf"
        align="center"
        tone="deep"
        plate={{ num: '03', label: 'MEPF' }}
        aria-labelledby="mepf-h"
        media={<ResponsiveImage src={IMG.wide('home-mepf-intro')} alt="" position="58% 50%" />}
      >
        <ChapterEyebrow>MEPF engineering</ChapterEyebrow>
        <ChapterTitle id="mepf-h" lines={chapterLines(section?.heading, TITLE)} />
        <ChapterLede>{section?.subheading || LEDE}</ChapterLede>
        {/* The four parts at a glance (client, 11 Oct 2026). Each card jumps to
            that system's own chapter below, which stay as they were. */}
        <ChapterCards
          label="The four systems"
          items={SYSTEM_ORDER.map((key, i) => {
            const Icon = ICON[key];
            return {
              href: `#mepf-${key}`,
              num: String(i + 1).padStart(2, '0'),
              title: SYSTEMS[key].name,
              text: SYSTEMS[key].legend,
              icon: <Icon strokeWidth={1.6} />,
            };
          })}
        />
        <ChapterLinks>
          <ChapterLink href={ROUTES.service('mepf-consultancy')}>Look inside the house</ChapterLink>
        </ChapterLinks>
      </Chapter>

      {SYSTEM_ORDER.map((key, i) => {
        const system = SYSTEMS[key];
        const headingId = `mepf-${key}-h`;
        return (
          <Chapter
            key={key}
            id={`mepf-${key}`}
            /* Alternating sides, as in the design: Air left, Water right, … */
            align={i % 2 ? 'right' : 'left'}
            aria-labelledby={headingId}
            media={
              <ResponsiveImage
                src={IMG.card(`home-mepf-${key}`)}
                alt={`${SYSTEM_CAPTION[key]} — ${system.legend}`}
                position={POSITION[key]}
              />
            }
          >
            <ChapterIndex>{String(i + 1).padStart(2, '0')}</ChapterIndex>
            <ChapterTitle as="h3" id={headingId} lines={[system.name]} />
            <ChapterLede>{system.what}</ChapterLede>
            <ChapterTags items={[`${SYSTEM_CAPTION[key]} · ${system.legend}`]} />
            <ChapterAside>{SYSTEM_PAIN[key]}</ChapterAside>
          </Chapter>
        );
      })}
    </>
  );
}

'use client';

import { useState } from 'react';
import { CtaLink } from '@/components/common/CtaLink';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';
import type { Project } from '@/types/domain';
import { PopupSteps, StoryPopup, useSwipeStep } from './StoryPopup';

/**
 * The selected work's full-screen photograph: the decks' popup (StoryPopup)
 * with a project's cover in its frame, as the client stories have a film
 * (client, Oct 2026). The previous and next buttons, ← →, or a sideways swipe
 * go through the other cards' photographs, running round like the deck.
 *
 * A card opens this rather than its project's page, so the page is one link
 * away, under the name.
 */
export function ProjectPhotoViewer({
  projects,
  title,
  index,
  onIndex,
  onClose,
}: {
  projects: Project[];
  /** The deck's title. */
  title: string;
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = projects.length;
  const at = index === null ? 0 : Math.min(index, count - 1);
  const project = index === null ? undefined : projects[at];
  const step = count > 1 ? (by: 1 | -1) => onIndex((at + by + count) % count) : undefined;

  return (
    <StoryPopup
      open={!!project}
      title={title}
      label={project ? `${project.title}, ${project.locality} — photograph` : ''}
      closeLabel="Close Full-Screen Photo"
      name={project?.title ?? ''}
      line={project ? `${project.locality} · ${project.year}` : ''}
      action={
        project && (
          /* A white outline here, not the light tone's cyan: the popup is neutral like the
             cards that open it (25 Oct 2026). tailwind-merge lets these win over the tone. */
          <CtaLink
            href={ROUTES.project(project.slug)}
            tone="light"
            size="sm"
            className="border-white/40 bg-white/5 text-white hover:border-white/70 hover:bg-white/10 focus-visible:outline-white"
          >
            View Project
          </CtaLink>
        )
      }
      onClose={onClose}
      onStep={step}
    >
      {project && <Still key={project.id} src={project.coverImage} alt={project.title} n={at + 1} total={count} onStep={step} />}
    </StoryPopup>
  );
}

/** One photograph in the frame. Keyed by project, so each arrives with a fade and its own shape. */
function Still({ src, alt, n, total, onStep }: { src: string; alt: string; n: number; total: number; onStep?: (by: 1 | -1) => void }) {
  /* An upright photograph fills the frame; a wide one is shown whole over a blur of itself, as a wide film is. */
  const [wide, setWide] = useState(false);
  const swipe = useSwipeStep(onStep);

  return (
    <div className="cs-reel" {...swipe}>
      {wide && <img src={src} alt="" className="cs-reel__backdrop" aria-hidden />}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn('cs-reel__photo absolute inset-0 h-full w-full', wide ? 'object-contain' : 'object-cover')}
        onLoad={(e) => setWide(e.currentTarget.naturalWidth > e.currentTarget.naturalHeight)}
      />
      <span className="cs-reel__scrim cs-reel__scrim--top" aria-hidden />
      <span className="cs-reel__scrim cs-reel__scrim--bottom" aria-hidden />
      <span className="cs-reel__count">{`${n}/${total}`}</span>
      {onStep && <PopupSteps onStep={onStep} noun="photo" />}
    </div>
  );
}

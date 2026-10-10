'use client';

import { LEGAL_CONTENT } from './content';
import { PageHero } from '@/components/common';
import { SITE } from '@/constants/site';


export function LegalView({ kind }: { kind: 'privacy' | 'terms' }) {
  const content = LEGAL_CONTENT[kind];

  return (
    <>
      <PageHero overline="Legal" title={content.title} lead={content.lead} breadcrumbs={[{ label: content.title }]} size="sm" />

      <section className="section-sm">
        <div className="container max-w-3xl">
          <p className="text-caption text-subtle">Last updated: 1 August 2026</p>

          <div className="mt-10 space-y-10">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-display text-heading-lg font-semibold">{section.heading}</h2>
                {section.body.map((para) => (
                  <p key={para} className="mt-3 leading-relaxed text-muted">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <p className="mt-12 rounded-lg border border-dashed p-5 text-caption text-subtle">
            Phase 1 prototype: this is placeholder legal copy written to be reasonable and complete in structure.
            It must be reviewed by the client's legal advisor before the site goes live.
          </p>
        </div>
      </section>
    </>
  );
}

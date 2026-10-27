'use client';

import { Reveal, SplitText } from '@/components/motion';
import { CtaLink } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { DIFFERENTIATORS } from '@/constants/site';
import { Icon } from '@/lib/icons';

/**
 * Why choose us — PDF page 4, back on the home page at the client's request
 * (27 Oct 2026), directly above the client stories: four promises, then the
 * people who can say on camera whether they were kept.
 *
 * It was taken out once (Sep 2026) for restating `OneSystem` — see HomeView.
 * It came back as the PDF has it, four short promises and nothing else: no
 * chips, no maintenance card, no second "single point of responsibility".
 *
 * The heading beside the PDF's own 2×2 from `lg`, not a row of four: the band
 * sits between the reviews and the stories' row of four films, a short way
 * above the figures' four columns, and a third row of four would read as more
 * of the same. Cards on the page's ground — white, a hairline, the icon in a
 * tinted tile — and nothing brand-filled (the page's colour rule; the PDF's
 * cyan tiles would be the loudest thing on it).
 *
 * On a phone it is one screen and one stop, like every band there, with the
 * four as rows (`.why-us` in globals.css).
 */
export function WhyChooseUs() {
  return (
    <section id="why-us" data-section="why-us" aria-labelledby="why-us-h" className="why-us">
      <div className="why-us__grid container">
        <div>
          <Reveal>
            <p className="overline">Why choose us</p>
          </Reveal>
          <h2 id="why-us-h" className="mt-4 text-display-md text-[rgb(var(--c-text))]">
            <span className="block">
              <SplitText text="Four promises," />
            </span>
            <span className="block text-[rgb(var(--c-brand-text))]">
              <SplitText text="kept on every site." delay={0.15} />
            </span>
          </h2>
        </div>

        <ul className="why-us__list">
          {DIFFERENTIATORS.map((d, i) => (
            <Reveal as="li" key={d.key} delay={0.1 + i * 0.08} y={16} className="why-us__item">
              <span className="why-us__mark" aria-hidden>
                <Icon name={d.icon} className="h-5 w-5" />
              </span>
              <div className="why-us__body">
                <h3 className="why-us__name font-display text-heading-md">{d.title}</h3>
                <p className="why-us__desc text-caption text-[rgb(var(--c-text-muted))] md:text-base">{d.description}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        {/*
          The next step, once the reasons are in: the PDF's closing question
          (page 24) and the site's standing "Book a consultation". Under the
          heading and level with the cards' foot from `lg`, below the cards
          from `md`. Not on a phone, where the band is one screen with no room
          for it and the hero already carries Call and WhatsApp.
        */}
        <Reveal delay={0.3} className="why-us__cta">
          <p className="text-[rgb(var(--c-text-muted))]">Ready to experience hassle-free construction?</p>
          <CtaLink href={ROUTES.contact}>Book a consultation</CtaLink>
        </Reveal>
      </div>
    </section>
  );
}

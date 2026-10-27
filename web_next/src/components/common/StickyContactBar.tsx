'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle, Phone } from 'lucide-react';
import { PillLink } from '@/components/chapter/PillLink';
import { SITE } from '@/constants/site';
import { track } from '@/lib/analytics';

/**
 * Two permanent contact actions, pinned to the bottom of every page on mobile.
 *
 * This is the highest-value change on the lead plan and the lowest-risk one.
 * It is not an overlay: it is small, persistent, covers no content, and asks
 * for nothing — which is exactly the shape Google's interstitial guidance
 * permits, and the shape that carries no dark-pattern exposure at all.
 *
 * Mobile only. The desktop had a floating contact button (`FloatingRail`)
 * until 25 Oct 2026, when the client had it removed: there, Call and WhatsApp
 * sit in the home hero, and the header's Contact link and the footer's number
 * serve every other page. Never two of the same affordance in one viewport —
 * the stacked-overlay failure NN/G names as the most common way good
 * individual components add up to a bad page.
 *
 * The two actions are the home hero's pills, in their navy light-page tone
 * (client, 26 Oct 2026): the same words, label and icons on every page. The bar
 * stays 56px tall, so the spacer and every page's last line are unchanged.
 */
export function StickyContactBar() {
  const pathname = usePathname();

  /* The estimator owns its own bottom slot: a live-total bar that updates as
     the visitor plays with brands (see QuoteResult). Two stacked fixed bars is
     exactly the NN/G failure the comment above warns about, and that page
     already offers WhatsApp inline next to the PDF button. */
  if (pathname.startsWith('/estimator')) return null;

  /* The Contact hero carries the same two pills (ContactView), and the page
     is about nothing else; a bar under them would offer each one twice. */
  if (pathname.startsWith('/contact')) return null;

  /* Not on the home page (design migration, decision 5). The home page is
     a run of full-screen chapters whose copy rests at the bottom of the
     screen — exactly where this bar sits — so it covered the last line of
     every chapter on a phone. There, Call and WhatsApp are the hero's own
     pills (back since 25 Oct 2026), then the menu and the footer. It used to
     stand down only while the hero was on screen and slide in after; one line
     brings that back if the client wants it (`useWithinFirstScreen`, see git
     history). */
  if (pathname === '/') return null;

  /*
   * A page-aware opener beats a generic one: the message arrives already
   * carrying what they were looking at, so the first reply can be about the
   * project rather than about establishing what the project is.
   */
  const context = ` I was looking at ${SITE.url}${pathname}.`;
  const whatsappHref = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
    `Hi, I'd like to discuss a construction project.${context}`,
  )}`;

  return (
    <>
      {/*
        A spacer in normal flow, not padding on <body>.

        The bar is fixed, so without something occupying its height the last
        element of every page sits underneath it. Doing this with a global body
        rule would mean the desktop layout paying for a bar it never renders.
      */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />

      {/* 6px above and below a 44px pill: the bar's old 56px. */}
      <nav
        aria-label="Contact us"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-3 border-t border-[rgb(var(--c-border))] bg-[rgb(var(--c-surface))]/95 px-4 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md md:hidden"
      >
        <PillLink
          href={`tel:${SITE.phoneRaw}`}
          icon={<Phone strokeWidth={1.75} />}
          solid
          tone="light"
          onClick={() => track('call_click', { placement: 'sticky-bar', page: pathname })}
          ariaLabel={`Call us on ${SITE.phone}`}
        >
          Call us
        </PillLink>
        <PillLink
          href={whatsappHref}
          icon={<MessageCircle strokeWidth={1.75} />}
          external
          tone="light"
          onClick={() => track('whatsapp_click', { placement: 'sticky-bar', page: pathname })}
          ariaLabel="Chat with us on WhatsApp (opens in a new tab)"
        >
          WhatsApp
        </PillLink>
      </nav>
    </>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle, Phone } from 'lucide-react';
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
 * Mobile only. `FloatingRail` keeps the desktop, with its own Call and WhatsApp
 * actions hidden below `md` so the same two affordances never appear twice in
 * one viewport — the stacked-overlay failure NN/G names as the most common way
 * good individual components add up to a bad page.
 */
export function StickyContactBar() {
  const pathname = usePathname();

  /*
   * A page-aware opener beats a generic one: the message arrives already
   * carrying what they were looking at, so the first reply can be about the
   * project rather than about establishing what the project is.
   */
  const context = pathname === '/' ? '' : ` I was looking at ${SITE.url}${pathname}.`;
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

      <nav
        aria-label="Contact us"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-[rgb(var(--c-border))] bg-[rgb(var(--c-surface))]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <a
          href={`tel:${SITE.phoneRaw}`}
          onClick={() => track('call_click', { placement: 'sticky-bar', page: pathname })}
          className="flex h-14 items-center justify-center gap-2 border-r border-[rgb(var(--c-border))] text-sm font-medium text-[rgb(var(--c-text))] transition-colors active:bg-[rgb(var(--c-text))]/[0.06]"
        >
          <Phone className="h-4 w-4 text-cyan-700 dark:text-cyan-300" aria-hidden />
          Call
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('whatsapp_click', { placement: 'sticky-bar', page: pathname })}
          className="flex h-14 items-center justify-center gap-2 text-sm font-medium text-[rgb(var(--c-text))] transition-colors active:bg-[rgb(var(--c-text))]/[0.06]"
        >
          <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
          WhatsApp
        </a>
      </nav>
    </>
  );
}

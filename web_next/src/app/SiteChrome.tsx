'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar, Footer, Preloader, FloatingRail, StickyContactBar, CommandPalette, useCommandPalette } from '@/components/common';
// import { LeadOfferModal } from '@/features/lead/LeadOfferModal';
import { ScrollProgress } from '@/components/motion';
import { useLenisScroll, getLenis } from '@/hooks/useLenis';
import { HeroToneProvider } from './hero-tone';

function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      /**
       * Lenis owns the scroll position and writes it to the DOM on every frame, so a
       * bare `window.scrollTo` is reverted on the next tick. That left a short page
       * (e.g. /contact) rendered at the previous page's offset — past its own end,
       * i.e. visually blank, with every `whileInView` reveal below never firing.
       */
      lenis.scrollTo(0, { immediate: true, force: true });
      /**
       * The new route has a different document height. Lenis clamps scrolling to the
       * limit it last measured, so without this a long page entered from a short one
       * could refuse to scroll past the old page's height.
       */
      requestAnimationFrame(() => getLenis()?.resize());
      return;
    }
    // First mount: child effects run before the parent creates Lenis.
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}

/**
 * The public site's chrome.
 *
 * Mounted by app/(public)/layout.tsx, and directly by app/not-found.tsx — the
 * root not-found boundary renders inside the root layout only, never inside a
 * route group's, so an unmatched URL would otherwise lose the navbar and footer
 * that `<Route path="*">` used to give it.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const { open, setOpen } = useCommandPalette();

  useLenisScroll();

  return (
    <HeroToneProvider>
      <Preloader />
      <ScrollToTop />
      <ScrollProgress />
      <Navbar />
      <CommandPalette open={open} onClose={() => setOpen(false)} />

      {/* The section engine's stage (lib/section-nav, "The stage"). On a touch
          device, on the home page, with the stage switched on, the outer box is
          fixed over the screen and the inner one is what the engine moves.
          Everywhere else they are two plain boxes. Nothing `position: fixed`
          may go inside: a moved box becomes what fixed is measured from —
          which is why the header, the rail and the contact bar stay out here
          (overlays are portalled to the body). */}
      <div data-nav-stage="">
        <div data-nav-surface="">
          <main id="main">{children}</main>

          <Footer />
        </div>
      </div>
      <FloatingRail />
      <StickyContactBar />
      {/* Rate-card popup disabled — it kept reopening on idle.
          Mounted once, above the routes, so the offer survives navigation and
          can never be rendered twice. See features/lead/useLeadOffer.ts. */}
      {/* <LeadOfferModal /> */}
    </HeroToneProvider>
  );
}

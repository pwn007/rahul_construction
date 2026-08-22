import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar, Footer, FloatingRail, StickyContactBar, CommandPalette, useCommandPalette } from '@/components/common';
import { LeadOfferModal } from '@/features/lead/LeadOfferModal';
import { ScrollProgress } from '@/components/motion';
import { Spinner } from '@/components/ui';
import { useLenisScroll, getLenis } from '@/hooks/useLenis';
import { usePrefersReducedMotion } from '@/hooks';
import { HeroToneProvider } from '../hero-tone';

function ScrollToTop() {
  const { pathname } = useLocation();

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

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  const { open, setOpen } = useCommandPalette();
  const reduced = usePrefersReducedMotion();

  useLenisScroll();

  return (
    <HeroToneProvider>
      <ScrollToTop />
      <ScrollProgress />
      <Navbar onOpenPalette={() => setOpen(true)} />
      <CommandPalette open={open} onClose={() => setOpen(false)} />

      <main id="main">
        {/*
         * `Suspense` must sit ABOVE `AnimatePresence`, never inside it.
         *
         * Route components are `lazy()`, so entering a route whose chunk is not yet
         * cached suspends mid-transition. With the boundary nested inside, React
         * replayed the render while `AnimatePresence mode="wait"` had already queued
         * the key change — and the incoming page inherited the *exit* values. The
         * result was a fully rendered page (correct height, correct content) frozen at
         * `opacity: 0, y: -8`: a blank screen that only a reload cleared.
         *
         * Hoisting the boundary means AnimatePresence never observes a suspending
         * child; it only ever sees a resolved element.
         */}
        <Suspense fallback={<RouteFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0.15 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <Footer />
      <FloatingRail />
      <StickyContactBar />
      {/* Mounted once, above the router, so the offer survives navigation and
          can never be rendered twice. See features/lead/useLeadOffer.ts. */}
      <LeadOfferModal />
    </HeroToneProvider>
  );
}

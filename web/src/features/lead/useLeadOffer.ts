import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '@/lib/storage';
import { track } from '@/lib/analytics';

/**
 * Show the lead popup whenever the visitor stops.
 *
 * The rule is deliberately simple: no activity for `IDLE_MS` and the popup
 * opens. Close it, go still again, and it opens again — there is no cooldown,
 * no dismissal limit and no engagement requirement. The only permanent stop is
 * giving us a number, on either this popup or the estimator's PDF gate.
 *
 * This replaced an exit-intent engine with page counts, scroll-depth gates and
 * a seven-day cap. If the captured numbers turn out to be junk, `IDLE_MS` is
 * the dial — raising it is the cheapest way to make the popup rarer without
 * changing any of the logic below.
 */

/** Stillness before the popup opens. The only tuning dial in this file. */
const IDLE_MS = 8_000;

/**
 * Routes the popup never appears on.
 *
 * Not visitor surfaces. A lead popup over the client's own admin panel is not
 * a lead, and the portal is for people who are already customers. Every public
 * page — including the estimator and the contact page — does get it.
 */
const SUPPRESSED = ['/admin', '/portal'];

/**
 * Anything that means "still here, still reading".
 *
 * `pointermove` covers mouse and stylus, `touchstart`/`wheel`/`scroll` cover
 * phones and trackpads, and `keydown` covers someone typing. `visibilitychange`
 * is in the list so returning to a backgrounded tab restarts the count rather
 * than firing the instant the tab regains focus.
 */
const ACTIVITY = ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'visibilitychange'];

interface OfferState {
  converted: boolean;
}

const INITIAL: OfferState = { converted: false };

function readState(): OfferState {
  return readStore<OfferState>(STORAGE_KEYS.leadOffer, INITIAL);
}

/**
 * Stop asking, permanently.
 *
 * Called by both capture surfaces on success — this popup and the estimator's
 * PDF gate — and by the contact form. Someone who has just handed over their
 * number must never be asked for it again eight seconds later.
 */
export function markLeadCaptured(): void {
  writeStore<OfferState>(STORAGE_KEYS.leadOffer, { converted: true });
}

/**
 * Forget that anyone here has converted.
 *
 * Called by the navbar's "Not you? Clear name". That control exists for a
 * *different* person picking up the same browser, and a different person has
 * not given us their number — so leaving `converted: true` behind meant the
 * site went on treating them as a known lead and never offered again.
 *
 * It also made the control look broken: clearing the name removed one key
 * while this one sat in localStorage still holding the previous visitor's
 * state. Whoever clears the name gets the whole front-end memory cleared.
 */
export function resetLeadOffer(): void {
  removeStore(STORAGE_KEYS.leadOffer);
}

/**
 * True while the visitor is typing into something.
 *
 * Eight seconds of stillness part-way through the contact form or the
 * estimator's own gate is a person thinking about what to enter, not a person
 * who has drifted off. Covering that form with a popup asking for the same
 * details would lose the very lead it interrupts, so the timer waits.
 */
function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  return el.matches('input, textarea, select, [contenteditable="true"]');
}

export interface LeadOffer {
  open: boolean;
  /** Closes it. The idle timer restarts, so pausing again reopens it. */
  dismiss: () => void;
  /** Call on successful submit — stops the popup for good on this browser. */
  suppress: () => void;
}

export function useLeadOffer(): LeadOffer {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const suppressedRoute = SUPPRESSED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (suppressedRoute) return;
    /* Already showing — the timer stops rather than firing against itself. */
    if (open) return;

    let timer: number | undefined;

    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        /*
         * `converted` is read here, at fire time, not once when the effect set
         * up. "Not you? Clear name" removes that flag mid-page, and an early
         * return up top meant the listeners were never attached for a converted
         * visitor — so after clearing, the next person got no offer until they
         * happened to navigate. Reading it here costs one localStorage lookup
         * every eight idle seconds and keeps the two in step.
         */
        if (readState().converted) return;
        /* Mid-form is not idle. Wait for them to finish, then resume counting. */
        if (isTyping()) {
          arm();
          return;
        }
        setOpen(true);
        track('offer_shown', { trigger: 'idle', page: window.location.pathname });
      }, IDLE_MS);
    };

    arm();
    ACTIVITY.forEach((type) => document.addEventListener(type, arm, { passive: true }));

    return () => {
      window.clearTimeout(timer);
      ACTIVITY.forEach((type) => document.removeEventListener(type, arm));
    };
    /*
     * `open` and `pathname` are both dependencies on purpose. Closing the popup
     * re-runs this effect and arms a fresh timer, which is exactly what makes it
     * reopen on the next pause; navigating does the same.
     */
  }, [pathname, suppressedRoute, open]);

  const dismiss = useCallback(() => {
    track('offer_dismissed', { trigger: 'idle' });
    setOpen(false);
  }, []);

  const suppress = useCallback(() => {
    markLeadCaptured();
  }, []);

  return { open, dismiss, suppress };
}

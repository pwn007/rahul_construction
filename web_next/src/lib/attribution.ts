/**
 * First-touch campaign attribution.
 *
 * Answers "which channel earned this phone number", which the site could not
 * answer at all before: every record was stamped with a hardcoded source and
 * the campaign parameters in the URL were dropped on the first navigation.
 *
 * First touch, not last: it is captured once per visit and never overwritten,
 * so a visitor who arrives from an ad, reads three pages and then submits from
 * the footer is still credited to the ad. Session-scoped, so a genuinely new
 * visit re-attributes.
 */

import { readStore, writeStore, STORAGE_KEYS } from './storage';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  /** Where they came from, when it wasn't a tagged campaign. */
  referrer?: string;
  /** The page they landed on, which is not necessarily the one they converted on. */
  landingPage?: string;
}

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, 120);
  return trimmed || undefined;
}

/**
 * Read the visit's attribution, capturing it on first call.
 *
 * Safe to call from anywhere at any time — the first caller writes, everyone
 * after reads. Call sites do not need to know or care which one they are.
 */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};

  const stored = readStore<Attribution | null>(STORAGE_KEYS.attribution, null, 'session');
  if (stored) return stored;

  const params = new URLSearchParams(window.location.search);

  /*
   * `document.referrer` is populated on same-origin navigations too, which would
   * attribute an internal click as an external source on any page but the first.
   * Since this only ever runs once — on the landing page — that is not a risk
   * here, but the same-origin check keeps it true if that ever changes.
   */
  const referrer = document.referrer;
  const external = referrer && !referrer.startsWith(window.location.origin) ? referrer : null;

  const captured: Attribution = {
    utmSource: clean(params.get('utm_source')),
    utmMedium: clean(params.get('utm_medium')),
    utmCampaign: clean(params.get('utm_campaign')),
    referrer: clean(external),
    landingPage: clean(window.location.pathname + window.location.search),
  };

  writeStore(STORAGE_KEYS.attribution, captured, 'session');
  return captured;
}

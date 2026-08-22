/**
 * The site's measurement layer.
 *
 * Every lead surface reports through `track()`. One vocabulary, one transport,
 * and no vendor names anywhere but this file — swapping GTM for something else
 * is a change to `load()` and nothing above it.
 *
 * With `VITE_GTM_ID` unset the whole module is inert: `load()` returns without
 * touching the document and `track()` still buffers into `dataLayer`, so dev,
 * tests and preview builds stay silent while the call sites keep working.
 */

const GTM_ID = import.meta.env['VITE_GTM_ID'] as string | undefined;

/**
 * Where a lead came from.
 *
 * This is the value stored on the record and reported alongside every
 * `lead_submit`, so the two can never drift: the funnel report and the CRM row
 * are reading the same string.
 */
export type LeadSource =
  | 'contact-form'
  | 'estimator-pdf'
  | 'idle-popup'
  | 'download'
  | 'newsletter';

/**
 * What opened the popup. One value — it only ever opens on a pause.
 *
 * Kept as a union rather than inlined so a second trigger, if one is ever added
 * back, has to be named at the point it is reported.
 */
export type OfferTrigger = 'idle';

/**
 * The complete event vocabulary.
 *
 * A closed union rather than a free string: a typo in an event name is a silent
 * hole in the funnel report, and it is the kind of hole nobody notices for a
 * quarter.
 */
export type AnalyticsEvent =
  /* Estimator funnel */
  | 'estimator_start'
  | 'estimator_step'
  | 'estimator_result'
  /* Lead capture */
  | 'lead_gate_open'
  | 'lead_submit'
  | 'lead_submit_failed'
  /* Behavioural offer */
  | 'offer_shown'
  | 'offer_dismissed'
  /* Direct contact */
  | 'whatsapp_click'
  | 'call_click';

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function dataLayer(): unknown[] {
  if (typeof window === 'undefined') return [];
  window.dataLayer ??= [];
  return window.dataLayer;
}

/**
 * Record something that happened.
 *
 * Undefined props are dropped rather than sent as `undefined`, because GTM
 * forwards them as the string "undefined" and they arrive in reports as a real
 * value competing with the real ones.
 */
export function track(event: AnalyticsEvent, props: Props = {}): void {
  const clean: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== '') clean[key] = value;
  }
  dataLayer().push({ event, ...clean });
}

let loaded = false;

/**
 * Inject the tag manager. Called once, from the app root.
 *
 * Injected from here rather than hardcoded into `index.html` so the container
 * id stays configuration: a build without `VITE_GTM_ID` ships no third-party
 * script at all, which is what keeps the dev console clean and the preview
 * deploys out of production analytics.
 */
export function loadAnalytics(): void {
  if (loaded || !GTM_ID || typeof document === 'undefined') return;
  loaded = true;

  dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}

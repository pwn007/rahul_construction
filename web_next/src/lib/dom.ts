/**
 * DOM interop helpers.
 */

/**
 * `fetchPriority="high"` for LCP images.
 *
 * This used to hold the all-lowercase `fetchpriority`, with a note saying React 18
 * did not recognise the camelCase prop and to switch when we upgraded. We did
 * upgrade — React 19.2 is installed — and the workaround then became the bug it
 * was written to avoid: React 19 recognises `fetchPriority`, so the lowercase
 * spelling logged `Invalid DOM property \`fetchpriority\`. Did you mean
 * \`fetchPriority\`?` on every page with a hero, and dropped the attribute
 * instead of forwarding it. The hint the five call sites were asking for was not
 * actually reaching the browser.
 *
 * Kept as a const rather than inlined so the five call sites stay identical.
 */
export const HIGH_PRIORITY_IMG = { fetchPriority: 'high' } as Record<string, string>;

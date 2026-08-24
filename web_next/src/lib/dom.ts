/**
 * DOM interop helpers.
 */

/**
 * `fetchpriority="high"` for LCP images.
 *
 * React 18 does not recognise the camelCase `fetchPriority` prop: it warns in the
 * console and forwards the attribute unchanged, so the browser hint is applied but
 * every render logs noise. The real DOM attribute is all-lowercase.
 *
 * React 19 supports `fetchPriority` natively — delete this and inline the prop when
 * we upgrade.
 */
export const HIGH_PRIORITY_IMG = { fetchpriority: 'high' } as Record<string, string>;

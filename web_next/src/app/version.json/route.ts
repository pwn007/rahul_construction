/**
 * /version.json — the id of the build on the server.
 *
 * Written once at build time into `out/version.json`. Every page compares it with
 * the id it was built with and reloads when they differ; see
 * `lib/build-freshness.ts`. Served `no-store` (.htaccess) so the answer is never
 * itself stale.
 */
export const dynamic = 'force-static';

export function GET() {
  return Response.json({ build: process.env.NEXT_PUBLIC_BUILD_ID });
}

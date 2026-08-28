/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /*
   * Legacy paths from the previous site — preserve inbound links.
   *
   * These were client-side `<Navigate replace />` routes in the Vite app, which
   * meant a crawler saw a 200 on the old URL and no link equity moved. As real
   * 301s they transfer authority to the destination.
   *
   * `/mepf` was a real page carrying the interactive house. The house moved onto
   * the service page rather than being deleted, so this is a redirect and not a
   * 404 — the destination still has what the URL promised.
   */
  async redirects() {
    return [
      { source: '/calculator', destination: '/estimator', permanent: true },
      { source: '/services/mep', destination: '/services/mepf-consultancy', permanent: true },
      { source: '/mepf', destination: '/services/mepf-consultancy', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        /* Same deal as the images: content-independent filenames, so a change
           means a new filename rather than an overwrite. */
        source: '/video/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;

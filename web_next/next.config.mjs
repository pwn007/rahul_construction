/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /*
   * Static export — the whole site becomes plain HTML/CSS/JS in `out/`, served
   * by the client's shared PHP hosting (Hostinger, LiteSpeed). Node exists only
   * on the machine that runs `npm run build:prod`, never on the server.
   *
   * The `redirects()` and `headers()` that used to live here do not run in an
   * export (there is no server to run them), so they moved verbatim into
   * `public/.htaccess`: the three legacy 301s, and the immutable cache rule for
   * /images and /video. That file also carries what only deployment needs — the
   * /api rewrite into Laravel and the deny-lock on /backend.
   */
  output: 'export',

  /*
   * /about → about/index.html. LiteSpeed/Apache serve a directory's index
   * without any rewrite rule, so clean URLs survive a refresh on a deep link —
   * the failure mode every SPA-on-FTP deployment hits first.
   */
  trailingSlash: true,

  /* Belt and braces: next/image is not used anywhere (everything is plain
     <img>), but an export build refuses to start if the default loader is left
     enabled, so this states the fact. */
  images: { unoptimized: true },
};

export default nextConfig;

/**
 * Turn the JavaScript of every earlier release into a "reload" stub.
 *
 *   runs after `next build` in `npm run build:prod`
 *
 * A deploy extracts the zip over public_html and deletes nothing, so every old
 * release's chunks stay on the server. A browser holding an old page — a tab left
 * open, a restored tab, Back/Forward from its cache — can then boot that release
 * in full, working, and nothing looks wrong. The client saw the 23 Sep home page
 * this way on 26 Oct 2026.
 *
 * `data/retired-chunks.txt` lists every `_next/static/**.js` path shipped in the
 * releases under `deploy/` up to 26 Oct 2026 (that folder is gitignored, so the
 * list is committed). For each path the current build does not itself use, this
 * writes a stub into `out/`. The zip carries it to the server, the overwrite
 * replaces the old chunk, and any old page that boots reloads into the current
 * one: HTML is `no-cache`, so the reload revalidates.
 *
 * The list does not grow. Releases from now on carry `src/lib/build-freshness.ts`
 * and notice they are stale on their own.
 *
 * A path the current build does use is left alone. Webpack names chunks by
 * content, so an unchanged chunk keeps its name from one release to the next.
 * Old-only CSS is left on the server too; it runs nothing.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');
const LIST = join(ROOT, 'scripts/data/retired-chunks.txt');

/* Every chunk an old page loads runs this, so the first one reloads and the
   rest find the timestamp and stand down. If the reload still comes back to the
   old page (the cache won again), the 30s window stops it from looping. */
const STUB = `/* Neetu Archstone: retired release. An old copy of a page asked for this file; reload to get the current one. See scripts/retire-old-builds.mjs. */
try{var k="archstone.build.retired",t=+sessionStorage.getItem(k)||0;if(Date.now()-t>3e4){sessionStorage.setItem(k,String(Date.now()));location.reload()}}catch(e){}
`;

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

if (!(await exists(join(OUT, 'index.html')))) {
  console.error('retire-old-builds: no out/index.html — run next build first.');
  process.exit(1);
}

const paths = (await readFile(LIST, 'utf8')).split('\n').map((l) => l.trim()).filter(Boolean);

let written = 0;
let kept = 0;
for (const path of paths) {
  const target = join(OUT, path);
  if (await exists(target)) {
    kept += 1;
    continue;
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, STUB);
  written += 1;
}

console.log(`retire-old-builds: ${written} old chunks stubbed, ${kept} still used by this build.`);

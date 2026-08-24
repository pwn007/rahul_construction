/**
 * Photography optimiser.
 *
 *   node scripts/optimize-images.mjs
 *
 * Converts every JPEG in `public/images` to WebP in place and deletes the
 * original. Files in `public/` bypass Vite entirely — they are copied verbatim
 * into `dist` — so this is the only thing standing between a 17 MB deploy and a
 * 3 MB one.
 *
 * Output is committed, exactly like src/data/image-catalogue.ts. This script is
 * not part of `npm run build`; re-run it only when new photography lands.
 *
 * WHY THE FILENAME STEM IS PRESERVED
 * `src/lib/media.ts` maps seeds to filenames through a pinned table plus an
 * FNV-1a hash over the pool arrays in `src/data/image-catalogue.ts`. Keeping the
 * stems and the pool ordering identical means every seed resolves to the same
 * photograph it did before — only the container changes. Renaming or reordering
 * silently reshuffles the entire site's imagery.
 */

import { readdir, unlink, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, '../public/images');

/**
 * The sources are already 1500px/q58, so there is little headroom in the
 * dimensions — the win has to come from the codec. 1400px still covers the
 * largest render slot (a full-bleed hero), and WebP at q58 holds up on
 * photographs that are always displayed under `object-cover` at card or hero
 * scale. Going below ~55 starts to show on the flat sky gradients in the
 * jaipur-* set.
 */
const MAX_WIDTH = 1400;
const QUALITY = 58;

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

const files = (await readdir(DIR)).filter((f) => /\.jpe?g$/i.test(f)).sort();

if (files.length === 0) {
  console.log('No JPEGs in public/images — nothing to do.');
  process.exit(0);
}

let before = 0;
let after = 0;

for (const file of files) {
  const src = join(DIR, file);
  const out = join(DIR, `${basename(file, extname(file))}.webp`);

  const srcSize = (await stat(src)).size;

  await sharp(src)
    // `withoutEnlargement` matters: several of these are already under 1600px
    // and upscaling them would add bytes to buy nothing.
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);

  const outSize = (await stat(out)).size;
  await unlink(src);

  before += srcSize;
  after += outSize;

  const saved = Math.round((1 - outSize / srcSize) * 100);
  console.log(`  ${file.padEnd(24)} ${kb(srcSize).padStart(8)} → ${kb(outSize).padStart(8)}  (-${saved}%)`);
}

console.log(
  `\n${files.length} images: ${kb(before)} → ${kb(after)} ` +
    `(-${Math.round((1 - after / before) * 100)}%)`,
);
console.log('Remember: .jpg → .webp in src/data/image-catalogue.ts and src/lib/media.ts');

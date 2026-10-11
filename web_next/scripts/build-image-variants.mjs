/**
 * Responsive photograph variants.
 *
 *   npm run images:variants
 *
 * The site is a static export served from shared hosting: there is no image
 * server to resize a photo on request, so the sizes a full-bleed design needs are
 * made here, once, and committed like the rest of `public/images`.
 *
 * For every photograph listed in `image-variants.config.mjs` this writes, into
 * `public/images/v/`:
 *
 *   <name>-<width>.avif / .webp            the landscape frame at each width
 *   <name>-portrait-<width>.avif / .webp   a 9:16 crop around `portrait.focus`
 *
 * and records them in `src/data/image-variants.json`, keyed by the path the
 * components already use. `components/common/ResponsiveImage.tsx` reads that
 * manifest; a photo that is not in it is shown exactly as before.
 *
 * Nothing is upscaled. A width larger than the original is skipped and the
 * original's own width is used as the largest variant instead.
 *
 * Re-run after adding or replacing an original. The whole manifest is rewritten
 * each time, so a photo removed from the config also leaves the manifest (its
 * old files stay in `public/images/v` until deleted by hand).
 */
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, extname } from 'node:path';
import sharp from 'sharp';
import config from './image-variants.config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, config.sourceDir);
const OUT = join(ROOT, config.outDir);
const MANIFEST = join(ROOT, config.manifest);
/* Public URL of the output folder: `public/images/v` → `/images/v`. */
const URL_BASE = '/' + config.outDir.replace(/^public\/?/, '').replace(/\/$/, '');

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The widths to make for an original `max` px wide. */
function widthsFor(list, max) {
  const fit = list.filter((w) => w <= max);
  if (!fit.length || fit[fit.length - 1] < max) fit.push(max);
  return fit;
}

async function encode(pipeline, file, format) {
  const q = config.quality[format];
  const out = format === 'avif' ? pipeline.avif({ quality: q, effort: 4 }) : pipeline.webp({ quality: q, effort: 5 });
  await out.toFile(file);
}

async function variants(input, name, region, widths) {
  const set = { avif: [], webp: [] };
  for (const w of widths) {
    for (const format of ['avif', 'webp']) {
      const file = `${name}-${w}.${format}`;
      let pipeline = sharp(input).rotate();
      if (region) pipeline = pipeline.extract(region);
      pipeline = pipeline.resize({ width: w, withoutEnlargement: true });
      await encode(pipeline, join(OUT, file), format);
      set[format].push([w, `${URL_BASE}/${file}`]);
    }
  }
  return set;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const manifest = {};

  for (const photo of config.photos) {
    const input = join(SOURCE, photo.source);
    try {
      await stat(input);
    } catch {
      console.warn(`skip  ${photo.source}: not found in ${config.sourceDir}`);
      continue;
    }
    const meta = await sharp(input).rotate().metadata();
    /* `rotate()` applies EXIF orientation, so read the turned dimensions. */
    const turned = (meta.orientation ?? 1) >= 5;
    const width = turned ? meta.height : meta.width;
    const height = turned ? meta.width : meta.height;
    const name = basename(photo.source, extname(photo.source));

    const land = await variants(input, name, null, widthsFor(config.widths, width));
    const entry = { width, height, ...land };

    if (photo.portrait) {
      const aspect = photo.portrait.aspect ?? config.portraitAspect;
      const [fx, fy] = photo.portrait.focus ?? [0.5, 0.5];
      /* The largest crop of that shape the original allows, centred on the focus. */
      const cw = Math.round(Math.min(width, height * aspect));
      const ch = Math.round(cw / aspect);
      const region = {
        left: Math.round(clamp(fx * width - cw / 2, 0, width - cw)),
        top: Math.round(clamp(fy * height - ch / 2, 0, height - ch)),
        width: cw,
        height: ch,
      };
      const port = await variants(input, `${name}-portrait`, region, widthsFor(config.portraitWidths, cw));
      entry.portrait = { width: cw, height: ch, ...port };
    }

    manifest[photo.key] = entry;
    console.log(`done  ${photo.source} → ${photo.key} (${entry.webp.length} widths${entry.portrait ? ' + portrait' : ''})`);
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nmanifest: ${Object.keys(manifest).length} photo(s) → ${config.manifest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

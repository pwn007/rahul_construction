import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import manifest from '@/data/image-variants.json';

/**
 * A photograph at the size the screen needs.
 *
 * The site is a static export, so there is no image server to resize on
 * request; `scripts/build-image-variants.mjs` does it ahead of time and writes
 * `src/data/image-variants.json`. This component looks the `src` up there:
 *
 *  · listed  → a <picture> with AVIF and WebP `srcset`s at 640–2560 px, plus a
 *              hand-cropped portrait version for phones and portrait tablets;
 *  · not yet → the plain file, exactly as an <img src> would show it today.
 *
 * So every call site can use it now, and gets the sharper files the moment the
 * client's photographs are run through the script — no further code change.
 *
 * Full-bleed backgrounds fill their box with `object-fit: cover` (set by the
 * caller's container, e.g. `.chapter__media`); `position` and
 * `positionPortrait` choose which part of the photo survives the crop.
 */

type Variant = readonly [width: number, url: string];
interface VariantSet {
  width: number;
  height: number;
  avif?: Variant[];
  webp?: Variant[];
}
interface ManifestEntry extends VariantSet {
  portrait?: VariantSet;
}

const MANIFEST = manifest as unknown as Record<string, ManifestEntry | undefined>;

/** True when `npm run images:variants` has made sizes for this path. */
export const hasImageVariants = (src: string) => Boolean(MANIFEST[src]);

/** Portrait crops take over where the hero's portrait crop already does. */
export const PORTRAIT_MEDIA = '(max-width: 1023.98px) and (orientation: portrait)';

const srcSet = (variants?: Variant[]) => variants?.map(([w, url]) => `${url} ${w}w`).join(', ');

export interface ResponsiveImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt' | 'loading' | 'fetchPriority'> {
  src: string;
  /** Required. Use `""` for a purely decorative background. */
  alt: string;
  /** The hero, and only the hero: loaded eagerly at high priority. */
  priority?: boolean;
  /** Loaded now at normal priority, though not in view: warming the hero's other slides. */
  eager?: boolean;
  /** Rendered width; full-bleed by default. */
  sizes?: string;
  /** `object-position` on landscape screens, e.g. `'50% 40%'`. */
  position?: string;
  /** `object-position` on portrait screens below 1024 px, when it should differ. */
  positionPortrait?: string;
}

export function ResponsiveImage({
  src,
  alt,
  priority = false,
  eager = false,
  sizes = '100vw',
  position,
  positionPortrait,
  className,
  style,
  ...rest
}: ResponsiveImageProps) {
  const entry = MANIFEST[src];
  const imgStyle = {
    ...style,
    ...(position ? { '--img-pos': position } : null),
    ...(positionPortrait ? { '--img-pos-portrait': positionPortrait } : null),
  } as CSSProperties;

  const img = (
    <img
      {...rest}
      src={src}
      alt={alt}
      width={entry?.width}
      height={entry?.height}
      sizes={entry ? sizes : undefined}
      srcSet={entry ? srcSet(entry.webp) : undefined}
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      className={cn('rimg', className)}
      style={imgStyle}
    />
  );

  if (!entry) return img;

  const portrait = entry.portrait;
  return (
    <picture>
      {portrait?.avif && <source media={PORTRAIT_MEDIA} type="image/avif" srcSet={srcSet(portrait.avif)} sizes={sizes} />}
      {portrait?.webp && <source media={PORTRAIT_MEDIA} type="image/webp" srcSet={srcSet(portrait.webp)} sizes={sizes} />}
      {entry.avif && <source type="image/avif" srcSet={srcSet(entry.avif)} sizes={sizes} />}
      {img}
    </picture>
  );
}

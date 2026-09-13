'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import { SITE } from '@/constants/site';

export type LogoTone = 'auto' | 'light' | 'dark';

/**
 * The brand mark, from the client's 2026 identity kit (docs/brand/mark.svg).
 *
 * One cyan shape — two isometric parallelograms joined at a small notch, an
 * abstract "N" rising like a building. It is single-colour on every ground:
 * cyan holds on paper and on navy alike, so unlike the two-tone mark it
 * replaced there is no tone for the mark to carry.
 *
 * ── The path lives in the kit's 1000×1000 artboard ──────────────────────────
 * MARK_BBOX is its ink box. Anything placing the mark — LogoMark's viewBox, the
 * hero scene's door sign — reads the box from here; scaling by the artboard
 * instead leaves the mark tiny and off-centre.
 */
export const MARK_PATH =
  'M500,238.36V577.55a5.57,5.57,0,0,1-5.58,5.57,5.45,5.45,0,0,1-2.66-.68,3.67,3.67,0,0,1-.47-.26L273.4,456.4V605.18a44.4,44.4,0,0,0,22.2,38.46l204.4,118V596.87a5.57,5.57,0,0,1,5.58-5.57,5.37,5.37,0,0,1,2.57.63,4.56,4.56,0,0,1,.6.34L726.6,718V369.18Z';

export const MARK_BBOX = { x: 273.4, y: 238.36, w: 453.2, h: 523.28 } as const;

/**
 * The horizontal lockup (docs/brand/lockup.svg) as outlined paths, not live
 * text. The kit's wordmark is set in a Montserrat-style face the site does not
 * load; drawing the designer's own outlines keeps the logo exact without a font
 * request. "Neetu" takes the tone, the mark and ARCHSTONE stay cyan.
 */
const LOCKUP = {
  width: 784.6,
  height: 266.19,
  viewBox: '107.72 366.89 784.6 266.19',
  mark: 'M223,366.89V539.45a2.84,2.84,0,0,1-2.83,2.84,2.73,2.73,0,0,1-1.36-.35,1.41,1.41,0,0,1-.24-.13l-110.85-64v75.69A22.61,22.61,0,0,0,119,573.08l104,60V549.28a2.84,2.84,0,0,1,2.84-2.83,2.79,2.79,0,0,1,1.31.32l.31.17,110.83,64V433.45Z',
  primary: [
    'M427,411.26h16.7l60.21,73.94V411.26H524v109.2H507.32l-60.21-73.94v73.94H427Z',
    'M544.61,478.81c0-24.81,18.25-42.59,43-42.59,24.34,0,42.12,17,42.12,43,0,1.56-.16,3.9-.31,5.78H564.11c2.34,12.16,12.48,20,27,20,9.36,0,16.69-3,22.62-9l10.45,12c-7.48,8.89-19.18,13.57-33.54,13.57C562.7,521.55,544.61,503.61,544.61,478.81Zm66.61-6.71c-1.56-12-10.77-20.28-23.56-20.28-12.63,0-21.84,8.11-23.71,20.28Z',
    'M641.64,478.81c0-24.81,18.25-42.59,43.05-42.59,24.34,0,42.12,17,42.12,43,0,1.56-.16,3.9-.31,5.78H661.14c2.34,12.16,12.48,20,27,20,9.36,0,16.69-3,22.62-9l10.45,12c-7.48,8.89-19.18,13.57-33.53,13.57C659.73,521.55,641.64,503.61,641.64,478.81Zm66.61-6.71c-1.56-12-10.77-20.28-23.56-20.28-12.63,0-21.84,8.11-23.71,20.28Z',
    'M748.18,493.47V452.76H734.46v-15.6h13.72V418.75h19.5v18.41H790v15.6H767.68V493c0,8.11,4.06,12.48,11.54,12.48a17.52,17.52,0,0,0,10.92-3.43l5.46,13.88c-4.68,3.75-11.7,5.62-18.72,5.62C758.63,521.55,748.18,511.88,748.18,493.47Z',
    'M811.05,484.74V437.16h19.5v44.92c0,15.13,7.17,22.31,19.5,22.31,13.57,0,22.77-8.42,22.77-25.12V437.16h19.5v83.3H873.76V509.85c-6.24,7.64-16.07,11.7-26.83,11.7C825.55,521.55,811.05,509.85,811.05,484.74Z',
  ],
  secondary: [
    'M445.34,548.21h5.73l18.41,40.53H463.4l-4.46-10.13H437.41L433,588.74h-6ZM456.92,574l-8.75-19.85L439.43,574Z',
    'M487.08,548.21h15.8c10.54,0,16.91,5.33,16.91,14.13,0,6.31-3.24,10.77-8.92,12.79l9.61,13.61h-6.31l-8.74-12.45c-.81.06-1.62.12-2.55.12h-10v12.33h-5.79Zm15.63,23.28c7.41,0,11.29-3.36,11.29-9.15s-3.88-9.09-11.29-9.09h-9.84v18.24Z',
    'M537.44,568.48c0-12,9.15-20.73,21.48-20.73,6.25,0,11.7,2.14,15.4,6.31l-3.76,3.65a15,15,0,0,0-11.41-4.81c-9.15,0-15.92,6.6-15.92,15.58s6.77,15.57,15.92,15.57a15.08,15.08,0,0,0,11.41-4.86l3.76,3.64c-3.7,4.17-9.15,6.37-15.46,6.37C546.59,589.2,537.44,580.46,537.44,568.48Z',
    'M622.66,570.68H599.39v18.06H593.6V548.21h5.79v17.43h23.27V548.21h5.79v40.53h-5.79Z',
    'M648.48,584.11l2.14-4.52c3,2.72,8.16,4.69,13.37,4.69,7,0,10-2.72,10-6.25,0-9.9-24.55-3.65-24.55-18.7,0-6.26,4.86-11.58,15.52-11.58,4.74,0,9.67,1.27,13,3.59L676.09,556a20.89,20.89,0,0,0-11.11-3.3c-6.89,0-9.84,2.89-9.84,6.43,0,9.9,24.54,3.7,24.54,18.58,0,6.19-5,11.52-15.69,11.52C657.8,589.2,651.72,587.12,648.48,584.11Z',
    'M707.18,553.25H693.29v-5h33.52v5h-13.9v35.49h-5.73Z',
    'M740.81,568.48c0-11.87,9.15-20.73,21.6-20.73s21.48,8.8,21.48,20.73-9.15,20.72-21.48,20.72S740.81,580.34,740.81,568.48Zm37.29,0c0-9-6.72-15.58-15.69-15.58s-15.81,6.6-15.81,15.58,6.72,15.57,15.81,15.57S778.1,577.45,778.1,568.48Z',
    'M804.32,548.21h4.75l24.32,30.22V548.21h5.79v40.53h-4.75l-24.32-30.22v30.22h-5.79Z',
    'M862.91,548.21h28.6v5H868.7V565.7H889v4.92H868.7V583.7h23.62v5H862.91Z',
  ],
};

/**
 * "Neetu" alone, in the kit's outlines — for places that pair the mark with
 * their own label (the admin bar's "Admin" badge) rather than the full lockup.
 * Fills with currentColor, so it takes whatever text colour it sits in.
 */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="427 411.26 465.32 110.31" width={465.32} height={110.31} className={cn('h-4 w-auto', className)} aria-hidden>
      <g fill="currentColor">
        {LOCKUP.primary.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/* `tone` is still accepted — every caller passes it — but a single-colour mark
   has nothing to switch. */
export function LogoMark({ className }: { className?: string; tone?: LogoTone }) {
  return (
    <svg
      viewBox={`${MARK_BBOX.x} ${MARK_BBOX.y} ${MARK_BBOX.w} ${MARK_BBOX.h}`}
      className={cn('h-9 w-9', className)}
      aria-hidden
    >
      <path d={MARK_PATH} fill="currentColor" className="text-cyan-500" />
    </svg>
  );
}

export function Logo({
  className,
  compact,
  tone = 'auto',
}: {
  className?: string;
  compact?: boolean;
  tone?: LogoTone;
}) {
  const wordTone =
    tone === 'light' ? 'text-white' : tone === 'dark' ? 'text-navy-800' : 'text-navy-800 dark:text-white';

  return (
    <Link href="/" className={cn('group flex items-center', className)} aria-label={`${SITE.name} — home`}>
      {compact ? (
        <LogoMark className="h-9 w-9 shrink-0 transition-transform duration-500 ease-out-expo group-hover:rotate-[-6deg]" />
      ) : (
        /* width/height attributes give the SVG an intrinsic ratio, so `w-auto`
           resolves from the height instead of falling back to 300px. */
        <svg
          viewBox={LOCKUP.viewBox}
          width={LOCKUP.width}
          height={LOCKUP.height}
          className="h-10 w-auto shrink-0"
          aria-hidden
        >
          <path
            d={LOCKUP.mark}
            fill="currentColor"
            className="text-cyan-500 transition-transform duration-500 ease-out-expo [transform-box:fill-box] [transform-origin:center] group-hover:rotate-[-6deg]"
          />
          <g fill="currentColor" className={cn('transition-colors', wordTone)}>
            {LOCKUP.primary.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g fill="currentColor" className="text-cyan-500">
            {LOCKUP.secondary.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </svg>
      )}
    </Link>
  );
}

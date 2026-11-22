import { MARK_BBOX, MARK_PATH } from '@/components/common/Logo';
import { cn } from '@/lib/cn';

/*
 * The home page's glyphs, from the client's Figma Make code (Nov 2026): the
 * service emblems, chevrons, quote mark and socials are their SVG paths
 * unchanged. Their two logos were small PNGs (63×71, 88×88) that go soft on a
 * retina screen, so those are redrawn here with our own vector mark, placed
 * where the PNGs had it.
 */

type IconProps = { className?: string };

/** The cyan mark alone, its viewBox the ink box. */
export function TemplateMark({ className }: IconProps) {
  return (
    <svg viewBox={`${MARK_BBOX.x} ${MARK_BBOX.y} ${MARK_BBOX.w} ${MARK_BBOX.h}`} className={className} aria-hidden>
      <path d={MARK_PATH} fill="#00BBEE" />
    </svg>
  );
}

/** Their `logo.png`: the mark on white, inset 2/63 and 3/71. Size it by height. */
export function HeaderLogo({ className }: IconProps) {
  return (
    <span className={cn('relative block aspect-[63/71] bg-white', className)} aria-hidden>
      <TemplateMark className="absolute left-[3.17%] top-[4.23%] w-[95.24%]" />
    </span>
  );
}

/** Their `logo-box.png`: a white tile (a 2px navy edge top and left) with the mark at 25/88. */
export function FooterLogoBox({ className }: IconProps) {
  return (
    <span className={cn('relative block', className)} aria-hidden>
      <span className="absolute bottom-0 left-[2.27%] right-0 top-[2.27%] bg-white" />
      <TemplateMark className="absolute left-[28.41%] top-[28.41%] w-[45.45%]" />
    </span>
  );
}

export function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg width="45%" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d={dir === 'prev' ? 'M14 3L5 12l9 9' : 'M6 3l9 9-9 9'} />
    </svg>
  );
}

export function QuoteGlyph({ className }: IconProps) {
  return (
    <svg width="2.8vw" viewBox="0 0 40 30" className={className} aria-hidden>
      <path d="M0 14C0 5 5 0 14 0v4C9 5 8 8 8 11h8v19H0zM22 14C22 5 27 0 36 0v4c-5 1-6 4-6 7h8v19H22z" />
    </svg>
  );
}

export const SOCIAL_PATHS = {
  instagram: {
    d: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-3a1 1 0 100 2 1 1 0 000-2z',
    evenOdd: true,
  },
  facebook: {
    d: 'M12 2a10 10 0 00-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0012 2z',
    evenOdd: false,
  },
  linkedin: {
    d: 'M3 3h18v18H3zm4.5 7H5v8h2.5zM6.2 6a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8zM18 18v-4.4c0-2.4-1.3-3.6-3-3.6-1.4 0-2 .8-2.3 1.3V10H10.3v8h2.4v-4.3c0-1 .6-1.8 1.5-1.8s1.4.7 1.4 1.8V18z',
    evenOdd: true,
  },
} as const;

/* The four service emblems: navy line drawings on a 240 grid, the parts in
   `ht-icon-accent` drawn cyan. */
const EMBLEMS = [
  <g key="tracking">
    <path d="M32 32v174h174M58 184v-32h26v32m28 0v-66h26v66m28 0v-100h26v100" />
    <path className="ht-icon-accent" d="m50 128 48-34 42 12 60-64m-34 0h34v34" />
    <g className="ht-icon-accent">
      <circle cx="50" cy="128" r="6" />
      <circle cx="98" cy="94" r="6" />
      <circle cx="140" cy="106" r="6" />
    </g>
  </g>,
  <g key="compass">
    <path d="M120 22v24M109 46h22v22h-22zM110 87 58 200m72-113 52 113M54 208l4-8m124 0 4 8" />
    <circle cx="120" cy="80" r="15" />
    <path className="ht-icon-accent" d="M53 124a83 83 0 0 0 134 0M70 145h100m-50-9v18" />
  </g>,
  <g key="engineering">
    <path d="m104 28-4 20-16 7-17-11-23 23 11 17-7 16-20 4v32l20 4 7 16-11 17 23 23 17-11 16 7 4 20h32l4-20 16-7 17 11 23-23-11-17 7-16 20-4v-32l-20-4-7-16 11-17-23-23-17 11-16-7-4-20z" />
    <path d="M102 75a48 48 0 0 0-21 73m57 17a48 48 0 0 0 21-73" />
    <path className="ht-icon-accent" d="m137 64-47 66h29l-16 46 47-66h-29z" />
  </g>,
  <g key="interior">
    <path d="m120 28 83 48v96l-83 48-83-48V76zM37 76l83 48 83-48m-83 48v96" />
    <path className="ht-icon-accent" d="m67 144 53 31 53-31m-106 0v-32m106 32v-32M120 175v-32m-40-10 27-16v-27l-27 16zm60-16 32-18V76l-32 18z" />
    <path d="m67 163 53 31 53-31" />
  </g>,
];

export function ServiceIcon({ index }: { index: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 240 240"
      className="ht-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {EMBLEMS[index]}
    </svg>
  );
}

'use client';

import Link from 'next/link';
import { SITE } from '@/constants/site';
import { FOOTER as F } from './content';
import { FooterLogoBox, SOCIAL_PATHS } from './icons';

const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
] as const;

const link =
  'inline-block text-[1.02vw] font-light leading-[2.2] tracking-[0.1em] transition duration-200 hover:translate-x-1 hover:text-cyan-500 max-lg:text-[0.75rem]';
const heading = 'text-[1.05vw] font-light tracking-[0.12em] max-lg:text-xs';

/**
 * The home page's footer, from the client's Figma Make design (Nov 2026).
 * Every other page keeps `Footer`; SiteChrome picks by pathname.
 *
 * Its columns are the design's, written here, so the admin's Footer module
 * (which drives `Footer`) does not reach this one, and there is no newsletter
 * on the home page. The links go to the real pages (the design's only went
 * back to the top).
 */
export function HomeFooter() {
  return (
    <footer data-section="footer" className="ht relative mx-auto w-full max-w-[1920px] overflow-hidden bg-navy-800 pb-[10vw] pt-[2.4vw] text-white max-lg:pb-10">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,#1d4ed8_1.5px,transparent_1.6px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_50%_100%,#000,transparent_70%)]" />
      <div className="relative mx-[5.6%] grid grid-cols-2 gap-y-8 border-b border-white/30 pb-[2vw] lg:grid-cols-[19%_26%_15%_12%_1fr]">
        {/* Full width under 768px: in the design's half column the email ran
            over the SERVICES links beside it. */}
        <div className="max-md:col-span-2">
          <Link href="/" aria-label={`${SITE.name} — home`}>
            <FooterLogoBox className="size-[5.6vw] max-lg:size-14" />
          </Link>
          <address className="mt-[2.4vw] text-[1.3vw] font-light not-italic leading-[1.6] max-lg:text-[0.875rem]">
            {F.address}
            <br />
            <a href={`tel:${SITE.phoneRaw}`} className="transition hover:text-cyan-500">
              {F.phone}
            </a>
            <br />
            <a href={`mailto:${SITE.email}`} className="transition hover:text-cyan-500">
              {F.email}
            </a>
          </address>
        </div>
        {F.columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading} className={col.heading === 'RESOURCES' ? 'lg:text-center' : ''}>
            <h4 className={heading}>{col.heading}</h4>
            <ul className="mt-[0.8vw]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <h4 className={heading}>{F.follow}</h4>
          <div className="mt-[1vw] flex gap-[0.8vw] max-lg:gap-3">
            {SOCIALS.map((s) => {
              const p = SOCIAL_PATHS[s.key];
              return (
                <a
                  key={s.key}
                  href={SITE.socials[s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="transition duration-300 hover:-translate-y-1 hover:text-cyan-500"
                >
                  <svg viewBox="0 0 24 24" className="size-[1.9vw] fill-current max-lg:size-6" aria-hidden>
                    <path d={p.d} fillRule={p.evenOdd ? 'evenodd' : undefined} />
                  </svg>
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative mx-[5.6%] mt-[1vw] flex justify-between text-[0.95vw] font-light tracking-wide max-lg:text-[10px]">
        <span>{F.legal}</span>
        <span>{F.sign}</span>
      </div>
    </footer>
  );
}

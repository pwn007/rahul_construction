import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { SITE } from '@/constants/site';

export type LogoTone = 'auto' | 'light' | 'dark';

/**
 * The mark from the portfolio cover: two offset parallelograms forming
 * an abstract "N" / building mass.
 *
 * The leading shape is always cyan (legible on any ground). The trailing shape
 * carries the tone — it must never be navy-on-dark, which is what made the
 * wordmark disappear over the dark hero.
 */
export function LogoMark({ className, tone = 'auto' }: { className?: string; tone?: LogoTone }) {
  const trailing =
    tone === 'light' ? 'text-white' : tone === 'dark' ? 'text-navy-800' : 'text-navy-800 dark:text-white';

  return (
    <svg viewBox="0 0 44 44" className={cn('h-9 w-9', className)} fill="none" aria-hidden>
      <path d="M4 4h13v20L4 30V4Z" fill="currentColor" className="text-cyan-500" />
      <path d="M21 10h13v20a10 10 0 0 1-10 10h-3V10Z" fill="currentColor" className={trailing} />
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
    <Link to="/" className={cn('group flex items-center gap-2.5', className)} aria-label={`${SITE.name} — home`}>
      <LogoMark
        tone={tone}
        className="h-9 w-9 shrink-0 transition-transform duration-500 ease-out-expo group-hover:rotate-[-6deg]"
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={cn('font-display text-[1.35rem] font-semibold tracking-tight transition-colors', wordTone)}>
            {SITE.wordmark.primary}
          </span>
          <span className="mt-0.5 font-display text-[0.6rem] font-medium tracking-[0.32em] text-cyan-500">
            {SITE.wordmark.secondary}
          </span>
        </span>
      )}
    </Link>
  );
}

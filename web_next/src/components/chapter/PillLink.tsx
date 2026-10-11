import type { MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The finalized design's button: an outlined pill whose frosted circle holds the
 * icon and, on hover or press, slides across to fill the pill.
 *
 * For dark grounds (chapters, the hero, the header over the hero). `solid` is
 * the one filled variant, for the single most important action in a view.
 * Styles in globals.css under "PILLS".
 */
export function PillLink({
  href,
  icon,
  children,
  external = false,
  solid = false,
  onClick,
  className,
  ariaLabel,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  /** Opens in a new tab (WhatsApp, external sites). `tel:` links need not set it. */
  external?: boolean;
  solid?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn('pill', className)}
      data-solid={solid || undefined}
    >
      <span className="pill__fill" aria-hidden />
      <span className="pill__icon" aria-hidden>
        {icon}
      </span>
      <span className="pill__label">{children}</span>
    </a>
  );
}

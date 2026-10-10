'use client';

import { useId } from 'react';
import Link from 'next/link';
import { Checkbox, FieldError } from '@/components/ui';
import { CONSENT_TEXT } from '@/lib/consent';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/cn';

/**
 * The consent gate on every lead form.
 *
 * Unticked by default and blocking — under the DPDP Act consent has to be a
 * clear affirmative action, which a pre-ticked box is not. The decline path is
 * simply leaving it alone: there is no "no thanks" button to word, which is the
 * cheapest way to stay clear of the CCPA's confirm-shaming rule.
 *
 * The label is a `<label>` wrapping the input, so the whole sentence is a hit
 * target. That matters more than it sounds on a phone, where an 18px checkbox
 * is the difference between consenting and mis-tapping.
 */
export function ConsentCheckbox({
  checked,
  onChange,
  error,
  className,
  /** `light` for the permanently dark grounds — the footer, the navy bands. */
  tone = 'default',
  /** Overrides the wording for a surface that is not asking to phone anybody. */
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  error?: string;
  className?: string;
  tone?: 'default' | 'light';
  children?: React.ReactNode;
}) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          className={cn('mt-0.5', tone === 'light' && 'border-white/25 bg-white/10', error && 'border-danger')}
        />
        <span className={cn('text-caption leading-relaxed', tone === 'light' ? 'text-white/60' : 'text-muted')}>
          {children ?? CONSENT_TEXT}{' '}
          <Link
            href={ROUTES.privacy}
            className={cn(
              'underline underline-offset-2',
              tone === 'light' ? 'hover:text-cyan-400' : 'hover:text-cyan-700 dark:hover:text-cyan-300',
            )}
          >
            Privacy policy
          </Link>
          .
        </span>
      </label>
      <FieldError message={error} />
    </div>
  );
}

/** The one message shown when the box is left unticked. */
export const CONSENT_REQUIRED = 'Please tick this so we can call you back.';

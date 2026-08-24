'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * `text-base lg:text-sm` — 16px on phones and tablets, 14px from `lg` up.
 *
 * Not a style preference. iOS Safari zooms the viewport whenever a form control
 * smaller than 16px receives focus, and never zooms back out: at the previous
 * flat `text-sm` every field on the site — contact, estimator, the lead popup,
 * the downloads gate, the newsletter — jerked the page larger on tap and left
 * the visitor pinching to recover. 16px is the threshold that suppresses it, so
 * this is the one breakpoint that exists for behaviour rather than for looks.
 *
 * Any new field must go through these primitives, or repeat the pair.
 */
const base =
  'w-full rounded-md border bg-[rgb(var(--c-surface))] px-3.5 text-base text-[rgb(var(--c-text))] placeholder:text-[rgb(var(--c-text-subtle))] transition-colors duration-200 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/12 disabled:cursor-not-allowed disabled:opacity-60 lg:text-sm';

/* ------------------------------- Label ------------------------------- */

export function Label({
  children,
  htmlFor,
  required,
  hint,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-2 flex items-baseline justify-between gap-3', className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-[rgb(var(--c-text))]">
        {children}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {hint && <span className="text-caption text-subtle">{hint}</span>}
    </div>
  );
}

/* ---------------------------- FieldError ----------------------------- */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-caption text-danger" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/* ------------------------------- Input ------------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, leftIcon, suffix, ...props },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text-subtle))]">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          base,
          'h-11',
          leftIcon && 'pl-10',
          suffix && 'pr-16',
          error && 'border-danger focus:border-danger focus:ring-danger/12',
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-caption text-subtle">
          {suffix}
        </span>
      )}
    </div>
  );
});

/* ----------------------------- Textarea ------------------------------ */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(base, 'resize-y py-3', error && 'border-danger focus:border-danger focus:ring-danger/12', className)}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  );
});

/* ------------------------------ Select ------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          base,
          'h-11 appearance-none pr-10',
          error && 'border-danger focus:border-danger focus:ring-danger/12',
          className,
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--c-text-subtle))]"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

/* ----------------------------- Checkbox ------------------------------ */

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] border-2 border-[rgb(var(--c-border))] bg-[rgb(var(--c-surface))] accent-cyan-500 transition-colors checked:border-cyan-500 checked:bg-cyan-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500',
        className,
      )}
      {...props}
    />
  );
});

/* ------------------------------ Switch ------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 disabled:opacity-50',
        checked ? 'bg-cyan-500' : 'bg-[rgb(var(--c-border))]',
      )}
    >
      <span
        className={cn(
          'inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out-expo',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  );
}

/* ---------------------------- FormField ------------------------------ */

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  description,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {description && !error && <p className="mt-1.5 text-caption text-subtle">{description}</p>}
      <FieldError message={error} />
    </div>
  );
}

'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-out-expo disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-navy-800 text-white hover:bg-navy-900 hover:shadow-lg active:scale-[0.98] dark:bg-cyan-500 dark:text-navy-950 dark:hover:bg-cyan-400',
        accent:
          'bg-cyan-500 text-white hover:bg-cyan-600 hover:shadow-glow active:scale-[0.98]',
        secondary:
          'surface border text-[rgb(var(--c-text))] hover:border-cyan-500/60 hover:shadow-md active:scale-[0.98]',
        outline:
          'border border-current/25 bg-transparent hover:border-current/60 hover:bg-current/[0.04] active:scale-[0.98]',
        ghost: 'bg-transparent hover:bg-current/[0.06] active:scale-[0.98]',
        link: 'link-underline bg-transparent p-0 text-cyan-700 hover:text-cyan-500 dark:text-cyan-400',
        danger: 'bg-danger text-white hover:brightness-110 active:scale-[0.98]',
        glass: 'glass text-[rgb(var(--c-text))] hover:shadow-md active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 rounded-md px-3.5 text-[0.8125rem]',
        md: 'h-11 rounded-lg px-5 text-sm',
        lg: 'h-[52px] rounded-lg px-7 text-[0.9375rem]',
        xl: 'h-[60px] rounded-xl px-9 text-base',
        icon: 'h-11 w-11 rounded-lg',
        'icon-sm': 'h-9 w-9 rounded-md',
      },
      full: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', full: false },
  },
);

type BaseProps = VariantProps<typeof buttonVariants> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> & {
    href?: string;
    external?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, leftIcon, rightIcon, loading, children, href, external, disabled, ...props },
  ref,
) {
  const classes = cn(buttonVariants({ variant, size, full }), className);

  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (href && !disabled) {
    if (external || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:')) {
      return (
        <a
          className={classes}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {content}
        </a>
      );
    }
    return (
      <Link className={classes} href={href}>
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
});

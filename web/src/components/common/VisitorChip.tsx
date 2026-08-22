import { useCallback, useState } from 'react';
import { cn } from '@/lib/cn';
import { useVisitor, forgetVisitor } from '@/lib/visitor';
import { useOnClickOutside } from '@/hooks';

/**
 * The one piece of furniture this feature adds to the site.
 *
 * Everywhere else the visitor's name replaces existing copy; here there is a
 * new element, so it is kept deliberately quiet — caption-sized, muted, no
 * border, no avatar. It has to sit *below* the Get Estimate button in the
 * visual hierarchy: this is recognition, not a call to action, and a chip that
 * competes with the primary CTA has made the navbar worse to personalize it.
 *
 * Renders nothing at all when there is no name — no placeholder, no reserved
 * space — so the default navbar is untouched for the majority of visitors.
 */
export function VisitorChip({
  overDark = false,
  variant = 'bar',
  className,
}: {
  /** Navbar sits over the dark hero on some routes; inherit its own signal. */
  overDark?: boolean;
  /** `bar` for the desktop actions row, `drawer` for the mobile menu header. */
  variant?: 'bar' | 'drawer';
  className?: string;
}) {
  const name = useVisitor();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = useCallback(() => setMenuOpen(false), []);
  const ref = useOnClickOutside<HTMLDivElement>(close);

  if (!name) return null;

  const clear = () => {
    forgetVisitor();
    setMenuOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/*
        A button rather than plain text, and a popover rather than a bare ×.
        Clearing is destructive-ish and irreversible without retyping, so it
        takes two deliberate taps.
      */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Signed in as ${name}. Not you?`}
        className={cn(
          'max-w-[10rem] truncate rounded-md px-2.5 py-1.5 text-caption font-medium transition-colors',
          variant === 'drawer'
            ? 'text-muted hover:bg-[rgb(var(--c-text))]/[0.06]'
            : overDark
              ? 'text-white/70 hover:bg-white/10 hover:text-white'
              : 'text-subtle hover:bg-[rgb(var(--c-text))]/[0.06] hover:text-[rgb(var(--c-text))]',
        )}
      >
        Hi, {name}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={cn(
            'surface absolute z-50 mt-1.5 w-max rounded-md border p-1 shadow-lg',
            variant === 'drawer' ? 'left-0' : 'right-0',
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={clear}
            className="block w-full rounded px-3 py-2 text-left text-caption text-muted transition-colors hover:bg-[rgb(var(--c-text))]/[0.06] hover:text-[rgb(var(--c-text))]"
          >
            Not you? Clear name
          </button>
        </div>
      )}
    </div>
  );
}

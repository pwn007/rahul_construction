import { forwardRef, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks';
import { OUTSIDE_DISTRICT } from '@/lib/geo';
import type { AtlasEntry } from './useAtlas';

/**
 * District chips.
 *
 * These are not decoration and not a mobile afterthought — they carry two jobs
 * the map itself cannot:
 *
 * 1. **Mobile control.** An interactive map embedded in a scrolling page
 *    captures the scroll gesture, which NN/g found actively harms the task. On
 *    small screens the map goes inert and these become the only control.
 *
 * 2. **WCAG 2.2 SC 2.5.8 conformance.** Small zones — Kishanpole, Amer — render
 *    well under the 24×24px minimum target size in a narrow column. That is
 *    permissible only because an equivalent control exists elsewhere, and this
 *    row is that control, at 44px. Do not drop it to tidy the layout without
 *    replacing the conformance mechanism.
 *
 * They also carry the out-of-limit group, which has no polygon to click.
 */

interface AtlasChipsProps {
  entries: AtlasEntry[];
  outsideCount: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  total: number;
  className?: string;
}

export function AtlasChips({ entries, outsideCount, selected, onSelect, onHover, total, className }: AtlasChipsProps) {
  const reduced = usePrefersReducedMotion();
  const activeRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);

  /**
   * Keep the selected chip in view when the selection arrives from the map or
   * a deep link. Skipped on first render — scrolling the row on page load
   * yanks the viewport for no reason.
   */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [selected, reduced]);

  const chips = [
    ...entries
      .filter((e) => e.count > 0)
      .map((e) => ({ id: e.district.id, label: e.district.label, hint: `JMC ${e.district.official}`, count: e.count })),
    ...(outsideCount
      ? [{ id: OUTSIDE_DISTRICT.id, label: OUTSIDE_DISTRICT.label, hint: OUTSIDE_DISTRICT.official, count: outsideCount }]
      : []),
  ];

  return (
    <div
      role="group"
      aria-label="Filter projects by Jaipur district"
      className={cn('no-scrollbar mask-fade-x -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}
    >
      <Chip
        ref={selected === null ? activeRef : undefined}
        label="All districts"
        count={total}
        active={selected === null}
        onClick={() => onSelect(null)}
      />
      {chips.map((chip) => (
        <Chip
          key={chip.id}
          ref={selected === chip.id ? activeRef : undefined}
          label={chip.label}
          hint={chip.hint}
          count={chip.count}
          active={selected === chip.id}
          onClick={() => onSelect(selected === chip.id ? null : chip.id)}
          onHover={onHover ? (on) => onHover(on ? chip.id : null) : undefined}
        />
      ))}
    </div>
  );
}

interface ChipProps {
  label: string;
  hint?: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onHover?: (entering: boolean) => void;
}

const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { label, hint, count, active, onClick, onHover },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      /* Selection is never signalled by colour alone: a check glyph, the count
         and the active border all carry it too. */
      aria-label={hint ? `${label} — ${count} project${count === 1 ? '' : 's'} (${hint})` : `${label} — ${count}`}
      onClick={onClick}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      onFocus={onHover ? () => onHover(true) : undefined}
      onBlur={onHover ? () => onHover(false) : undefined}
      className={cn(
        /* min-h-11 = 44px — the mobile touch target, and the reason the map's
           smaller zones are permitted to be under 24px. */
        'flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-all duration-300',
        active
          ? 'border-cyan-500 bg-cyan-500/[0.12] font-medium text-cyan-700 dark:text-cyan-300'
          : 'bg-[rgb(var(--c-surface))] text-muted hover:border-cyan-500/50 hover:text-[rgb(var(--c-text))]',
      )}
    >
      {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />}
      <span className="whitespace-nowrap">{label}</span>
      <span
        className={cn(
          'num rounded-full px-1.5 py-0.5 text-[0.68rem] leading-none',
          active ? 'bg-cyan-500 text-white' : 'bg-[rgb(var(--c-text))]/[0.07] text-subtle',
        )}
      >
        {count}
      </span>
    </button>
  );
});

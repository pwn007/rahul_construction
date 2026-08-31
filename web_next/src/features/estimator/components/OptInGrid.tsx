'use client';

import { Minus, Plus } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';

export interface OptInItem {
  key: string;
  label: string;
  /** Devanagari gloss, where the English is trade vocabulary. */
  hindi?: string;
  description: string;
  /** Lucide icon name. */
  icon: string;
  amount: number;
  /** "₹100/sq ft", "per floor served", "per bedroom" — how the amount was reached. */
  basis?: string;
  /** Rendered under the price when the visitor has a choice of allowance. */
  options?: { key: string; label: string; detail?: string; amount: number }[];
  selectedOption?: string;
}

/**
 * The add-it-and-watch-the-number-move grid.
 *
 * One component for enhancements and for furniture, because they are the same
 * interaction: a toggle, a price, and an affordance that says which way the tap
 * goes. Two copies of this markup would have diverged inside a month — the
 * enhancement grid it came from had already grown a labour-only strike-through
 * that the furniture grid would have needed too.
 */
export function OptInGrid({
  items,
  selected,
  onToggle,
  onChoose,
  /** Prices are shown struck through: the visitor is buying these themselves. */
  muted,
}: {
  items: OptInItem[];
  selected: (key: string) => boolean;
  onToggle: (key: string) => void;
  onChoose?: (key: string, optionKey: string) => void;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const isOn = selected(item.key);

        return (
          <div
            key={item.key}
            className={cn(
              'rounded-lg border transition-all duration-300',
              isOn ? 'border-cyan-500 bg-cyan-500/[0.05]' : 'surface hover:border-cyan-500/50',
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(item.key)}
              aria-pressed={isOn}
              className="flex w-full items-start gap-4 p-5 text-left"
            >
              <span
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isOn ? 'bg-cyan-500 text-white' : 'bg-[rgb(var(--c-text))]/[0.05] text-[rgb(var(--c-text-muted))]',
                )}
              >
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-medium leading-tight">{item.label}</span>
                    {item.hindi && <span className="block font-deva text-caption text-subtle">{item.hindi}</span>}
                  </span>
                  <span className={cn('shrink-0', isOn ? 'text-cyan-500' : 'text-subtle')}>
                    {isOn ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </span>

                <span className="mt-1 block text-caption leading-relaxed text-muted">{item.description}</span>

                <span className={cn('num mt-2 block text-caption font-medium', muted && 'line-through opacity-50')}>
                  + {formatCurrency(item.amount)}
                  {item.basis && <span className="font-normal text-subtle"> ({item.basis})</span>}
                </span>
              </span>
            </button>

            {/*
              The allowance levels, revealed only once the item is in.
              Showing three prices per card for seven cards before anything is
              selected is twenty-one numbers competing with the total.
            */}
            {isOn && item.options && onChoose && (
              <div className="flex flex-wrap gap-2 border-t px-5 py-3">
                {item.options.map((opt) => {
                  const picked = item.selectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => onChoose(item.key, opt.key)}
                      aria-pressed={picked}
                      title={opt.detail}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-caption transition-colors',
                        picked
                          ? 'border-cyan-500 bg-cyan-500/10 font-medium text-cyan-700 dark:text-cyan-300'
                          : 'border-[rgb(var(--c-border))] text-muted hover:border-cyan-500/50',
                      )}
                    >
                      {opt.label}
                      <span className="num ml-1.5 text-subtle">{formatCurrency(opt.amount)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

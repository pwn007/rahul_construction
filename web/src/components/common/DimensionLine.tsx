import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks';

/**
 * A dimension line, drawn the way one appears on a construction drawing: a
 * witness line closed by 45° tick terminators rather than arrowheads. It draws
 * itself under a figure as the figure scrolls in, so it arrives in step with
 * the `Counter` that usually supplies the value — the number and its
 * measurement land together.
 *
 * Meant to sit inside the existing gap between a stat's value and its label,
 * so adding it costs no vertical space. Absolutely positioned, so the caller
 * only has to make the element wrapping the digits `relative`.
 *
 * Coloured from --c-brand-text, not raw brand cyan: #00BBEE is 2.1:1 on paper,
 * under the 3:1 floor a graphic element needs to clear to count as visible.
 * Wrap the tile in `group` to get the hover emphasis.
 */
export function DimensionLine({ tone, className }: { tone: 'light' | 'dark'; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const paint = tone === 'light' ? 'rgb(255 255 255 / 0.5)' : 'rgb(var(--c-brand-text) / 0.6)';

  return (
    <motion.span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 -bottom-1 h-2 opacity-70 transition-opacity duration-500 ease-out-expo group-hover:opacity-100',
        className,
      )}
      initial={reduced ? false : 'rest'}
      whileInView="drawn"
      viewport={{ once: true, margin: '-10%' }}
    >
      <motion.span
        className="absolute left-0 top-1/2 h-px w-full origin-left"
        style={{ background: paint }}
        variants={{ rest: { scaleX: 0 }, drawn: { scaleX: 1 } }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
      {(['left', 'right'] as const).map((side) => (
        <motion.span
          key={side}
          className={cn(
            'absolute top-1/2 h-2 w-px -translate-y-1/2 rotate-45',
            side === 'left' ? 'left-0' : 'right-0',
          )}
          style={{ background: paint }}
          variants={{ rest: { opacity: 0 }, drawn: { opacity: 1 } }}
          transition={{ duration: 0.3, delay: side === 'left' ? 0.15 : 0.75 }}
        />
      ))}
    </motion.span>
  );
}

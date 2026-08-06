import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, Info, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export { Button, buttonVariants, type ButtonProps } from './Button';
export { Input, Textarea, Select, Checkbox, Switch, Label, FieldError, FormField } from './Field';

/* ==================================================================== */
/* Badge                                                                 */
/* ==================================================================== */

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[rgb(var(--c-text))]/[0.06] text-[rgb(var(--c-text-muted))]',
        brand: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300',
        navy: 'bg-navy-800 text-white',
        sand: 'bg-sand-500/15 text-sand-700 dark:text-sand-300',
        outline: 'border border-current/20 text-[rgb(var(--c-text-muted))]',
        success: 'bg-success/12 text-success',
        warning: 'bg-warning/12 text-warning',
        danger: 'bg-danger/12 text-danger',
      },
      size: {
        sm: 'px-2 py-0.5 text-[0.6875rem]',
        md: 'px-2.5 py-1 text-caption',
        lg: 'px-3.5 py-1.5 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

/* ==================================================================== */
/* Card                                                                  */
/* ==================================================================== */

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }>(
  function Card({ className, hoverable, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'surface rounded-xl border shadow-sm',
          hoverable && 'card-hover hover:border-cyan-500/40 hover:shadow-md',
          className,
        )}
        {...props}
      />
    );
  },
);

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-6', className)} {...props} />;
}
export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t px-6 py-4', className)} {...props} />;
}

/* ==================================================================== */
/* Separator / Skeleton / Spinner / EmptyState                           */
/* ==================================================================== */

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      className={cn(vertical ? 'h-full w-px' : 'h-px w-full', 'bg-[rgb(var(--c-border))]', className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md bg-[rgb(var(--c-text))]/[0.06]', className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-5 w-5 animate-spin text-cyan-500', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-20 text-center', className)}>
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[rgb(var(--c-text))]/[0.05] text-[rgb(var(--c-text-subtle))]">
          {icon}
        </div>
      )}
      <h3 className="text-heading-md">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ==================================================================== */
/* Progress                                                              */
/* ==================================================================== */

export function Progress({
  value,
  className,
  barClassName,
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--c-text))]/[0.08]', className)}
    >
      <motion.div
        className={cn('h-full rounded-full bg-cyan-500', barClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ==================================================================== */
/* Tooltip                                                               */
/* ==================================================================== */

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-md bg-ink-950 px-2.5 py-1.5 text-[0.75rem] leading-snug text-white shadow-lg',
              side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ==================================================================== */
/* Dialog / Drawer                                                       */
/* ==================================================================== */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'surface relative w-full overflow-hidden rounded-t-2xl border shadow-xl sm:rounded-2xl',
              widths[size],
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
                <div>
                  {title && <h2 className="text-heading-md">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="-mr-1 rounded-md p-1.5 text-[rgb(var(--c-text-subtle))] transition-colors hover:bg-[rgb(var(--c-text))]/[0.06]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className={cn('surface absolute right-0 top-0 flex h-full w-full flex-col border-l shadow-xl', width)}
          >
            <div className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="text-heading-md">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-md p-1.5 text-[rgb(var(--c-text-subtle))] transition-colors hover:bg-[rgb(var(--c-text))]/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ==================================================================== */
/* Tabs                                                                  */
/* ==================================================================== */

export function Tabs({
  tabs,
  value,
  onChange,
  className,
  variant = 'underline',
}: {
  tabs: { value: string; label: string; count?: number; icon?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}) {
  const groupId = useId();
  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto',
        variant === 'underline' ? 'border-b' : 'rounded-lg bg-[rgb(var(--c-text))]/[0.05] p-1',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
              variant === 'underline' ? 'pb-3' : 'rounded-md',
              active ? 'text-[rgb(var(--c-text))]' : 'text-subtle hover:text-[rgb(var(--c-text-muted))]',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' && (
              <span className="num rounded-full bg-[rgb(var(--c-text))]/[0.08] px-1.5 py-0.5 text-[0.6875rem]">
                {t.count}
              </span>
            )}
            {active &&
              (variant === 'underline' ? (
                <motion.span
                  layoutId={`tab-underline-${groupId}`}
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-500"
                />
              ) : (
                <motion.span
                  layoutId={`tab-pill-${groupId}`}
                  className="surface absolute inset-0 -z-10 rounded-md shadow-xs"
                />
              ))}
          </button>
        );
      })}
    </div>
  );
}

/* ==================================================================== */
/* Accordion                                                             */
/* ==================================================================== */

export function Accordion({
  items,
  className,
  allowMultiple,
}: {
  items: { id: string; question: ReactNode; answer: ReactNode }[];
  className?: string;
  allowMultiple?: boolean;
}) {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (id: string) =>
    setOpen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : allowMultiple ? [...prev, id] : [id],
    );

  return (
    <div className={cn('divide-y border-y', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-cyan-700"
            >
              <span className="text-heading-md font-display">{item.question}</span>
              <span
                className={cn(
                  'mt-1 shrink-0 rounded-full border p-1 transition-transform duration-400 ease-out-expo',
                  isOpen && 'rotate-180 border-cyan-500 text-cyan-500',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="max-w-prose pb-6 text-[0.9375rem] leading-relaxed text-muted">{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ==================================================================== */
/* Toast                                                                 */
/* ==================================================================== */

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

const ToastContext = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void }>({ push: () => {} });

export const useToast = () => useContext(ToastContext);

const TOAST_ICON: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-cyan-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `t${++counter.current}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="glass pointer-events-auto flex items-start gap-3 rounded-lg p-4 shadow-lg"
              role="status"
            >
              {TOAST_ICON[t.kind]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-caption text-muted">{t.description}</p>}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 rounded p-1 text-[rgb(var(--c-text-subtle))] hover:bg-[rgb(var(--c-text))]/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ==================================================================== */
/* Pagination                                                            */
/* ==================================================================== */

export function Pagination({
  page,
  totalPages,
  onChange,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="rounded-md border px-3 py-2 text-sm transition-colors hover:border-cyan-500 disabled:opacity-40"
      >
        Prev
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - (pages[i - 1] ?? 0) > 1 && <span className="px-1 text-subtle">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'num min-w-[38px] rounded-md border px-3 py-2 text-sm transition-colors',
              p === page ? 'border-navy-800 bg-navy-800 text-white' : 'hover:border-cyan-500',
            )}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-md border px-3 py-2 text-sm transition-colors hover:border-cyan-500 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

/* ==================================================================== */
/* RadioCard — the workhorse of the estimator                            */
/* ==================================================================== */

export function RadioCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  meta,
  className,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all duration-400 ease-out-expo disabled:opacity-50',
        selected
          ? 'border-cyan-500 bg-cyan-500/[0.06] shadow-glow'
          : 'surface hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-md',
        className,
      )}
    >
      <span
        className={cn(
          'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
          selected ? 'border-cyan-500 bg-cyan-500' : 'border-[rgb(var(--c-border))] group-hover:border-cyan-500/60',
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      {icon && (
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg transition-colors',
            selected ? 'bg-cyan-500 text-white' : 'bg-[rgb(var(--c-text))]/[0.05] text-[rgb(var(--c-text-muted))]',
          )}
        >
          {icon}
        </span>
      )}
      <span className="block pr-8">
        <span className="block font-display text-[1.0625rem] font-semibold leading-tight">{title}</span>
        {description && <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-muted">{description}</span>}
      </span>
      {meta && <span className="mt-auto block w-full pt-1">{meta}</span>}
    </button>
  );
}

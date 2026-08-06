/**
 * Indian-locale formatting helpers.
 *
 * Note: the competitor's estimator renders "₹100,46,18,760.00" — a broken mix of
 * western and Indian grouping. We use Intl with `en-IN` so lakh/crore grouping is
 * always correct, and provide a compact "₹1.24 Cr" form for headline numbers.
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹12,45,000 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return inr.format(Math.round(value));
}

/** 12,45,000 */
export function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * ₹1.24 Cr · ₹18.5 L · ₹86,000
 *
 * Lakh values use one decimal, not two. "₹55.46 L" on an *indicative* estimate is
 * false precision — it implies a certainty the model does not have.
 */
export function formatCurrencyCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  return `₹${inrNumber.format(Math.round(value))}`;
}

/** "₹18.20 L – ₹20.90 L" */
export function formatRange(min: number, max: number): string {
  return `${formatCurrencyCompact(min)} – ${formatCurrencyCompact(max)}`;
}

export function formatArea(value: number, unit = 'sq ft'): string {
  return `${formatNumber(value)} ${unit}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** 12 Mar 2026 */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** "3 days ago" */
export function formatRelative(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(-Math.round(diff / ms), unit);
  }
  return 'just now';
}

/** Weeks → "9 months (38 weeks)" */
export function formatDuration(weeks: number): string {
  const months = Math.round((weeks / 4.345) * 10) / 10;
  const monthLabel = Number.isInteger(months) ? months.toFixed(0) : months.toFixed(1);
  return `${monthLabel} months (${Math.round(weeks)} weeks)`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function readingTime(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220));
}

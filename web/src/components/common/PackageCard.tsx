import { ArrowUpRight, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/lib/format';
import type { PackageOption, ServiceModel } from '@/constants/estimator';

/**
 * A single published package.
 *
 * Shared by the Pricing page and the homepage packages block so the two cannot drift
 * — the rates, inclusions and CTA target are defined once. Scope switches with the
 * service model: turnkey inclusions come from Port1.pdf p.15, labour-only from p.14.
 */
export function PackageCard({
  pkg,
  model,
  popular,
  /** Homepage teaser trims the inclusion list; the Pricing page shows all of it. */
  maxInclusions,
  ctaLabel = 'Estimate this package',
}: {
  pkg: PackageOption;
  model: ServiceModel;
  popular?: boolean;
  maxInclusions?: number;
  ctaLabel?: string;
}) {
  const inclusions = model === 'turnkey' ? pkg.inclusions : pkg.labourInclusions;
  const shown = maxInclusions ? inclusions.slice(0, maxInclusions) : inclusions;

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-2xl border p-8 transition-all duration-500',
        popular
          ? 'border-cyan-500 bg-cyan-500 text-white shadow-lg lg:-translate-y-3'
          : 'surface shadow-sm hover:-translate-y-1 hover:shadow-md',
      )}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-800 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
          Most chosen
        </span>
      )}

      <p className={cn('text-caption uppercase tracking-wide', popular ? 'text-white/70' : 'text-subtle')}>
        {pkg.headline}
      </p>
      <h3 className="mt-1 font-display text-display-sm font-semibold">{pkg.label}</h3>

      <p className="num mt-6 text-2xl font-semibold sm:text-3xl">
        {model === 'turnkey' ? (
          <>
            ₹{formatNumber(pkg.minRate)} – {formatNumber(pkg.maxRate)}
          </>
        ) : (
          <>₹{pkg.labourOnlyRate}</>
        )}
        <span className={cn('text-base font-normal', popular ? 'text-white/70' : 'text-subtle')}> / sq ft</span>
      </p>

      <p className={cn('mt-4 text-sm leading-relaxed', popular ? 'text-white/80' : 'text-muted')}>{pkg.description}</p>

      <ul
        className="mt-7 flex-1 space-y-3 border-t pt-6"
        style={popular ? { borderColor: 'rgb(255 255 255 / 0.2)' } : undefined}
      >
        {shown.map((inc) => (
          <li key={inc} className="flex items-start gap-2.5 text-sm">
            <Check className={cn('mt-0.5 h-4 w-4 shrink-0', popular ? 'text-white' : 'text-cyan-500')} strokeWidth={2.5} />
            {inc}
          </li>
        ))}
      </ul>

      <Button
        href={`${ROUTES.estimator}?pkg=${pkg.key}&model=${model}`}
        variant={popular ? 'secondary' : 'primary'}
        size="lg"
        full
        className="mt-8"
        rightIcon={<ArrowUpRight className="h-4 w-4" />}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

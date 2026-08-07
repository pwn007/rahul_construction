import { motion } from 'framer-motion';
import { Check, HardHat, Info, KeyRound, Minus, Plus } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { Badge, FormField, Input, RadioCard, Select, Switch, Tooltip } from '@/components/ui';
import {
  AREA_UNITS,
  ENHANCEMENTS,
  FLOOR_OPTIONS,
  LOCATIONS,
  PACKAGES,
  PROPERTY_TYPES,
  QUALITY_TIERS,
} from '@/constants/estimator';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { EstimatorInput } from '../model';
import { toSqft } from '../model';

type Patch = (patch: Partial<EstimatorInput>) => void;

export function StepHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mb-8">
      <p className="overline">{eyebrow}</p>
      <h2 className="mt-3 text-display-sm">{title}</h2>
      {lead && <p className="mt-3 max-w-lead text-muted">{lead}</p>}
    </div>
  );
}

/* ==================================================================== */
/* 1 — Your plot: what, how, how big, where                              */
/* ==================================================================== */

/**
 * Merged from the old "Intent" and "Site" steps.
 *
 * Only one input in the whole estimator is actually required — the area — and
 * it used to sit behind a step that asked nothing quantitative. Putting the
 * property type, the service model, the area and the locality on one screen
 * means the visitor supplies everything the model genuinely needs before the
 * first Continue, and the live meter has a real number from that moment on.
 */
export function StepPlot({ input, patch, stepLabel }: { input: EstimatorInput; patch: Patch; stepLabel: string }) {
  const areaSqft = toSqft(input.plotArea, input.areaUnit);
  const isInterior = input.propertyType === 'interior-only';

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="What are you building, and where?"
        lead="Commercial and mixed-use carry higher loads and compliance requirements, so they price differently. Everything else on this page we can assume for you."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {PROPERTY_TYPES.map((type) => (
          <RadioCard
            key={type.key}
            selected={input.propertyType === type.key}
            onSelect={() =>
              patch({
                propertyType: type.key,
                ...(type.key === 'interior-only' ? { packageKey: 'fully-furnished', floors: 1 } : {}),
              })
            }
            title={type.label}
            description={type.description}
            icon={<Icon name={type.icon} className="h-5 w-5" />}
          />
        ))}
      </div>

      <div className="mt-10">
        <p className="mb-3 text-[0.8125rem] font-medium">How would you like us to work?</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <RadioCard
            selected={input.serviceModel === 'turnkey'}
            onSelect={() => patch({ serviceModel: 'turnkey' })}
            title="Turnkey"
            description="We handle everything — design, materials, labour, services and finishes under one agreement."
            icon={<KeyRound className="h-5 w-5" />}
            meta={<Badge variant="brand" size="sm">₹1,200 – 3,000 / sq ft</Badge>}
          />
          <RadioCard
            selected={input.serviceModel === 'labour-only'}
            onSelect={() => patch({ serviceModel: 'labour-only' })}
            title="Labour only"
            description="You procure the materials, we provide supervised labour and execution. Saves 8–12% if you have the time."
            icon={<HardHat className="h-5 w-5" />}
            meta={<Badge variant="default" size="sm">₹100 – 199 / sq ft</Badge>}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <FormField label={isInterior ? 'Area' : 'Plot area'} htmlFor="plotArea" required>
          <div className="flex gap-2">
            <Input
              id="plotArea"
              type="number"
              min={100}
              max={200000}
              value={input.plotArea || ''}
              onChange={(e) => patch({ plotArea: Math.max(0, Number(e.target.value)) })}
              className="flex-1"
            />
            <Select
              value={input.areaUnit}
              onChange={(e) => patch({ areaUnit: e.target.value as EstimatorInput['areaUnit'] })}
              aria-label="Area unit"
              className="w-44"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
          {input.areaUnit !== 'sqft' && (
            <p className="num mt-2 text-caption text-cyan-700 dark:text-cyan-400">= {formatNumber(areaSqft)} sq ft</p>
          )}
        </FormField>

        <FormField label="Location" htmlFor="location" hint="Affects labour and logistics">
          <Select id="location" value={input.location} onChange={(e) => patch({ location: e.target.value })}>
            {LOCATIONS.map((l) => (
              <option key={l.key} value={l.key}>
                {l.label} — {l.zone}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

    </div>
  );
}

/* ==================================================================== */
/* 2 — Your build: floors, levels, footprint                             */
/* ==================================================================== */

/**
 * Never rendered for interiors-only projects — that path skips this step
 * entirely rather than showing a heading with no inputs under it, which is what
 * the old "Structure" step did.
 */
export function StepBuild({ input, patch, stepLabel }: { input: EstimatorInput; patch: Patch; stepLabel: string }) {
  const areaSqft = toSqft(input.plotArea, input.areaUnit);
  const coveragePct = Math.round(input.builtUpRatio * 100);

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="How many floors?"
        lead="Each additional floor adds structure, services and roughly four weeks to the programme."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FLOOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => patch({ floors: option.value })}
            aria-pressed={input.floors === option.value}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border py-5 transition-all duration-400 ease-out-expo',
              input.floors === option.value
                ? 'border-cyan-500 bg-cyan-500/[0.06] shadow-glow'
                : 'surface hover:-translate-y-0.5 hover:border-cyan-500/50',
            )}
          >
            <span className="num text-xl font-semibold">{option.short}</span>
            <span className="text-caption text-subtle">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="surface flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-5">
          <span>
            <span className="block font-medium">Basement</span>
            <span className="mt-0.5 block text-caption text-muted">
              Excavation, retaining walls and waterproofing — about 35% more per sq ft.
            </span>
          </span>
          <Switch checked={input.hasBasement} onChange={(v) => patch({ hasBasement: v })} label="Include basement" />
        </label>

        <label className="surface flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-5">
          <span>
            <span className="block font-medium">Stilt parking</span>
            <span className="mt-0.5 block text-caption text-muted">
              Open parking level — costs about 45% less than a habitable floor.
            </span>
          </span>
          <Switch checked={input.hasStilt} onChange={(v) => patch({ hasStilt: v })} label="Include stilt parking" />
        </label>
      </div>

      {/*
        Ground coverage is a JDA setback question most homeowners cannot answer,
        so it is presented as a stated assumption they may correct rather than a
        raw control they must set. It used to be an unlabelled live slider on the
        site step, where dragging it from 72% to 95% silently inflated the
        estimate by a third.
      */}
      <details className="group mt-8 rounded-lg border border-dashed p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <span>
            <span className="block text-[0.8125rem] font-medium">
              We have assumed you can build on {coveragePct}% of the plot
            </span>
            <span className="num mt-0.5 block text-caption text-subtle">
              Footprint ≈ {formatNumber(areaSqft * input.builtUpRatio)} sq ft per floor · typical after Jaipur setbacks
            </span>
          </span>
          <span className="shrink-0 text-caption text-cyan-700 group-open:hidden dark:text-cyan-400">Adjust</span>
          <span className="hidden shrink-0 text-caption text-subtle group-open:block">Close</span>
        </summary>

        <div className="mt-5 border-t pt-5">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-[0.8125rem] font-medium">Ground coverage after setbacks</p>
            <Tooltip content="The share of your plot you can actually build on after mandatory setbacks. 70–75% is typical for a residential plot in Jaipur. Your architect or the JDA sanction plan will give the exact figure.">
              <Info className="h-3.5 w-3.5 text-subtle" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={40}
              max={95}
              step={1}
              value={coveragePct}
              onChange={(e) => patch({ builtUpRatio: Number(e.target.value) / 100 })}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[rgb(var(--c-text))]/[0.1] accent-cyan-500"
              aria-label="Ground coverage percentage"
            />
            <span className="num w-14 text-right text-sm font-semibold">{coveragePct}%</span>
          </div>
          <p className="mt-3 text-caption text-subtle">
            Leave this alone if you are not sure — it only changes the footprint we price.
          </p>
        </div>
      </details>
    </div>
  );
}

/* ==================================================================== */
/* 3 — Your finish: package & quality                                    */
/* ==================================================================== */

export function StepFinish({ input, patch, stepLabel }: { input: EstimatorInput; patch: Patch; stepLabel: string }) {
  const labourOnly = input.serviceModel === 'labour-only';

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="How far should we take it?"
        lead="Three levels of completion, taken directly from our published rate card. You can refine materials and add extras once you have seen your number."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {PACKAGES.map((pkg) => {
          const selected = input.packageKey === pkg.key;
          return (
            <button
              key={pkg.key}
              type="button"
              onClick={() => patch({ packageKey: pkg.key })}
              aria-pressed={selected}
              className={cn(
                'flex flex-col rounded-xl border p-6 text-left transition-all duration-400 ease-out-expo',
                selected ? 'border-cyan-500 bg-cyan-500/[0.05] shadow-glow' : 'surface hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-md',
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-caption uppercase tracking-wide text-subtle">{pkg.headline}</p>
                  <h3 className="mt-1 font-display text-heading-lg font-semibold">{pkg.label}</h3>
                </div>
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-cyan-500 bg-cyan-500' : 'border-[rgb(var(--c-border))]',
                  )}
                >
                  {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
              </div>

              <p className="num mt-4 text-2xl font-semibold text-navy-800 dark:text-white">
                {labourOnly ? (
                  <>
                    ₹{pkg.labourOnlyRate}
                    <span className="text-sm font-normal text-subtle"> /sq ft</span>
                  </>
                ) : (
                  <>
                    ₹{formatNumber(pkg.minRate)}–{formatNumber(pkg.maxRate)}
                    <span className="text-sm font-normal text-subtle"> /sq ft</span>
                  </>
                )}
              </p>

              <p className="mt-3 text-caption leading-relaxed text-muted">{pkg.description}</p>

              <ul className="mt-5 space-y-2 border-t pt-4">
                {pkg.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-2 text-caption">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" strokeWidth={3} />
                    {inc}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <p className="mb-3 text-[0.8125rem] font-medium">Material specification</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {QUALITY_TIERS.map((tier) => (
            <RadioCard
              key={tier.key}
              selected={input.quality === tier.key}
              onSelect={() => patch({ quality: tier.key })}
              title={
                <span className="flex items-center gap-2">
                  {tier.label}
                  {tier.key === 'signature' && (
                    <Badge variant="brand" size="sm">
                      Recommended
                    </Badge>
                  )}
                </span>
              }
              description={tier.description}
              meta={
                <span className="mt-2 block space-y-1.5 border-t pt-3">
                  {tier.highlights.map((h) => (
                    <span key={h} className="block text-caption text-subtle">
                      · {h}
                    </span>
                  ))}
                </span>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Enhancements — now a post-estimate refinement, not a step             */
/* ==================================================================== */

/**
 * Moved out of the wizard and onto the result screen.
 *
 * Enhancements are purely additive: they never block the calculation. Asking for
 * twelve yes/no decisions before showing a number cost us visitors for no
 * modelling benefit, and two of them used to arrive pre-ticked — a ₹2.85 L
 * modular kitchen and a ₹95/sqft false ceiling that inflated the meter by
 * roughly 10% before anyone had seen the list. Nothing is pre-selected now.
 */
export function StepEnhancements({
  input,
  patch,
  chargeableArea,
  embedded,
}: {
  input: EstimatorInput;
  patch: Patch;
  chargeableArea: number;
  /** True when rendered inside a result-screen panel rather than as a wizard step. */
  embedded?: boolean;
}) {
  const available = ENHANCEMENTS.filter((e) => e.appliesTo.includes(input.propertyType));
  const labourOnly = input.serviceModel === 'labour-only';

  const toggle = (key: string) =>
    patch({
      enhancements: input.enhancements.includes(key)
        ? input.enhancements.filter((k) => k !== key)
        : [...input.enhancements, key],
    });

  const priceFor = (e: (typeof ENHANCEMENTS)[number]) => {
    if (e.pricingModel === 'per-sqft') return e.unitPrice * chargeableArea;
    if (e.pricingModel === 'per-floor') return e.unitPrice * Math.max(1, input.floors - 1);
    return e.unitPrice;
  };

  return (
    <div>
      {!embedded && (
        <StepHeading
          eyebrow="Enhancements"
          title="Anything else?"
          lead="These are the line items that most often get discovered late and blow the budget. Add them now and see the real number."
        />
      )}

      {labourOnly && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-caption text-muted">
            You selected a labour-only contract, so enhancement materials are purchased by you directly.
            These selections are recorded for scope but excluded from the cost.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {available.map((e) => {
          const selected = input.enhancements.includes(e.key);
          return (
            <button
              key={e.key}
              type="button"
              onClick={() => toggle(e.key)}
              aria-pressed={selected}
              className={cn(
                'flex items-start gap-4 rounded-lg border p-5 text-left transition-all duration-300',
                selected ? 'border-cyan-500 bg-cyan-500/[0.05]' : 'surface hover:border-cyan-500/50',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                  selected ? 'bg-cyan-500 text-white' : 'bg-[rgb(var(--c-text))]/[0.05] text-[rgb(var(--c-text-muted))]',
                )}
              >
                <Icon name={e.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{e.label}</span>
                  <span className={cn('shrink-0', selected ? 'text-cyan-500' : 'text-subtle')}>
                    {selected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </span>
                <span className="mt-1 block text-caption leading-relaxed text-muted">{e.description}</span>
                <span className={cn('num mt-2 block text-caption font-medium', labourOnly && 'line-through opacity-50')}>
                  + {formatCurrency(priceFor(e))}
                  {e.pricingModel === 'per-sqft' && <span className="font-normal text-subtle"> (₹{e.unitPrice}/sq ft)</span>}
                  {e.pricingModel === 'per-floor' && <span className="font-normal text-subtle"> (per floor served)</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {input.enhancements.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="num mt-6 text-caption text-subtle"
        >
          {input.enhancements.length} enhancement{input.enhancements.length === 1 ? '' : 's'} selected
        </motion.p>
      )}
    </div>
  );
}

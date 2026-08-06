import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Info, Sparkles, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, RadioCard } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import { MATERIAL_CATEGORIES, type MaterialGroup } from '@/constants/materials';
import { QUALITY_TIERS } from '@/constants/estimator';
import type { EstimatorInput } from '../model';
import { StepHeading } from './Steps';

type Patch = (patch: Partial<EstimatorInput>) => void;

export function StepMaterials({
  input,
  patch,
  builtUpArea,
  specAdjustment,
}: {
  input: EstimatorInput;
  patch: Patch;
  builtUpArea: number;
  specAdjustment: number;
}) {
  const [active, setActive] = useState(0);
  const category = MATERIAL_CATEGORIES[active];
  const tier = QUALITY_TIERS.find((q) => q.key === input.quality);

  const completed = Object.keys(input.materials).filter((id) =>
    Object.values(input.materials[id] ?? {}).some(Boolean),
  );

  const select = (categoryId: string, key: string, value: string) =>
    patch({
      materials: {
        ...input.materials,
        [categoryId]: { ...(input.materials[categoryId] ?? {}), [key]: value },
      },
    });

  const clearCategory = (categoryId: string) => {
    const next = { ...input.materials };
    delete next[categoryId];
    patch({ materials: next });
  };

  const toggleExtra = (enhancementKey: string, on: boolean) =>
    patch({
      enhancements: on
        ? [...new Set([...input.enhancements, enhancementKey])]
        : input.enhancements.filter((k) => k !== enhancementKey),
    });

  /* ---------------------------------------------------------------- */
  /* Mode chooser                                                      */
  /* ---------------------------------------------------------------- */

  if (input.materialMode !== 'custom') {
    return (
      <div>
        <StepHeading
          eyebrow="Step 5 of 7"
          title="Which materials?"
          lead="Take our recommended specification, or choose brand by brand — steel, cement, tiles, switches, sanitaryware and more."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <RadioCard
            selected
            onSelect={() => patch({ materialMode: 'recommended' })}
            title={`Use our ${tier?.label ?? 'Signature'} specification`}
            description="The brands and grades we specify by default at your chosen quality tier. Fastest route to a number."
            icon={<Sparkles className="h-5 w-5" />}
            meta={
              <span className="mt-2 block space-y-1.5 border-t pt-3">
                {tier?.highlights.map((h) => (
                  <span key={h} className="block text-caption text-subtle">
                    · {h}
                  </span>
                ))}
              </span>
            }
          />

          <RadioCard
            selected={false}
            onSelect={() => patch({ materialMode: 'custom' })}
            title="Specify materials myself"
            description="Pick the exact brand and grade for all 14 categories. Every choice updates your estimate live."
            icon={<SlidersHorizontal className="h-5 w-5" />}
            meta={
              <span className="mt-2 flex flex-wrap gap-1 border-t pt-3">
                {MATERIAL_CATEGORIES.slice(0, 7).map((c) => (
                  <span key={c.id} className="text-caption text-subtle">
                    {c.icon} {c.label}
                  </span>
                ))}
                <span className="text-caption text-subtle">+7 more</span>
              </span>
            }
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-dashed p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
          <p className="text-caption leading-relaxed text-muted">
            You can skip this — the recommended specification is what most clients choose, and you can
            fine-tune materials later against the BOQ.
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Full material picker                                              */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      <StepHeading
        eyebrow="Step 5 of 7"
        title="Specify your materials"
        lead="Fourteen categories, the same brands and rates we buy at. Every choice moves your estimate immediately."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => patch({ materialMode: 'recommended', materials: {} })}
          className="text-caption text-cyan-700 underline underline-offset-2 dark:text-cyan-400"
        >
          ← Use the recommended specification instead
        </button>

        <span
          className={cn(
            'num rounded-full px-3 py-1.5 text-caption font-medium',
            specAdjustment > 0 && 'bg-warning/12 text-warning',
            specAdjustment < 0 && 'bg-success/12 text-success',
            specAdjustment === 0 && 'bg-[rgb(var(--c-text))]/[0.06] text-subtle',
          )}
        >
          Spec adjustment: {specAdjustment > 0 ? '+' : ''}
          {formatCurrency(specAdjustment)}
        </span>
      </div>

      {/* Category strip */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {MATERIAL_CATEGORIES.map((c, i) => {
          const done = completed.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={cn(
                'relative flex w-[104px] shrink-0 flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-all duration-300',
                i === active ? 'border-cyan-500 bg-cyan-500/[0.06] shadow-glow' : 'surface hover:border-cyan-500/50',
                done && i !== active && 'border-success/50',
              )}
            >
              {done && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className="text-xl leading-none" aria-hidden>
                {c.icon}
              </span>
              <span className="text-center text-[0.7rem] leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active category */}
      {category && (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-5 rounded-xl border bg-[rgb(var(--c-surface-2))] p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-heading-lg font-semibold">
                <span aria-hidden className="mr-2">
                  {category.icon}
                </span>
                {category.label}
              </h3>
              {category.note && <p className="mt-1.5 max-w-prose text-caption text-muted">{category.note}</p>}
            </div>
            {completed.includes(category.id) && (
              <button
                type="button"
                onClick={() => clearCategory(category.id)}
                className="flex shrink-0 items-center gap-1 text-caption text-subtle transition-colors hover:text-danger"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Brands */}
          {category.brands && (
            <div className="mt-5">
              <p className="text-overline uppercase text-subtle">Select brand</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {category.brands.map((brand) => {
                  const on = input.materials[category.id]?.['brand'] === brand.name;
                  return (
                    <OptionButton
                      key={brand.name}
                      selected={on}
                      onClick={() => select(category.id, 'brand', brand.name)}
                      title={brand.name}
                      subtitle={brand.alt ? `Or ${brand.alt}` : undefined}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Groups */}
          {category.groups?.map((group) => (
            <GroupBlock
              key={group.name}
              group={group}
              categoryId={category.id}
              selected={input.materials[category.id]?.[group.name]}
              onSelect={(value) => select(category.id, group.name, value)}
              builtUpArea={builtUpArea}
            />
          ))}

          {/* Yes/No extras — these drive the real enhancement so nothing is double-counted */}
          {category.extras?.map((extra) => {
            const on = input.enhancements.includes(extra.enhancementKey);
            return (
              <div key={extra.name} className="mt-5 flex items-center justify-between gap-4 rounded-lg border bg-[rgb(var(--c-surface))] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{extra.name}</p>
                  <p className="text-caption text-subtle">Priced as an add-on and shown in your breakdown.</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {(['YES', 'NO'] as const).map((v) => {
                    const isOn = (v === 'YES') === on;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => toggleExtra(extra.enhancementKey, v === 'YES')}
                        className={cn(
                          'rounded-md px-3.5 py-1.5 text-caption font-medium transition-colors',
                          isOn ? 'bg-cyan-500 text-white' : 'border text-muted hover:border-cyan-500/50',
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {active < MATERIAL_CATEGORIES.length - 1 && (
            <button
              type="button"
              onClick={() => setActive(active + 1)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 dark:text-cyan-400"
            >
              Save & next material <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Selected summary */}
      {completed.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-caption text-subtle">Specified:</span>
          {completed.map((id) => {
            const c = MATERIAL_CATEGORIES.find((x) => x.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => clearCategory(id)}
                className="flex items-center gap-1.5 rounded-full bg-cyan-500/12 px-2.5 py-1 text-caption text-cyan-700 transition-colors hover:bg-cyan-500/20 dark:text-cyan-300"
              >
                {c?.label}
                <X className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GroupBlock({
  group,
  selected,
  onSelect,
  builtUpArea,
}: {
  group: MaterialGroup;
  categoryId: string;
  selected?: string;
  onSelect: (value: string) => void;
  builtUpArea: number;
}) {
  const base = group.options.find((o) => o.name === group.baseline);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-overline uppercase text-subtle">{group.name}</p>
        {!group.coverage && group.options.some((o) => o.unit && o.unit !== 'lumpsum' && o.unit !== 'sqft') && (
          <Badge variant="default" size="sm">
            Quantified at BOQ
          </Badge>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {group.options.map((option) => {
          const on = selected === option.name;

          let delta = 0;
          if (option.unit === 'lumpsum') delta = (option.rate ?? 0) - (base?.rate ?? 0);
          else if (option.unit === 'sqft' && group.coverage)
            delta = ((option.rate ?? 0) - (base?.rate ?? 0)) * group.coverage * builtUpArea;

          return (
            <OptionButton
              key={option.name}
              selected={on}
              onClick={() => onSelect(option.name)}
              title={option.name}
              subtitle={option.priceLabel}
              delta={delta}
              isBaseline={option.name === group.baseline}
            />
          );
        })}
      </div>
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  title,
  subtitle,
  delta = 0,
  isBaseline,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  delta?: number;
  isBaseline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg border p-3.5 text-left transition-all duration-300',
        selected ? 'border-cyan-500 bg-cyan-500/[0.07]' : 'bg-[rgb(var(--c-surface))] hover:border-cyan-500/50',
      )}
    >
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-semibold leading-tight">{title}</span>
        {subtitle && <span className="mt-0.5 block text-caption text-subtle">{subtitle}</span>}
        {isBaseline ? (
          <span className="mt-1 block text-caption text-subtle">Included as standard</span>
        ) : delta !== 0 ? (
          <span className={cn('num mt-1 block text-caption font-medium', delta > 0 ? 'text-warning' : 'text-success')}>
            {delta > 0 ? '+' : ''}
            {formatCurrency(delta)}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-cyan-500 bg-cyan-500' : 'border-[rgb(var(--c-border))]',
        )}
      >
        {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
      </span>
    </button>
  );
}

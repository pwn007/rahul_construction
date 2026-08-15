import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, Minus, Plus } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { Button, FormField, Input, Select, Switch } from '@/components/ui';
import { AREA_UNITS, ENHANCEMENTS, LOCATIONS, PROPERTY_TYPES } from '@/constants/estimator';
import {
  MATERIAL_GROUPS,
  MATERIAL_LINES,
  MATERIAL_LINE_BY_KEY,
  QUANTITY_UNIT_LABEL,
  defaultOption,
  optionOf,
} from '@/constants/materials';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { EstimatorInput } from '../model';
import { activeLines, calculateEstimate, deriveScope, toSqft } from '../model';
import { MaterialIcon } from './MaterialIcon';

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
/* A house that gains a storey as you tap                                */
/* ==================================================================== */

/**
 * Deliberately not decoration.
 *
 * The single hardest thing to get right on this screen is making the visitor
 * confident we understood the input — "1,200 per floor across 3 floors" is a
 * multiplication they have to trust us to have done. A drawing that visibly
 * grows a storey per tap confirms it without a sentence, and it is the one idea
 * worth taking wholesale from the competitor's calculator.
 */
function HouseGraphic({ floors, basement, stilt }: { floors: number; basement: boolean; stilt: boolean }) {
  const storeys = Math.max(1, Math.min(5, floors));
  const storeyH = 26;
  const baseY = 132;

  const description =
    `${storeys} floor${storeys === 1 ? '' : 's'}` +
    (basement ? ', with basement' : '') +
    (stilt ? ', with stilt parking' : '');

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40" role="img" aria-label={description}>
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity="0.07" />
        </linearGradient>
      </defs>

      {/* ground line */}
      <line x1="14" y1={baseY + 1} x2="146" y2={baseY + 1} stroke="rgb(var(--c-border))" strokeWidth="1.5" />

      {basement && (
        <rect
          x="42" y={baseY} width="76" height="16"
          fill="none" stroke="rgb(var(--c-border))" strokeWidth="1.5" strokeDasharray="4 3"
        />
      )}

      {Array.from({ length: storeys }).map((_, i) => {
        const y = baseY - (i + 1) * storeyH;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <rect x="42" y={y} width="76" height={storeyH} fill="url(#wall)" stroke="rgb(var(--c-brand))" strokeWidth="1.5" />
            {/* windows — omitted on a stilt ground floor, which has none */}
            {!(stilt && i === 0) && (
              <>
                <rect x="54" y={y + 8} width="14" height="11" fill="rgb(var(--c-brand))" fillOpacity="0.45" />
                <rect x="92" y={y + 8} width="14" height="11" fill="rgb(var(--c-brand))" fillOpacity="0.45" />
              </>
            )}
          </motion.g>
        );
      })}

      {/* roof */}
      <motion.path
        key={storeys}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        d={`M36 ${baseY - storeys * storeyH} L80 ${baseY - storeys * storeyH - 18} L124 ${baseY - storeys * storeyH} Z`}
        fill="rgb(var(--c-brand))"
        fillOpacity="0.3"
        stroke="rgb(var(--c-brand))"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ==================================================================== */
/* 1 — Where, and how big                                                */
/* ==================================================================== */

/**
 * Three inputs. Locality, area per floor, floors.
 *
 * This replaces two screens that between them asked for property type, service
 * model, plot area, unit, locality, floors, basement, stilt and a ground-coverage
 * percentage — nine questions, of which the model genuinely needs three to
 * produce a defensible number. The rest either have a safe default (residential,
 * turnkey, no basement) or were asking the visitor to do an architect's job.
 *
 * The coverage slider is gone rather than defaulted, because a slider reads as
 * something you are supposed to set. `MODEL.defaultBuiltUpRatio` now survives
 * only to convert legacy `?area=` deep links, which carried plot area.
 */
export function StepSite({ input, patch, stepLabel }: { input: EstimatorInput; patch: Patch; stepLabel: string }) {
  const [advanced, setAdvanced] = useState(false);
  const perFloorSqft = toSqft(input.areaPerFloor, input.areaUnit);
  const isInterior = input.propertyType === 'interior-only';
  const totalSqft = isInterior ? perFloorSqft : perFloorSqft * input.floors;

  const location = LOCATIONS.find((l) => l.key === input.location);

  /* The indicative band for this locality: everything Economy and unfurnished at
     one end, everything Premium with fixtures at the other. Shown before anything
     else is entered — it costs the visitor nothing and it anchors honestly, which
     is the one thing Brick&Bolt does better than everyone. */
  const band = [
    /* Structure only, then a complete furnished build — the two ends of what a
       visitor can assemble on the next screen. Exclusive alternatives are held
       out: ready-mix and site-mix are never both in a selection. */
    MATERIAL_LINES.filter((l) => l.group === 'structure' && !l.exclusiveWith?.length),
    MATERIAL_LINES.filter((l) => !l.exclusiveWith?.length),
  ].map((lines) => {
    const materials = Object.fromEntries(lines.map((l) => [l.key, defaultOption(l).key]));
    const probe = calculateEstimate({
      ...input,
      materials,
      areaPerFloor: 1000,
      areaUnit: 'sqft',
      floors: 1,
    });
    return probe.perSqft;
  });
  const bandLow = Math.round(Math.min(...band));
  const bandHigh = Math.round(Math.max(...band));

  const setFloors = (next: number) => patch({ floors: Math.max(1, Math.min(5, next)) });

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="Where are you building, and how big?"
        lead="Three answers is all we need for a costed estimate. Everything else has a sensible default you can change later."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <FormField label="Location" htmlFor="location" hint="Affects labour rates and material logistics">
            <Select id="location" value={input.location} onChange={(e) => patch({ location: e.target.value })}>
              {LOCATIONS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label} — {l.zone}
                </option>
              ))}
            </Select>
            {location && (
              <p className="num mt-2 text-caption text-cyan-700 dark:text-cyan-400">
                Typical range in {location.label}: ₹{formatNumber(bandLow)} – {formatNumber(bandHigh)} / sq ft
              </p>
            )}
          </FormField>

          <FormField
            label={isInterior ? 'Area to be finished' : 'Built-up area per floor'}
            htmlFor="areaPerFloor"
            hint={isInterior ? undefined : 'The covered area of one floor. We multiply by the number of floors.'}
            required
          >
            <div className="flex gap-2">
              <Input
                id="areaPerFloor"
                type="number"
                inputMode="numeric"
                min={100}
                max={200000}
                placeholder="e.g. 1200"
                value={input.areaPerFloor || ''}
                onChange={(e) => patch({ areaPerFloor: Math.max(0, Number(e.target.value)) })}
                className="flex-1"
              />
              <Select
                value={input.areaUnit}
                onChange={(e) => patch({ areaUnit: e.target.value as EstimatorInput['areaUnit'] })}
                aria-label="Area unit"
                className="w-40"
              >
                {AREA_UNITS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </div>
          </FormField>

          {!isInterior && (
            <FormField label="Number of floors" htmlFor="floors">
              <div className="surface flex items-center justify-between rounded-lg border p-2">
                <button
                  type="button"
                  onClick={() => setFloors(input.floors - 1)}
                  disabled={input.floors <= 1}
                  aria-label="Remove a floor"
                  className="flex h-11 w-11 items-center justify-center rounded-md border transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="num text-center font-medium">
                  {input.floors} <span className="text-muted">({floorPhrase(input.floors)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFloors(input.floors + 1)}
                  disabled={input.floors >= 5}
                  aria-label="Add a floor"
                  className="flex h-11 w-11 items-center justify-center rounded-md border transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </FormField>
          )}

          {/* Advanced — everything that has a safe default lives behind this. */}
          <div className="rounded-lg border border-dashed">
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              aria-expanded={advanced}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="text-[0.8125rem] font-medium">
                Advanced options
                <span className="ml-2 font-normal text-subtle">
                  Building type, basement, stilt parking
                </span>
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-subtle transition-transform', advanced && 'rotate-180')} />
            </button>

            {advanced && (
              <div className="space-y-5 border-t p-4">
                <FormField label="Building type" htmlFor="propertyType">
                  <Select
                    id="propertyType"
                    value={input.propertyType}
                    onChange={(e) =>
                      patch({
                        propertyType: e.target.value as EstimatorInput['propertyType'],
                        ...(e.target.value === 'interior-only' ? { finishTier: 'bespoke' as const, floors: 1 } : {}),
                      })
                    }
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label} — {t.description}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {!isInterior && (
                  <>
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block text-[0.8125rem] font-medium">Basement</span>
                        <span className="block text-caption text-subtle">
                          Excavation, retaining and waterproofing — priced at 1.35× a normal floor.
                        </span>
                      </span>
                      <Switch
                        checked={input.hasBasement}
                        onChange={(v) => patch({ hasBasement: v })}
                        label="Include basement"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="min-w-0">
                        <span className="block text-[0.8125rem] font-medium">Stilt parking</span>
                        <span className="block text-caption text-subtle">
                          Open parking level — no walls or finishing, so priced at 0.55×.
                        </span>
                      </span>
                      <Switch checked={input.hasStilt} onChange={(v) => patch({ hasStilt: v })} label="Include stilt parking" />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live confirmation of what we understood */}
        <div className="lg:col-span-2">
          <div className="surface flex h-full flex-col items-center justify-center rounded-xl border p-6 text-center">
            <p className="text-caption uppercase tracking-wide text-subtle">Total built-up area</p>
            <p className="num mt-1 font-display text-3xl font-semibold">
              {totalSqft > 0 ? `${formatNumber(Math.round(totalSqft))}` : '—'}
              {totalSqft > 0 && <span className="ml-1 text-base font-normal text-subtle">sq ft</span>}
            </p>

            {!isInterior && (
              <p className="mt-1.5 text-caption text-muted">
                {floorPhrase(input.floors)}
                {input.hasBasement && ' + basement'}
                {input.hasStilt && ' + stilt'}
              </p>
            )}

            <HouseGraphic floors={input.floors} basement={input.hasBasement} stilt={input.hasStilt} />

            {input.areaUnit !== 'sqft' && perFloorSqft > 0 && (
              <p className="num text-caption text-subtle">
                {formatNumber(input.areaPerFloor)} {AREA_UNITS.find((u) => u.key === input.areaUnit)?.label} ={' '}
                {formatNumber(Math.round(perFloorSqft))} sq ft per floor
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function floorPhrase(floors: number) {
  return floors <= 1 ? 'Ground only' : `Ground + ${floors - 1}`;
}

/* ==================================================================== */
/* 2 — Select materials                                                  */
/* ==================================================================== */

/**
 * Modelled directly on the competitor's calculator, at the client's instruction.
 *
 * Their structure, which this reproduces: a sticky horizontal strip of 96×96
 * material tiles with scroll arrows, a "Select Brand" panel underneath showing
 * the active material's brands as cards with a radio in the top-right corner,
 * an "Added to cart" confirmation, and a Next button that advances along the
 * strip. One material at a time; the strip is the navigation.
 *
 * Two deliberate departures, both narrow:
 *
 *   1. **No lock icons.** Eleven of their thirteen materials are gated behind a
 *      login on a page that advertises "100% Free tool — No paywall applied".
 *      Reproducing a paywall was never the ask.
 *   2. **Colours come from our tokens**, not their literal `bg-yellow-50` /
 *      `text-gray-900`. Hard-coding their greys would break dark mode and read as
 *      a different product. The structure, sizing and interaction are theirs.
 *
 * Prices stay on the brand cards — theirs show only a logo and a name, but a cost
 * calculator that hides the cost during the one moment you are choosing is
 * working against itself, and the client asked for price alongside every material
 * earlier in this same brief.
 */
export function StepMaterialSelect({
  input,
  patch,
  stepLabel,
  chargeableArea,
}: {
  input: EstimatorInput;
  patch: Patch;
  stepLabel: string;
  chargeableArea: number;
}) {
  const scope = deriveScope(input);
  const chosen = input.materials;

  const activeKeys = useMemo(
    () => new Set(activeLines(input, scope).map((l) => l.key)),
    [input, scope],
  );

  /* Everything valid at this scope, plus anything already chosen — so a
     selection never vanishes when the scope shifts under it. */
  const visible = useMemo(
    () => MATERIAL_LINES.filter((l) => l.packages.includes(scope) || l.key in chosen),
    [scope, chosen],
  );

  const [activeKey, setActiveKey] = useState<string>(() => visible[0]?.key ?? '');
  const stripRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeLine = MATERIAL_LINE_BY_KEY[activeKey] ?? visible[0];
  const activeIndex = visible.findIndex((l) => l.key === activeLine?.key);
  const activeIsChosen = activeLine ? activeLine.key in chosen : false;

  const focusMaterial = (key: string) => {
    setActiveKey(key);
    tileRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const scrollStrip = (direction: -1 | 1) =>
    stripRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });

  /**
   * Picking a brand IS adding the material — the same single action theirs uses.
   *
   * Exclusivity is applied here, destructively, rather than being filtered out at
   * pricing time. It used to be the latter, and that let a material sit in the
   * selection while contributing nothing: tapping Ready-mix silently supplanted
   * cement, sand and aggregate, whose tiles then looked exactly like materials
   * that had never been chosen. The selection and the priced set can no longer
   * disagree, because conflicting choices are removed the moment they conflict.
   */
  const pick = (line: (typeof MATERIAL_LINES)[number], optionKey: string) => {
    const next: Record<string, string> = { ...chosen, [line.key]: optionKey };

    for (const other of MATERIAL_LINES) {
      if (other.key === line.key) continue;
      const conflicts =
        line.exclusiveWith?.includes(other.key) || other.exclusiveWith?.includes(line.key);
      if (conflicts) delete next[other.key];
    }

    patch({ materials: next });
  };

  /** What the active material displaced, so the swap can be stated rather than inferred. */
  const replaces = activeLine
    ? MATERIAL_LINES.filter(
        (o) =>
          o.key !== activeLine.key &&
          (activeLine.exclusiveWith?.includes(o.key) || o.exclusiveWith?.includes(activeLine.key)),
      )
    : [];

  const remove = (lineKey: string) => {
    const next = { ...chosen };
    delete next[lineKey];
    patch({ materials: next });
  };

  const goNext = () => {
    const next = visible[activeIndex + 1];
    if (next) focusMaterial(next.key);
  };

  const selected = activeLines(input, scope);
  const selectedTotal = selected.reduce(
    (sum, l) => sum + Math.round(l.coefficient * chargeableArea) * optionOf(l, chosen[l.key]).rate,
    0,
  );

  const activeQuantity = activeLine ? Math.round(activeLine.coefficient * chargeableArea) : 0;
  const activeChosen = activeLine ? activeLine.key in chosen : false;
  const activeSupplantedBy =
    activeLine && activeChosen && !activeKeys.has(activeLine.key)
      ? MATERIAL_LINES.find((o) => o.exclusiveWith?.includes(activeLine.key) && activeKeys.has(o.key))
      : undefined;

  return (
    <div>
      <StepHeading
        eyebrow={stepLabel}
        title="Select materials"
        lead="Pick a material, choose its brand, and it is added to your build. Move along the row for the next one."
      />

      {/* ---- Material strip ---- */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollStrip(-1)}
          aria-label="Scroll materials left"
          className="surface absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors hover:border-cyan-500 sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/*
          `px-11` reserved 88px for the two arrows. On a 320px screen that left
          roughly 160px for the tiles themselves, which is the misalignment the
          client reported. Below `sm` the arrows are hidden and the padding goes
          with them, so the strip is a plain swipe surface with snap points — the
          same pattern as the home process rail — and gets the full width back.
        */}
        <div ref={stripRef} className="no-scrollbar flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 py-2 sm:scroll-px-11 sm:px-11">
          {visible.map((line) => {
            const isLive = activeKeys.has(line.key);
            const isActive = line.key === activeLine?.key;
            /* Selected, but displaced by an exclusive partner. The UI can no
               longer produce this — `pick` removes conflicts outright — but a
               shared URL still can, and it must not render as "never chosen". */
            const isGhost = line.key in chosen && !isLive;

            return (
              <button
                key={line.key}
                ref={(el) => {
                  tileRefs.current[line.key] = el;
                }}
                type="button"
                onClick={() => focusMaterial(line.key)}
                aria-pressed={isActive}
                className={cn(
                  'relative h-24 w-24 shrink-0 rounded-xl border-2 transition-all duration-200',
                  isActive
                    ? 'border-cyan-500 bg-cyan-500/[0.07] shadow-glow'
                    : isLive
                      ? 'surface border-cyan-500/45'
                      : isGhost
                        ? 'surface border-dashed opacity-60'
                        : 'surface hover:border-cyan-500/40',
                )}
              >
                <span className="flex h-full flex-col items-center justify-center p-2">
                  <span
                    className={cn(
                      'mb-1 flex h-10 w-10 items-center justify-center',
                      isLive || isActive ? 'text-cyan-700 dark:text-cyan-400' : 'text-[rgb(var(--c-text-subtle))]',
                    )}
                  >
                    <MaterialIcon name={line.key} className="h-7 w-7" />
                  </span>
                  <span
                    className={cn(
                      'text-center text-[0.6875rem] leading-tight',
                      isActive ? 'font-medium' : isLive ? 'text-muted' : 'text-subtle',
                    )}
                  >
                    {line.label}
                  </span>
                </span>

                {/* Their tile carries a lock badge here. Ours carries the one
                    thing worth knowing at a glance: whether it is in the build. */}
                {isLive && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={4} />
                  </span>
                )}
                {isGhost && (
                  <span className="absolute inset-x-1 bottom-1 rounded bg-[rgb(var(--c-text))]/[0.06] text-[0.5625rem] uppercase tracking-wide text-subtle">
                    Replaced
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollStrip(1)}
          aria-label="Scroll materials right"
          className="surface absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-colors hover:border-cyan-500 sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ---- Select Brand ---- */}
      {activeLine && (
        <div className="mt-6 rounded-xl border bg-sand-100/60 p-6 dark:bg-sand-500/[0.07]">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-heading-lg font-semibold">
              {activeLine.options.length > 1 ? 'Select Brand' : 'Specification'}
            </h3>
            <p className="text-caption text-muted">
              {activeLine.label}
              {activeQuantity > 0 && (
                <>
                  {' · '}
                  <span className="num">
                    {formatNumber(activeQuantity)} {QUANTITY_UNIT_LABEL[activeLine.unit]}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {activeLine.options.map((opt) => {
              const picked = chosen[activeLine.key] === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => pick(activeLine, opt.key)}
                  aria-pressed={picked}
                  className={cn(
                    'surface relative flex flex-col items-center rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md',
                    picked ? 'border-cyan-500' : 'border-[rgb(var(--c-border))] hover:border-cyan-500/50',
                  )}
                >
                  <span
                    className={cn(
                      'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                      picked ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-[rgb(var(--c-border))]',
                    )}
                    aria-hidden
                  >
                    {picked && <Check className="h-3 w-3" strokeWidth={4} />}
                  </span>

                  {/*
                    One brand per card, one icon per card.
                    The source calculator pairs equivalents — "KAMADHENU Or
                    RATHI" — and reproducing that meant a card stood for two
                    suppliers at once, drawn with the same generic glyph twice
                    because we have no brand logos. Equivalent brands now share a
                    rate and get a card each.
                  */}
                  <span className="mb-3 mt-2 flex min-h-[5rem] w-full flex-col items-center justify-center gap-2">
                    <MaterialIcon name={activeLine.key} className="h-9 w-9 text-cyan-700 dark:text-cyan-400" />
                    <span className="text-center text-[0.875rem] font-medium">
                      {opt.label}
                      {opt.provisional && <span className="text-subtle"> *</span>}
                    </span>
                  </span>

                  {opt.detail && <span className="text-caption text-subtle">{opt.detail}</span>}

                  <span className="num mt-2 w-full border-t pt-2 text-center">
                    <span className="block font-semibold">
                      {activeQuantity > 0 ? formatCurrency(activeQuantity * opt.rate) : '—'}
                    </span>
                    <span className="block text-caption text-subtle">
                      ₹{formatNumber(opt.rate)}/{QUANTITY_UNIT_LABEL[activeLine.unit].replace(/s$/, '')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {activeIsChosen && replaces.length > 0 && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] p-3 text-caption leading-relaxed text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span>
                {activeLine.label} replaces{' '}
                <span className="font-medium text-[rgb(var(--c-text))]">
                  {replaces.map((r) => r.label).join(', ')}
                </span>
                , so {replaces.length === 1 ? 'it is' : 'they are'} no longer in your build — it is the same
                concrete bought a different way. Remove this to price {replaces.length === 1 ? 'it' : 'them'}{' '}
                separately.
              </span>
            </p>
          )}

          {activeLine.note && (
            <p className="mb-4 flex items-start gap-2 text-caption leading-relaxed text-subtle">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {activeLine.note}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="flex items-center gap-2 text-caption">
              {activeSupplantedBy ? (
                <span className="text-muted">Covered by {activeSupplantedBy.label}</span>
              ) : activeChosen ? (
                <>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={4} />
                  </span>
                  <span className="font-medium text-success">Added to your build</span>
                  <button
                    type="button"
                    onClick={() => remove(activeLine.key)}
                    className="ml-1 text-subtle underline-offset-2 transition-colors hover:text-danger hover:underline"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span className="text-subtle">Choose a brand to add this material</span>
              )}
            </p>

            <Button
              variant="secondary"
              size="md"
              onClick={goNext}
              disabled={activeIndex >= visible.length - 1}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next material
            </Button>
          </div>
        </div>
      )}

      {/* ---- Cart counter ---- */}
      <div className="sticky bottom-4 z-10 mt-6">
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-lg">
          <p className="text-caption text-muted">
            {selected.length === 0 ? (
              'No materials added yet'
            ) : (
              <>
                <span className="num font-semibold text-[rgb(var(--c-text))]">{selected.length}</span> material
                {selected.length === 1 ? '' : 's'} added
              </>
            )}
          </p>
          <p className="num text-heading-md font-semibold">{formatCurrency(selectedTotal)}</p>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-caption leading-relaxed text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Prices are material cost for your building. Labour, design and site costs are added on the next screen.
          Quantities use standard thumb rules and are confirmed against approved drawings. Rates marked{' '}
          <span className="font-medium">*</span> are indicative rather than published.
        </span>
      </p>
    </div>
  );
}

/* ==================================================================== */
/* Enhancements — a post-estimate refinement, not a step                 */
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
            You chose to buy the materials yourself, so enhancement materials are purchased by you directly.
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

'use client';

import { Info } from 'lucide-react';
import { FURNITURE_LINES, furnitureOptionOf } from '@/constants/furniture';
import { track } from '@/lib/analytics';
import { bedroomCount, type EstimatorInput } from '../model';
import { OptInGrid, type OptInItem } from './OptInGrid';

/**
 * Loose furniture — the layer a builder's "fully furnished" does not contain.
 *
 * Opt-in and priced on top of the package rather than inside it, which is both
 * the commercially honest treatment (₹2,500–3,000/sq ft is the price of fixed
 * joinery, not of a sofa) and the reason the rate-card assertion in
 * `check:estimator` still passes. Every item is an allowance at three levels, so
 * a visitor can land on a number for their own taste without us pretending to
 * know which sofa they will buy.
 */
export function FurniturePicker({
  input,
  patch,
  chargeableArea,
}: {
  input: EstimatorInput;
  patch: (next: Partial<EstimatorInput>) => void;
  chargeableArea: number;
}) {
  const labourOnly = input.serviceModel === 'labour-only';
  const bedrooms = bedroomCount(chargeableArea);

  const amountFor = (line: (typeof FURNITURE_LINES)[number], optionKey: string | undefined) => {
    const opt = furnitureOptionOf(line, optionKey);
    if (line.pricingModel === 'per-sqft') return opt.rate * chargeableArea;
    if (line.pricingModel === 'per-bedroom') return opt.rate * bedrooms;
    return opt.rate;
  };

  const basisFor = (line: (typeof FURNITURE_LINES)[number], optionKey: string | undefined) => {
    const opt = furnitureOptionOf(line, optionKey);
    if (line.pricingModel === 'per-sqft') return `₹${opt.rate}/sq ft`;
    if (line.pricingModel === 'per-bedroom') return `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`;
    return undefined;
  };

  const items: OptInItem[] = FURNITURE_LINES.map((line) => {
    const chosen = input.furniture[line.key];
    return {
      key: line.key,
      label: line.label,
      ...(line.hindi && { hindi: line.hindi }),
      description: line.blurb,
      icon: line.icon,
      amount: amountFor(line, chosen),
      ...(basisFor(line, chosen) && { basis: basisFor(line, chosen)! }),
      options: line.options.map((o) => ({
        key: o.key,
        label: o.label,
        ...(o.detail && { detail: o.detail }),
        amount: amountFor(line, o.key),
      })),
      selectedOption: chosen ?? furnitureOptionOf(line, undefined).key,
    };
  });

  const toggle = (key: string) => {
    const next = { ...input.furniture };
    const adding = !(key in next);
    if (adding) {
      const line = FURNITURE_LINES.find((l) => l.key === key)!;
      next[key] = furnitureOptionOf(line, undefined).key;
    } else {
      delete next[key];
    }
    track('estimator_furniture_toggle', { item: key, on: adding });
    patch({ furniture: next });
  };

  const choose = (key: string, optionKey: string) =>
    patch({ furniture: { ...input.furniture, [key]: optionKey } });

  return (
    <div>
      {labourOnly && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-caption text-muted">
            You chose to buy the materials yourself, so furniture is purchased by you directly. These selections
            are recorded for scope but excluded from the cost.
          </p>
        </div>
      )}

      <OptInGrid
        items={items}
        selected={(key) => key in input.furniture}
        onToggle={toggle}
        onChoose={choose}
        muted={labourOnly}
      />

      <p className="mt-5 flex items-start gap-2 text-caption leading-relaxed text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Furniture is priced on top of the package, not inside it — a fully furnished handover from a builder
          means fixed joinery (modular kitchen, wardrobes, ceilings), and a sofa is not in that contract. Each
          figure is an allowance at that level rather than a specific product, and all of them are indicative
          until we have walked your rooms.
        </span>
      </p>
    </div>
  );
}

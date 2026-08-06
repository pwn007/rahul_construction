import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Checkbox, FormField, Input, Select, Switch, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { FieldConfig } from '../types';

const SPAN: Record<number, string> = {
  4: 'sm:col-span-4',
  6: 'sm:col-span-6',
  8: 'sm:col-span-8',
  12: 'col-span-12',
};

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const id = `field-${field.name}`;
  const span = SPAN[field.span ?? 12] ?? 'col-span-12';

  const common = {
    id,
    error,
    placeholder: field.placeholder,
    disabled: field.readOnly,
  };

  let control: React.ReactNode;

  switch (field.type) {
    case 'textarea':
    case 'richtext':
      control = (
        <Textarea
          {...common}
          rows={field.type === 'richtext' ? 10 : 4}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case 'number':
    case 'currency':
      control = (
        <Input
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? (field.type === 'currency' ? 1 : 'any')}
          value={value === undefined || value === null ? '' : Number(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          leftIcon={field.type === 'currency' ? <span className="text-sm">₹</span> : undefined}
        />
      );
      break;

    case 'select':
      control = (
        <Select {...common} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
      break;

    case 'multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div className="flex flex-wrap gap-2 rounded-md border p-3">
          {field.options?.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                className={cn(
                  'rounded-full px-3 py-1.5 text-caption transition-colors',
                  on ? 'bg-cyan-500 text-white' : 'bg-[rgb(var(--c-text))]/[0.06] text-muted hover:bg-[rgb(var(--c-text))]/[0.1]',
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
      break;
    }

    case 'boolean':
      control = (
        <div className="flex h-11 items-center gap-3">
          <Switch checked={Boolean(value)} onChange={onChange} label={field.label} id={id} />
          <span className="text-sm text-muted">{value ? 'Enabled' : 'Disabled'}</span>
        </div>
      );
      break;

    case 'date':
      control = (
        <Input
          {...common}
          type="date"
          value={value ? String(value).slice(0, 10) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
      );
      break;

    case 'color':
      control = (
        <div className="flex gap-2">
          <input
            type="color"
            id={id}
            value={String(value ?? '#00AEEF')}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-md border bg-transparent p-1"
            aria-label={field.label}
          />
          <Input error={error} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="flex-1" />
        </div>
      );
      break;

    case 'image':
      control = <ImageField value={String(value ?? '')} onChange={onChange} error={error} />;
      break;

    case 'tags':
      control = <TagsField value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
      break;

    case 'rating':
      control = (
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${n} stars`}
              className={cn(
                'h-10 w-10 rounded-md border text-sm transition-colors',
                Number(value) >= n ? 'border-warning bg-warning/15 text-warning' : 'text-subtle hover:border-warning/50',
              )}
            >
              ★
            </button>
          ))}
        </div>
      );
      break;

    default:
      control = (
        <Input
          {...common}
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <FormField
      label={field.label}
      htmlFor={id}
      required={field.required}
      error={error}
      description={field.help}
      className={span}
    >
      {control}
    </FormField>
  );
}

function ImageField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-3">
      {value && (
        <div className="relative w-fit overflow-hidden rounded-lg border">
          <img src={value} alt="" className="h-28 w-44 object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove image"
            className="absolute right-1.5 top-1.5 rounded bg-ink-950/70 p-1 text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL, or pick from Media Library" error={error} />
      <p className="text-caption text-subtle">
        Prototype: paste a URL. Phase 2 opens the Media Library picker with signed-URL upload.
      </p>
    </div>
  );
}

function TagsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const tag = draft.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Type and press Enter"
        />
        <button
          type="button"
          onClick={add}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors hover:border-cyan-500"
          aria-label="Add tag"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 rounded-full bg-cyan-500/12 px-2.5 py-1 text-caption text-cyan-700 dark:text-cyan-300">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

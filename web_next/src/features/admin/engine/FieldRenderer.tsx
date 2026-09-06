'use client';

import { useRef, useState } from 'react';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { Checkbox, FormField, Input, Select, Switch, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { FieldConfig } from '../types';
import { uploadImage } from '@/services/media';

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
            value={String(value ?? '#00BBEE')}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-md border bg-transparent p-1"
            aria-label={field.label}
          />
          <Input error={error} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="flex-1" />
        </div>
      );
      break;

    case 'image':
      control = <ImageField id={id} value={String(value ?? '')} onChange={onChange} error={error} />;
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

    case 'kv-list':
      control = <KvListField value={Array.isArray(value) ? (value as KvRow[]) : []} onChange={onChange} />;
      break;

    case 'link-list':
      control = <LinkListField value={Array.isArray(value) ? (value as LinkRow[]) : []} onChange={onChange} />;
      break;

    case 'image-list':
      control = <ImageListField value={Array.isArray(value) ? (value as GalleryRow[]) : []} onChange={onChange} />;
      break;

    case 'feature-list':
      control = <FeatureListField value={Array.isArray(value) ? (value as FeatureRow[]) : []} onChange={onChange} />;
      break;

    case 'step-list':
      control = <StepListField value={Array.isArray(value) ? (value as StepRow[]) : []} onChange={onChange} />;
      break;

    case 'latlng':
      control = <LatLngField value={(value as LatLng | undefined) ?? undefined} onChange={onChange} />;
      break;

    case 'socials':
      control = <SocialsField value={(value as Socials | undefined) ?? undefined} onChange={onChange} />;
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

function ImageField({ id, value, onChange, error }: { id?: string; value: string; onChange: (v: string) => void; error?: string }) {
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
      <div className="flex gap-2">
        {/* The id makes FormField's label actually point at something — before
            this the htmlFor dangled and automation/label-clicks found nothing. */}
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL — /images/… or /uploads/…" error={error} className="flex-1" />
        <UploadButton onUploaded={onChange} />
      </div>
      <p className="text-caption text-subtle">
        Upload a photo (webp/jpg/png, up to 8&nbsp;MB) or paste a URL.
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

/* ------------------------------ KvList ------------------------------- */

type KvRow = { label: string; value: string };

/**
 * Label/value rows — the shape of a project's `specs`.
 *
 * No drag handles: order is the row order, and with half a dozen rows the
 * remove-and-re-add cost of getting it wrong is lower than the cost of a
 * drag-and-drop dependency in the admin bundle.
 */
function KvListField({ value, onChange }: { value: KvRow[]; onChange: (v: KvRow[]) => void }) {
  const set = (i: number, patch: Partial<KvRow>) => onChange(value.map((row, n) => (n === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input value={row.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Label (e.g. Plot size)" className="flex-1" />
          <Input value={row.value} onChange={(e) => set(i, { value: e.target.value })} placeholder="Value (e.g. 30 × 50 ft)" className="flex-1" />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, n) => n !== i))}
            aria-label="Remove row"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-subtle transition-colors hover:border-danger hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: '', value: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add row
      </button>
    </div>
  );
}

/* ----------------------------- LinkList ------------------------------ */

type LinkRow = { label: string; href: string };

/** A footer column's links — KvListField with `href` for a value key, and the
    same no-drag rule: row order is display order. */
function LinkListField({ value, onChange }: { value: LinkRow[]; onChange: (v: LinkRow[]) => void }) {
  const set = (i: number, patch: Partial<LinkRow>) => onChange(value.map((row, n) => (n === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex gap-2">
          <Input value={row.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Label (e.g. Gallery)" className="flex-1" />
          <Input value={row.href} onChange={(e) => set(i, { href: e.target.value })} placeholder="Link (e.g. /gallery)" className="flex-1" />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, n) => n !== i))}
            aria-label="Remove row"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-subtle transition-colors hover:border-danger hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: '', href: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add link
      </button>
    </div>
  );
}

/* ---------------------------- ImageList ------------------------------ */

type GalleryRow = { id: string; url: string; alt: string; caption?: string; order: number };

/**
 * The project's photo gallery, in display order.
 *
 * Ids and `order` are re-normalised to `i1…iN` / `1…N` on every change rather
 * than preserved, because that is exactly how the seed data is shaped
 * (`src/data/projects.ts`) and the public gallery sorts by `order` — deriving
 * both from row position makes an inconsistent pair unrepresentable.
 */
function ImageListField({ value, onChange }: { value: GalleryRow[]; onChange: (v: GalleryRow[]) => void }) {
  const normalise = (rows: Omit<GalleryRow, 'id' | 'order'>[]) =>
    onChange(rows.map((row, i) => ({ ...row, id: `i${i + 1}`, order: i + 1 })));

  const set = (i: number, patch: Partial<GalleryRow>) => normalise(value.map((row, n) => (n === i ? { ...row, ...patch } : row)));

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    normalise(next);
  };

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={row.id} className="flex gap-3 rounded-lg border p-3">
          {row.url ? (
            <img src={row.url} alt="" className="h-20 w-28 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded border border-dashed text-caption text-subtle">No image</div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex gap-2">
              <Input value={row.url} onChange={(e) => set(i, { url: e.target.value })} placeholder="Image URL — /images/… or /uploads/…" className="flex-1" />
              <UploadButton onUploaded={(url) => set(i, { url })} />
            </div>
            <div className="flex gap-2">
              <Input value={row.alt} onChange={(e) => set(i, { alt: e.target.value })} placeholder="Alt text (what the photo shows)" className="flex-1" />
              <Input value={row.caption ?? ''} onChange={(e) => set(i, { caption: e.target.value })} placeholder="Caption (optional)" className="flex-1" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:text-cyan-700 disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:text-cyan-700 disabled:opacity-30">↓</button>
            <button type="button" onClick={() => normalise(value.filter((_, n) => n !== i))} aria-label="Remove image" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:border-danger hover:text-danger"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => normalise([...value, { url: '', alt: '', caption: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add photo
      </button>
    </div>
  );
}

/* ----------------------------- LatLng -------------------------------- */

type LatLng = { lat: number; lng: number };

/** The atlas pin. Cleared entirely when both boxes are emptied, so "no pin" is
    an absent object rather than {0, 0} — coordinates the atlas would dutifully
    place in the Gulf of Guinea. */
function LatLngField({ value, onChange }: { value?: LatLng; onChange: (v: LatLng | undefined) => void }) {
  const set = (key: 'lat' | 'lng', raw: string) => {
    const next = { lat: value?.lat ?? NaN, lng: value?.lng ?? NaN, [key]: raw === '' ? NaN : Number(raw) };
    if (Number.isNaN(next.lat) && Number.isNaN(next.lng)) return onChange(undefined);
    onChange({ lat: Number.isNaN(next.lat) ? 0 : next.lat, lng: Number.isNaN(next.lng) ? 0 : next.lng });
  };

  return (
    <div className="flex gap-2">
      <Input type="number" step="0.0001" value={value?.lat ?? ''} onChange={(e) => set('lat', e.target.value)} placeholder="Latitude — 26.9124" className="flex-1" />
      <Input type="number" step="0.0001" value={value?.lng ?? ''} onChange={(e) => set('lng', e.target.value)} placeholder="Longitude — 75.7873" className="flex-1" />
    </div>
  );
}

/* ----------------------------- Socials ------------------------------- */

type Socials = { linkedin?: string; email?: string };

/** A team member's contact links. Same clearing rule as LatLngField: blank
    boxes drop their key, and when both are blank the whole object goes —
    AboutView renders the icons with `socials?.linkedin &&`, so absence is the
    correct "no links" state, not an object of empty strings. */
function SocialsField({ value, onChange }: { value?: Socials; onChange: (v: Socials | undefined) => void }) {
  const set = (key: 'linkedin' | 'email', raw: string) => {
    const next: Socials = { ...value, [key]: raw };
    if (!next.linkedin?.trim()) delete next.linkedin;
    if (!next.email?.trim()) delete next.email;
    onChange(next.linkedin || next.email ? next : undefined);
  };

  return (
    <div className="flex gap-2">
      <Input type="url" value={value?.linkedin ?? ''} onChange={(e) => set('linkedin', e.target.value)} placeholder="LinkedIn URL" className="flex-1" />
      <Input type="email" value={value?.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="Email address" className="flex-1" />
    </div>
  );
}

/* --------------------------- UploadButton ---------------------------- */

/**
 * One button, one hidden input, one honest error line. Uploads go to the real
 * API regardless of mock mode — see services/media.ts — and land as
 * `/uploads/YYYY/MM/name-xxxxxx.ext`, which this hands straight to the field.
 */
function UploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setUploadError('');
    try {
      onUploaded((await uploadImage(file)).url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy ? 'Uploading…' : 'Upload'}
      </button>
      {uploadError && <p className="mt-1 max-w-[12rem] text-caption text-danger">{uploadError}</p>}
    </div>
  );
}

/* --------------------------- FeatureList ----------------------------- */

type FeatureRow = { icon: string; title: string; description: string };

/** A service's features — what renders as the icon-led card grid on the
    service page and feeds the home page's "क्या-क्या मिलता है" chips. Icon is a
    lucide name typed as text; the registry in lib/icons falls back safely on a
    typo, so a wrong name costs a generic icon, not a crash. */
function FeatureListField({ value, onChange }: { value: FeatureRow[]; onChange: (v: FeatureRow[]) => void }) {
  const set = (i: number, patch: Partial<FeatureRow>) => onChange(value.map((row, n) => (n === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex gap-2">
            <Input value={row.icon} onChange={(e) => set(i, { icon: e.target.value })} placeholder="Icon (lucide name — e.g. Ruler)" className="w-44" />
            <Input value={row.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Title" className="flex-1" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, n) => n !== i))}
              aria-label="Remove feature"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-subtle transition-colors hover:border-danger hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Input value={row.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="One-line description" />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { icon: '', title: '', description: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add feature
      </button>
    </div>
  );
}

/* ----------------------------- StepList ------------------------------ */

type StepRow = { step: number; title: string; description: string };

/** The service's process timeline. `step` is derived from row position on
    every change — same reasoning as the gallery's ids: a hand-maintained
    number and a position that can disagree is a bug factory. */
function StepListField({ value, onChange }: { value: StepRow[]; onChange: (v: StepRow[]) => void }) {
  const normalise = (rows: Omit<StepRow, 'step'>[]) => onChange(rows.map((row, i) => ({ ...row, step: i + 1 })));
  const set = (i: number, patch: Partial<StepRow>) => normalise(value.map((row, n) => (n === i ? { ...row, ...patch } : row)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    normalise(next);
  };

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="flex gap-3 rounded-lg border p-3">
          <span className="num mt-2 w-8 shrink-0 text-center text-heading-lg font-semibold text-[rgb(var(--c-brand-text))]">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <Input value={row.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="Step title" />
            <Input value={row.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="What happens in this step" />
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:text-cyan-700 disabled:opacity-30">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:text-cyan-700 disabled:opacity-30">↓</button>
            <button type="button" onClick={() => normalise(value.filter((_, n) => n !== i))} aria-label="Remove step" className="rounded border px-2 py-1 text-caption text-subtle transition-colors hover:border-danger hover:text-danger"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => normalise([...value, { title: '', description: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-caption font-medium text-muted transition-colors hover:border-cyan-500 hover:text-cyan-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add step
      </button>
    </div>
  );
}

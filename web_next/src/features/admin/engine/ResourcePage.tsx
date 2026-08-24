'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Copy,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Drawer,
  EmptyState,
  Input,
  Pagination,
  Select,
  Skeleton,
  useToast,
} from '@/components/ui';
import { useResourceList, useResourceMutations } from '@/hooks/useResource';
import { useDebouncedValue } from '@/hooks';
import { formatDate } from '@/lib/format';
import { FieldRenderer } from './FieldRenderer';
import type { ResourceConfig } from '../types';

type Row = Record<string, unknown> & { id: string };

export function ResourcePage<T extends { id: string }>({ config }: { config: ResourceConfig<T> }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [previewing, setPreviewing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({ id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebouncedValue(search, 250);
  const { push } = useToast();

  const query = useMemo(
    () => ({ page, pageSize: 12, search: debouncedSearch || undefined, ...config.defaultQuery, ...filters }),
    [page, debouncedSearch, filters, config.defaultQuery],
  );

  const { data, isLoading } = useResourceList(config.service, query);
  const { create, update, remove } = useResourceMutations(config.service);

  const rows = (data?.items ?? []) as unknown as Row[];
  const canCreate = config.canCreate !== false;
  const canDelete = config.canDelete !== false;

  const openCreate = () => {
    const initial: Row = { id: '' };
    for (const f of config.fields) if (f.defaultValue !== undefined) initial[f.name] = f.defaultValue;
    setDraft(initial);
    setErrors({});
    setEditing('new');
  };

  const openEdit = (row: Row) => {
    setDraft({ ...row });
    setErrors({});
    setEditing(row);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const f of config.fields) {
      if (!f.required || f.readOnly) continue;
      const v = draft[f.name];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) next[f.name] = `${f.label} is required`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    const payload = { ...draft } as Partial<T>;
    try {
      if (editing === 'new') {
        await create.mutateAsync(payload);
        push({ kind: 'success', title: `${config.singular} created` });
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, dto: payload });
        push({ kind: 'success', title: `${config.singular} updated` });
      }
      setEditing(null);
    } catch {
      push({ kind: 'error', title: 'Could not save', description: 'Please try again.' });
    }
  };

  const duplicate = async (row: Row) => {
    const copy = { ...row } as Record<string, unknown>;
    delete copy['id'];
    if (typeof copy['title'] === 'string') copy['title'] = `${copy['title']} (copy)`;
    if (typeof copy['name'] === 'string') copy['name'] = `${copy['name']} (copy)`;
    if (typeof copy['slug'] === 'string') copy['slug'] = `${copy['slug']}-copy`;
    copy['status'] = 'draft';
    await create.mutateAsync(copy as Partial<T>);
    push({ kind: 'success', title: `${config.singular} duplicated`, description: 'Saved as a draft.' });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    push({ kind: 'success', title: `${config.singular} deleted` });
    setDeleting(null);
    setSelected((s) => s.filter((id) => id !== deleting.id));
  };

  const bulkDelete = async () => {
    await Promise.all(selected.map((id) => remove.mutateAsync(id)));
    push({ kind: 'success', title: `${selected.length} records deleted` });
    setSelected([]);
  };

  const sections = useMemo(() => {
    const map = new Map<string, typeof config.fields>();
    for (const f of config.fields) {
      const key = f.section ?? 'Details';
      map.set(key, [...(map.get(key) ?? []), f]);
    }
    return [...map.entries()];
  }, [config.fields]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">{config.label}</h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted">{config.description}</p>
        </div>
        {canCreate && (
          <Button variant="accent" size="md" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            New {config.singular.toLowerCase()}
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="surface mt-6 flex flex-wrap items-center gap-3 rounded-xl border p-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={config.searchPlaceholder ?? `Search ${config.label.toLowerCase()}…`}
          aria-label="Search"
          leftIcon={<Search className="h-4 w-4" />}
          className="h-9 max-w-xs flex-1"
        />

        {config.filters?.map((filter) => (
          <Select
            key={filter.key}
            value={filters[filter.key] ?? 'all'}
            onChange={(e) => {
              setFilters((f) => ({ ...f, [filter.key]: e.target.value }));
              setPage(1);
            }}
            aria-label={filter.label}
            className="h-9 w-auto text-caption"
          >
            <option value="all">{filter.label}: all</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}

        <span className="num ml-auto text-caption text-subtle">
          {data?.total ?? 0} record{data?.total === 1 ? '' : 's'}
        </span>
      </div>

      {/* Bulk bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] px-4 py-3"
          >
            <span className="num text-sm font-medium">{selected.length} selected</span>
            {canDelete && (
              <Button variant="danger" size="sm" onClick={bulkDelete} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
                Delete
              </Button>
            )}
            <button onClick={() => setSelected([])} className="ml-auto text-caption text-subtle hover:text-[rgb(var(--c-text))]">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="surface mt-4 overflow-hidden rounded-xl border">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={`No ${config.label.toLowerCase()} found`}
            description={search ? `Nothing matches “${search}”.` : `Create your first ${config.singular.toLowerCase()} to get started.`}
            action={canCreate ? <Button variant="accent" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>New {config.singular.toLowerCase()}</Button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[rgb(var(--c-surface-2))] text-left">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selected.length === rows.length && rows.length > 0}
                      onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                      aria-label="Select all"
                    />
                  </th>
                  {config.columns.map((col) => (
                    <th
                      key={col.key}
                      className={cn('px-4 py-3 font-medium text-subtle', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-32 px-4 py-3 text-right font-medium text-subtle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b transition-colors last:border-0 hover:bg-[rgb(var(--c-text))]/[0.02]">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id)))}
                        aria-label={`Select record ${row.id}`}
                      />
                    </td>
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-4 py-3', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                      >
                        {col.render ? col.render(row as unknown as T) : defaultCell(row[col.key])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconAction label="Preview" onClick={() => setPreviewing(row)}>
                          <Eye className="h-4 w-4" />
                        </IconAction>
                        {canCreate && (
                          <IconAction label="Duplicate" onClick={() => duplicate(row)}>
                            <Copy className="h-4 w-4" />
                          </IconAction>
                        )}
                        <IconAction label="Edit" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4" />
                        </IconAction>
                        {canDelete && (
                          <IconAction label="Delete" tone="danger" onClick={() => setDeleting(row)}>
                            <Trash2 className="h-4 w-4" />
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />}

      {/* Create / edit */}
      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`}
        width="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={save} loading={create.isPending || update.isPending}>
              {editing === 'new' ? 'Create' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          {sections.map(([section, fields]) => (
            <div key={section}>
              {sections.length > 1 && <p className="mb-4 text-overline uppercase text-subtle">{section}</p>}
              <div className="grid grid-cols-12 gap-5">
                {fields
                  .filter((f) => !f.readOnly)
                  .map((field) => (
                    <FieldRenderer
                      key={field.name}
                      field={field}
                      value={draft[field.name]}
                      onChange={(value) => setDraft((d) => ({ ...d, [field.name]: value }))}
                      error={errors[field.name]}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Preview */}
      <Drawer open={previewing !== null} onClose={() => setPreviewing(null)} title={`${config.singular} preview`} width="max-w-2xl">
        {previewing && (
          <div>
            {config.publicHref?.(previewing as unknown as T) && (
              <Link
                href={config.publicHref(previewing as unknown as T) as string}
                target="_blank"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 link-underline dark:text-cyan-400"
              >
                View on the live site <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}

            {config.preview ? (
              config.preview(previewing as unknown as T)
            ) : (
              <dl className="space-y-4">
                {config.fields.map((f) => (
                  <div key={f.name} className="border-b pb-3 last:border-0">
                    <dt className="text-caption uppercase tracking-wide text-subtle">{f.label}</dt>
                    <dd className="mt-1 text-sm">{defaultCell(previewing[f.name])}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8 flex gap-3 border-t pt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  openEdit(previewing);
                  setPreviewing(null);
                }}
                leftIcon={<Pencil className="h-4 w-4" />}
              >
                Edit this {config.singular.toLowerCase()}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete confirm */}
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete this ${config.singular.toLowerCase()}?`}
        description="This cannot be undone from the panel. In Phase 2 this becomes a soft delete with a 30-day restore window."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={remove.isPending} leftIcon={<Trash2 className="h-4 w-4" />}>
              Delete
            </Button>
          </>
        }
      >
        {deleting && (
          <p className="text-sm text-muted">
            <span className="font-medium text-[rgb(var(--c-text))]">
              {String(deleting['title'] ?? deleting['name'] ?? deleting['label'] ?? deleting['question'] ?? deleting.id)}
            </span>{' '}
            will be removed from the site immediately.
          </p>
        )}
      </Dialog>
    </div>
  );
}

function IconAction({
  children,
  label,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-md p-2 text-subtle transition-colors hover:bg-[rgb(var(--c-text))]/[0.06]',
        tone === 'danger' ? 'hover:text-danger' : 'hover:text-cyan-700',
      )}
    >
      {children}
    </button>
  );
}

function defaultCell(value: unknown): React.ReactNode {
  if (value === undefined || value === null || value === '') return <span className="text-subtle">—</span>;
  if (typeof value === 'boolean') return <Badge variant={value ? 'success' : 'default'} size="sm">{value ? 'Yes' : 'No'}</Badge>;
  if (Array.isArray(value)) return <span className="text-caption text-muted">{value.length} item{value.length === 1 ? '' : 's'}</span>;
  if (typeof value === 'object') return <span className="text-subtle">—</span>;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return <span className="num text-caption text-muted">{formatDate(str)}</span>;
  return str.length > 60 ? `${str.slice(0, 59)}…` : str;
}

export { defaultCell };

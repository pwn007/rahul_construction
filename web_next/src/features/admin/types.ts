'use client';

import type { ReactNode } from 'react';
import type { ListQuery } from '@/types/domain';
import type { ResourceService } from '@/services';

/**
 * The admin panel is *declarative*: every module is a ResourceConfig object,
 * rendered by one table engine and one form engine. Adding a module is adding a
 * config — not building a screen. This is what makes 28 modules tractable, and
 * what will keep them consistent as the product grows.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'date'
  | 'image'
  | 'slug'
  | 'color'
  | 'url'
  | 'email'
  | 'tags'
  | 'rating'
  /* A {label, value} row list — project specs and anything shaped like them. */
  | 'kv-list'
  /* An ordered gallery: url + alt + caption per row; ids and `order` are
     re-normalised on every change so the stored JSON matches the seed data's
     shape (`i1`, `i2`, … with 1-based order) exactly. */
  | 'image-list'
  /* A {lat, lng} pair — the Project Atlas pin. */
  | 'latlng'
  /* {icon, title, description} rows — a service's feature list. */
  | 'feature-list'
  /* Auto-numbered {step, title, description} rows — a service's process. */
  | 'step-list'
  /* {linkedin?, email?} — a team member's contact links. One optional object
     that disappears entirely when both boxes are blank, matching the seed
     where members without links simply have no `socials` key. */
  | 'socials';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** Grid span within the form (12-column). */
  span?: 4 | 6 | 8 | 12;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: unknown;
  /** Hidden from the create/edit form but still shown in the table. */
  readOnly?: boolean;
  section?: string;
}

export interface ColumnConfig<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ResourceConfig<T extends { id: string } = { id: string }> {
  /** Route segment under /admin. */
  key: string;
  label: string;
  singular: string;
  description: string;
  icon: string;
  group: 'Overview' | 'Content' | 'People' | 'Leads' | 'Page builder' | 'System';
  service: ResourceService<T>;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  filters?: FilterConfig[];
  defaultQuery?: ListQuery;
  searchPlaceholder?: string;
  /** Some resources are read-only in the panel (e.g. incoming leads). */
  canCreate?: boolean;
  canDelete?: boolean;
  /** Renders the preview drawer body. */
  preview?: (row: T) => ReactNode;
  /** Public URL to view this record on the live site. */
  publicHref?: (row: T) => string | undefined;
  badge?: (rows: T[]) => number | undefined;
}

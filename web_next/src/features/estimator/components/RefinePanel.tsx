'use client';

import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * A disclosure for the refinements that live on the result screen.
 *
 * Extracted from `Result.tsx` when the furniture picker arrived and needed the
 * same affordance as the extras panel. A native `<details>`, so it costs no
 * JavaScript and keeps its keyboard behaviour for free.
 */
export function RefinePanel({
  title,
  summary,
  count,
  children,
}: {
  title: string;
  summary: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="surface group rounded-xl border shadow-sm open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
          <Plus className="h-5 w-5 transition-transform duration-300 group-open:rotate-45" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-heading-md font-semibold">{title}</span>
            {count > 0 && (
              <Badge variant="brand" size="sm">
                {count}
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block truncate text-caption text-muted">{summary}</span>
        </span>
        <span className="shrink-0 text-caption text-subtle group-open:hidden">Open</span>
        <span className="hidden shrink-0 text-caption text-subtle group-open:block">Close</span>
      </summary>
      <div className="border-t p-6 pt-7">{children}</div>
    </details>
  );
}

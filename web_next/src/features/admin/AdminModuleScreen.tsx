'use client';

import { MODULE_BY_KEY } from './config/modules';
import { ResourcePage } from './engine/ResourcePage';
import { EmptyState } from '@/components/ui';

/**
 * Resolves `/admin/<key>` to its module config.
 *
 * The lookup is client-side because `config/modules.tsx` builds its configs from
 * JSX icons and render functions — it is a client module, so a server component
 * cannot read `MODULE_BY_KEY` to prerender the list. The panel is noindex and
 * behind the passcode gate either way, so nothing is lost by resolving here.
 */
export function AdminModuleScreen({ moduleKey }: { moduleKey: string }) {
  const config = MODULE_BY_KEY[moduleKey];

  if (!config) {
    return (
      <EmptyState
        title="No such module"
        description={`"${moduleKey}" is not one of the admin modules. Pick one from the sidebar.`}
      />
    );
  }

  return <ResourcePage config={config as never} />;
}

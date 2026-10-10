import { SiteChrome } from './SiteChrome';
import { NotFoundView } from '@/features/legal/NotFoundView';

/*
 * The root not-found boundary renders inside the root layout only — never
 * inside a route group's — so the chrome has to be mounted explicitly. Without
 * this an unmatched URL would lose the navbar and footer that the old
 * `<Route path="*">` inherited from PublicLayout.
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  );
}

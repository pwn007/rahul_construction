'use client';

import { useEffect } from 'react';

/**
 * Replaces the class ErrorBoundary that wrapped the Vite app.
 *
 * Same markup, same copy. Next mounts this automatically around every route, so
 * there is nothing to wrap by hand — and it gets `reset()`, which the old
 * boundary had no equivalent for: a recoverable render error can now be retried
 * in place instead of forcing a trip back to the homepage.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Phase 2: forward to Sentry / server logging.
    console.error('Unhandled application error', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
      <p className="text-overline uppercase tracking-[0.18em] text-cyan-500">Something went wrong</p>
      <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold">We hit an unexpected error.</h1>
      <p className="mt-4 max-w-md text-sm text-white/50">
        The page failed to render. Reloading usually resolves it — if it does not, please let us know.
      </p>
      <pre className="mt-6 max-w-xl overflow-x-auto rounded-lg bg-white/5 p-4 text-left text-xs text-white/60">
        {error.message}
      </pre>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-medium transition-colors hover:bg-cyan-600"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.assign('/')}
          className="rounded-lg bg-white/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/20"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}

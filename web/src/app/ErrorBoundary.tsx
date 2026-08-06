import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Phase 2: forward to Sentry / server logging.
    console.error('Unhandled application error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 text-center text-white">
        <p className="text-overline uppercase tracking-[0.18em] text-cyan-500">Something went wrong</p>
        <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold">We hit an unexpected error.</h1>
        <p className="mt-4 max-w-md text-sm text-white/50">
          The page failed to render. Reloading usually resolves it — if it does not, please let us know.
        </p>
        <pre className="mt-6 max-w-xl overflow-x-auto rounded-lg bg-white/5 p-4 text-left text-xs text-white/60">
          {this.state.error.message}
        </pre>
        <button
          onClick={() => window.location.assign('/')}
          className="mt-8 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-medium transition-colors hover:bg-cyan-600"
        >
          Back to home
        </button>
      </div>
    );
  }
}

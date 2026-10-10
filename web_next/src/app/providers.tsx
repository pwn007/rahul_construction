'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { readStore, writeStore, STORAGE_KEYS } from '@/lib/storage';

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  /** Live brand-colour override, driven by /admin/theme. */
  setBrandColor: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  resolved: 'light',
  setMode: () => {},
  toggle: () => {},
  setBrandColor: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function hexToRgbTriplet(hex: string): string | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [m[1], m[2], m[3]].map((h) => parseInt(h as string, 16)).join(' ');
}

/**
 * The stored preference is applied twice, and both times matter.
 *
 * `THEME_BOOT_SCRIPT` (below) runs synchronously in <head> and puts `.dark` on
 * <html> before the first paint, so a dark-mode visitor never sees a white
 * flash. React then catches up here on mount.
 *
 * Seeding this state from localStorage during render — which is what the Vite
 * build did — is not an option under SSR: the server has no storage, so it would
 * render `light`, the client would render `dark`, and React would discard the
 * server HTML. Starting at the server's value and correcting in an effect is the
 * only version that hydrates cleanly, and the boot script means the correction
 * is invisible.
 */
function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setModeState(readStore<ThemeMode>(STORAGE_KEYS.theme, 'light'));

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    writeStore(STORAGE_KEYS.theme, m);
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setMode]);

  const setBrandColor = useCallback((hex: string) => {
    const triplet = hexToRgbTriplet(hex);
    if (triplet) document.documentElement.style.setProperty('--c-brand', triplet);
  }, []);

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle, setBrandColor }),
    [mode, resolved, setMode, toggle, setBrandColor],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Applies the saved theme before the first paint. Inlined into <head> by
 * app/layout.tsx, deliberately blocking — it is a few hundred bytes, and
 * deferring it is exactly the flash it exists to prevent.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var m=JSON.parse(localStorage.getItem('${STORAGE_KEYS.theme}')||'"light"');
var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
if(d)document.documentElement.classList.add('dark');
document.documentElement.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;

/* ------------------------------------------------------------------ */
/* Query client                                                        */
/* ------------------------------------------------------------------ */

export function AppProviders({ children }: { children: ReactNode }) {
  /*
   * Per-mount, not module scope.
   *
   * A module-level QueryClient is a single cache shared by every request the
   * Node process handles — one visitor's data served to the next. `useState`
   * with an initialiser creates it once per client, never on the server.
   */
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

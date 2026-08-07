import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button, Input, FormField } from '@/components/ui';
import { Logo } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '@/lib/storage';

/**
 * Passcode gate for /admin.
 *
 * ── What this is, and what it is not ────────────────────────────────────────
 * This is a **demo gate, not access control.** Vite inlines VITE_ADMIN_PASSCODE
 * into the bundle at build time, and the AdminRoutes chunk stays publicly
 * fetchable regardless — anyone determined enough reads both out of the
 * JavaScript. It exists to stop a client, a colleague or a crawler from landing
 * in the admin panel by typing a URL.
 *
 * That trade is only acceptable because the panel guards nothing: in mock mode
 * every edit writes to the visitor's own localStorage (see lib/storage.ts) and
 * touches no shared data. Never describe this to a client as protected data.
 * Real authorisation is Phase 2 server-side work, alongside the portal's mock
 * login in features/portal/PortalRoutes.tsx.
 */

/** Falls back so a local `npm run dev` without an .env still opens. */
const PASSCODE = import.meta.env['VITE_ADMIN_PASSCODE'] ?? 'archstone';

export function isAdminUnlocked(): boolean {
  return readStore(STORAGE_KEYS.adminUnlocked, false);
}

export function lockAdmin(): void {
  removeStore(STORAGE_KEYS.adminUnlocked);
}

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="on-dark grain relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-16 text-white">
      <Seo title="Admin" noIndex />

      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[110px]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <Link to={ROUTES.home} className="mb-8 inline-flex items-center gap-2 text-caption text-white/50 transition-colors hover:text-cyan-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>

        <div className="glass-dark rounded-2xl p-8">
          <Logo tone="light" />

          <h1 className="mt-8 font-display text-display-sm font-semibold">Admin Panel</h1>
          <p className="mt-2 text-sm text-white/55">
            Enter the passcode to open the content management panel.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (passcode !== PASSCODE) {
                setError('Incorrect passcode.');
                return;
              }
              writeStore(STORAGE_KEYS.adminUnlocked, true);
              onUnlock();
            }}
          >
            <FormField label="Passcode" htmlFor="admin-passcode" error={error}>
              <Input
                id="admin-passcode"
                type="password"
                autoFocus
                autoComplete="off"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError('');
                }}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30"
              />
            </FormField>

            <Button type="submit" variant="accent" size="lg" full>
              Open admin panel
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.07] p-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p className="text-caption leading-relaxed text-white/60">
              <span className="font-medium text-white/85">Prototype panel.</span> This passcode is a demo gate,
              not authentication — edits are stored in this browser only and are never shared. Phase 2 replaces
              it with server-side roles and permissions.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

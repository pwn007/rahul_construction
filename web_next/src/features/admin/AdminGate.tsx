'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button, Input, FormField } from '@/components/ui';
import { Logo } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { authService } from '@/services/auth';
import type { User } from '@/types/domain';

/**
 * Sign-in gate for /admin — real authentication, against the Laravel API.
 *
 * This replaced a passcode gate whose secret was a NEXT_PUBLIC_ env var —
 * inlined into the public JavaScript bundle at build time, readable by anyone
 * with view-source. Its own docblock had to plead "never describe this to a
 * client as protected data."
 *
 * Now: email + password → POST /api/auth/login → a JWT held in localStorage
 * (STORAGE_KEYS.adminToken). The server checks the hash, enforces the account's
 * `active` flag, and throttles to five attempts a minute. What this gate knows,
 * the bundle can afford to reveal — there is no secret in it.
 */
export function AdminGate({ onSignIn }: { onSignIn: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onSignIn(await authService.login(email.trim(), password));
    } catch (err) {
      /* The server's own sentence: wrong credentials, deactivated account and
         throttling each say something different, and it knows which. */
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  };

  return (
    /*
      `dark` alongside `on-dark`, and both are doing a job. This screen is
      hard-coded dark (ink-950) regardless of the visitor's theme — but `on-dark`
      only flips `--c-brand-text`. Everything that colours itself from the theme
      tokens — the field labels' `--c-text` above all — kept its *light-theme*
      values, so in light mode "Email" and "Password" rendered near-black on a
      near-black card. Scoping the site's own `.dark` token set onto this subtree
      makes every token-driven component correct here without inventing anything.
    */
    <div className="dark on-dark grain relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-16 text-white">

      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[110px]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <Link href={ROUTES.home} className="mb-8 inline-flex items-center gap-2 text-caption text-white/50 transition-colors hover:text-cyan-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to site
        </Link>

        <div className="glass-dark rounded-2xl p-8">
          <Logo tone="light" />

          <h1 className="mt-8 font-display text-display-sm font-semibold">Admin Panel</h1>
          <p className="mt-2 text-sm text-white/55">Sign in with your team account.</p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <FormField label="Email" htmlFor="admin-email">
              <Input
                id="admin-email"
                type="email"
                autoFocus
                autoComplete="username"
                placeholder="you@neetuarchstone.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30"
              />
            </FormField>

            <FormField label="Password" htmlFor="admin-password" error={error}>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30"
              />
            </FormField>

            <Button type="submit" variant="accent" size="lg" full disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.07] p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p className="text-caption leading-relaxed text-white/60">
              <span className="font-medium text-white/85">Server-side sign-in.</span> Your session is a signed
              token that expires after a day; signing out revokes it immediately.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

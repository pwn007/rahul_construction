'use client';

/*
 * Client Portal — switched off, exactly as it was in the Vite build.
 *
 * Converted alongside everything else so it cannot rot, but no `app/portal/**`
 * route files exist, so none of this ships. To bring it back, create:
 *
 *   app/portal/layout.tsx          -> <PortalLayout>{children}</PortalLayout>
 *   app/portal/page.tsx            -> redirect('/portal/overview')
 *   app/portal/overview/page.tsx   -> <PortalOverview />   (reads usePortalProject())
 *   app/portal/timeline/page.tsx   -> <PortalTimeline />
 *   app/portal/updates/page.tsx    -> <PortalUpdates />
 *   app/portal/documents/page.tsx  -> <PortalDocuments />
 *   app/portal/invoices/page.tsx   -> <PortalInvoices />
 *
 * …and uncomment the five public entry points, all marked "Client Portal is
 * commented out":
 *   · constants/routes.ts — MAIN_NAV (Company) and FOOTER_NAV (Resources)
 *   · components/common/Chrome.tsx — command palette
 *   · features/home/sections/Narrative.tsx — "Watch your site live"
 *   · data/ops.ts — admin footer-config seed
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  ReceiptIndianRupee,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Input, FormField, Select } from '@/components/ui';
import { Logo } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { readStore, writeStore, removeStore, STORAGE_KEYS } from '@/lib/storage';
import { portalProjects, demoPortalUser } from '@/data/portal';
import type { PortalProject } from '@/types/domain';
export { PortalOverview, PortalTimeline, PortalDocuments, PortalInvoices, PortalUpdates } from './screens';

const NAV = [
  { to: ROUTES.portalOverview, label: 'Overview', icon: LayoutDashboard },
  { to: ROUTES.portalTimeline, label: 'Timeline', icon: CalendarDays },
  { to: ROUTES.portalUpdates, label: 'Site updates', icon: Newspaper },
  { to: ROUTES.portalDocuments, label: 'Documents', icon: FileText },
  { to: ROUTES.portalInvoices, label: 'Invoices', icon: ReceiptIndianRupee },
];

/* ------------------------------------------------------------------ */
/* Mock auth — any credentials work; a real JWT flow drops in here.     */
/* ------------------------------------------------------------------ */

function PortalLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('karan.vyas@example.com');
  const [password, setPassword] = useState('demo1234');

  return (
    <div className="on-dark grain relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-5 py-16 text-white">
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

          <h1 className="mt-8 font-display text-display-sm font-semibold">Client Portal</h1>
          <p className="mt-2 text-sm text-white/55">
            Track your project's progress, milestones, documents and payments in one place.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              writeStore(STORAGE_KEYS.portalUser, { ...demoPortalUser, email });
              onLogin();
            }}
          >
            <FormField label="Email" htmlFor="portal-email">
              <Input
                id="portal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30"
              />
            </FormField>
            <FormField label="Password" htmlFor="portal-password">
              <Input
                id="portal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-white/15 bg-white/5 text-white placeholder:text-white/30"
              />
            </FormField>

            <Button type="submit" variant="accent" size="lg" full>
              Sign in to portal
            </Button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.07] p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <p className="text-caption leading-relaxed text-white/60">
              <span className="font-medium text-white/85">Prototype demo.</span> Authentication is mocked — any
              credentials sign you in to a seeded demo project. Phase 2 replaces this with JWT auth and
              server-side authorisation.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-caption text-white/35">
          Not a client yet?{' '}
          <Link href={ROUTES.estimator} className="text-cyan-400 underline underline-offset-2">
            Start with an estimate
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

function PortalShell({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState(portalProjects[0]?.id ?? '');
  const [navOpen, setNavOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const project = portalProjects.find((p) => p.id === projectId) ?? portalProjects[0];
  const user = readStore(STORAGE_KEYS.portalUser, demoPortalUser);

  if (!project) {
    router.replace(ROUTES.home);
    return null;
  }

  const signOut = () => {
    removeStore(STORAGE_KEYS.portalUser);
    router.push(ROUTES.home);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--c-bg))]">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-[rgb(var(--c-surface))]">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button onClick={() => setNavOpen((v) => !v)} className="rounded-md p-2 hover:bg-[rgb(var(--c-text))]/[0.06] lg:hidden" aria-label="Toggle navigation">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Logo compact />
            <span className="hidden text-caption uppercase tracking-[0.18em] text-subtle sm:block">Client Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Select project"
              className="h-9 w-auto max-w-[220px] text-caption"
            >
              {portalProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </Select>

            <div className="hidden items-center gap-2.5 sm:flex">
              <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-caption font-medium">{user.name}</span>
            </div>

            <button onClick={signOut} className="rounded-md p-2 text-subtle transition-colors hover:bg-[rgb(var(--c-text))]/[0.06] hover:text-danger" aria-label="Sign out">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="container flex gap-8 py-8">
        {/* Sidebar */}
        <aside className={cn('w-56 shrink-0 lg:block', navOpen ? 'fixed inset-x-0 top-16 z-30 block border-b bg-[rgb(var(--c-surface))] p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0' : 'hidden')}>
          <nav className="space-y-1 lg:sticky lg:top-24" aria-label="Portal">
            {NAV.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                onClick={() => setNavOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors',
                  pathname === item.to
                    ? 'bg-cyan-500/10 font-medium text-cyan-700 dark:text-cyan-300'
                    : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}

            <div className="mt-6 rounded-lg border p-4">
              <div className="flex items-center gap-2.5">
                <img src={project.projectManager.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-caption font-medium">{project.projectManager.name}</p>
                  <p className="text-[0.7rem] text-subtle">Your project manager</p>
                </div>
              </div>
              <Button href={`tel:${SITE.phoneRaw}`} variant="secondary" size="sm" full className="mt-3">
                Call
              </Button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Building2 className="h-4 w-4 text-cyan-500" />
            <h1 className="font-display text-heading-lg font-semibold">{project.title}</h1>
            <span className="num rounded-full bg-[rgb(var(--c-text))]/[0.06] px-2.5 py-1 text-caption text-subtle">{project.code}</span>
          </div>

          {/* Screens are rendered by the app/portal/** route files (see the
              restore note at the top of this file) and receive `project`
              through PortalProjectContext. */}
          <PortalProjectContext.Provider value={project}>{children}</PortalProjectContext.Provider>
        </main>
      </div>
    </div>
  );
}

/** Read the portal project from the shell. Used by the screens. */
export const PortalProjectContext = createContext<PortalProject | null>(null);
export const usePortalProject = () => useContext(PortalProjectContext);

export function PortalLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  /* localStorage is invisible to the server, so the first client render has to
     match the server's. Same reason as features/admin/AdminLayout.tsx. */
  useEffect(() => {
    setAuthed(Boolean(readStore<unknown>(STORAGE_KEYS.portalUser, null)));
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-h', '64px');
    return () => document.documentElement.style.setProperty('--nav-h', '76px');
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[rgb(var(--c-bg))]" />;
  if (!authed) return <PortalLogin onLogin={() => setAuthed(true)} />;
  return <PortalShell>{children}</PortalShell>;
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { Badge, Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { useTheme } from '@/app/providers';
import { useLockBodyScroll } from '@/hooks';
import { MODULES, MODULE_GROUPS, EXTRA_NAV } from './config/modules';
import { useLeadCounts } from './useLeadCounts';
import { AdminGate } from './AdminGate';
import { authService, isSignedIn } from '@/services/auth';
import type { User } from '@/types/domain';

/**
 * The System group belongs to exactly one account.
 *
 * Media library, SEO & meta, Users, Settings, Estimator config, Roles &
 * permissions and Theme render only for the `superadmin` role — every other
 * signed-in user gets the rest of the panel and simply never sees these. Two
 * layers enforce it here: the sidebar drops the whole group, and AdminShell
 * bounces a typed-in /admin/{system-key} URL back to the dashboard.
 *
 * Honest limit, on purpose: this is UI-level gating. The API itself still
 * answers any signed-in user for these resources — server-side RBAC
 * (CheckPermission over roles.permissions) is the deferred phase where that
 * lock lands.
 */
const SUPER_ONLY_GROUP = 'System';

const SUPER_ONLY_KEYS = new Set(['media', 'seo', 'users', 'settings', 'estimator-config', 'roles', 'theme']);

const isSuper = (user: User | null) => user?.roleSlug === 'superadmin';

function Sidebar({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const [filter, setFilter] = useState('');
  const pathname = usePathname();
  /* Live, so a lead submitted on the public site moves this badge. */
  const { badges } = useLeadCounts();

  const groups = MODULE_GROUPS.filter((group) => group !== SUPER_ONLY_GROUP || isSuper(user)).map((group) => ({
    group,
    items: [
      ...MODULES.filter((m) => m.group === group).map((m) => ({ key: m.key, label: m.label, icon: m.icon })),
      ...EXTRA_NAV.filter((e) => e.group === group).map((e) => ({ key: e.key, label: e.label, icon: e.icon })),
    ].filter((item) => !filter || item.label.toLowerCase().includes(filter.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter modules…"
          aria-label="Filter modules"
          leftIcon={<Search className="h-3.5 w-3.5" />}
          className="h-9 text-caption"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
        {/* Was <NavLink end>, i.e. exact match only — /admin must not light up
            while a module page is open. `pathname === '/admin'` is that `end`. */}
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            pathname === '/admin'
              ? 'bg-cyan-500/12 font-medium text-cyan-700 dark:text-cyan-300'
              : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </Link>

        {groups.map(({ group, items }) => (
          <div key={group} className="mt-5">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle">{group}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.key}
                  href={`/admin/${item.key}`}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    pathname === `/admin/${item.key}`
                      ? 'bg-cyan-500/12 font-medium text-cyan-700 dark:text-cyan-300'
                      : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
                  )}
                >
                  <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badges[item.key] ? (
                    <span className="num rounded-full bg-cyan-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                      {badges[item.key]}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

function AdminShell({ user, onSignOut, children }: { user: User; onSignOut: () => void; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  useLockBodyScroll(navOpen);

  useEffect(() => setNavOpen(false), [pathname]);

  /* A System URL typed by hand gets the same answer as the hidden sidebar
     entry. `blocked` also blanks the frame below so the screen never flashes
     before the replace lands. */
  const moduleKey = pathname?.startsWith('/admin/') ? pathname.slice('/admin/'.length).replace(/\/$/, '') : '';
  const blocked = !isSuper(user) && SUPER_ONLY_KEYS.has(moduleKey);

  useEffect(() => {
    if (blocked) router.replace('/admin');
  }, [blocked, router]);

  return (
    <div className="min-h-screen bg-[rgb(var(--c-bg))]">

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-[rgb(var(--c-surface))]">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} className="rounded-md p-2 hover:bg-[rgb(var(--c-text))]/[0.06] lg:hidden" aria-label="Toggle navigation">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/admin" className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8" />
              <span className="hidden font-display text-lg font-semibold sm:block">{SITE.wordmark.primary}</span>
              <Badge variant="default" size="sm">
                Admin
              </Badge>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button href={ROUTES.home} variant="ghost" size="sm" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />} className="hidden sm:inline-flex">
              View site
            </Button>
            <button
              onClick={toggle}
              aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[rgb(var(--c-text))]/[0.06]"
            >
              {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-2.5 border-l pl-3">
              {user.avatar && <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />}
              <div className="hidden sm:block">
                <p className="text-caption font-medium leading-tight">{user.name}</p>
                <p className="text-[0.7rem] leading-tight text-subtle">{user.roleName}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="rounded-md p-2 text-subtle transition-colors hover:bg-[rgb(var(--c-text))]/[0.06] hover:text-danger"
              aria-label="Sign out"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-[rgb(var(--c-surface))] lg:block">
          <Sidebar user={user} />
        </aside>

        {/* Sidebar — mobile */}
        <AnimatePresence>
          {navOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 top-16 z-30 lg:hidden">
              <div className="absolute inset-0 bg-ink-950/50" onClick={() => setNavOpen(false)} />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
                className="absolute left-0 top-0 h-full w-72 border-r bg-[rgb(var(--c-surface))]"
              >
                <Sidebar user={user} onNavigate={() => setNavOpen(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          {/* The nested <Routes> became the app/admin/** route files; the screens
              they mounted are unchanged. `key={pathname}` still replays the
              enter transition on every admin navigation. */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {blocked ? null : children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/**
 * Admin chrome + sign-in gate. Mounted from app/admin/layout.tsx.
 *
 * The session is a JWT in localStorage, which the server render cannot read, so
 * the first client render must match the server's — hence `mounted`. On mount,
 * a stored token is not taken at its word: it is sent to /api/auth/me, and the
 * gate only opens on the server's answer. A token that expired overnight, or
 * one revoked by sign-out on another device, fails that call, gets cleared by
 * the auth service, and lands back on the gate rather than in a shell where
 * every request would 401.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isSignedIn()) {
      setMounted(true);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setMounted(true));
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--nav-h', '64px');
    return () => document.documentElement.style.setProperty('--nav-h', '76px');
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[rgb(var(--c-bg))]" />;
  if (!user) return <AdminGate onSignIn={setUser} />;

  return (
    <AdminShell
      user={user}
      onSignOut={() => {
        /* Revoke first (blacklists the JWT server-side), then drop to the gate.
           The service clears the stored token even if the network call fails. */
        void authService.signOut().finally(() => setUser(null));
      }}
    >
      {children}
    </AdminShell>
  );
}

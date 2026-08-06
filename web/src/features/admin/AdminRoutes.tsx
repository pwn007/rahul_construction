import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, LayoutDashboard, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { Seo } from '@/components/seo/Seo';
import { Badge, Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { useTheme } from '@/app/providers';
import { useLockBodyScroll } from '@/hooks';
import { MODULES, MODULE_GROUPS, MODULE_BY_KEY, EXTRA_NAV } from './config/modules';
import { ResourcePage } from './engine/ResourcePage';
import { AdminDashboard } from './screens/Dashboard';
import { AdminAnalytics, AdminEstimatorConfig, AdminRoles, AdminTheme, AdminDataReset } from './screens/System';
import { enquiries, estimateRequests, applications, users } from '@/data/ops';

const BADGES: Record<string, number> = {
  enquiries: enquiries.filter((e) => e.stage === 'new').length,
  estimates: estimateRequests.filter((e) => e.stage === 'new').length,
  applications: applications.filter((a) => a.stage === 'new').length,
};

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [filter, setFilter] = useState('');

  const groups = MODULE_GROUPS.map((group) => ({
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
        <NavLink
          to="/admin"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive ? 'bg-cyan-500/12 font-medium text-cyan-700 dark:text-cyan-300' : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
            )
          }
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </NavLink>

        {groups.map(({ group, items }) => (
          <div key={group} className="mt-5">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle">{group}</p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.key}
                  to={`/admin/${item.key}`}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive ? 'bg-cyan-500/12 font-medium text-cyan-700 dark:text-cyan-300' : 'text-muted hover:bg-[rgb(var(--c-text))]/[0.05]',
                    )
                  }
                >
                  <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {BADGES[item.key] ? (
                    <span className="num rounded-full bg-cyan-500 px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
                      {BADGES[item.key]}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4">
        <AdminDataReset />
        <p className="mt-3 text-caption leading-relaxed text-subtle">
          Prototype panel. Edits persist to your browser and appear on the public site immediately.
        </p>
      </div>
    </div>
  );
}

function AdminShell() {
  const [navOpen, setNavOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const location = useLocation();
  const user = users[0];

  useLockBodyScroll(navOpen);

  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-[rgb(var(--c-bg))]">
      <Seo title="Admin" noIndex />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-[rgb(var(--c-surface))]">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen((v) => !v)} className="rounded-md p-2 hover:bg-[rgb(var(--c-text))]/[0.06] lg:hidden" aria-label="Toggle navigation">
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2.5">
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
            {user && (
              <div className="flex items-center gap-2.5 border-l pl-3">
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="hidden sm:block">
                  <p className="text-caption font-medium leading-tight">{user.name}</p>
                  <p className="text-[0.7rem] leading-tight text-subtle">{user.roleName}</p>
                </div>
              </div>
            )}
            <Link to={ROUTES.home} className="rounded-md p-2 text-subtle transition-colors hover:bg-[rgb(var(--c-text))]/[0.06] hover:text-danger" aria-label="Sign out">
              <LogOut className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r bg-[rgb(var(--c-surface))] lg:block">
          <Sidebar />
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
                <Sidebar onNavigate={() => setNavOpen(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="estimator-config" element={<AdminEstimatorConfig />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="theme" element={<AdminTheme />} />

              {MODULES.map((module) => (
                <Route key={module.key} path={module.key} element={<ResourcePage config={MODULE_BY_KEY[module.key] as never} />} />
              ))}

              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AdminRoutes() {
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-h', '64px');
    return () => document.documentElement.style.setProperty('--nav-h', '76px');
  }, []);

  return <AdminShell />;
}

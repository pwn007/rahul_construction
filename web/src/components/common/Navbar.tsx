import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Calculator, ChevronDown, Menu, Moon, Phone, Search, Sun, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';
import { Logo } from './Logo';
import { MAIN_NAV, ROUTES, type NavLink as NavLinkType } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { useScrollInfo, useLockBodyScroll } from '@/hooks';
import { useTheme } from '@/app/providers';
import { useHeroTone } from '@/app/hero-tone';

export function Navbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { atTop, direction, y } = useScrollInfo();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const location = useLocation();
  const heroTone = useHeroTone();

  /**
   * Transparent bar sitting over a forced-dark hero: everything must render
   * light-on-dark. Once the glass background appears on scroll, normal
   * theme-aware colours take over again.
   */
  const overDark = heroTone === 'dark' && atTop && !openMenu;

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  const hidden = direction === 'down' && y > 400 && !openMenu && !mobileOpen;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-x-0 top-0 z-50"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div
          className={cn(
            'transition-all duration-500 ease-out-expo',
            atTop && !openMenu ? 'bg-transparent' : 'glass border-b shadow-sm',
          )}
        >
          <div className="container flex h-[var(--nav-h)] items-center justify-between gap-6">
            <Logo tone={overDark ? 'light' : 'auto'} />

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {MAIN_NAV.map((item) => {
                const triggerClass = (lit: boolean) =>
                  cn(
                    'flex items-center gap-1 rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                    lit
                      ? overDark
                        ? 'text-cyan-400'
                        : 'text-cyan-700 dark:text-cyan-400'
                      : overDark
                        ? 'text-white/85 hover:text-cyan-300'
                        : 'text-[rgb(var(--c-text))] hover:text-cyan-700 dark:hover:text-cyan-400',
                  );

                const chevron = item.children && (
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform duration-300', openMenu === item.label && 'rotate-180')}
                  />
                );

                return (
                  <div key={item.label} className="relative" onMouseEnter={() => setOpenMenu(item.children ? item.label : null)}>
                    {item.menuOnly ? (
                      /*
                        A heading, not a link — its page is deliberately unreachable.

                        It stays a real <button> rather than a styled <span> so it
                        keeps its place in the tab order, and the click *opens* the
                        menu instead of toggling it: hovering has already opened the
                        panel by the time a mouse gets here, and a toggle would
                        dismiss the very thing the pointer came for. Keyboard users
                        get the only way in — until now the mega menu opened on
                        hover alone and Enter simply navigated.
                      */
                      <button
                        type="button"
                        aria-expanded={openMenu === item.label}
                        onClick={() => setOpenMenu(item.label)}
                        className={triggerClass(openMenu === item.label)}
                      >
                        {item.label}
                        {chevron}
                      </button>
                    ) : (
                      <NavLink to={item.href} className={({ isActive }) => triggerClass(isActive || openMenu === item.label)}>
                        {item.label}
                        {chevron}
                      </NavLink>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPalette}
                aria-label="Search (Command K)"
                className={cn(
                  'hidden items-center gap-2 rounded-md border px-3 py-2 text-caption transition-colors md:flex',
                  overDark
                    ? 'border-white/25 text-white/70 hover:border-cyan-400/70 hover:text-white'
                    : 'text-subtle hover:border-cyan-500/50',
                )}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
                <kbd
                  className={cn(
                    'num rounded px-1.5 py-0.5 text-[0.65rem]',
                    overDark ? 'bg-white/15 text-white/80' : 'bg-[rgb(var(--c-text))]/[0.07]',
                  )}
                >
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={toggle}
                aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
                className={cn(
                  'hidden h-11 w-11 items-center justify-center rounded-md transition-colors sm:flex',
                  overDark ? 'text-white hover:bg-white/10' : 'hover:bg-[rgb(var(--c-text))]/[0.06]',
                )}
              >
                {resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>

              <Button href={ROUTES.estimator} variant="accent" size="md" className="hidden sm:inline-flex" leftIcon={<Calculator className="h-4 w-4" />}>
                Get Estimate
              </Button>

              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-md transition-colors lg:hidden',
                  overDark ? 'text-white hover:bg-white/10' : 'hover:bg-[rgb(var(--c-text))]/[0.06]',
                )}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass hidden border-b shadow-md lg:block"
            >
              <div className="container py-8">
                <MegaMenuContent item={MAIN_NAV.find((n) => n.label === openMenu)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function MegaMenuContent({ item }: { item?: NavLinkType }) {
  if (!item?.children) return null;
  return (
    <div className="grid grid-cols-12 gap-8">
      <div className="col-span-3">
        <p className="overline">{item.label}</p>
        <p className="mt-3 max-w-[24ch] text-sm text-muted">
          {item.label === 'Services' && 'Four capabilities, delivered as one accountable system.'}
          {item.label === 'Projects' && 'Work completed across Jaipur, documented properly.'}
          {item.label === 'Pricing' && 'An estimator that shows its working, and the papers to go with it.'}
          {item.label === 'Company' && 'Who we are and how to reach us.'}
        </p>
        {/* "View all" goes to `item.href`, which is the one thing a menu-only
            item has no business linking to. */}
        {!item.menuOnly && (
          <Link
            to={item.href}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 link-underline dark:text-cyan-400"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="col-span-9 grid grid-cols-3 gap-2">
        {item.children.map((child) => (
          <Link
            key={child.href + child.label}
            to={child.href}
            className="group rounded-lg border border-transparent p-4 transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04]"
          >
            <span className="flex items-center gap-2">
              <span className="font-display text-[0.95rem] font-semibold">{child.label}</span>
              {child.badge && (
                <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">
                  {child.badge}
                </span>
              )}
              <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            {child.description && <span className="mt-1 block text-caption text-muted">{child.description}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { resolved, toggle } = useTheme();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] lg:hidden"
        >
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className="surface absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Logo compact />
              <button onClick={onClose} aria-label="Close menu" className="rounded-md p-2 hover:bg-[rgb(var(--c-text))]/[0.06]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
              {MAIN_NAV.map((item) => (
                <div key={item.label} className="border-b last:border-0">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                        aria-expanded={expanded === item.label}
                        className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-semibold"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform duration-300', expanded === item.label && 'rotate-180')}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded === item.label && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-1 pb-4 pl-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href + child.label}
                                  to={child.href}
                                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-cyan-500/[0.06] hover:text-cyan-700"
                                >
                                  {child.label}
                                  {child.badge && (
                                    <span className="rounded-full bg-cyan-500 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase text-white">
                                      {child.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link to={item.href} className="block py-4 font-display text-lg font-semibold">
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            <div className="space-y-3 border-t px-5 py-5">
              <Button href={ROUTES.estimator} variant="accent" size="lg" full leftIcon={<Calculator className="h-4 w-4" />}>
                Get Free Estimate
              </Button>
              <div className="flex gap-3">
                <Button href={`tel:${SITE.phoneRaw}`} variant="secondary" size="lg" full leftIcon={<Phone className="h-4 w-4" />}>
                  Call us
                </Button>
                <Button onClick={toggle} variant="secondary" size="lg" aria-label="Toggle theme">
                  {resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

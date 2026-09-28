'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Calculator, ChevronDown, Menu, Moon, Phone, Sun, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';
import { Logo } from './Logo';
import { VisitorChip } from './VisitorChip';
import { MAIN_NAV, ROUTES, type NavLink as NavLinkType } from '@/constants/routes';
import { useNavItems } from '@/hooks/useNavItems';
import type { NavItem } from '@/types/domain';
import { SITE } from '@/constants/site';
import { useScrollInfo, useLockBodyScroll } from '@/hooks';
import { useTheme } from '@/app/providers';
import { useHeroTone } from '@/app/hero-tone';

/**
 * The admin's half of the navbar (module: Navigation) merged onto the code's
 * half — the practical line drawn in Sep 2026:
 *
 * DB rows own *presence, order, label and badge* of the top bar: a row set to
 * draft disappears, reordering reorders, renaming renames. Matching is by
 * href, so a rename cannot detach an item from its dropdown. The mega-menu
 * children, their descriptions and `menuOnly` stay in MAIN_NAV (the NavItem
 * table has no columns for them — extending it is a later phase, recorded in
 * the plan). A DB row whose href matches nothing becomes a plain link.
 * The `highlight` row is the accent CTA button, not a nav item.
 */
function mergeNav(rows: NavItem[]): NavLinkType[] {
  return rows
    .filter((r) => !r.parentId && !r.highlight)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => {
      const base = MAIN_NAV.find((n) => n.href === row.href);
      return base
        ? { ...base, label: row.label, badge: row.badge ?? base.badge }
        : { label: row.label, href: row.href, badge: row.badge };
    });
}

export function Navbar() {
  const navRows = useNavItems();
  const nav = mergeNav(navRows);
  const cta = navRows.find((r) => r.highlight);
  const { atTop, direction, y } = useScrollInfo();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const heroTone = useHeroTone();

  /**
   * Transparent bar sitting over a forced-dark hero: everything must render
   * light-on-dark. Once the glass background appears on scroll, normal
   * theme-aware colours take over again.
   *
   * Only the colours switch here — never the geometry. Hovering a link opens its
   * mega menu, which flips this off; if that also moved anything, every link
   * would jump sideways under the pointer onto its neighbour, which would then
   * open *its* menu.
   */
  const overDark = (heroTone === 'dark' || heroTone === 'cinematic') && atTop && !openMenu;

  /**
   * One header everywhere (Design B, made site-wide in Sep 2026): phones get
   * menu · logo · estimate, desktop gets uppercase tracked links and an outline
   * CTA, with no search, theme or greeting in the bar.
   *
   * The only thing that varies is height. The homepage's photo hero, at the top,
   * uses the render's taller bar (72px phones / 101px desktop); everywhere else,
   * and on that page once scrolled, it is `--nav-h` — which page heroes pad
   * against and sticky panels offset from.
   */
  const tall = heroTone === 'cinematic' && atTop;

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

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
            /* Bottom edge only: `.glass` draws a 1px border on all four sides,
               which nudged the whole row 1px right and down the moment the bar
               turned to glass. */
            atTop && !openMenu ? 'bg-transparent' : 'glass border-x-0 border-b border-t-0 shadow-sm',
          )}
        >
          <div
            className={cn(
              /* Below `lg`: menu · logo · estimate, where two equal `1fr` side
                 columns hold the logo on the exact centre line. No gap — at 375px
                 each side column needs all ~123px it gets.

                 From `lg`: full-bleed with the render's 72px gutters, so the logo
                 lines up with the homepage hero's edge-anchored caption on wide
                 screens too. */
              'container grid grid-cols-[1fr_auto_1fr] items-center transition-[height,padding] duration-500 ease-out-expo lg:flex lg:max-w-none lg:justify-between lg:gap-6 lg:px-10 xl:px-[72px]',
              tall ? 'h-[72px] lg:h-[101px]' : 'h-[var(--nav-h)]',
            )}
          >
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                'flex h-11 w-11 items-center justify-center justify-self-start rounded-full border transition-colors lg:hidden',
                overDark
                  ? 'border-white/40 text-white hover:bg-white/10'
                  : 'border-[rgb(var(--c-text))]/25 hover:bg-[rgb(var(--c-text))]/[0.06]',
              )}
            >
              <Menu className="h-[21px] w-[21px]" strokeWidth={1.75} />
            </button>

            <Logo tone={overDark ? 'light' : 'auto'} className="justify-self-center" lockupClassName="h-[30px] lg:h-[35px]" />

            {/* Desktop nav */}
            <nav className="hidden items-center lg:flex" aria-label="Main">
              {nav.map((item) => {
                /* Bare uppercase words, no chevrons; hover and click still open
                   the mega menu. */
                const triggerClass = (lit: boolean) =>
                  cn(
                    'flex items-center px-3.5 py-2 font-montserrat text-[12.5px] font-medium uppercase tracking-[0.24em] transition-colors xl:px-[21px]',
                    lit
                      ? overDark
                        ? 'text-cyan-400'
                        : 'text-cyan-700 dark:text-cyan-400'
                      : overDark
                        ? 'text-white/90 hover:text-cyan-300'
                        : 'text-[rgb(var(--c-text))] hover:text-cyan-700 dark:hover:text-cyan-400',
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
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        /* Was react-router's <NavLink>, whose `isActive` render-prop has no
                           Next equivalent. `usePathname()` reproduces it exactly: NavLink's
                           default matching is "equal, or a path prefix ending at a segment
                           boundary" — /services is active on /services/mepf-consultancy. */
                        className={triggerClass(
                          (pathname === item.href || pathname.startsWith(`${item.href}/`)) ||
                            openMenu === item.label,
                        )}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center justify-self-end">
              {/* Desktop: a hairline outline, not the cyan fill — the homepage
                  hero's own "Get Free Estimate" is the filled button there, and
                  two cyan blocks in one viewport compete. */}
              <Link
                href={cta?.href ?? ROUTES.estimator}
                className={cn(
                  'hidden h-[41px] items-center border px-[21.5px] font-montserrat text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 lg:inline-flex',
                  overDark
                    ? 'border-white/55 text-white hover:border-cyan-400 hover:text-cyan-300'
                    : 'border-[rgb(var(--c-text))]/30 text-[rgb(var(--c-text))] hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400',
                )}
              >
                {cta?.label ?? 'Get Estimate'}
              </Link>

              {/*
                Below `lg`, the right-hand third of menu · logo · estimate —
                compact enough (~105px) that the centred logo reads as centred.
                The label is a short fixed word rather than the admin's nav label:
                a long label there would break this row. Below 360px the row has
                no room for it, so the word goes sr-only — kept in the DOM because
                Button's href branch does not forward aria-label, and an icon-only
                link would otherwise have no accessible name.
              */}
              <Button
                href={cta?.href ?? ROUTES.estimator}
                variant="accent"
                size="sm"
                className="lg:hidden"
                leftIcon={<Calculator className="h-4 w-4" aria-hidden />}
              >
                <span className="sr-only min-[360px]:not-sr-only">Estimate</span>
              </Button>
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
                <MegaMenuContent item={nav.find((n) => n.label === openMenu)} />
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
          {/* Deliberately no count. This read "Four capabilities" while the menu
              beside it listed five, because Real Estate is a standalone page and
              not one of the four `services` entries. A blurb that counts its own
              siblings goes stale every time one is added. */}
          {item.label === 'Services' && 'Our capabilities, delivered as one accountable system.'}
          {item.label === 'Projects' && 'Work completed across Jaipur, documented properly.'}
          {item.label === 'Pricing' && 'An estimator that shows its working, and the papers to go with it.'}
          {item.label === 'Company' && 'Who we are and how to reach us.'}
        </p>
        {/* "View all" goes to `item.href`, which is the one thing a menu-only
            item has no business linking to. */}
        {!item.menuOnly && (
          <Link
            href={item.href}
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
            href={child.href}
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

/* Slides in from the left — the side the menu button sits on. */
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navRows = useNavItems();
  const nav = mergeNav(navRows);
  const cta = navRows.find((r) => r.highlight);
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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className="surface absolute left-0 top-0 flex h-full w-full max-w-sm flex-col border-r"
          >
            {/* The close button takes the corner the menu button was in, so the
                same thumb that opened the drawer closes it. */}
            <div className="flex flex-row-reverse items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Logo compact />
                {/* The mobile home for the greeting. Renders nothing without a name,
                    so the drawer header is unchanged for everyone else. */}
                <VisitorChip variant="drawer" className="-ml-0.5" />
              </div>
              <button onClick={onClose} aria-label="Close menu" className="rounded-md p-2 hover:bg-[rgb(var(--c-text))]/[0.06]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-4" aria-label="Mobile">
              {nav.map((item) => (
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
                                  href={child.href}
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
                    <Link href={item.href} className="block py-4 font-display text-lg font-semibold">
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            <div className="space-y-3 border-t px-5 py-5">
              {/* Label deliberately not wired to the CTA row: the drawer says
                  "Get Free Estimate" where the desktop bar says "Get Estimate",
                  and freezing today's copy beats silently unifying it. The
                  destination is the row's. */}
              <Button href={cta?.href ?? ROUTES.estimator} variant="accent" size="lg" full leftIcon={<Calculator className="h-4 w-4" />}>
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { mergeNav, MegaMenuContent, MobileDrawer } from '@/components/common/Navbar';
import { useNavItems } from '@/hooks/useNavItems';
import { useLockBodyScroll } from '@/hooks';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { cn } from '@/lib/cn';
import { HeaderLogo } from './icons';
import { LOGO_LINE } from './content';

/* The design's nav item: uppercase navy words, a cyan rule growing under the one hovered. */
const itemClass = 'group relative text-[1.2vw] uppercase text-navy-800';
function Underline({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-cyan-500 transition-transform duration-300 group-hover:scale-x-100',
        on && 'scale-x-100',
      )}
    />
  );
}

/**
 * The home page's header, from the client's Figma Make design (Nov 2026):
 * the mark and "DESIGN.BUILD.DELIVER", five words, the calculator, a rule,
 * and a soft shadow once the page has moved. Every other page keeps `Navbar`;
 * SiteChrome picks by pathname, so the static HTML is already right.
 *
 * In the design the words only scroll the page. Here (user, 22 Nov 2026)
 * they keep the site's real links and mega menus — `Pricing` still only opens
 * its menu — and phones, where the design has no menu at all, get the site's
 * drawer behind a small button beside the calculator.
 */
export function HomeHeader() {
  const navRows = useNavItems();
  const nav = mergeNav(navRows);
  const cta = navRows.find((r) => r.highlight);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', f, { passive: true });
    f();
    return () => window.removeEventListener('scroll', f);
  }, []);

  return (
    <>
      <header
        data-site-header=""
        className={cn(
          'ht sticky top-0 z-40 mx-auto w-full max-w-[1920px] bg-white transition-shadow duration-300',
          scrolled && 'shadow-[0_4px_20px_rgba(3,9,78,.12)]',
        )}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="mx-[3%] flex h-[6.5vw] items-center justify-between border-b border-black/90 max-lg:h-16">
          <Link href={ROUTES.home} className="group flex items-center gap-[1vw]" aria-label={`${SITE.name} — home`}>
            <HeaderLogo className="h-[4.5vw] transition-transform duration-300 group-hover:scale-105 max-lg:h-10" />
            <span className="text-[1.05vw] tracking-[0.2em] text-navy-800 max-lg:text-[10px]" aria-hidden>
              {LOGO_LINE}
            </span>
          </Link>

          <nav className="ml-[8vw] hidden gap-[4vw] lg:flex" aria-label="Main">
            {nav.map((item) => (
              <div key={item.label} onMouseEnter={() => setOpenMenu(item.children ? item.label : null)}>
                {item.menuOnly ? (
                  /* A heading, not a link — see the same branch in Navbar. */
                  <button type="button" aria-expanded={openMenu === item.label} onClick={() => setOpenMenu(item.label)} className={itemClass}>
                    {item.label}
                    <Underline on={openMenu === item.label} />
                  </button>
                ) : (
                  <Link href={item.href} className={itemClass}>
                    {item.label}
                    <Underline on={openMenu === item.label} />
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link href={cta?.href ?? ROUTES.estimator} aria-label={cta?.label ?? 'Get Estimate'} title={cta?.label ?? 'Get Estimate'}>
              <img
                src="/images/home/calc.png"
                width={43}
                height={53}
                alt=""
                className="h-[3.4vw] w-auto transition-transform duration-300 hover:-rotate-6 hover:scale-110 max-lg:h-8"
              />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="-mr-2 flex size-10 items-center justify-center text-navy-800 lg:hidden"
            >
              <Menu className="size-[22px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass absolute inset-x-0 top-full hidden border-b shadow-md lg:block"
            >
              <div className="container py-8">
                <MegaMenuContent item={nav.find((n) => n.label === openMenu)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

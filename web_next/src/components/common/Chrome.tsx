'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calculator,
  MessageCircle,
  Phone,
  Search,
  X,
  Building2,
  FileText,
  Layers,
  Users,
  Download,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { SITE } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { services } from '@/data/services';
import { posts } from '@/data/content';
import { useHotkey, useLockBodyScroll } from '@/hooks';
import { track, type AnalyticsEvent } from '@/lib/analytics';

/* ==================================================================== */
/* Floating action rail                                                  */
/* ==================================================================== */

/**
 * Desktop only.
 *
 * Its Call and WhatsApp actions are the same two the mobile `StickyContactBar`
 * pins to the bottom of the viewport, so below `md` both rendered at once —
 * two components offering the same two things, one of them behind an extra tap.
 * The rail keeps the pointer-driven viewport, where a collapsed FAB is the
 * right trade; the bar keeps the thumb-driven one, where it isn't.
 */
export function FloatingRail() {
  const [expanded, setExpanded] = useState(false);

  const actions: {
    label: string;
    href: string;
    icon: typeof MessageCircle;
    className: string;
    external: boolean;
    event?: AnalyticsEvent;
  }[] = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent('Hi, I would like to discuss a construction project.')}`,
      icon: MessageCircle,
      className: 'bg-[#25D366] text-white',
      external: true,
      event: 'whatsapp_click',
    },
    {
      label: 'Call',
      href: `tel:${SITE.phoneRaw}`,
      icon: Phone,
      className: 'bg-navy-800 text-white',
      external: true,
      event: 'call_click',
    },
    /* No event: an internal navigation to the estimator is already measured by
       `estimator_start` when the page it lands on begins. */
    { label: 'Estimate', href: ROUTES.estimator, icon: Calculator, className: 'bg-cyan-500 text-white', external: false },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 hidden flex-col items-end gap-3 md:flex sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {expanded &&
          actions.map((action, i) => (
            <motion.a
              key={action.label}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              onClick={() => action.event && track(action.event, { placement: 'floating-rail' })}
              initial={{ opacity: 0, y: 12, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.85 }}
              transition={{ duration: 0.28, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'group flex h-12 items-center gap-2 rounded-full px-4 shadow-lg transition-transform hover:scale-105',
                action.className,
              )}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.a>
          ))}
      </AnimatePresence>

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Close quick actions' : 'Open quick actions'}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-400 ease-out-expo',
          expanded ? 'rotate-90 bg-navy-800 text-white' : 'bg-cyan-500 text-white hover:scale-105',
        )}
      >
        {/* Inset so the 2.2x pulse stays inside the button's own box. At `inset-0`
            it reached ~33px past the rail, and the rail is pinned to the right
            edge of the viewport — enough to widen the document on a 360px phone. */}
        {!expanded && <span className="absolute inset-[22%] animate-pulse-ring rounded-full bg-cyan-500/40" aria-hidden />}
        {expanded ? <X className="h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
      </button>
    </div>
  );
}

/* ==================================================================== */
/* Command palette (⌘K)                                                  */
/* ==================================================================== */

interface Command {
  id: string;
  label: string;
  group: string;
  href: string;
  icon: typeof Search;
  keywords?: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const router = useRouter();

  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = [
      { id: 'p-home', label: 'Home', group: 'Pages', href: ROUTES.home, icon: LayoutDashboard },
      { id: 'p-estimator', label: 'Cost Estimator', group: 'Pages', href: ROUTES.estimator, icon: Calculator, keywords: 'calculator price budget cost' },
      // Pricing & Packages is commented out for now — published rates are hidden;
      // see the Pricing entry in MAIN_NAV (constants/routes.ts).
      // { id: 'p-pricing', label: 'Pricing & Packages', group: 'Pages', href: ROUTES.pricing, icon: FileText, keywords: 'rates sqft turnkey' },
      { id: 'p-projects', label: 'All Projects', group: 'Pages', href: ROUTES.projects, icon: Building2 },
      { id: 'p-about', label: 'About Us', group: 'Pages', href: ROUTES.about, icon: Users },
      { id: 'p-vastu', label: 'Vastu Planning', group: 'Pages', href: ROUTES.vastu, icon: Layers },
      { id: 'p-gallery', label: 'Gallery', group: 'Pages', href: ROUTES.gallery, icon: Layers },
      { id: 'p-careers', label: 'Careers', group: 'Pages', href: ROUTES.careers, icon: Users },
      { id: 'p-downloads', label: 'Downloads', group: 'Pages', href: ROUTES.downloads, icon: Download },
      { id: 'p-contact', label: 'Contact', group: 'Pages', href: ROUTES.contact, icon: MessageCircle },
      // Client Portal is commented out for now — see features/portal/PortalLayout.tsx.
      // { id: 'p-portal', label: 'Client Portal', group: 'Pages', href: ROUTES.portal, icon: LayoutDashboard },
      { id: 'p-admin', label: 'Admin Panel', group: 'Pages', href: ROUTES.admin, icon: LayoutDashboard },
    ];
    /*
      The `Inside a Building — MEPF` page entry used to sit above, pointing at
      `/mepf`. That page is gone and its house now sits on the MEPF service page,
      which this list already generates — so the entry would have been a second
      row to the same URL. Its search terms are folded into the keywords below
      instead, which is why they are not just `s.tagline`.
    */
    const svc: Command[] = services.map((s) => ({
      id: `s-${s.id}`,
      label: s.title,
      group: 'Services',
      href: ROUTES.service(s.slug),
      icon: Layers,
      keywords: s.slug === 'mepf-consultancy' ? `${s.tagline} inside a building hvac plumbing electrical fire` : s.tagline,
    }));
    const prj: Command[] = projects.map((p) => ({
      id: `pr-${p.id}`,
      label: p.title,
      group: 'Projects',
      href: ROUTES.project(p.slug),
      icon: Building2,
      keywords: `${p.locality} ${p.category}`,
    }));
    const blog: Command[] = posts.map((p) => ({
      id: `b-${p.id}`,
      label: p.title,
      group: 'Insights',
      href: ROUTES.post(p.slug),
      icon: FileText,
      keywords: p.category,
    }));
    return [...pages, ...svc, ...prj, ...blog];
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 8);
    const q = query.toLowerCase();
    return commands
      .filter((c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, commands]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        const target = results[active];
        if (target) {
          router.push(target.href);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, active, router, onClose]);

  const grouped = results.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="surface relative w-full max-w-xl overflow-hidden rounded-xl border shadow-xl"
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="h-[18px] w-[18px] text-[rgb(var(--c-text-subtle))]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, services, projects…"
                /* 16px on phones for the same reason as `ui/Field.tsx`: below it,
                   iOS zooms the viewport the moment the field takes focus. */
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-[rgb(var(--c-text-subtle))] lg:text-[0.95rem]"
              />
              <kbd className="num rounded bg-[rgb(var(--c-text))]/[0.07] px-1.5 py-0.5 text-[0.65rem] text-subtle">ESC</kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No results for “{query}”</p>}
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 py-2 text-overline uppercase text-subtle">{group}</p>
                  {items.map((c) => {
                    const index = results.indexOf(c);
                    return (
                      <button
                        key={c.id}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => {
                          router.push(c.href);
                          onClose();
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                          index === active ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'hover:bg-[rgb(var(--c-text))]/[0.04]',
                        )}
                      >
                        <c.icon className="h-4 w-4 shrink-0 opacity-60" />
                        <span className="flex-1 truncate">{c.label}</span>
                        {index === active && <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useHotkey('k', true, () => setOpen((v) => !v));
  return { open, setOpen };
}

'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, ChevronDown, Download, FileDown, Image as ImageIcon, IndianRupee, Info, MessageCircle, MoveLeft, Ruler, ShieldCheck } from 'lucide-react';
import { Button, Dialog, FormField, Input, Select, Spinner, useToast } from '@/components/ui';
import { ConsentCheckbox, CONSENT_REQUIRED, PageHero } from '@/components/common';
import { leadMeta } from '@/lib/consent';
import { track } from '@/lib/analytics';
import { markLeadCaptured } from '@/features/lead/useLeadOffer';
import { getVisitor, rememberVisitor } from '@/lib/visitor';
import { readStore, writeStore, STORAGE_KEYS } from '@/lib/storage';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/lib/format';
import { SITE } from '@/constants/site';
import { AREA_UNITS, FLOOR_OPTIONS, PROPERTY_TYPES, ASSUMPTIONS } from '@/constants/estimator';
import { estimatesService } from '@/services';
import { useStates, useCities, DEFAULT_STATE_CODE, DEFAULT_CITY, CITY_OTHER } from './geo';
import { scrollToTarget } from '@/hooks/useLenis';
import { DEFAULT_QUOTE_INPUT, useQuote, type Quote, type QuoteInput, type QuoteOption } from './quote';
import { MaterialArt } from './components/MaterialArt';

/**
 * The estimator, rebuilt around quantities — September 2026.
 *
 * The previous version was a four-step wizard (package → 23 materials × 73
 * brand options → furniture → result) that produced one rupee range. Visitors
 * could not see where the number came from, and the firm carried the risk of
 * a big gap between an opaque estimate and the real bill. This version asks
 * only what arithmetic needs — plot size and floors — and answers with the
 * actual shopping list: so many bricks, so many bags of cement, priced line
 * by line, with labour and overheads stated in the open (the old visible
 * wastage buffer now rides inside the admin-owned rates — see
 * estimator-prices). Civil structure only, on purpose: quantities for finishing and
 * furniture return once this engine has proven itself against real builds
 * (the old wizard survives in git history).
 *
 * The estimate itself stays free — the gate is on the PDF alone, exactly as
 * before: that gate is where the lead comes from, and the toast only promises
 * a call once the record actually exists (see handleLead).
 */

const DELIVERABLES = [
  {
    icon: Ruler,
    title: 'Real material quantities',
    detail: 'Bricks, cement bags, steel, sand — computed from your plot size with the thumb rules every site engineer uses.',
  },
  {
    icon: IndianRupee,
    title: 'Priced line by line',
    detail: 'Every quantity at today’s Jaipur rates, plus labour and site overheads. Nothing hidden in a lump sum.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing hidden',
    detail: 'Labour and site overheads shown as separate lines — check the arithmetic yourself.',
  },
  {
    icon: FileDown,
    title: 'A branded PDF',
    detail: 'The full working, yours to keep and compare against any contractor’s quote.',
  },
];

/* Interior-only fit-outs have no civil structure to quantify. */
const BUILD_TYPES = PROPERTY_TYPES.filter((t) => t.key !== 'interior-only');

export function EstimatorView() {
  const [draft, setDraft] = useState<QuoteInput>(() => ({
    ...DEFAULT_QUOTE_INPUT,
    ...readStore<Partial<QuoteInput>>(STORAGE_KEYS.estimator, {}, 'session'),
  }));
  /* Typing debounces into `committed`; the query key follows committed only. */
  const [committed, setCommitted] = useState(draft);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setCommitted(draft);
      writeStore(STORAGE_KEYS.estimator, draft, 'session');
    }, 350);
    return () => window.clearTimeout(t);
  }, [draft]);

  const { data: quote, isFetching, isError } = useQuote(committed);
  const [leadOpen, setLeadOpen] = useState(false);
  const { push } = useToast();

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => setDraft((d) => ({ ...d, [key]: value }));

  /* Brand taps skip the typing debounce — a tap is a decision, and the 250ms
     amount-tick below is the feedback loop that makes playing with brands
     feel alive (the research file calls this the engagement loop). */
  /* Same instant-commit as a brand tap: switching scope is a decision,
     not typing. */
  const choosePackage = (pkg: QuoteInput['package']) => {
    setDraft((d) => {
      const next = { ...d, package: pkg };
      setCommitted(next);
      writeStore(STORAGE_KEYS.estimator, next, 'session');
      return next;
    });
  };

  const choose = (lineKey: string, optionKey: string) => {
    setDraft((d) => {
      const next = { ...d, selections: { ...d.selections, [lineKey]: optionKey } };
      setCommitted(next);
      writeStore(STORAGE_KEYS.estimator, next, 'session');
      return next;
    });
  };

  const handleLead = async (lead: { name: string; phone: string; email?: string; state: string; city: string }) => {
    if (!quote) return;
    const { generateCivilPdf } = await import('./pdf');
    generateCivilPdf(quote, committed, lead);
    setLeadOpen(false);
    track('lead_submit', { source: 'estimator-pdf', fields: 5 });
    markLeadCaptured();
    rememberVisitor(lead.name);

    /* The PDF is already downloading — the lead write never blocks it, but its
       outcome is honest: the "we will call" promise appears only once the
       record exists (this POST also fires the owner's email alert). */
    void estimatesService
      .create({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        propertyType: committed.propertyType,
        areaPerFloor: committed.areaPerFloor,
        areaUnit: committed.areaUnit,
        floors: committed.floors,
        packageType: committed.package,
        qualityTier: 'standard',
        /* Structured geography for the nationwide plan; `location` keeps the
           same meaning it always had (a lowercase city), so old rows and new
           stay comparable in one column. */
        state: lead.state,
        city: lead.city,
        location: lead.city.toLowerCase(),
        enhancements: [],
        /* The whole shopping list — chosen brand included — so sales can
           rebuild the quote line by line. The options[] catalogue is UI
           plumbing, not part of the lead. */
        materials: quote.lines.map(({ options: _options, ...line }) => line),
        materialsCost: quote.materialsTotal,
        builtUpArea: quote.builtUpArea,
        totalMin: quote.totalMin,
        totalMax: quote.totalMax,
        timelineWeeks: quote.timelineWeeks,
        stage: 'new',
        ...leadMeta(),
      })
      .then(() =>
        push({
          kind: 'success',
          title: 'Your estimate is downloading',
          description: 'We will call you within one working day.',
        }),
      )
      .catch(() => {
        track('lead_submit_failed', { source: 'estimator-pdf' });
        push({
          kind: 'error',
          title: 'Your estimate is downloading',
          description: 'We could not save your details, so nobody will call. Send it on WhatsApp and we will pick it up.',
        });
      });
  };

  return (
    <>
      <PageHero
        overline="Cost estimator"
        title="See the materials before the money."
        lead={
          <>
            Give us your plot size and floors — get the actual quantities your structure needs, priced line by line
            at today&rsquo;s Jaipur rates, with a branded PDF yours to keep.
          </>
        }
        breadcrumbs={[{ label: 'Cost Estimator' }]}
        actions={
          <Button variant="accent" size="lg" onClick={() => scrollToTarget('#estimate', -100)} rightIcon={<Calculator className="h-4 w-4" />}>
            Start my estimate
          </Button>
        }
      />

      <section className="section-sm">
        <div className="container">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DELIVERABLES.map((d) => (
              <div key={d.title} className="rounded-xl border p-5">
                <d.icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden />
                <h3 className="mt-3 font-medium">{d.title}</h3>
                <p className="mt-1.5 text-caption leading-relaxed text-muted">{d.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="estimate" className="section-sm">
        <div className="container">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            {/* ── Inputs ─────────────────────────────────────────────── */}
            <div className="rounded-2xl border p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-heading-md font-semibold">Your building</h2>

              <div className="mt-6 space-y-5">
                <FormField label="What should we price?" htmlFor="est-package">
                  <div id="est-package" className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Package">
                    {([
                      { key: 'civil', title: 'Civil Work', sub: 'Structure only' },
                      { key: 'semi-furnished', title: 'Semi Furnished', sub: 'Structure + finishing' },
                    ] as const).map((pkg) => {
                      const selected = draft.package === pkg.key;
                      return (
                        <button
                          key={pkg.key}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => choosePackage(pkg.key)}
                          className={
                            selected
                              ? 'rounded-lg border-2 border-cyan-600 bg-cyan-500/[0.06] px-3 py-2.5 text-left transition-colors'
                              : 'rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-cyan-500'
                          }
                        >
                          <span className={selected ? 'block text-sm font-semibold' : 'block text-sm font-medium'}>{pkg.title}</span>
                          <span className="block text-caption text-subtle">{pkg.sub}</span>
                        </button>
                      );
                    })}
                    {/* Teaser, not an option: full-width dashed row below the live
                        pair rather than a third equal column — a disabled control
                        shown as a peer invites taps it can't answer, and three
                        columns wrap badly at 390px. No onClick, so the fully-
                        furnished key never enters state/types/backend. */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={false}
                      disabled
                      aria-disabled
                      className="col-span-2 flex cursor-not-allowed items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2.5 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-subtle">Fully Furnished</span>
                        <span className="block text-caption text-subtle">Move-in ready interiors</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Coming soon
                      </span>
                    </button>
                  </div>
                </FormField>

                <FormField label="Building type" htmlFor="est-type">
                  <Select id="est-type" value={draft.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                    {BUILD_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Plot area (per floor)" htmlFor="est-area">
                  <div className="flex gap-2">
                    <Input
                      id="est-area"
                      type="number"
                      min={50}
                      value={draft.areaPerFloor || ''}
                      onChange={(e) => set('areaPerFloor', Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select
                      aria-label="Area unit"
                      value={draft.areaUnit}
                      onChange={(e) => set('areaUnit', e.target.value as QuoteInput['areaUnit'])}
                      className="w-36"
                    >
                      {AREA_UNITS.map((u) => (
                        <option key={u.key} value={u.key}>
                          {u.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </FormField>

                <FormField label="Floors" htmlFor="est-floors">
                  <Select id="est-floors" value={draft.floors} onChange={(e) => set('floors', Number(e.target.value))}>
                    {FLOOR_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/[0.07] p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden />
                <p className="text-caption leading-relaxed text-muted">
                  {draft.package === 'civil' ? (
                    <>
                      <span className="font-medium text-[rgb(var(--c-text))]">Civil structure only.</span> Foundation
                      to roof — masonry, RCC and waterproofing. Flooring, interiors and furniture are quoted
                      separately once the structure is scoped.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-[rgb(var(--c-text))]">Structure + finishing.</span> Everything
                      in Civil Work plus flooring, paint, doors, windows, electricals and plumbing. Modular kitchen,
                      wardrobes and furniture are quoted separately.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* ── Result ─────────────────────────────────────────────── */}
            {/* Gated on the *committed* area, not on having data: with the
                query disabled its placeholder keeps the previous answer, so
                clearing the field would otherwise leave a stale estimate for
                an area the visitor just deleted. */}
            {/* min-w-0: without it the chip rows set this column's minimum
                width and push the amounts off a phone screen — overflow-x-auto
                can only scroll inside a constrained box. pb keeps the last
                content clear of the sticky mini-bar. */}
            <div aria-live="polite" className="min-w-0 pb-16 lg:pb-0">
              {committed.areaPerFloor < 50 && (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border p-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                    <MoveLeft className="h-5 w-5 text-cyan-600 dark:text-cyan-400 lg:block" aria-hidden />
                  </span>
                  <p className="font-medium">Enter your plot area to begin</p>
                  <p className="max-w-sm text-sm leading-relaxed text-muted">
                    Fill in the area and floors on the left — the material quantities and cost appear here instantly.
                    Nothing to submit, nothing to sign up for.
                  </p>
                </div>
              )}

              {committed.areaPerFloor >= 50 && isError && (
                <div className="rounded-2xl border p-8 text-center">
                  <p className="font-medium">We could not calculate right now.</p>
                  <p className="mt-1.5 text-sm text-muted">
                    Please try again in a minute, or WhatsApp us your plot size on {SITE.phone}.
                  </p>
                </div>
              )}

              {committed.areaPerFloor >= 50 && !isError && !quote && (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border">
                  <Spinner className="h-6 w-6" />
                </div>
              )}

              {committed.areaPerFloor >= 50 && quote && (
                <QuoteResult
                  quote={quote}
                  input={committed}
                  busy={isFetching}
                  onChoose={choose}
                  onDownload={() => {
                    setLeadOpen(true);
                    track('lead_gate_open', { source: 'estimator-pdf' });
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <LeadDialog open={leadOpen} onClose={() => setLeadOpen(false)} onSubmit={handleLead} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Result — the shopping list                                          */
/* ------------------------------------------------------------------ */
/* Result — the shopping list, now with brand choice                    */
/* ------------------------------------------------------------------ */

/** A trademark image that can never break the card: a failed load swaps to
    the brand name in text. */
function BrandLogo({ src, label, cover }: { src: string; label: string; cover?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className="text-caption font-medium text-neutral-700">{label}</span>;
  return (
    <img
      src={src}
      alt={label}
      loading="lazy"
      className={cover ? 'h-full w-full object-cover' : 'max-h-7 w-auto max-w-full object-contain'}
      onError={() => setBroken(true)}
    />
  );
}

/** The amount re-mounts on every value change, so each brand tap lands with a
    250ms settle — research's 150–300ms feedback window: fast enough to feel
    instant, slow enough to be *seen* changing. */
function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-block' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block' }}
        >
          {formatCurrency(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function QuoteResult({
  quote,
  input,
  busy,
  onChoose,
  onDownload,
}: {
  quote: Quote;
  input: QuoteInput;
  busy: boolean;
  onChoose: (lineKey: string, optionKey: string) => void;
  onDownload: () => void;
}) {
  const unitLabel = AREA_UNITS.find((u) => u.key === input.areaUnit)?.label ?? input.areaUnit;

  /* Group chrome appears only when there are two groups to tell apart —
     the civil-only view stays exactly as it always was. */
  const grouped = quote.lines.some((l) => l.group === 'finishing');
  const groupTotal = (g: 'structure' | 'finishing') => quote.lines.filter((l) => l.group === g).reduce((sum, l) => sum + l.amount, 0);
  const groupCount = (g: 'structure' | 'finishing') => quote.lines.filter((l) => l.group === g).length;

  /* Collapsible groups (the accordion the mobile research favours over
     tabs): when Semi arrives, Structure starts folded — the visitor has
     already seen the civil half, the news is the finishing half — and one
     tap opens it. The civil-only view carries none of this chrome. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCollapsed(input.package === 'semi-furnished' ? { structure: true } : {});
  }, [input.package]);
  const toggleGroup = (g: string) => setCollapsed((c) => ({ ...c, [g]: !c[g] }));

  const GroupHeader = ({ group, label }: { group: 'structure' | 'finishing'; label: string }) => (
    <button
      type="button"
      onClick={() => toggleGroup(group)}
      aria-expanded={!collapsed[group]}
      className="flex w-full items-center justify-between gap-3 bg-[rgb(var(--c-text))]/[0.03] px-5 py-3 text-left transition-colors hover:bg-[rgb(var(--c-text))]/[0.05]"
    >
      <span className="flex items-center gap-2">
        <ChevronDown className={collapsed[group] ? 'h-4 w-4 -rotate-90 text-subtle transition-transform' : 'h-4 w-4 text-subtle transition-transform'} aria-hidden />
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-subtle">{label}</span>
        <span className="text-caption text-subtle">· {groupCount(group)} items</span>
      </span>
      <AnimatedAmount value={groupTotal(group)} className="num text-sm font-medium" />
    </button>
  );

  /* ── Bigger-image preview, mobile-first ─────────────────────────────
     Most estimator traffic is phones, where hover does not exist — so the
     primary affordance is a per-row "See photos" sheet (large swatches,
     tap selects and closes: seeing and choosing in one place). Desktop
     additionally gets a 200ms hover preview — under 150ms triggers on
     drive-by cursors, over 250ms feels broken (tooltip-timing research);
     it renders as a fixed-position node because the materials container
     clips overflow. */
  const [photosForKey, setPhotosForKey] = useState<string | null>(null);
  const photosLine = photosForKey ? quote.lines.find((l) => l.key === photosForKey) : undefined;

  const [canHover] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches);
  const [preview, setPreview] = useState<{ opt: QuoteOption; x: number; y: number; below: boolean } | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const showPreview = (opt: QuoteOption, el: HTMLElement) => {
    if (!canHover || (!opt.photo && !opt.logo)) return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const below = r.top < 280;
      shownScrollY.current = window.scrollY;
      setPreview({ opt, x: r.left + r.width / 2, y: below ? r.bottom + 10 : r.top - 10, below });
    }, 200);
  };
  const shownScrollY = useRef(0);
  const hidePreview = () => {
    window.clearTimeout(hoverTimer.current);
    setPreview(null);
  };
  useEffect(() => {
    if (!preview) return;
    /* Not a blind hide: Lenis (the site's smooth-scroll) keeps emitting
       momentum ticks for a beat after the wheel stops, and killing the
       preview on the first of those made it flicker out the moment it
       appeared. A real scroll moves tens of pixels; momentum residue moves
       a few — 24px separates the two. */
    const onScroll = () => {
      if (Math.abs(window.scrollY - shownScrollY.current) > 24) setPreview(null);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [preview]);
  /* The sticky mini-bar shows once the headline card has scrolled away, so
     the number a brand tap changes is never off-screen (the configurator
     bottom-bar pattern). Small screens only — on desktop the card is rarely
     far, and a second bar would just be chrome. */
  const headlineRef = useRef<HTMLDivElement>(null);
  const [headlineGone, setHeadlineGone] = useState(false);
  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeadlineGone(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={busy ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* The headline: a range, not fake precision. */}
      <div ref={headlineRef} className="rounded-2xl border p-6 sm:p-8">
        <p className="text-overline uppercase text-subtle">
          {input.package === 'semi-furnished' ? 'Estimated semi furnished cost' : 'Estimated civil cost'}
        </p>
        <p className="mt-2 font-display text-display-sm font-semibold">
          {formatCurrencyCompact(quote.totalMin)} <span className="text-muted">–</span> {formatCurrencyCompact(quote.totalMax)}
        </p>
        {/* The visitor's own numbers doing the arithmetic in front of them —
            the show-your-work line the clarity research asks for. */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-muted">
          <span>
            <span className="num font-medium text-[rgb(var(--c-text))]">{formatNumber(input.areaPerFloor)} {unitLabel}</span>
            {' × '}
            <span className="num font-medium text-[rgb(var(--c-text))]">{input.floors}</span>
            {input.floors === 1 ? ' floor' : ' floors'}
            {' = '}
            <span className="num font-medium text-[rgb(var(--c-text))]">{formatNumber(quote.builtUpArea)} sq ft</span> built-up
          </span>
          <span>
            about <span className="num font-medium text-[rgb(var(--c-text))]">{formatCurrency(Math.round(quote.total / Math.max(quote.builtUpArea, 1)))}</span> / sq ft
          </span>
        </div>
      </div>

      {/* The working — quantities first, brands under your thumb. */}
      <div className="mt-6 overflow-hidden rounded-2xl border">
        <div className="border-b bg-[rgb(var(--c-text))]/[0.03] px-5 py-3.5">
          <h3 className="font-medium">Materials your structure needs</h3>
          <p className="mt-0.5 text-caption text-subtle">
            {/* wastagePct has been 0 since the buffer moved into the rates
                (Sep 2026) — the branch keeps this honest if it ever returns. */}
            {quote.wastagePct > 0
              ? `Quantities include a ${quote.wastagePct}% wastage buffer.`
              : 'Priced at today\u2019s Jaipur rates.'}
          </p>
        </div>

        <div className="divide-y">
          {quote.lines.map((line, idx) => (
            <Fragment key={line.key}>
              {grouped && idx === 0 && <GroupHeader group="structure" label="Structure" />}
              {grouped && line.group === 'finishing' && quote.lines[idx - 1]?.group !== 'finishing' && (
                <GroupHeader group="finishing" label="Finishing" />
              )}
              {!(grouped && collapsed[line.group]) && (
            <div className="px-5 py-5">
              {/* Identity row — the scan entry-point (F-pattern), with the
                  thumb-rule chip kept tertiary on the right. */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Neutral plate, not cyan: the artwork carries its own
                      material colours (terracotta bricks, kraft sack). */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--c-text))]/[0.04] sm:h-11 sm:w-11">
                    <MaterialArt name={line.key} className="h-7 w-7 sm:h-8 sm:w-8" />
                  </span>
                  <h4 className="truncate text-heading-sm font-semibold">{line.label}</h4>
                </div>
                {/* The per-sqft thumb-rule chip lived here until Sep 2026.
                    It existed to justify the "+20%" buffer beside it; once the
                    client baked the allowance into the rates the chip was down
                    to a bare coefficient, and they asked for it to go — the
                    YOU NEED quantity already carries the answer. Coefficients
                    still ride in the payload for the PDF/lead record. */}
              </div>

              {/* One tinted body binds the stats and the brand picker into a
                  single perceived unit — common region, the strongest Gestalt
                  grouping (Palmer 1992: +34% over proximity alone). The
                  earlier full-width border-t inside the card read as a "new
                  chapter", which is a line-divider's actual meaning — exactly
                  the disconnect the client saw. Rows still separate with
                  divide-y: between materials IS the chapter break. */}
              <div className="mt-3 rounded-xl bg-[rgb(var(--c-text))]/[0.025] p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-subtle">You need</p>
                    <p className="num mt-1 font-display text-heading-md font-semibold leading-tight">
                      {line.buyQty ? (
                        <>
                          {/* The word, not the ≈ symbol: ~30% of adults trip
                              on mathematical notation, and everyday speech
                              does approximation with words. The rounded
                              headline + exact sub-line below is also the
                              trust-safe pairing for an estimate. */}
                          <span className="text-heading-sm font-medium text-muted">about</span> {line.buyQty}{' '}
                          <span className="text-heading-sm font-medium text-muted">{line.buyUnit}</span>
                        </>
                      ) : (
                        <>
                          {formatNumber(line.qty)} <span className="text-heading-sm font-medium text-muted">{line.unit}</span>
                        </>
                      )}
                    </p>
                    {line.buyQty && (
                      <p className="num mt-0.5 text-caption text-subtle">
                        {formatNumber(line.qty)} {line.unit}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-subtle">It costs</p>
                    <p className="num mt-1 font-display text-heading-md font-semibold leading-tight">
                      <AnimatedAmount value={line.amount} />
                    </p>
                    <p className="num mt-0.5 text-caption text-subtle">
                      @ {formatCurrency(line.rate)}/{line.unit.replace(/s$/, '')} · {line.chosen.label}
                    </p>
                  </div>
                </div>

                {line.options.length > 1 && (
                  <div className="mt-4">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-subtle">
                        Choose your brand <span className="font-normal normal-case tracking-normal">— price updates instantly</span>
                      </p>
                      {/* -m-2 p-2 grows the hit area to ≥44px without moving
                          the layout — phones first. */}
                      <button
                        type="button"
                        onClick={() => setPhotosForKey(line.key)}
                        className="-m-2 flex shrink-0 items-center gap-1 p-2 text-caption font-medium text-cyan-700 transition-colors hover:text-cyan-800 dark:text-cyan-400"
                      >
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden /> See photos
                      </button>
                    </div>
                    {/* Brands show their mark on a white plate; type options
                        (bricks, sand…) show a licensed product photo
                        (docs/image-credits.md); anything imageless falls back
                        to a text plate so a missing file degrades quietly. */}
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6" role="radiogroup" aria-label={`${line.label} brand`}>
                      {line.options.map((opt) => {
                        const selected = opt.key === line.chosen.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChoose(line.key, opt.key)}
                            onMouseEnter={(e) => showPreview(opt, e.currentTarget)}
                            onMouseLeave={hidePreview}
                            className={
                              selected
                                ? 'relative rounded-lg border-2 border-cyan-600 bg-cyan-500/[0.06] p-2 text-left transition-colors'
                                : 'relative rounded-lg border bg-[rgb(var(--c-bg))] p-2 text-left transition-colors hover:border-cyan-500'
                            }
                          >
                            {opt.default && (
                              <span className="absolute -top-2 right-2 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-white">
                                Our pick
                              </span>
                            )}
                            {opt.photo ? (
                              <span className="block h-14 overflow-hidden rounded-md">
                                <BrandLogo src={opt.photo} label={opt.label} cover />
                              </span>
                            ) : (
                              <span className="flex h-10 items-center justify-center rounded-md bg-white px-1.5">
                                {opt.logo ? (
                                  <BrandLogo src={opt.logo} label={opt.label} />
                                ) : (
                                  <span className="truncate text-[0.7rem] font-medium text-neutral-700">{opt.label}</span>
                                )}
                              </span>
                            )}
                            <span className="mt-1.5 flex items-baseline justify-between gap-1">
                              <span className={selected ? 'truncate text-[0.7rem] font-medium leading-tight' : 'truncate text-[0.7rem] leading-tight text-muted'}>{opt.label}</span>
                              <span className="num shrink-0 text-[0.7rem] text-subtle">{formatCurrency(opt.rate)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t text-sm">
          {grouped ? (
            <>
              <div className="flex items-baseline justify-between px-5 py-3">
                <span>Structure materials</span>
                <AnimatedAmount value={groupTotal('structure')} className="num" />
              </div>
              <div className="flex items-baseline justify-between px-5 py-3">
                <span>Finishing materials</span>
                <AnimatedAmount value={groupTotal('finishing')} className="num" />
              </div>
              <div className="flex items-baseline justify-between px-5 py-3">
                <span className="font-medium">Materials</span>
                <AnimatedAmount value={quote.materialsTotal} className="num font-medium" />
              </div>
            </>
          ) : (
            <div className="flex items-baseline justify-between px-5 py-3">
              <span className="font-medium">Materials</span>
              <AnimatedAmount value={quote.materialsTotal} className="num font-medium" />
            </div>
          )}
          <div className="flex items-baseline justify-between px-5 py-3">
            <span>
              Labour <span className="text-caption text-subtle">({formatCurrency(quote.labour.rate)} / sq ft)</span>
            </span>
            <span className="num">{formatCurrency(quote.labour.amount)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-5 py-3">
            <span>
              Site overheads{' '}
              <span className="text-caption text-subtle">
                (shuttering, scaffolding, curing, transport &amp; supervision — {quote.overheads.pct}%)
              </span>
            </span>
            <AnimatedAmount value={quote.overheads.amount} className="num shrink-0" />
          </div>
          <div className="flex items-baseline justify-between border-t bg-[rgb(var(--c-text))]/[0.03] px-5 py-3.5">
            <span className="font-semibold">Total</span>
            <AnimatedAmount value={quote.total} className="num font-semibold" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="accent" size="lg" onClick={onDownload} leftIcon={<Download className="h-4 w-4" />}>
          Get this as a PDF
        </Button>
        <Button
          variant="secondary"
          size="lg"
          href={`https://wa.me/${SITE.phoneRaw.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I used your cost estimator and would like to discuss my project.')}`}
          leftIcon={<MessageCircle className="h-4 w-4" />}
        >
          Discuss on WhatsApp
        </Button>
      </div>

      <ul className="mt-8 space-y-1.5 text-caption leading-relaxed text-subtle">
        {ASSUMPTIONS.map((a) => (
          <li key={a} className="flex gap-2">
            <span aria-hidden>·</span>
            {a}
          </li>
        ))}
      </ul>

      {/* Desktop hover preview — one shared fixed node (the materials
          container clips overflow, fixed positioning is immune). */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed z-50 w-56 -translate-x-1/2 overflow-hidden rounded-xl border bg-white shadow-xl"
            style={{ left: preview.x, top: preview.y, transform: `translateX(-50%) translateY(${preview.below ? '0' : '-100%'})` }}
          >
            {preview.opt.photo ? (
              <img src={preview.opt.photo} alt={preview.opt.label} className="h-36 w-full object-cover" />
            ) : (
              <span className="flex h-28 items-center justify-center p-4">
                <img src={preview.opt.logo ?? ''} alt={preview.opt.label} className="max-h-16 w-auto max-w-full object-contain" />
              </span>
            )}
            <p className="flex items-baseline justify-between gap-2 px-3 py-2 text-caption text-neutral-800">
              <span className="truncate font-medium">
                {preview.opt.label}
                {preview.opt.detail ? ` · ${preview.opt.detail}` : ''}
              </span>
              <span className="num shrink-0 text-neutral-500">{formatCurrency(preview.opt.rate)}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "See photos" sheet — the phone-first way to look closely: large
          swatches, and tapping one selects it and closes. Seeing and
          choosing happen in the same place. */}
      <Dialog
        open={photosLine !== undefined && photosLine !== null}
        onClose={() => setPhotosForKey(null)}
        title={photosLine ? `${photosLine.label} — brands` : ''}
        description="Tap one to select it."
        size="lg"
      >
        {photosLine && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photosLine.options.map((opt) => {
              const selected = opt.key === photosLine.chosen.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onChoose(photosLine.key, opt.key);
                    setPhotosForKey(null);
                  }}
                  className={
                    selected
                      ? 'relative overflow-hidden rounded-xl border-2 border-cyan-600 bg-cyan-500/[0.06] text-left transition-colors'
                      : 'relative overflow-hidden rounded-xl border text-left transition-colors hover:border-cyan-500'
                  }
                >
                  {opt.default && (
                    <span className="absolute left-2 top-2 z-10 rounded-full bg-cyan-600 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-white">
                      Our pick
                    </span>
                  )}
                  {opt.photo ? (
                    <img src={opt.photo} alt={opt.label} className="h-40 w-full object-cover sm:h-44" loading="lazy" />
                  ) : (
                    <span className="flex h-40 items-center justify-center bg-white p-5 sm:h-44">
                      <img src={opt.logo ?? ''} alt={opt.label} className="max-h-16 w-auto max-w-full object-contain sm:max-h-20" loading="lazy" />
                    </span>
                  )}
                  <span className="flex items-baseline justify-between gap-2 px-3 py-2">
                    <span className="min-w-0">
                      <span className={selected ? 'block truncate text-sm font-medium' : 'block truncate text-sm'}>{opt.label}</span>
                      {opt.detail && <span className="block truncate text-caption text-subtle">{opt.detail}</span>}
                    </span>
                    <span className="num shrink-0 text-caption text-muted">{formatCurrency(opt.rate)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Dialog>

      {/* Sticky mini-bar — small screens, once the headline card is gone. */}
      <AnimatePresence>
        {headlineGone && (
          <motion.div
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-[rgb(var(--c-bg))]/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur lg:hidden"
          >
            <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-wide text-subtle">
                  {input.package === 'semi-furnished' ? 'Semi Furnished' : 'Civil Work'} estimate
                </p>
                <p className="num font-display text-lg font-semibold leading-tight">
                  {formatCurrencyCompact(quote.totalMin)} – {formatCurrencyCompact(quote.totalMax)}
                </p>
              </div>
              <Button variant="accent" size="md" onClick={onDownload} leftIcon={<Download className="h-4 w-4" />}>
                Get PDF
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lead-capture gate for the PDF — ported unchanged from the old       */
/* Result screen: the estimate stays free, the itemised PDF is what    */
/* is worth a name and a number.                                       */
/* ------------------------------------------------------------------ */

function LeadDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (lead: { name: string; phone: string; email?: string; state: string; city: string }) => void;
}) {
  const [name, setName] = useState(() => getVisitor() ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  /* Pre-selected, not blank: most visitors are exactly here today, so the
     default costs them nothing, and an outstation visitor changes it in two
     taps. A blank-required pair would tax every Jaipur lead to purify data
     the phone call verifies anyway. */
  const [stateCode, setStateCode] = useState(DEFAULT_STATE_CODE);
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; city?: string; consent?: string }>({});

  const states = useStates().data ?? [];
  const cities = useCities(stateCode).data;

  const submit = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Please enter your name';
    if (!/^[+]?[\d\s-]{10,15}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit mobile number';
    if (!city) next.city = 'Please select your city';
    if (!consent) next.consent = CONSENT_REQUIRED;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      /* The lead stores names, not codes — readable in the admin drawer and
         the owner's mail without a lookup table. */
      state: states.find((s) => s.code === stateCode)?.name ?? stateCode,
      city,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Where should we send this?"
      description="We generate your PDF instantly — no email verification, no waiting."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} leftIcon={<Download className="h-4 w-4" />}>
            Get my detailed PDF
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Your name" htmlFor="lead-name" required error={errors.name}>
          <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ritu Sharma" error={errors.name} />
        </FormField>
        <FormField label="Mobile number" htmlFor="lead-phone" required error={errors.phone}>
          <Input id="lead-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98290 00000" error={errors.phone} />
        </FormField>
        <FormField label="Email" htmlFor="lead-email" hint="Optional">
          <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </FormField>
        {/* Two native selects — the exact controls the inputs card already
            uses, so the dialog stays in one visual language. Changing state
            blanks the city (its list just changed under it) rather than
            silently keeping a city from the wrong state. */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="State" htmlFor="lead-state" required>
            <Select
              id="lead-state"
              value={stateCode}
              onChange={(e) => {
                setStateCode(e.target.value);
                setCity('');
              }}
            >
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="City" htmlFor="lead-city" required error={errors.city}>
            <Select id="lead-city" value={city} onChange={(e) => setCity(e.target.value)}>
              {!city && <option value="">Select city…</option>}
              {(cities ?? (city ? [city] : [])).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={CITY_OTHER}>Other / not listed</option>
            </Select>
          </FormField>
        </div>
        <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent} />
        <p className="text-caption text-subtle">We use this only to follow up on your estimate. No marketing lists, no sharing.</p>
      </div>
    </Dialog>
  );
}

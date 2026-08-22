import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Download, Info, MessageCircle, Plus, RotateCcw, Ruler, Share2 } from 'lucide-react';
import { Badge, Button, Dialog, FormField, Input, Switch, useToast } from '@/components/ui';
import { ConsentCheckbox, CONSENT_REQUIRED } from '@/components/common';
import { leadMeta } from '@/lib/consent';
import { track } from '@/lib/analytics';
import { markLeadCaptured } from '@/features/lead/useLeadOffer';
import { getVisitor, rememberVisitor } from '@/lib/visitor';
import { Counter, Reveal } from '@/components/motion';
import { formatCurrency, formatCurrencyCompact, formatDuration, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { projects } from '@/data/projects';
import { estimatesService } from '@/services';
import { COST_HEADS } from '@/constants/estimator';
import { MATERIAL_GROUPS, QUANTITY_UNIT_LABEL } from '@/constants/materials';
import type { EstimateResult, EstimatorInput } from '../model';
import { missingEssentials, specSummary } from '../model';
import { StepEnhancements } from './Steps';
import { useCopy } from '@/hooks';

/* ------------------------------------------------------------------ */
/* Donut chart — dependency-free SVG                                    */
/* ------------------------------------------------------------------ */

function CostDonut({ heads }: { heads: EstimateResult['heads'] }) {
  const size = 200;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = heads.map((head) => {
    const length = (head.percent / 100) * circumference;
    const seg = { ...head, length, offset };
    offset += length;
    return seg;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-48 w-48 -rotate-90" role="img" aria-label="Cost distribution by head">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(0 0 0 / 0.05)" strokeWidth={stroke} />
      {segments.map((seg, i) => (
        <motion.circle
          key={seg.key}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={`${seg.length} ${circumference}`}
          strokeDashoffset={-seg.offset}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.09 }}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Lead-capture gate for the PDF                                        */
/* ------------------------------------------------------------------ */

/**
 * The one thing gated on this page, and deliberately the only one.
 *
 * The estimate itself stays free — that is the site's differentiator against
 * Brick&Bolt, whose calculator holds the number back until you hand over a
 * phone number, and gating it here would also put an interstitial on our best
 * organic landing page. What is worth a name and a number is the itemised PDF,
 * so the button names *that* rather than saying "Submit".
 */
function LeadDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (lead: { name: string; phone: string; email?: string }) => void;
}) {
  /* Prefilled for a returning visitor downloading a second PDF. Name only. */
  const [name, setName] = useState(() => getVisitor() ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Please enter your name';
    if (!/^[+]?[\d\s-]{10,15}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit mobile number';
    if (!consent) next.consent = CONSENT_REQUIRED;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Where should we send this?"
      description="Two fields. We generate your PDF instantly — no email verification, no waiting."
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
          <Input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98290 00000"
            error={errors.phone}
          />
        </FormField>
        <FormField label="Email" htmlFor="lead-email" hint="Optional">
          <Input id="lead-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </FormField>
        <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent} />
        <p className="text-caption text-subtle">
          We use this only to follow up on your estimate. No marketing lists, no sharing.
        </p>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Commercial split — "what am I actually paying for?"                  */
/* ------------------------------------------------------------------ */

/**
 * The first thing on the result screen after the number itself.
 *
 * Materials / labour / design / approvals is a different axis from structure /
 * finishing / MEPF / interiors, and it is the one a homeowner asks about. The
 * construction heads are still here, one disclosure down, for anyone comparing
 * against a contractor's quotation.
 *
 * Each row expands into its own detail: materials into the itemised list,
 * the rest into an explanation of what the money covers. Nothing is a black box,
 * and nothing arrives before it is asked for.
 */
function CommercialSplit({
  result,
  children,
}: {
  result: EstimateResult;
  /** Rendered inside the materials row when it is expanded. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="surface rounded-xl border">
      <div className="border-b p-6">
        <h3 className="font-display text-heading-lg font-semibold">Where the money goes</h3>
        <p className="mt-1.5 text-caption text-muted">
          Every line adds up to the total above — tap any row to see what it covers.
        </p>
      </div>

      <div className="divide-y">
        {result.commercial.map((head) => {
          const isOpen = open === head.key;
          const expandable = head.key === 'materials' && Boolean(children);

          return (
            <div key={head.key}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : head.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-[rgb(var(--c-surface-2))]"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{head.label}</span>
                    <span className="num shrink-0 font-semibold">{formatCurrency(head.amount)}</span>
                  </span>

                  <span className="mt-2 flex items-center gap-3">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[rgb(var(--c-text))]/[0.07]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: head.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${head.percent}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </span>
                    <span className="num w-11 shrink-0 text-right text-caption text-subtle">
                      {head.percent.toFixed(0)}%
                    </span>
                  </span>
                </span>

                <Plus
                  className={cn('h-4 w-4 shrink-0 text-subtle transition-transform', isOpen && 'rotate-45')}
                  aria-hidden
                />
              </button>

              {isOpen && (
                <div className="border-t bg-[rgb(var(--c-surface-2))] p-5">
                  <p className="text-caption leading-relaxed text-muted">{head.description}</p>
                  {expandable && <div className="mt-5">{children}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Itemised materials                                                   */
/* ------------------------------------------------------------------ */

/**
 * Quantity, rate and amount for every material line.
 *
 * The quantities are the point. "₹3,97,900 of cement" is a claim; "994 bags at
 * ₹400" is something a visitor can take to a supplier and check, and checking is
 * what turns an estimate into an argument. No competitor in this market shows
 * quantities at all — the closest, Brick&Bolt, shows brand names per tier.
 *
 * Rates shown here are delivered rates: the catalogue rate after the tier,
 * locality and normalisation scaling, so quantity × rate = amount holds exactly
 * on screen. A reader who multiplies two columns gets the third.
 */
function MaterialBreakdown({ result }: { result: EstimateResult }) {
  const pool = result.commercial.find((c) => c.key === 'materials')?.amount ?? 0;

  if (!result.materialLines.length) {
    return (
      <p className="text-caption leading-relaxed text-muted">
        You have chosen to buy the materials yourself, so there is no material cost in this estimate —
        only labour, design and site costs.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {MATERIAL_GROUPS.map((group) => {
        const lines = result.materialLines.filter((l) => l.group === group.key);
        if (!lines.length) return null;
        const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);

        return (
          <div key={group.key}>
            <div className="flex items-baseline justify-between gap-3 border-b pb-2">
              <p className="text-[0.8125rem] font-semibold">{group.label}</p>
              <p className="num text-caption font-medium">{formatCurrency(subtotal)}</p>
            </div>

            <ul className="mt-1 divide-y divide-dashed">
              {lines.map((line) => (
                <li key={line.key} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-caption font-medium">{line.label}</span>
                      <span className="text-caption text-subtle">
                        {line.spec}
                        {line.provisional && ' *'}
                      </span>
                    </span>
                    <span className="num block text-caption text-subtle">
                      {formatNumber(line.quantity)} {QUANTITY_UNIT_LABEL[line.unit]} @ ₹
                      {formatNumber(Math.round(line.unitRate))}
                    </span>
                  </span>
                  <span className="num shrink-0 text-caption font-medium">{formatCurrency(line.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <div className="flex items-baseline justify-between gap-3 border-t pt-3">
        <p className="text-[0.8125rem] font-semibold">Total materials</p>
        <p className="num font-semibold">{formatCurrency(pool)}</p>
      </div>

      <p className="flex items-start gap-2 text-caption leading-relaxed text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Quantities use published thumb rules — 0.4 bags of cement and 4 kg of steel per sq ft, and so on. They
          are close enough to plan and budget against, and they are not a take-off: final quantities come from
          approved drawings and a bar-bending schedule.
          {result.materialLines.some((l) => l.provisional) && (
            <> Rates marked <span className="font-medium">*</span> have an indicative grade spread.</>
          )}
        </span>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result screen                                                        */
/* ------------------------------------------------------------------ */

export function ResultScreen({
  result,
  input,
  patch,
  onRestart,
  shareUrl,
}: {
  result: EstimateResult;
  input: EstimatorInput;
  patch: (next: Partial<EstimatorInput>) => void;
  onRestart: () => void;
  shareUrl: string;
}) {
  const [leadOpen, setLeadOpen] = useState(false);
  const { push } = useToast();
  const { copied, copy } = useCopy();

  /*
   * Read once on mount, not on every render.
   *
   * `handleLead` writes the name partway through this screen's life; re-reading
   * would make the headline change under the visitor while the PDF downloads,
   * which is a jarring thing for a heading to do.
   */
  const [visitorName] = useState(getVisitor);


  /**
   * A partial selection has priced partial work, and the screen has to say so.
   *
   * A visitor who picked three materials has priced three materials, not a house.
   * The competitor's calculator produces a confident total regardless of what you
   * selected; naming what is missing costs us nothing and is the difference
   * between an estimate and a number.
   */
  const missing = missingEssentials(input);
  const complete = missing.length === 0 && result.materialLines.length > 0;

  const related = useMemo(
    () =>
      projects
        .filter((p) => p.locality.toLowerCase().includes(result.labels.location.toLowerCase().split(' ')[0] ?? ''))
        .slice(0, 3),
    [result.labels.location],
  );

  const fallbackProjects = related.length ? related : projects.filter((p) => p.featured).slice(0, 3);

  const handleLead = async (lead: { name: string; phone: string; email?: string }) => {
    // jsPDF is ~114 KB gzipped — loaded on demand so it never touches first paint.
    const { generateEstimatePdf } = await import('../pdf');
    generateEstimatePdf(result, lead);
    setLeadOpen(false);
    track('lead_submit', { source: 'estimator-pdf', fields: 3 });
    /* They have given us a number. The popup must never ask again. */
    markLeadCaptured();
    rememberVisitor(lead.name);

    /**
     * The PDF is already on their machine, so the capture never blocks it — but
     * the outcome is no longer hidden.
     *
     * This used to end in `.catch(() => undefined)` while the toast promised
     * "We will call you within one working day." If the write failed, the
     * visitor was told they would be contacted by a business that had never
     * received their details. Now the promise is only made once the record
     * exists, and a failure offers a channel that cannot silently fail.
     */
    void estimatesService
      .create({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        propertyType: input.propertyType,
        areaPerFloor: input.areaPerFloor,
        areaUnit: input.areaUnit,
        floors: input.floors,
        // Scope is derived, not chosen — sales still sees rate-card language.
        packageType: result.scope,
        qualityTier: specSummary(input),
        location: input.location,
        enhancements: input.enhancements,
        // The exact specification, so an estimator can rebuild the quote line by line.
        // The exact material and brand set, so an estimator can rebuild the quote line by line.
        materials: input.materials,
        materialsCost: Math.round(result.materialsCost),
        builtUpArea: Math.round(result.builtUpArea),
        totalMin: Math.round(result.min),
        totalMax: Math.round(result.max),
        timelineWeeks: result.timelineWeeks,
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

  const whatsappText = encodeURIComponent(
    `Hi, I used your cost estimator.\n\nProject: ${result.labels.propertyType} · ${result.labels.packageLabel}\nArea: ${formatNumber(result.builtUpArea)} sq ft built-up\nLocation: ${result.labels.location}\nEstimate: ${formatCurrencyCompact(result.min)} – ${formatCurrencyCompact(result.max)}\n\nI'd like to discuss this.`,
  );

  return (
    <div>
      {/* Headline */}
      <Reveal>
        <div className="on-dark grain relative overflow-hidden rounded-2xl bg-navy-800 p-8 text-white md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-500/25 blur-[90px]" aria-hidden />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              {/*
                The same badge, one word warmer for someone who has told us
                their name. A substitution rather than an added element, so the
                unpersonalized screen is unchanged down to the pixel.
              */}
              <Badge variant="brand" size="lg" className="bg-cyan-500 text-white">
                <Check className="h-3.5 w-3.5" />
                {complete
                  ? visitorName
                    ? `Hi ${visitorName} — your estimate is ready`
                    : 'Your estimate is ready'
                  : 'Cost of the work you selected'}
              </Badge>

              <p className="num mt-6 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-none tracking-tight">
                ₹<Counter value={result.min / 100000} decimals={2} /> L
                <span className="mx-2 text-white/40">–</span>₹<Counter value={result.max / 100000} decimals={2} /> L
              </p>

              <p className="mt-4 text-white/60">
                <span className="num text-white">{formatCurrency(result.perSqft)}</span> per sq ft ·{' '}
                <span className="num text-white">{formatNumber(result.chargeableArea)}</span> sq ft chargeable ·{' '}
                <span className="num text-white">{formatDuration(result.timelineWeeks)}</span>
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => {
                    track('lead_gate_open', { source: 'estimator-pdf' });
                    setLeadOpen(true);
                  }}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Download PDF estimate
                </Button>
                <Button
                  href={`https://wa.me/${SITE.whatsapp}?text=${whatsappText}`}
                  external
                  variant="outline"
                  size="lg"
                  className="border-white/25 text-white hover:bg-white/10"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                  onClick={() => track('whatsapp_click', { placement: 'estimator-result' })}
                >
                  Send on WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    void copy(shareUrl);
                    push({ kind: 'success', title: 'Link copied', description: 'Your configuration is saved in the link.' });
                  }}
                  leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                >
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>

              {/*
                A visitor who wants to talk but does not want a PDF and does not
                use WhatsApp previously had nowhere to go from this screen —
                the only routes off it were the download gate, wa.me, and
                browsing projects.
              */}
              {missing.length > 0 && (
                <p className="mt-6 flex items-start gap-2 rounded-lg border border-white/15 bg-white/[0.06] p-3.5 text-caption leading-relaxed text-white/70">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  <span>
                    This prices only what you selected. A complete build also needs{' '}
                    <span className="font-medium text-white">{missing.map((m) => m.label).join(', ')}</span> —
                    add them on the previous step if you want us to supply those too.
                  </span>
                </p>
              )}

              <p className="mt-6 text-caption text-white/55">
                Want us to walk you through it?{' '}
                <Link to={ROUTES.contact} className="link-underline font-medium text-cyan-400">
                  Book a consultation
                </Link>{' '}
                and we will go through the numbers line by line — no charge, no obligation.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-dark rounded-xl p-6">
                <p className="text-caption uppercase tracking-wide text-white/45">Your configuration</p>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {[
                    ['Finish', result.labels.packageLabel],
                    ['Built-up area', `${formatNumber(Math.round(result.builtUpArea))} sq ft`],
                    ['Floors', result.labels.floors],
                    ['Location', result.labels.location],
                    ['Building type', result.labels.propertyType],
                    ['Contract', result.labels.serviceModel],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-white/45">{k}</dt>
                      <dd className="text-right text-white/85">{v}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={onRestart}
                  className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-caption text-white/50 transition-colors hover:text-cyan-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/*
        The commercial split, immediately under the number.

        This answers "what am I paying for?" in four rows using words a homeowner
        already owns, and every row expands. Materials expands all the way down to
        quantities — 994 bags of cement at ₹400 — which is the level at which an
        estimate stops being a claim and becomes something you can check.
      */}
      <Reveal delay={0.06}>
        <div className="mt-6">
          <CommercialSplit result={result}>
            <MaterialBreakdown result={result} />
          </CommercialSplit>
        </div>
      </Reveal>

      {/*
        Service model, demoted from a step-one question to a switch here.

        Turnkey vs labour-only used to be the second thing the estimator asked,
        with two rate cards an order of magnitude apart (₹1,200–3,000 against
        ₹100–199 per sq ft) and no explanation of why. It reads as an error unless
        you already know what a labour contract is. Almost everyone wants turnkey;
        the minority who do not can say so here, after the number, in plain words.
      */}
      <div className="surface mt-4 flex items-center justify-between gap-4 rounded-xl border p-5">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium">I&apos;ll buy the materials myself</p>
          <p className="mt-1 text-caption leading-relaxed text-muted">
            We supervise and execute; you procure everything. Removes the material cost from this estimate
            and reprices the work at our labour-only rate.
          </p>
        </div>
        <Switch
          checked={input.serviceModel === 'labour-only'}
          onChange={(v) => patch({ serviceModel: v ? 'labour-only' : 'turnkey' })}
          label="Buy materials myself"
        />
      </div>

      {/*
        Enhancements — the one refinement that still belongs here.

        The material picker used to sit beside this as a second panel. Step 2 now
        *is* the material picker, so keeping it would have meant two places to
        choose flooring, which is exactly the kind of duplication that makes a
        tool feel like a form. Enhancements are different: they are whole systems
        (solar, lift, HVAC) that sit outside the material model, and they are
        purely additive, so they never block the number.
      */}
      <div className="mt-4">
        <RefinePanel
          title="Add extras"
          summary={
            input.enhancements.length
              ? `${input.enhancements.length} added · ${formatCurrencyCompact(result.enhancementsCost)}`
              : 'Solar, lift, HVAC, home automation, boundary wall and more'
          }
          count={input.enhancements.length}
        >
          <StepEnhancements input={input} patch={patch} chargeableArea={result.chargeableArea} embedded />
        </RefinePanel>
      </div>

      {/* Breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Reveal delay={0.1} className="lg:col-span-5">
          <div className="surface h-full rounded-xl border p-7 shadow-sm">
            <h3 className="font-display text-heading-lg font-semibold">Where the money goes</h3>
            <p className="mt-1.5 text-caption text-muted">Distribution across construction heads.</p>

            <div className="mt-6 flex justify-center">
              <CostDonut heads={result.heads} />
            </div>

            <div className="mt-6 space-y-3">
              {result.heads.map((head) => (
                <div key={head.key} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: head.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{head.label}</span>
                    <span className="block text-caption text-subtle">{head.description}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="num block text-sm font-semibold">{formatCurrencyCompact(head.amount)}</span>
                    <span className="num block text-caption text-subtle">{head.percent.toFixed(1)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="space-y-6 lg:col-span-7">
          {/* Timeline */}
          <Reveal delay={0.16}>
            <div className="surface rounded-xl border p-7 shadow-sm">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-heading-lg font-semibold">Estimated programme</h3>
                <span className="num text-sm text-cyan-700 dark:text-cyan-400">{result.timelineWeeks} weeks</span>
              </div>

              <div className="mt-6 space-y-4">
                {result.phases.map((phase, i) => (
                  <div key={phase.key}>
                    <div className="flex items-baseline justify-between text-caption">
                      <span className="font-medium">{phase.label}</span>
                      <span className="num text-subtle">
                        wk {phase.startWeek + 1}–{phase.startWeek + phase.weeks}
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-[rgb(var(--c-text))]/[0.06]">
                      <motion.div
                        className="absolute h-full rounded-full bg-cyan-500"
                        style={{ left: `${(phase.startWeek / result.timelineWeeks) * 100}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(phase.weeks / result.timelineWeeks) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Payments */}
          <Reveal delay={0.22}>
            <div className="surface overflow-hidden rounded-xl border shadow-sm">
              <div className="border-b p-7 pb-5">
                <h3 className="font-display text-heading-lg font-semibold">Milestone payment schedule</h3>
                <p className="mt-1.5 text-caption text-muted">
                  You pay for work that is finished, verified and photographed — never against a date.
                </p>
              </div>
              <div className="divide-y">
                {result.payments.map((row) => (
                  <div key={row.milestone} className="flex items-center justify-between gap-4 px-7 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.milestone}</p>
                      <p className="text-caption text-subtle">{row.trigger}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num text-sm font-semibold">{formatCurrencyCompact(row.amount)}</p>
                      <p className="num text-caption text-subtle">{row.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Enhancements */}
      {result.enhancementBreakdown.length > 0 && (
        <Reveal delay={0.1} className="mt-6">
          <div className="surface rounded-xl border p-7 shadow-sm">
            <h3 className="font-display text-heading-lg font-semibold">Selected enhancements</h3>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {result.enhancementBreakdown.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-md bg-[rgb(var(--c-text))]/[0.03] px-4 py-3">
                  <span className="text-sm">{item.label}</span>
                  <span className="num text-sm font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Assumptions */}
      <Reveal delay={0.1} className="mt-6">
        <div className="rounded-xl border border-dashed p-7">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-subtle" />
            <h3 className="font-display text-heading-md font-semibold">What this estimate assumes</h3>
          </div>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {result.assumptions.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-caption leading-relaxed text-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Proof */}
      <Reveal delay={0.1} className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="overline">Proof</p>
            <h3 className="mt-2 text-display-sm">What we have built nearby</h3>
          </div>
          <Link to={ROUTES.projects} className="hidden items-center gap-2 text-sm font-medium text-cyan-700 link-underline sm:inline-flex dark:text-cyan-400">
            All projects <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {fallbackProjects.map((project) => (
            <Link key={project.id} to={ROUTES.project(project.slug)} className="group block">
              <div className="overflow-hidden rounded-lg">
                <img
                  src={project.coverImage}
                  alt={project.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                />
              </div>
              <p className="mt-3 text-caption text-subtle">
                {project.locality} · {formatNumber(project.areaSqft)} sq ft
              </p>
              <p className="font-display font-semibold transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                {project.title}
              </p>
            </Link>
          ))}
        </div>
      </Reveal>

      <LeadDialog open={leadOpen} onClose={() => setLeadOpen(false)} onSubmit={handleLead} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Live cost meter — always visible while configuring                   */
/* ------------------------------------------------------------------ */

/**
 * Live cost meter.
 *
 * Deliberately inert until the visitor has supplied an area. Previously it computed
 * from a seeded 1,500 sq ft plot and displayed a precise, confident range on step 1 —
 * a quotation for a project nobody had described. The empty state below sets the
 * expectation instead, and the number arrives the moment it is genuinely theirs.
 */
export function LiveCostMeter({ result, compact }: { result: EstimateResult; compact?: boolean }) {
  /**
   * Two things have to be true before there is anything to show: an area, and at
   * least one material. Rendering ₹0 as though it were an estimate is worse than
   * rendering nothing — it looks like the tool decided your house is free.
   */
  const noArea = result.chargeableArea <= 0;
  const ready = !noArea && result.materialLines.length > 0;

  if (!ready) {
    return (
      <div className={cn('glass rounded-xl p-5', compact && 'flex items-center gap-4 p-4')}>
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-wide text-subtle">Estimated cost</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="num text-2xl font-semibold leading-none text-[rgb(var(--c-text-subtle))]">—</span>
            <span className="text-caption text-subtle">appears here</span>
          </p>

          {!compact && (
            <>
              <div className="mt-4 space-y-2 border-t pt-4" aria-hidden>
                {COST_HEADS.map((head) => (
                  <div key={head.key}>
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-subtle">{head.label}</span>
                      <span className="num text-subtle">—</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-[rgb(var(--c-text))]/[0.05]" />
                  </div>
                ))}
              </div>

              <p className="mt-4 flex items-start gap-2 border-t pt-4 text-caption leading-relaxed text-muted">
                <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
                {noArea
                  ? 'Add your built-up area above and this updates with every choice after it.'
                  : 'Select the materials you want us to supply and this fills in as you go.'}
              </p>
            </>
          )}
        </div>
        {compact && (
          <p className="shrink-0 text-caption text-subtle">{noArea ? 'Add area' : 'Pick materials'}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('glass rounded-xl p-5', compact && 'flex items-center justify-between gap-4 p-4')}>
      <div className={cn(compact && 'min-w-0')}>
        <p className="text-caption uppercase tracking-wide text-subtle">Estimated cost</p>
        <p className="num mt-1 text-2xl font-semibold leading-none text-navy-800 dark:text-white">
          {formatCurrencyCompact(result.min)}
          <span className="mx-1.5 text-subtle">–</span>
          {formatCurrencyCompact(result.max)}
        </p>
      </div>

      {!compact && (
        <>
          <div className="mt-4 space-y-2 border-t pt-4">
            {result.heads.map((head) => (
              <div key={head.key}>
                <div className="flex items-center justify-between text-caption">
                  <span className="text-muted">{head.label}</span>
                  <span className="num">{head.percent.toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[rgb(var(--c-text))]/[0.07]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: head.color }}
                    animate={{ width: `${head.percent}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <dl className="mt-4 space-y-1.5 border-t pt-4 text-caption">
            <div className="flex justify-between">
              <dt className="text-muted">Chargeable area</dt>
              <dd className="num">{formatNumber(result.chargeableArea)} sq ft</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Applied rate</dt>
              <dd className="num">{formatCurrency(result.effectiveRate)}/sq ft</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Timeline</dt>
              <dd className="num">{result.timelineWeeks} weeks</dd>
            </div>
          </dl>
        </>
      )}

      {compact && (
        <p className="num shrink-0 text-caption text-subtle">
          {formatNumber(result.chargeableArea)} sq ft · {result.timelineWeeks} wk
        </p>
      )}
    </div>
  );
}

/* ==================================================================== */
/* Refinement panel                                                      */
/* ==================================================================== */

/**
 * A collapsed drawer on the result screen.
 *
 * Uses a native `<details>` rather than animated state: it is keyboard- and
 * screen-reader-accessible for free, survives a re-render, and needs no motion
 * gating. The summary carries the current selection so the panel stays useful
 * while shut — a visitor should be able to see that they have added four
 * enhancements without opening anything.
 */
function RefinePanel({
  title,
  summary,
  count,
  children,
}: {
  title: string;
  summary: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="surface group rounded-xl border shadow-sm open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
          <Plus className="h-5 w-5 transition-transform duration-300 group-open:rotate-45" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-display text-heading-md font-semibold">{title}</span>
            {count > 0 && (
              <Badge variant="brand" size="sm">
                {count}
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block truncate text-caption text-muted">{summary}</span>
        </span>
        <span className="shrink-0 text-caption text-subtle group-open:hidden">Open</span>
        <span className="hidden shrink-0 text-caption text-subtle group-open:block">Close</span>
      </summary>
      <div className="border-t p-6 pt-7">{children}</div>
    </details>
  );
}

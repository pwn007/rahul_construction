import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check, Download, Info, MessageCircle, RotateCcw, Ruler, Share2 } from 'lucide-react';
import { Badge, Button, Dialog, FormField, Input, useToast } from '@/components/ui';
import { Counter, Reveal } from '@/components/motion';
import { formatCurrency, formatCurrencyCompact, formatDuration, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';
import { projects } from '@/data/projects';
import { estimatesService } from '@/services';
import { COST_HEADS } from '@/constants/estimator';
import type { EstimateResult, EstimatorInput } from '../model';
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

function LeadDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (lead: { name: string; phone: string; email?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Please enter your name';
    if (!/^[+]?[\d\s-]{10,15}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit mobile number';
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
            Download PDF
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
        <p className="text-caption text-subtle">
          We use this only to follow up on your estimate. No marketing lists, no sharing.
        </p>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Result screen                                                        */
/* ------------------------------------------------------------------ */

export function ResultScreen({
  result,
  input,
  onRestart,
  shareUrl,
}: {
  result: EstimateResult;
  input: EstimatorInput;
  onRestart: () => void;
  shareUrl: string;
}) {
  const [leadOpen, setLeadOpen] = useState(false);
  const { push } = useToast();
  const { copied, copy } = useCopy();

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
    push({ kind: 'success', title: 'Your estimate is downloading', description: 'We will call you within one working day.' });

    // Fire-and-forget lead capture — the download must never wait on the network.
    void estimatesService
      .create({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        propertyType: input.propertyType,
        plotArea: input.plotArea,
        areaUnit: input.areaUnit,
        floors: input.floors,
        packageType: input.packageKey,
        qualityTier: input.quality,
        location: input.location,
        enhancements: input.enhancements,
        materialMode: input.materialMode,
        materials: input.materials,
        specAdjustment: Math.round(result.specAdjustment),
        builtUpArea: Math.round(result.builtUpArea),
        totalMin: Math.round(result.min),
        totalMax: Math.round(result.max),
        timelineWeeks: result.timelineWeeks,
        stage: 'new',
      })
      .catch(() => undefined);
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
              <Badge variant="brand" size="lg" className="bg-cyan-500 text-white">
                <Check className="h-3.5 w-3.5" /> Your estimate is ready
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
                <Button variant="accent" size="lg" onClick={() => setLeadOpen(true)} leftIcon={<Download className="h-4 w-4" />}>
                  Download PDF estimate
                </Button>
                <Button
                  href={`https://wa.me/${SITE.whatsapp}?text=${whatsappText}`}
                  external
                  variant="outline"
                  size="lg"
                  className="border-white/25 text-white hover:bg-white/10"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
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
            </div>

            <div className="lg:col-span-5">
              <div className="glass-dark rounded-xl p-6">
                <p className="text-caption uppercase tracking-wide text-white/45">Your configuration</p>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {[
                    ['Type', result.labels.propertyType],
                    ['Model', result.labels.serviceModel],
                    ['Package', result.labels.packageLabel],
                    ['Quality', result.labels.quality],
                    ['Floors', result.labels.floors],
                    ['Location', result.labels.location],
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

      {/* Specification schedule */}
      {result.specSchedule.length > 0 && (
        <Reveal delay={0.1} className="mt-6">
          <div className="surface rounded-xl border p-7 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h3 className="font-display text-heading-lg font-semibold">Your material specification</h3>
                <p className="mt-1.5 text-caption text-muted">
                  Priced as the difference from our standard specification — the package rate already includes a
                  standard grade.
                </p>
              </div>
              <span
                className={cn(
                  'num shrink-0 rounded-full px-3 py-1.5 text-caption font-medium',
                  result.specAdjustment > 0 && 'bg-warning/12 text-warning',
                  result.specAdjustment < 0 && 'bg-success/12 text-success',
                  result.specAdjustment === 0 && 'bg-[rgb(var(--c-text))]/[0.06] text-subtle',
                )}
              >
                {result.specAdjustment > 0 ? '+' : ''}
                {formatCurrency(result.specAdjustment)}
              </span>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2.5 pr-4 font-medium text-subtle">Category</th>
                    <th className="pb-2.5 pr-4 font-medium text-subtle">Item</th>
                    <th className="pb-2.5 pr-4 font-medium text-subtle">Selection</th>
                    <th className="pb-2.5 text-right font-medium text-subtle">Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {result.specSchedule.map((line, i) => (
                    <tr key={`${line.category}-${line.group}-${i}`} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 text-muted">{line.category}</td>
                      <td className="py-2.5 pr-4 text-muted">{line.group}</td>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium">{line.choice}</span>
                        {line.priceLabel && <span className="num ml-2 text-caption text-subtle">{line.priceLabel}</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        {line.quantifiedAtBoq ? (
                          <span className="text-caption text-subtle">At BOQ</span>
                        ) : line.delta === 0 ? (
                          <span className="text-caption text-subtle">Standard</span>
                        ) : (
                          <span className={cn('num font-medium', line.delta > 0 ? 'text-warning' : 'text-success')}>
                            {line.delta > 0 ? '+' : ''}
                            {formatCurrency(line.delta)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.specDeferredCount > 0 && (
              <p className="mt-4 flex items-start gap-2 text-caption leading-relaxed text-subtle">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {result.specDeferredCount} selection{result.specDeferredCount === 1 ? ' is' : 's are'} priced per
                running foot, tonne, cubic metre or fitting. Those need a quantity take-off from approved drawings,
                so they are recorded here at their unit rate rather than guessed into the headline.
              </p>
            )}
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
  const ready = result.chargeableArea > 0;

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
                Add your plot area in step 2 and this updates with every choice after it.
              </p>
            </>
          )}
        </div>
        {compact && <p className="shrink-0 text-caption text-subtle">Step 2</p>}
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

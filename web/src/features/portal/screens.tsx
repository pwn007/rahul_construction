import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  IndianRupee,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge, Button, Progress, Tabs } from '@/components/ui';
import { Counter, Reveal } from '@/components/motion';
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber, formatRelative } from '@/lib/format';
import type { Invoice, Milestone, PortalProject } from '@/types/domain';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('surface rounded-xl border shadow-sm', className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <h2 className="font-display text-heading-md font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

const MILESTONE_STATE: Record<Milestone['state'], { label: string; badge: 'success' | 'brand' | 'default' | 'warning'; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Completed', badge: 'success', icon: CheckCircle2 },
  'in-progress': { label: 'In progress', badge: 'brand', icon: Clock },
  upcoming: { label: 'Upcoming', badge: 'default', icon: CalendarCheck },
  delayed: { label: 'Delayed', badge: 'warning', icon: AlertCircle },
};

const INVOICE_STATE: Record<Invoice['state'], { label: string; badge: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Paid', badge: 'success' },
  due: { label: 'Due', badge: 'warning' },
  overdue: { label: 'Overdue', badge: 'danger' },
  scheduled: { label: 'Scheduled', badge: 'default' },
};

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

export function PortalOverview({ project }: { project: PortalProject }) {
  const paid = project.invoices.filter((i) => i.state === 'paid').reduce((s, i) => s + i.amount, 0);
  const outstanding = project.contractValue - paid;
  const nextMilestone = project.milestones.find((m) => m.state === 'in-progress' || m.state === 'upcoming');
  const overdue = project.invoices.filter((i) => i.state === 'overdue');

  const daysToTarget = Math.round((new Date(project.targetDate).getTime() - Date.now()) / 86_400_000);

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <Reveal>
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/[0.06] p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-medium">
                {overdue.length} payment{overdue.length === 1 ? '' : 's'} overdue
              </p>
              <p className="mt-1 text-caption text-muted">
                {overdue.map((i) => i.title).join(', ')} — material orders for the next stage are held until this clears.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Overall progress', value: `${project.progress}%`, sub: `${project.milestones.filter((m) => m.state === 'completed').length} of ${project.milestones.length} milestones` },
          { label: 'Contract value', value: formatCurrencyCompact(project.contractValue), sub: `${formatNumber(project.areaSqft)} sq ft` },
          { label: 'Paid to date', value: formatCurrencyCompact(paid), sub: `${Math.round((paid / project.contractValue) * 100)}% of contract` },
          { label: 'Target handover', value: formatDate(project.targetDate), sub: daysToTarget > 0 ? `${daysToTarget} days remaining` : 'Handover window' },
        ].map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 0.06}>
            <div className="surface h-full rounded-xl border p-5 shadow-sm">
              <p className="text-caption uppercase tracking-wide text-subtle">{kpi.label}</p>
              <p className="num mt-2 text-2xl font-semibold">{kpi.value}</p>
              <p className="mt-1 text-caption text-subtle">{kpi.sub}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Progress ring + camera */}
        <Reveal delay={0.08} className="lg:col-span-5">
          <Panel title="Construction progress">
            <div className="flex flex-col items-center">
              <div className="relative h-44 w-44">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(0 0 0 / 0.07)" strokeWidth="12" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#00BBEE"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - project.progress / 100) }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="num text-3xl font-semibold">
                    <Counter value={project.progress} />%
                  </span>
                  <span className="text-caption text-subtle">complete</span>
                </div>
              </div>

              {nextMilestone && (
                <div className="mt-6 w-full rounded-lg border border-cyan-500/25 bg-cyan-500/[0.05] p-4">
                  <p className="text-caption uppercase tracking-wide text-subtle">Currently working on</p>
                  <p className="mt-1 font-medium">{nextMilestone.title}</p>
                  <p className="mt-1 text-caption text-muted">{nextMilestone.description}</p>
                  <Progress value={nextMilestone.progress} className="mt-3" />
                  <p className="num mt-2 text-caption text-subtle">
                    {nextMilestone.progress}% · planned by {formatDate(nextMilestone.plannedDate)}
                  </p>
                </div>
              )}
            </div>
          </Panel>
        </Reveal>

        {/* Live camera */}
        <Reveal delay={0.14} className="lg:col-span-7">
          <Panel title="Live site camera" action={<Badge variant="danger" size="sm">Live</Badge>}>
            <div className="relative overflow-hidden rounded-lg">
              <img src={project.cameraFeedUrl} alt="Live site camera feed" className="aspect-video w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" aria-hidden />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink-950/70 px-3 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-white">Camera 02</span>
              </div>
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                <p className="text-caption text-white/70">{project.address}</p>
                <Button variant="glass" size="sm" leftIcon={<Video className="h-3.5 w-3.5" />}>
                  Full screen
                </Button>
              </div>
            </div>
            <p className="mt-3 text-caption text-subtle">
              Prototype: still frame. Phase 2 connects the live RTSP/HLS stream from the site camera.
            </p>
          </Panel>
        </Reveal>
      </div>

      {/* Recent update */}
      {project.updates[0] && (
        <Reveal delay={0.1}>
          <Panel title="Latest site update" action={<span className="text-caption text-subtle">{formatRelative(project.updates[0].date)}</span>}>
            <h3 className="font-display text-heading-md font-semibold">{project.updates[0].title}</h3>
            <p className="mt-2 max-w-prose leading-relaxed text-muted">{project.updates[0].note}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {project.updates[0].images.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
              ))}
            </div>
            <p className="mt-4 text-caption text-subtle">Posted by {project.updates[0].author}</p>
          </Panel>
        </Reveal>
      )}

      {/* Financial summary */}
      <Reveal delay={0.1}>
        <Panel title="Financial summary">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: 'Contract value', value: project.contractValue, tone: 'text-[rgb(var(--c-text))]' },
              { label: 'Paid to date', value: paid, tone: 'text-success' },
              { label: 'Outstanding', value: outstanding, tone: 'text-warning' },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-caption uppercase tracking-wide text-subtle">{row.label}</p>
                <p className={cn('num mt-1.5 text-xl font-semibold', row.tone)}>{formatCurrency(row.value)}</p>
              </div>
            ))}
          </div>
          <Progress value={(paid / project.contractValue) * 100} className="mt-6 h-2" barClassName="bg-success" label="Payment progress" />
        </Panel>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export function PortalTimeline({ project }: { project: PortalProject }) {
  return (
    <div className="space-y-6">
      <Reveal>
        <Panel title="Milestone programme" action={<Badge variant="brand" size="sm">{project.progress}% complete</Badge>}>
          <div className="relative pl-9">
            <div className="absolute left-[13px] top-2 h-[calc(100%-1rem)] w-px bg-[rgb(var(--c-border))]" aria-hidden />

            <div className="space-y-8">
              {project.milestones.map((m, i) => {
                const state = MILESTONE_STATE[m.state];
                const variance = m.actualDate
                  ? Math.round((new Date(m.actualDate).getTime() - new Date(m.plannedDate).getTime()) / 86_400_000)
                  : null;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                  >
                    <span
                      className={cn(
                        'absolute -left-9 top-0.5 flex h-[27px] w-[27px] items-center justify-center rounded-full border-2 bg-[rgb(var(--c-bg))]',
                        m.state === 'completed' && 'border-success text-success',
                        m.state === 'in-progress' && 'border-cyan-500 text-cyan-500',
                        m.state === 'upcoming' && 'border-[rgb(var(--c-border))] text-subtle',
                        m.state === 'delayed' && 'border-warning text-warning',
                      )}
                    >
                      <state.icon className="h-3.5 w-3.5" />
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-heading-md font-semibold">{m.title}</h3>
                      <Badge variant={state.badge} size="sm">
                        {state.label}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{m.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-caption text-subtle">
                      <span>
                        Planned: <span className="num text-[rgb(var(--c-text-muted))]">{formatDate(m.plannedDate)}</span>
                      </span>
                      {m.actualDate && (
                        <span>
                          Actual: <span className="num text-[rgb(var(--c-text-muted))]">{formatDate(m.actualDate)}</span>
                        </span>
                      )}
                      {variance !== null && variance !== 0 && (
                        <span className={variance > 0 ? 'text-warning' : 'text-success'}>
                          {variance > 0 ? `${variance} days late` : `${Math.abs(variance)} days early`}
                        </span>
                      )}
                    </div>

                    {m.state === 'in-progress' && <Progress value={m.progress} className="mt-3 max-w-sm" />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="rounded-xl border border-dashed p-5">
          <p className="text-caption leading-relaxed text-muted">
            Planned dates come from the baseline programme agreed before mobilisation. Any variance is flagged in the
            weekly report with a cause and a recovery plan — you should never learn about a delay at handover.
          </p>
        </div>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Updates                                                             */
/* ------------------------------------------------------------------ */

export function PortalUpdates({ project }: { project: PortalProject }) {
  return (
    <div className="space-y-5">
      {project.updates.map((update, i) => (
        <Reveal key={update.id} delay={i * 0.06}>
          <Panel>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-heading-lg font-semibold">{update.title}</h2>
              <span className="text-caption text-subtle">
                {formatDate(update.date)} · {formatRelative(update.date)}
              </span>
            </div>
            <p className="mt-3 max-w-prose leading-relaxed text-muted">{update.note}</p>

            {update.images.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {update.images.map((src) => (
                  <div key={src} className="group relative overflow-hidden rounded-lg">
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                    <ImageIcon className="absolute right-3 top-3 h-4 w-4 text-white/70" />
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 border-t pt-4 text-caption text-subtle">Posted by {update.author}</p>
          </Panel>
        </Reveal>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

const DOC_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'drawing', label: 'Drawings' },
  { value: 'approval', label: 'Approvals' },
  { value: 'contract', label: 'Contracts' },
  { value: 'report', label: 'Reports' },
];

export function PortalDocuments({ project }: { project: PortalProject }) {
  const [category, setCategory] = useState('all');
  const docs = category === 'all' ? project.documents : project.documents.filter((d) => d.category === category);

  return (
    <div className="space-y-6">
      <Tabs
        tabs={DOC_CATEGORIES.map((c) => ({
          value: c.value,
          label: c.label,
          count: c.value === 'all' ? project.documents.length : project.documents.filter((d) => d.category === c.value).length,
        }))}
        value={category}
        onChange={setCategory}
        variant="pill"
        className="inline-flex"
      />

      <Panel>
        <div className="divide-y">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.title}</p>
                  <p className="num text-caption text-subtle">
                    {doc.fileType} · {doc.fileSize} · uploaded {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
                Download
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export function PortalInvoices({ project }: { project: PortalProject }) {
  const paid = project.invoices.filter((i) => i.state === 'paid').reduce((s, i) => s + i.amount, 0);
  const due = project.invoices.filter((i) => i.state === 'due' || i.state === 'overdue').reduce((s, i) => s + i.amount, 0);
  const scheduled = project.invoices.filter((i) => i.state === 'scheduled').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Paid', value: paid, tone: 'text-success' },
          { label: 'Due now', value: due, tone: 'text-warning' },
          { label: 'Scheduled', value: scheduled, tone: 'text-subtle' },
        ].map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 0.06}>
            <div className="surface rounded-xl border p-5 shadow-sm">
              <p className="text-caption uppercase tracking-wide text-subtle">{kpi.label}</p>
              <p className={cn('num mt-2 text-2xl font-semibold', kpi.tone)}>{formatCurrency(kpi.value)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Panel title="Payment ledger">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-medium text-subtle">Invoice</th>
                <th className="pb-3 pr-4 font-medium text-subtle">Milestone</th>
                <th className="pb-3 pr-4 font-medium text-subtle">Due</th>
                <th className="pb-3 pr-4 text-right font-medium text-subtle">Amount</th>
                <th className="pb-3 text-right font-medium text-subtle">Status</th>
              </tr>
            </thead>
            <tbody>
              {project.invoices.map((inv) => {
                const state = INVOICE_STATE[inv.state];
                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-medium">{inv.title}</p>
                      <p className="num text-caption text-subtle">{inv.number}</p>
                    </td>
                    <td className="py-4 pr-4 text-caption text-muted">{inv.milestone}</td>
                    <td className="num py-4 pr-4 text-caption text-muted">
                      {formatDate(inv.dueDate)}
                      {inv.paidDate && <span className="block text-success">Paid {formatDate(inv.paidDate)}</span>}
                    </td>
                    <td className="num py-4 pr-4 text-right font-semibold">{formatCurrency(inv.amount)}</td>
                    <td className="py-4 text-right">
                      <Badge variant={state.badge} size="sm">
                        {state.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
          <Button variant="accent" size="md" leftIcon={<IndianRupee className="h-4 w-4" />}>
            Pay outstanding
          </Button>
          <Button variant="secondary" size="md" leftIcon={<Download className="h-4 w-4" />}>
            Download statement
          </Button>
          <p className="text-caption text-subtle">Prototype — payment gateway integrates in Phase 2.</p>
        </div>
      </Panel>
    </div>
  );
}

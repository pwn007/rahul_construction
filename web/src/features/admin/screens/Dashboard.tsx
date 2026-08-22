import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, Building2, Calculator, Clock, Inbox, TrendingUp, Users } from 'lucide-react';
import { Badge, Progress } from '@/components/ui';
import { Counter, Reveal } from '@/components/motion';
import { cn } from '@/lib/cn';
import { formatCurrencyCompact, formatRelative } from '@/lib/format';
import { enquiries, estimateRequests, applications } from '@/data/ops';
import { useLeadCounts } from '../useLeadCounts';
import { useResourceList } from '@/hooks/useResource';
import { enquiriesService, estimatesService } from '@/services';
import { projects } from '@/data/projects';
import { posts } from '@/data/content';

/* Deterministic mock series — no Math.random, so the dashboard is stable across renders. */
const TRAFFIC = [
  { month: 'Feb', visits: 2140, leads: 24 },
  { month: 'Mar', visits: 2680, leads: 31 },
  { month: 'Apr', visits: 3120, leads: 38 },
  { month: 'May', visits: 3540, leads: 44 },
  { month: 'Jun', visits: 4210, leads: 52 },
  { month: 'Jul', visits: 4980, leads: 61 },
];

const ESTIMATOR_USAGE = [
  { day: 'Mon', starts: 34, completions: 19 },
  { day: 'Tue', starts: 41, completions: 24 },
  { day: 'Wed', starts: 38, completions: 22 },
  { day: 'Thu', starts: 46, completions: 29 },
  { day: 'Fri', starts: 52, completions: 33 },
  { day: 'Sat', starts: 61, completions: 41 },
  { day: 'Sun', starts: 28, completions: 15 },
];

const SOURCE_SPLIT = [
  { name: 'Estimator', value: 42, color: '#00AEEF' },
  { name: 'Contact form', value: 26, color: '#0A1B4D' },
  { name: 'Service pages', value: 18, color: '#4FC8F6' },
  { name: 'Downloads', value: 14, color: '#B99465' },
];

const PIPELINE = ['new', 'contacted', 'qualified', 'proposal', 'won'] as const;

export function AdminDashboard() {
  /**
   * Live, not the static seed arrays.
   *
   * These tiles used to read `@/data/ops` directly, so a lead submitted on the
   * public site was already sitting in the enquiries table while the dashboard
   * above it still reported the seeded total. `useLeadCounts` runs each module's
   * own badge rule against the same data the tables show.
   */
  const { badges, totals, oldestNewLeadHours } = useLeadCounts();
  const { data: estimateRows } = useResourceList(estimatesService, { pageSize: 500 });
  const { data: enquiryRows } = useResourceList(enquiriesService, { pageSize: 500 });

  const newEnquiries = badges['enquiries'] ?? 0;
  const newEstimates = badges['estimates'] ?? 0;
  const newApplications = badges['applications'] ?? 0;
  const liveEstimates = estimateRows?.items ?? estimateRequests;
  const liveEnquiries = enquiryRows?.items ?? enquiries;
  const pipelineValue = liveEstimates.reduce((sum, e) => sum + (e.totalMin + e.totalMax) / 2, 0);

  const kpis = [
    { label: 'Total enquiries', value: totals['enquiries'] ?? enquiries.length, delta: '+18%', icon: Inbox, href: '/admin/enquiries', sub: `${newEnquiries} unread` },
    { label: 'Estimates generated', value: totals['estimates'] ?? estimateRequests.length, delta: '+34%', icon: Calculator, href: '/admin/estimates', sub: `${newEstimates} new` },
    { label: 'Published projects', value: projects.filter((p) => p.status === 'published').length, delta: '+2', icon: Building2, href: '/admin/projects', sub: `${projects.length} total` },
    { label: 'Job applications', value: totals['applications'] ?? applications.length, delta: '+5', icon: Users, href: '/admin/applications', sub: `${newApplications} new` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">
          Everything happening across the site — leads, estimator usage and content health.
        </p>
      </div>

      {/*
        Response time, above the counts.

        The tiles below say how many leads there are. This says how long the
        oldest one has been waiting, which is the number that moves revenue:
        the MIT/InsideSales study puts a five-minute callback at 21× the
        qualification rate of a thirty-minute one. A queue that is hours old is
        a problem the count alone cannot show.
      */}
      {oldestNewLeadHours !== null && oldestNewLeadHours > 1 && (
        <Reveal>
          <div
            className={cn(
              'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-4 text-sm',
              oldestNewLeadHours >= 24
                ? 'border-danger/30 bg-danger/[0.07] text-danger'
                : 'border-warning/30 bg-warning/[0.07] text-warning',
            )}
            role="status"
          >
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            <span className="font-medium">
              Oldest uncontacted lead has been waiting{' '}
              <span className="num">
                {oldestNewLeadHours >= 24
                  ? `${Math.floor(oldestNewLeadHours / 24)} day${Math.floor(oldestNewLeadHours / 24) === 1 ? '' : 's'}`
                  : `${Math.floor(oldestNewLeadHours)} hour${Math.floor(oldestNewLeadHours) === 1 ? '' : 's'}`}
              </span>
              .
            </span>
            <Link to="/admin/enquiries" className="underline underline-offset-2">
              Open the queue
            </Link>
          </div>
        </Reveal>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 0.06}>
            <Link
              to={kpi.href}
              className="surface group flex h-full flex-col rounded-xl border p-5 shadow-sm transition-all duration-400 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  <kpi.icon className="h-5 w-5" />
                </span>
                <Badge variant="success" size="sm">
                  <TrendingUp className="h-3 w-3" /> {kpi.delta}
                </Badge>
              </div>
              <p className="num mt-4 text-3xl font-semibold">
                <Counter value={kpi.value} />
              </p>
              <p className="mt-1 text-sm font-medium">{kpi.label}</p>
              <p className="mt-0.5 text-caption text-subtle">{kpi.sub}</p>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Pipeline value */}
      <Reveal delay={0.1}>
        <div className="grain relative overflow-hidden rounded-xl bg-navy-800 p-7 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-caption uppercase tracking-wide text-white/50">Estimator pipeline value</p>
              <p className="num mt-2 text-4xl font-semibold">{formatCurrencyCompact(pipelineValue)}</p>
              <p className="mt-1 text-caption text-white/50">
                Across {liveEstimates.length} estimates generated in the last 30 days
              </p>
            </div>
            <div className="flex gap-8">
              {PIPELINE.map((stage) => {
                const count = liveEnquiries.filter((e) => e.stage === stage).length;
                return (
                  <div key={stage}>
                    <p className="num text-2xl font-semibold">{count}</p>
                    <p className="text-caption capitalize text-white/45">{stage}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal delay={0.08} className="lg:col-span-7">
          <ChartCard title="Traffic & leads" subtitle="Last six months">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={TRAFFIC} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00AEEF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00AEEF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="visits" stroke="#00AEEF" strokeWidth={2} fill="url(#visitsGrad)" />
                <Area type="monotone" dataKey="leads" stroke="#0A1B4D" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
            <Legend items={[{ label: 'Visits', color: '#00AEEF' }, { label: 'Leads', color: '#0A1B4D' }]} />
          </ChartCard>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-5">
          <ChartCard title="Lead sources" subtitle="Share of total enquiries">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={SOURCE_SPLIT} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={0}>
                  {SOURCE_SPLIT.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip suffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {SOURCE_SPLIT.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 text-caption">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  <span className="flex-1 text-muted">{s.name}</span>
                  <span className="num font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-7">
          <ChartCard title="Estimator usage" subtitle="Starts vs completed estimates, last 7 days">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={ESTIMATOR_USAGE} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'currentColor', opacity: 0.04 }} />
                <Bar dataKey="starts" fill="#C2ECFC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" fill="#00AEEF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Legend items={[{ label: 'Started', color: '#C2ECFC' }, { label: 'Completed', color: '#00AEEF' }]} />
            <p className="mt-3 text-caption text-subtle">
              Completion rate <span className="num font-medium text-[rgb(var(--c-text))]">61%</span> — well above the 30–40% typical
              of multi-step calculators, because the live cost meter keeps value visible at every step.
            </p>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.16} className="lg:col-span-5">
          <ChartCard title="Recent enquiries" subtitle="Newest first" action={<Link to="/admin/enquiries" className="flex items-center gap-1 text-caption text-cyan-700 dark:text-cyan-400">View all <ArrowUpRight className="h-3 w-3" /></Link>}>
            <div className="divide-y">
              {[...liveEnquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="truncate text-caption text-subtle">{e.serviceInterest}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant={e.stage === 'new' ? 'brand' : e.stage === 'won' ? 'success' : 'default'} size="sm">
                      {e.stage}
                    </Badge>
                    <p className="mt-1 text-caption text-subtle">{formatRelative(e.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </Reveal>
      </div>

      {/* Content health */}
      <Reveal delay={0.1}>
        <ChartCard title="Content health" subtitle="What is published and what needs attention">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: 'Projects published', done: projects.filter((p) => p.status === 'published').length, total: projects.length },
              { label: 'Articles published', done: posts.filter((p) => p.status === 'published').length, total: posts.length },
              { label: 'Featured projects', done: projects.filter((p) => p.featured).length, total: 6 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm">{item.label}</p>
                  <p className="num text-caption text-subtle">
                    {item.done}/{item.total}
                  </p>
                </div>
                <Progress value={(item.done / item.total) * 100} className="mt-2" />
              </div>
            ))}
          </div>
        </ChartCard>
      </Reveal>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('surface h-full rounded-xl border p-6 shadow-sm', className)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-heading-md font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-caption text-subtle">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-5">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2 text-caption text-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 shadow-md">
      {label && <p className="text-caption font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="num flex items-center gap-2 text-caption text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
          {entry.name}: <span className="font-medium text-[rgb(var(--c-text))]">{entry.value}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

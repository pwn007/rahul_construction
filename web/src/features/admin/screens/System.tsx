import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend as RLegend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Info, RotateCcw, Save, X } from 'lucide-react';
import { Badge, Button, FormField, Input, Select, Switch, Tabs, useToast } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { cn } from '@/lib/cn';
import { ChartCard } from './Dashboard';
import { useTheme } from '@/app/providers';
import { formatCurrency, formatNumber } from '@/lib/format';
import { roles } from '@/data/ops';
import { PACKAGES, QUALITY_TIERS, LOCATIONS, ENHANCEMENTS } from '@/constants/estimator';
import { MATERIAL_CATEGORIES } from '@/constants/materials';
import { resetOverlay } from '@/services/adapters/mock.adapter';
import type { PermissionAction } from '@/types/domain';

/* ==================================================================== */
/* Analytics                                                             */
/* ==================================================================== */

const PAGE_VIEWS = [
  { page: '/', views: 8420, avgTime: '1:42', bounce: '38%' },
  { page: '/estimator', views: 5210, avgTime: '3:18', bounce: '22%' },
  { page: '/projects', views: 3840, avgTime: '2:04', bounce: '31%' },
  { page: '/pricing', views: 3120, avgTime: '2:36', bounce: '27%' },
  { page: '/services/mepf-consultancy', views: 1980, avgTime: '2:51', bounce: '29%' },
  { page: '/about', views: 1640, avgTime: '1:28', bounce: '44%' },
  { page: '/blog', views: 1210, avgTime: '2:12', bounce: '48%' },
  { page: '/contact', views: 980, avgTime: '1:56', bounce: '35%' },
];

const CONVERSION = [
  { step: 'Landed', users: 5210 },
  { step: 'Step 2', users: 4380 },
  { step: 'Step 3', users: 3910 },
  { step: 'Step 4', users: 3540 },
  { step: 'Step 5', users: 3280 },
  { step: 'Result', users: 3180 },
  { step: 'PDF', users: 1420 },
];

const DEVICES = [
  { month: 'Feb', mobile: 1420, desktop: 620, tablet: 100 },
  { month: 'Mar', mobile: 1780, desktop: 780, tablet: 120 },
  { month: 'Apr', mobile: 2100, desktop: 880, tablet: 140 },
  { month: 'May', mobile: 2410, desktop: 980, tablet: 150 },
  { month: 'Jun', mobile: 2890, desktop: 1150, tablet: 170 },
  { month: 'Jul', mobile: 3420, desktop: 1370, tablet: 190 },
];

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm">Analytics</h1>
        <p className="mt-1.5 text-sm text-muted">
          Traffic, engagement and estimator conversion. Phase 2 wires this to GA4 and server-side events.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Sessions (30d)', value: '4,980', delta: '+18.4%' },
          { label: 'Avg. session', value: '2:14', delta: '+11s' },
          { label: 'Estimator completion', value: '61%', delta: '+6pp' },
          { label: 'Lead conversion', value: '4.2%', delta: '+0.8pp' },
        ].map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 0.05}>
            <div className="surface rounded-xl border p-5 shadow-sm">
              <p className="text-caption uppercase tracking-wide text-subtle">{kpi.label}</p>
              <p className="num mt-2 text-2xl font-semibold">{kpi.value}</p>
              <Badge variant="success" size="sm" className="mt-2">
                {kpi.delta}
              </Badge>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Reveal delay={0.08} className="lg:col-span-7">
          <ChartCard title="Estimator funnel" subtitle="Where people drop out of the wizard">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={CONVERSION} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00AEEF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00AEEF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="step" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#00AEEF" strokeWidth={2.5} fill="url(#funnelGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-3 text-caption text-subtle">
              The largest drop is at the PDF gate (3,180 → 1,420, 45%). That is the deliberate trade: we ask for a
              phone number only after the estimate is on screen.
            </p>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.14} className="lg:col-span-5">
          <ChartCard title="Device mix" subtitle="Sessions by device, last 6 months">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={DEVICES} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} />
                <Tooltip />
                <RLegend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="mobile" stroke="#00AEEF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="desktop" stroke="#0A1B4D" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tablet" stroke="#B99465" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-3 text-caption text-subtle">
              69% mobile — which is why the estimator has a sticky mobile cost meter and a thumb-reachable action rail.
            </p>
          </ChartCard>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <ChartCard title="Top pages" subtitle="Views, engagement and bounce rate">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-subtle">Page</th>
                  <th className="pb-3 pr-4 text-right font-medium text-subtle">Views</th>
                  <th className="pb-3 pr-4 text-right font-medium text-subtle">Avg. time</th>
                  <th className="pb-3 text-right font-medium text-subtle">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {PAGE_VIEWS.map((row) => (
                  <tr key={row.page} className="border-b last:border-0">
                    <td className="num py-3 pr-4">{row.page}</td>
                    <td className="num py-3 pr-4 text-right font-medium">{formatNumber(row.views)}</td>
                    <td className="num py-3 pr-4 text-right text-muted">{row.avgTime}</td>
                    <td className="num py-3 text-right text-muted">{row.bounce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </Reveal>
    </div>
  );
}

/* ==================================================================== */
/* Estimator configuration                                               */
/* ==================================================================== */

export function AdminEstimatorConfig() {
  const [tab, setTab] = useState('rates');
  const [rates, setRates] = useState(PACKAGES.map((p) => ({ key: p.key, label: p.label, min: p.minRate, max: p.maxRate, labour: p.labourOnlyRate })));
  const [quality, setQuality] = useState(QUALITY_TIERS.map((q) => ({ key: q.key, label: q.label, multiplier: q.multiplier })));
  const [locations, setLocations] = useState(LOCATIONS.map((l) => ({ key: l.key, label: l.label, zone: l.zone, multiplier: l.multiplier })));
  const [enhancements, setEnhancements] = useState(ENHANCEMENTS.map((e) => ({ key: e.key, label: e.label, model: e.pricingModel, price: e.unitPrice })));
  const { push } = useToast();

  const save = () =>
    push({
      kind: 'success',
      title: 'Estimator configuration saved',
      description: 'Public calculator picks these up on next load.',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Estimator configuration</h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted">
            The rates, multipliers and add-on prices that drive the public cost estimator. Change a number here and
            every estimate generated afterwards uses it.
          </p>
        </div>
        <Button variant="accent" size="md" onClick={save} leftIcon={<Save className="h-4 w-4" />}>
          Save configuration
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.05] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
        <p className="text-caption leading-relaxed text-muted">
          Cost model: <span className="num">chargeable area × base rate × quality multiplier × location multiplier × property-type
          factor</span>, plus enhancements, plus 3% contingency, presented as a −6% / +8% range.
        </p>
      </div>

      <Tabs
        tabs={[
          { value: 'rates', label: 'Base rates', count: rates.length },
          { value: 'quality', label: 'Quality tiers', count: quality.length },
          { value: 'locations', label: 'Localities', count: locations.length },
          { value: 'enhancements', label: 'Enhancements', count: enhancements.length },
          { value: 'materials', label: 'Material catalogue', count: MATERIAL_CATEGORIES.length },
        ]}
        value={tab}
        onChange={setTab}
        variant="pill"
        className="inline-flex"
      />

      {tab === 'rates' && (
        <div className="surface overflow-hidden rounded-xl border">
          <ConfigTable
            headers={['Package', 'Turnkey min (₹/sq ft)', 'Turnkey max (₹/sq ft)', 'Labour only (₹/sq ft)']}
            rows={rates.map((r, i) => [
              <span key="l" className="font-medium">{r.label}</span>,
              <NumberCell key="min" value={r.min} onChange={(v) => setRates((s) => s.map((x, j) => (j === i ? { ...x, min: v } : x)))} />,
              <NumberCell key="max" value={r.max} onChange={(v) => setRates((s) => s.map((x, j) => (j === i ? { ...x, max: v } : x)))} />,
              <NumberCell key="lab" value={r.labour} onChange={(v) => setRates((s) => s.map((x, j) => (j === i ? { ...x, labour: v } : x)))} />,
            ])}
          />
        </div>
      )}

      {tab === 'quality' && (
        <div className="surface overflow-hidden rounded-xl border">
          <ConfigTable
            headers={['Tier', 'Multiplier', 'Effect on a ₹2,000/sq ft base']}
            rows={quality.map((q, i) => [
              <span key="l" className="font-medium">{q.label}</span>,
              <NumberCell key="m" value={q.multiplier} step={0.01} onChange={(v) => setQuality((s) => s.map((x, j) => (j === i ? { ...x, multiplier: v } : x)))} />,
              <span key="e" className="num text-muted">{formatCurrency(2000 * q.multiplier)} / sq ft</span>,
            ])}
          />
        </div>
      )}

      {tab === 'locations' && (
        <div className="surface overflow-hidden rounded-xl border">
          <ConfigTable
            headers={['Locality', 'Zone', 'Multiplier', 'Effect on a ₹2,000/sq ft base']}
            rows={locations.map((l, i) => [
              <span key="l" className="font-medium">{l.label}</span>,
              <span key="z" className="text-caption text-subtle">{l.zone}</span>,
              <NumberCell key="m" value={l.multiplier} step={0.01} onChange={(v) => setLocations((s) => s.map((x, j) => (j === i ? { ...x, multiplier: v } : x)))} />,
              <span key="e" className="num text-muted">{formatCurrency(2000 * l.multiplier)} / sq ft</span>,
            ])}
          />
        </div>
      )}

      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.05] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
            <p className="text-caption leading-relaxed text-muted">
              The catalogue behind the estimator&apos;s <strong>Specify materials myself</strong> step — 14 categories
              transcribed from the published rate card. Each group declares a <em>baseline</em> (the grade already
              included in the package rate); the estimator prices only the difference from it. Items priced per RFT,
              TON, CUM or NOS are listed at unit rate and quantified at BOQ stage.
            </p>
          </div>

          {MATERIAL_CATEGORIES.map((category) => (
            <div key={category.id} className="surface overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between gap-4 border-b bg-[rgb(var(--c-surface-2))] px-5 py-3">
                <h3 className="flex items-center gap-2 font-display text-heading-md font-semibold">
                  <span aria-hidden>{category.icon}</span>
                  {category.label}
                </h3>
                <Badge variant="default" size="sm">
                  {(category.brands?.length ?? 0) + (category.groups?.length ?? 0)} group(s)
                </Badge>
              </div>

              <div className="divide-y">
                {category.brands && (
                  <div className="px-5 py-3">
                    <p className="text-overline uppercase text-subtle">Brands</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {category.brands.map((b) => (
                        <Badge key={b.name} variant="default" size="sm">
                          {b.name}
                          {b.alt ? ` / ${b.alt}` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {category.groups?.map((group) => (
                  <div key={group.name} className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-overline uppercase text-subtle">{group.name}</p>
                      <Badge variant="brand" size="sm">baseline: {group.baseline}</Badge>
                      {group.coverage ? (
                        <Badge variant="default" size="sm">coverage ×{group.coverage}</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">quantified at BOQ</Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.options.map((o) => (
                        <span
                          key={o.name}
                          className="num rounded-md border px-2 py-1 text-caption text-muted"
                        >
                          {o.name}
                          {o.priceLabel ? ` · ${o.priceLabel}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {category.extras?.map((e) => (
                  <div key={e.name} className="px-5 py-3">
                    <p className="text-overline uppercase text-subtle">{e.name} (yes / no)</p>
                    <p className="mt-1 text-caption text-subtle">
                      Drives the <span className="num">{e.enhancementKey}</span> enhancement — never priced twice.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'enhancements' && (
        <div className="surface overflow-hidden rounded-xl border">
          <ConfigTable
            headers={['Enhancement', 'Pricing model', 'Unit price (₹)']}
            rows={enhancements.map((e, i) => [
              <span key="l" className="font-medium">{e.label}</span>,
              <Badge key="m" variant="default" size="sm">{e.model}</Badge>,
              <NumberCell key="p" value={e.price} onChange={(v) => setEnhancements((s) => s.map((x, j) => (j === i ? { ...x, price: v } : x)))} />,
            ])}
          />
        </div>
      )}
    </div>
  );
}

function ConfigTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-[rgb(var(--c-surface-2))] text-left">
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 font-medium text-subtle">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b last:border-0">
              {cells.map((cell, j) => (
                <td key={j} className="px-5 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NumberCell({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <Input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 max-w-[140px]"
      aria-label="Value"
    />
  );
}

/* ==================================================================== */
/* Roles & permissions                                                   */
/* ==================================================================== */

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'publish'];
const MODULE_KEYS = ['projects', 'services', 'blogs', 'gallery', 'testimonials', 'faqs', 'team', 'careers', 'enquiries', 'estimates', 'media', 'seo', 'users', 'settings'];

export function AdminRoles() {
  const [activeRole, setActiveRole] = useState(roles[0]?.id ?? '');
  const role = roles.find((r) => r.id === activeRole) ?? roles[0];
  const { push } = useToast();

  if (!role) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm">Roles & permissions</h1>
        <p className="mt-1.5 max-w-prose text-sm text-muted">
          Who can do what. Phase 1 renders the matrix from mock data; Phase 2 enforces it server-side on every route.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={cn(
                  'w-full rounded-xl border p-5 text-left transition-all duration-300',
                  r.id === activeRole ? 'border-cyan-500 bg-cyan-500/[0.06] shadow-glow' : 'surface hover:border-cyan-500/50',
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-heading-md font-semibold">{r.name}</p>
                  <Badge variant="default" size="sm">
                    {r.memberCount} {r.memberCount === 1 ? 'member' : 'members'}
                  </Badge>
                </div>
                <p className="mt-2 text-caption leading-relaxed text-muted">{r.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="surface overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-display text-heading-md font-semibold">{role.name} permissions</h2>
              <Button variant="secondary" size="sm" onClick={() => push({ kind: 'success', title: 'Permissions saved' })} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-[rgb(var(--c-surface-2))] text-left">
                    <th className="px-6 py-3 font-medium text-subtle">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="px-3 py-3 text-center font-medium capitalize text-subtle">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULE_KEYS.map((moduleKey) => {
                    const granted = role.permissions[moduleKey] ?? [];
                    return (
                      <tr key={moduleKey} className="border-b last:border-0">
                        <td className="px-6 py-3 capitalize">{moduleKey}</td>
                        {ACTIONS.map((action) => (
                          <td key={action} className="px-3 py-3 text-center">
                            {granted.includes(action) ? (
                              <Check className="mx-auto h-4 w-4 text-success" strokeWidth={3} />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-[rgb(var(--c-text-subtle))]/40" />
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Theme settings                                                        */
/* ==================================================================== */

export function AdminTheme() {
  const { resolved, setMode, setBrandColor } = useTheme();
  const [brand, setBrand] = useState('#00AEEF');
  const [radius, setRadius] = useState(16);
  const [density, setDensity] = useState('comfortable');
  const [glass, setGlass] = useState(true);
  const [motionOn, setMotionOn] = useState(true);
  const { push } = useToast();

  const applyBrand = (hex: string) => {
    setBrand(hex);
    setBrandColor(hex);
  };

  const reset = () => {
    applyBrand('#00AEEF');
    setRadius(16);
    setDensity('comfortable');
    setGlass(true);
    setMotionOn(true);
    document.documentElement.style.setProperty('--radius-base', '16px');
    push({ kind: 'info', title: 'Theme reset to defaults' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-sm">Theme</h1>
          <p className="mt-1.5 max-w-prose text-sm text-muted">
            Brand colour, corner radius and motion. Changing the brand colour here updates CSS variables live —
            try it and watch the buttons below.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Reset
          </Button>
          <Button variant="accent" size="md" onClick={() => push({ kind: 'success', title: 'Theme saved' })} leftIcon={<Save className="h-4 w-4" />}>
            Save theme
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="surface rounded-xl border p-6 shadow-sm">
            <h2 className="font-display text-heading-md font-semibold">Brand</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField label="Accent colour" htmlFor="brand-color">
                <div className="flex gap-2">
                  <input
                    id="brand-color"
                    type="color"
                    value={brand}
                    onChange={(e) => applyBrand(e.target.value)}
                    className="h-11 w-16 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <Input value={brand} onChange={(e) => applyBrand(e.target.value)} className="flex-1" />
                </div>
              </FormField>

              <FormField label="Base corner radius" htmlFor="radius" hint={`${radius}px`}>
                <input
                  id="radius"
                  type="range"
                  min={0}
                  max={32}
                  value={radius}
                  onChange={(e) => {
                    setRadius(Number(e.target.value));
                    document.documentElement.style.setProperty('--radius-base', `${e.target.value}px`);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[rgb(var(--c-text))]/[0.1] accent-cyan-500"
                />
              </FormField>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {['#00AEEF', '#0A1B4D', '#B99465', '#16A34A', '#DC2626', '#7C3AED'].map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => applyBrand(swatch)}
                  className={cn('h-9 w-9 rounded-full border-2 transition-transform hover:scale-110', brand === swatch ? 'border-[rgb(var(--c-text))]' : 'border-transparent')}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Set brand colour to ${swatch}`}
                />
              ))}
            </div>

            <p className="mt-4 flex items-start gap-2 text-caption leading-relaxed text-subtle">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The accent drives fills, highlights and selection. Accent <em>text</em> and focus rings use a
              contrast-locked variant so small labels stay above 4.5:1 on light backgrounds — brand cyan itself
              is only 2.3:1 there.
            </p>
          </div>

          <div className="surface rounded-xl border p-6 shadow-sm">
            <h2 className="font-display text-heading-md font-semibold">Appearance</h2>
            <div className="mt-5 space-y-5">
              <FormField label="Default colour scheme" htmlFor="scheme">
                <Select id="scheme" value={resolved} onChange={(e) => setMode(e.target.value as 'light' | 'dark')}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </FormField>

              <FormField label="Interface density" htmlFor="density">
                <Select id="density" value={density} onChange={(e) => setDensity(e.target.value)}>
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                  <option value="spacious">Spacious</option>
                </Select>
              </FormField>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Glassmorphism</p>
                  <p className="mt-0.5 text-caption text-muted">Frosted surfaces on the navbar and overlays.</p>
                </div>
                <Switch checked={glass} onChange={setGlass} label="Glassmorphism" />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Motion & animation</p>
                  <p className="mt-0.5 text-caption text-muted">
                    Scroll reveals, parallax and smooth scroll. Users who prefer reduced motion always override this.
                  </p>
                </div>
                <Switch checked={motionOn} onChange={setMotionOn} label="Motion" />
              </div>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-5">
          <div className="surface sticky top-24 rounded-xl border p-6 shadow-sm">
            <p className="text-overline uppercase text-subtle">Live preview</p>

            <div className="mt-5 space-y-4" style={{ borderRadius: `${radius}px` }}>
              <div className="rounded-xl bg-navy-800 p-5 text-white" style={{ borderRadius: `${radius}px` }}>
                <p className="text-caption uppercase tracking-wide text-white/50">Estimated cost</p>
                <p className="num mt-1.5 text-2xl font-semibold">₹42.4 L – ₹48.7 L</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="accent" size="md">Primary action</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="outline" size="md">Outline</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="brand">Brand</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
              </div>

              <div className="rounded-lg border p-4" style={{ borderRadius: `${radius}px` }}>
                <p className="font-display text-heading-md font-semibold">Card surface</p>
                <p className="mt-1.5 text-caption text-muted">
                  Typography, borders and radii all read from the same token set the public site uses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================== */
/* Data reset (prototype utility)                                        */
/* ==================================================================== */

export function AdminDataReset() {
  const { push } = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        resetOverlay();
        push({ kind: 'info', title: 'Mock data reset', description: 'Reloading…' });
        window.setTimeout(() => window.location.reload(), 600);
      }}
      leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
    >
      Reset mock data
    </Button>
  );
}

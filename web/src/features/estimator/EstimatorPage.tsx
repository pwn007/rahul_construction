import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Clock, FileDown, IndianRupee, PieChart, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui';
import { PageHero } from '@/components/common';
import { ROUTES } from '@/constants/routes';
import { scrollToTarget } from '@/hooks/useLenis';
import { cn } from '@/lib/cn';
import { readStore, writeStore, STORAGE_KEYS } from '@/lib/storage';
import { SITE } from '@/constants/site';
import { IMG } from '@/lib/media';
import { usePrefersReducedMotion } from '@/hooks';
import { calculateEstimate, decodeInput, encodeInput, DEFAULT_INPUT, type EstimatorInput } from './model';
import { StepIntent, StepSite, StepStructure, StepPackage, StepEnhancements } from './components/Steps';
import { StepMaterials } from './components/StepMaterials';
import { LiveCostMeter, ResultScreen } from './components/Result';

/**
 * The hero previously showed a worked *sample* estimate. It read as a quotation
 * rather than an example, and it anchored the visitor against a number that was not
 * theirs — if your budget is ₹25 L and the first thing you see is ₹42.4 L, you leave
 * before starting. The same card still runs on the homepage, where previewing the
 * output is genuinely its job.
 *
 * This replaces it with what the page actually needs to do: remove the two objections
 * people have about calculators — "will this waste my time?" and "will they spam me?"
 */
const DELIVERABLES = [
  {
    icon: IndianRupee,
    title: 'A costed range',
    detail: 'Not a single fake-precise number — a defensible band built on our published rate card.',
  },
  {
    icon: PieChart,
    title: 'Head-wise breakdown',
    detail: 'Where every rupee goes: structure, finishing, MEPF, interiors, approvals.',
  },
  {
    icon: CalendarCheck,
    title: 'Milestone payment schedule',
    detail: 'What you pay and exactly when — tied to work completed, never to dates.',
  },
  {
    icon: FileDown,
    title: 'A branded PDF',
    detail: 'Yours to keep, compare against other quotes, and share with your family.',
  },
];

const STEPS = [
  { key: 'intent', label: 'Project' },
  { key: 'site', label: 'Site' },
  { key: 'structure', label: 'Structure' },
  { key: 'package', label: 'Package' },
  { key: 'materials', label: 'Materials' },
  { key: 'extras', label: 'Enhancements' },
  { key: 'result', label: 'Estimate' },
] as const;

export default function EstimatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [step, setStep] = useState(0);
  const [input, setInput] = useState<EstimatorInput>(() => ({
    ...DEFAULT_INPUT,
    ...readStore<Partial<EstimatorInput>>(STORAGE_KEYS.estimator, {}, 'session'),
    ...decodeInput(location.search),
  }));

  const result = useMemo(() => calculateEstimate(input), [input]);

  const patch = useCallback((next: Partial<EstimatorInput>) => {
    setInput((prev) => ({ ...prev, ...next }));
  }, []);

  /* Draft survives a refresh; the URL stays deep-linkable. */
  useEffect(() => {
    writeStore(STORAGE_KEYS.estimator, input, 'session');
  }, [input]);

  useEffect(() => {
    navigate({ search: encodeInput(input) }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const goTo = (next: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    const anchor = document.getElementById('wizard');
    if (anchor) {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' } as ScrollToOptions);
    }
  };

  const restart = () => {
    setInput(DEFAULT_INPUT);
    setStep(0);
    goTo(0);
  };

  const isResult = step === STEPS.length - 1;
  const shareUrl = `${SITE.url}/estimator?${encodeInput(input)}`;

  // Step 1 asks nothing quantitative, so it is always advanceable.
  // From step 2 onward the plot/carpet area is what the whole model rests on.
  const canAdvance = step === 0 || input.plotArea > 0;

  return (
    <>
      <Seo
        title="Construction Cost Estimator — Jaipur 2026"
        description="Get an instant, itemised construction cost estimate for your plot in Jaipur. Head-wise breakdown, milestone payment schedule, estimated timeline and a downloadable PDF in under two minutes."
        image={IMG.wide('og-estimator')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Neetu Archstone Construction Cost Estimator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        }}
      />

      <PageHero
        overline="Cost estimator"
        title="What will your build actually cost?"
        lead={
          <>
            Seven quick steps, about two minutes. You get a costed range, a head-wise breakdown, a milestone payment
            schedule, an estimated programme and a branded PDF — built on our published rate card, not a
            number pulled from the air.
          </>
        }
        breadcrumbs={[{ label: 'Cost Estimator' }]}
        actions={
          <>
            <Button
              variant="accent"
              size="lg"
              onClick={() => scrollToTarget('#wizard', -100)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Start my estimate
            </Button>
            <Button href={ROUTES.pricing} variant="secondary" size="lg">
              See published rates
            </Button>
          </>
        }
        aside={
          <div className="surface overflow-hidden rounded-2xl border shadow-lg">
            <div className="border-b bg-gradient-to-r from-cyan-500/[0.09] via-transparent to-sand-300/[0.14] px-6 py-5 dark:to-sand-500/[0.08]">
              <p className="text-overline uppercase text-subtle">What you&apos;ll get</p>
              <p className="mt-1.5 font-display text-heading-md font-semibold">
                Four things, in about two minutes
              </p>
            </div>

            <ul className="divide-y">
              {DELIVERABLES.map((item, i) => (
                <li key={item.title} className="flex items-start gap-4 px-6 py-4">
                  <span className="num mt-0.5 w-4 shrink-0 text-caption text-subtle">{i + 1}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-semibold leading-tight">{item.title}</span>
                    <span className="mt-1 block text-caption leading-relaxed text-muted">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t bg-[rgb(var(--c-surface-2))] px-6 py-4">
              <span className="flex items-center gap-2 text-caption text-muted">
                <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                About 2 minutes
              </span>
              <span className="flex items-center gap-2 text-caption text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                No email needed to see your number
              </span>
            </div>
          </div>
        }
      />

      <section id="wizard" className="section-sm">
        <div className="container">
          {/* Step indicator */}
          <div className="mb-10 overflow-x-auto no-scrollbar">
            <ol className="flex min-w-max items-center gap-1">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.key} className="flex items-center">
                    <button
                      onClick={() => i <= step && goTo(i)}
                      disabled={i > step}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition-colors',
                        active && 'bg-cyan-500/10 font-medium text-cyan-700 dark:text-cyan-300',
                        done && 'text-[rgb(var(--c-text-muted))] hover:text-cyan-700',
                        i > step && 'cursor-not-allowed text-subtle',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-semibold',
                          active && 'border-cyan-500 bg-cyan-500 text-white',
                          done && 'border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
                        )}
                      >
                        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                      </span>
                      {s.label}
                    </button>
                    {i < STEPS.length - 1 && (
                      <span className={cn('mx-1 h-px w-6 shrink-0', i < step ? 'bg-cyan-500' : 'bg-[rgb(var(--c-border))]')} aria-hidden />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {isResult ? (
            <ResultScreen result={result} input={input} onRestart={restart} shareUrl={shareUrl} />
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="surface rounded-xl border p-7 shadow-sm md:p-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
                      transition={{ duration: reduced ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {step === 0 && <StepIntent input={input} patch={patch} />}
                      {step === 1 && <StepSite input={input} patch={patch} />}
                      {step === 2 && <StepStructure input={input} patch={patch} />}
                      {step === 3 && <StepPackage input={input} patch={patch} />}
                      {step === 4 && (
                        <StepMaterials
                          input={input}
                          patch={patch}
                          builtUpArea={result.builtUpArea}
                          specAdjustment={result.specAdjustment}
                        />
                      )}
                      {step === 5 && <StepEnhancements input={input} patch={patch} chargeableArea={result.chargeableArea} />}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6">
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => goTo(step - 1)}
                      disabled={step === 0}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back
                    </Button>
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={() => goTo(step + 1)}
                      disabled={!canAdvance}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {step === STEPS.length - 2 ? 'See my estimate' : 'Continue'}
                    </Button>
                  </div>
                </div>

                <p className="mt-4 text-caption text-subtle">
                  Your progress is saved automatically. The URL carries your configuration — bookmark it or send it to
                  someone.
                </p>
              </div>

              {/* Sticky live meter */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-4">
                  <LiveCostMeter result={result} />
                  <div className="rounded-xl border border-dashed p-5">
                    <p className="text-caption leading-relaxed text-muted">
                      This number updates with every choice you make. It is built from our published rate card, adjusted
                      for material specification, locality and building type — the same model our estimators use.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {/* Mobile sticky meter */}
      {!isResult && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t p-3 lg:hidden">
          <div className="glass rounded-xl">
            <LiveCostMeter result={result} compact />
          </div>
        </div>
      )}
    </>
  );
}

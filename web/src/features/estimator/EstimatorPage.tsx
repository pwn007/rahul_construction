import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Clock, FileDown, IndianRupee, PieChart, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui';
import { PageHero } from '@/components/common';
// Only consumer was the "See published rates" button, commented out below.
// import { ROUTES } from '@/constants/routes';
import { scrollToTarget } from '@/hooks/useLenis';
import { cn } from '@/lib/cn';
import { readStore, writeStore, STORAGE_KEYS } from '@/lib/storage';
import { track } from '@/lib/analytics';
import { SITE } from '@/constants/site';
import { IMG } from '@/lib/media';
import { usePrefersReducedMotion } from '@/hooks';
import { calculateEstimate, decodeInput, encodeInput, DEFAULT_INPUT, type EstimatorInput } from './model';
import { StepSite, StepMaterialSelect } from './components/Steps';
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

/**
 * Two questions, then the number.
 *
 * The model has exactly one required input — the area — and every other field
 * ships with a working default. The original seven-step wizard therefore stood
 * between the visitor and a figure it could already have produced; collapsing it
 * to three helped, but the remaining three still asked nine questions, of which
 * six had a safe default and two were industry vocabulary a homeowner has no way
 * to evaluate.
 *
 * What is left is the irreducible set: where, how big, how finished. The service
 * model, building type, basement, stilt and coverage all default; materials and
 * enhancements live on the result screen, where a visitor who has already seen
 * their number is far more willing to spend the effort.
 */
const ALL_STEPS = [
  { key: 'site', label: 'Your building' },
  { key: 'materials', label: 'Your materials' },
  { key: 'result', label: 'Estimate' },
] as const;

type StepKey = (typeof ALL_STEPS)[number]['key'];

export default function EstimatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [input, setInput] = useState<EstimatorInput>(() => ({
    ...DEFAULT_INPUT,
    ...readStore<Partial<EstimatorInput>>(STORAGE_KEYS.estimator, {}, 'session'),
    ...decodeInput(location.search),
  }));

  const steps = useMemo(() => [...ALL_STEPS], []);

  /**
   * The step is part of the draft, not local state.
   *
   * It used to be a bare `useState(0)`, so refreshing on the last step dropped
   * you back to the first with forward navigation disabled — every answer
   * survived but your position did not. A deep link that pre-answered the
   * package (see PackageCard) landed on step one too, re-asking what the link
   * had already said. Both are fixed by seeding from the saved draft and from
   * whatever the URL already answers.
   */
  const [step, setStep] = useState(() => {
    const saved = readStore<{ step?: number }>(STORAGE_KEYS.estimator, {}, 'session').step;
    const decoded = decodeInput(location.search);
    const initial = saved ?? (decoded.materials ? 1 : 0);
    return Math.max(0, Math.min(ALL_STEPS.length - 1, initial));
  });

  const result = useMemo(() => calculateEstimate(input), [input]);

  const patch = useCallback((next: Partial<EstimatorInput>) => {
    setInput((prev) => ({ ...prev, ...next }));
  }, []);

  /* Draft survives a refresh; the URL stays deep-linkable. */
  useEffect(() => {
    writeStore(STORAGE_KEYS.estimator, { ...input, step }, 'session');
  }, [input, step]);

  useEffect(() => {
    navigate({ search: encodeInput(input) }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  /*
   * The funnel, reported as three events.
   *
   * `estimator_start` fires once per mount rather than on the first
   * interaction, because the drop-off worth knowing about is between arriving
   * and answering anything — the step someone never reaches is invisible if
   * the funnel only starts once they engage.
   */
  const started = useRef(false);
  useEffect(() => {
    /*
     * Latched. StrictMode double-invokes effects in development, which sent two
     * `estimator_start` events per visit — a funnel whose first step is
     * inflated makes every downstream conversion rate look half as good as it
     * is, and the discrepancy only shows up once someone compares it to the
     * session count.
     */
    if (started.current) return;
    started.current = true;
    track('estimator_start', { entryStep: step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    /* Forward only. Going back to change an answer is not funnel progress. */
    if (clamped > step) {
      const key = steps[clamped]?.key;
      track(key === 'result' ? 'estimator_result' : 'estimator_step', { step: clamped, key });
    }
    setStep(clamped);
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

  const current: StepKey = steps[step]?.key ?? 'site';
  const stepLabel = `Step ${step + 1} of ${steps.length - 1}`;
  const isResult = current === 'result';
  const shareUrl = `${SITE.url}/estimator?${encodeInput(input)}`;

  /** The area is the model's only genuine requirement, and it is asked on step 1. */
  const canAdvance = input.areaPerFloor > 0;

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
            Two questions, about thirty seconds. You get a costed range, an itemised breakdown down to the
            bag of cement, a milestone payment schedule, an estimated programme and a branded PDF — built on
            our published rate card, not a number pulled from the air.
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
            {/* "See published rates" is commented out for now — published rates
                are hidden; see the Pricing entry in MAIN_NAV (constants/routes.ts). */}
            {/* <Button href={ROUTES.pricing} variant="secondary" size="lg">
              See published rates
            </Button> */}
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
          {/*
            Step indicator.

            `min-w-max` inside a scroller meant this ran 135px past a 390px phone,
            so the third step — the one telling you the estimate is coming — was
            off-screen. A progress indicator you have to scroll to see the end of
            is not doing its job. It now fits: labels are hidden below `sm` except
            on the active step, which is the only one whose name you need, and the
            connectors shrink. The scroller stays as a safety net for very narrow
            devices rather than as the normal case.
          */}
          <div className="mb-10 overflow-x-auto no-scrollbar">
            <ol className="flex min-w-max items-center gap-1">
              {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.key} className="flex items-center">
                    <button
                      onClick={() => i <= step && goTo(i)}
                      disabled={i > step}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-2 py-2 text-sm transition-colors sm:gap-2.5 sm:px-3',
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
                      {/* The inactive labels are hidden, not removed: a screen reader
                          still reads "Your materials", it simply does not take up
                          130px of a 390px viewport to say so. */}
                      <span className={cn('whitespace-nowrap', !active && 'sr-only sm:not-sr-only')}>{s.label}</span>
                    </button>
                    {i < steps.length - 1 && (
                      <span
                        className={cn(
                          'mx-0.5 h-px w-3 shrink-0 sm:mx-1 sm:w-6',
                          i < step ? 'bg-cyan-500' : 'bg-[rgb(var(--c-border))]',
                        )}
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {isResult ? (
            <ResultScreen result={result} input={input} patch={patch} onRestart={restart} shareUrl={shareUrl} />
          ) : (
            /* `[&>*]:min-w-0` — a grid item defaults to `min-width: auto`, so it
               refuses to shrink below its content's min-content width. Any wide
               child then widens the item, the grid, and the document with it. */
            <div className="grid gap-8 [&>*]:min-w-0 lg:grid-cols-12">
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
                      {current === 'site' && <StepSite input={input} patch={patch} stepLabel={stepLabel} />}
                      {current === 'materials' && (
                        <StepMaterialSelect
                          input={input}
                          patch={patch}
                          stepLabel={stepLabel}
                          chargeableArea={result.chargeableArea}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* "See my estimate" plus "Back", both `whitespace-nowrap`, do not fit side
                      by side at 320px. They wrap and go full-width on the narrowest
                      screens, which also gives each a full-width tap target. */}
                  <div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                      {step === steps.length - 2 ? 'See my estimate' : 'Continue'}
                    </Button>
                  </div>
                </div>

                <p className="mt-4 text-caption text-subtle">
                  Your answers and your place in the flow are both saved — a refresh will not lose them. The URL carries
                  your configuration, so you can bookmark it or send it to someone.
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
        /* `pr-20` keeps the content clear of the floating action button, which is
           fixed bottom-right at z-40 and was sitting on top of the price. */
        <div className="fixed inset-x-0 bottom-0 z-30 border-t p-3 pr-20 lg:hidden">
          <div className="glass rounded-xl">
            <LiveCostMeter result={result} compact />
          </div>
        </div>
      )}
    </>
  );
}

import { Link } from 'react-router-dom';
import { ArrowUpRight, Calculator, Home, Search } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui';
import { SplitText } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { projects } from '@/data/projects';
import { useRegisterHeroTone } from '@/app/hero-tone';

export default function NotFoundPage() {
  useRegisterHeroTone('dark');

  const suggestions = [
    { label: 'Cost Estimator', href: ROUTES.estimator, description: 'Get a costed range in two minutes.' },
    { label: 'Our Projects', href: ROUTES.projects, description: 'Completed work across Jaipur.' },
    { label: 'Pricing & Packages', href: ROUTES.pricing, description: 'Published rates, no hidden costs.' },
    { label: 'Contact Us', href: ROUTES.contact, description: 'Talk to a person.' },
  ];

  return (
    <>
      <Seo title="Page not found" noIndex />

      <section className="on-dark grain relative flex min-h-[80svh] items-center overflow-hidden bg-ink-950 pt-32 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-25" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[110px]" aria-hidden />

        <div className="container relative py-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="num text-[clamp(5rem,16vw,11rem)] font-semibold leading-none tracking-tighter text-white/[0.08]">404</p>
              <h1 className="-mt-6 text-display-md text-white md:-mt-10">
                <SplitText text="This page was never built." />
              </h1>
              <p className="mt-5 max-w-lead text-body-lg text-white/60">
                The link is broken or the page has moved. Here is where most people were actually heading.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={ROUTES.home} variant="accent" size="lg" leftIcon={<Home className="h-4 w-4" />}>
                  Back to home
                </Button>
                <Button href={ROUTES.estimator} variant="outline" size="lg" className="border-white/25 text-white hover:bg-white/10" leftIcon={<Calculator className="h-4 w-4" />}>
                  Get an estimate
                </Button>
              </div>

              <p className="mt-6 flex items-center gap-2 text-caption text-white/40">
                <Search className="h-3.5 w-3.5" />
                Tip: press <kbd className="num rounded bg-white/10 px-1.5 py-0.5">⌘K</kbd> anywhere to search the site.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="glass-dark rounded-xl p-6">
                <p className="text-overline uppercase tracking-[0.18em] text-white/40">Popular destinations</p>
                <div className="mt-5 space-y-1">
                  {suggestions.map((s) => (
                    <Link
                      key={s.href}
                      to={s.href}
                      className="group flex items-center justify-between gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.06]"
                    >
                      <span>
                        <span className="block font-medium">{s.label}</span>
                        <span className="block text-caption text-white/45">{s.description}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-cyan-400" />
                    </Link>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-overline uppercase tracking-[0.18em] text-white/40">Recent project</p>
                  {projects[0] && (
                    <Link to={ROUTES.project(projects[0].slug)} className="group mt-3 flex items-center gap-3">
                      <img src={projects[0].coverImage} alt="" className="h-14 w-20 rounded-md object-cover" loading="lazy" />
                      <span>
                        <span className="block text-sm font-medium transition-colors group-hover:text-cyan-400">{projects[0].title}</span>
                        <span className="block text-caption text-white/40">{projects[0].locality}</span>
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

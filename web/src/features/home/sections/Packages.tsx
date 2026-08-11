import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PackagePlans, SectionHeader } from '@/components/common';
import { Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import type { ServiceModel } from '@/constants/estimator';

/**
 * Published packages on the homepage.
 *
 * Replaces the previous estimator teaser, which led with a *sample* quotation —
 * ₹42.4 L for a project belonging to nobody. It read as a quote rather than an
 * example and anchored visitors against a number that was not theirs.
 *
 * Uses the same `PackagePlans` block as the Pricing page, so the service-model
 * toggle, intro copy, rates and scope lists behave identically on both. Each card
 * routes into the estimator with the package *and* the model pre-selected, so the
 * visitor chooses first and prices second.
 */
export function Packages() {
  const [model, setModel] = useState<ServiceModel>('turnkey');

  return (
    <section className="section-sm">
      <div className="container">
        <SectionHeader
          overline="Pricing"
          title="Published rates. No hidden costs."
          lead="Two service models, three packages each. What changes between them is the specification — never the arithmetic."
          align="center"
        />

        <div className="mt-10">
          <PackagePlans model={model} onModelChange={setModel} />
        </div>

        <Reveal delay={0.2}>
          <div className="mt-10 text-center">
            <Link
              to={ROUTES.pricing}
              className="inline-flex items-center gap-2 font-medium text-cyan-700 link-underline dark:text-cyan-400"
            >
              Compare the full inclusion matrix <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

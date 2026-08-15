import { Tabs } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { PackageCard } from './PackageCard';
import { PACKAGES, type ServiceModel } from '@/constants/estimator';
import { COMMERCIAL_MODEL } from '@/constants/site';

/**
 * Service-model switch + the three published packages.
 *
 * Controlled rather than self-contained: the Pricing page also drives its inclusion
 * matrix from `model`, so the state has to live on the page. Extracting the block
 * this way means the homepage and the Pricing page are identical *by construction* —
 * the toggle labels, the intro copy, the rate switch and the scope lists cannot drift.
 *
 * Intro copy is verbatim from Port1.pdf p.14 (flexible) and p.15 (turnkey).
 */
export function PackagePlans({
  model,
  onModelChange,
  /** Pricing page shows the closing line under its own matrix instead. */
  showClosing = true,
}: {
  model: ServiceModel;
  onModelChange: (model: ServiceModel) => void;
  showClosing?: boolean;
}) {
  return (
    <>
      <div className="flex flex-col items-center">
        <Tabs
          tabs={[
            { value: 'turnkey', label: 'Turnkey (all-inclusive)' },
            { value: 'labour-only', label: 'Labour only' },
          ]}
          value={model}
          onChange={(v) => onModelChange(v as ServiceModel)}
          variant="pill"
          className="inline-flex"
        />

        <p className="mt-4 max-w-lead text-center text-caption text-muted">
          {model === 'turnkey' ? COMMERCIAL_MODEL.turnkeyIntro : COMMERCIAL_MODEL.flexibleIntro}
        </p>
        <p className="mt-2 max-w-lead text-center text-caption text-subtle">
          {model === 'turnkey'
            ? 'One agreement covers materials, labour, services and finishes.'
            : 'You buy the materials, we provide supervised labour and execution. Typically saves 8–12% if you have the time to manage procurement.'}
        </p>
      </div>

      <div className="mt-12 grid gap-6 [&>*]:min-w-0 lg:grid-cols-3">
        {PACKAGES.map((pkg, i) => (
          <Reveal key={pkg.key} delay={i * 0.08}>
            <PackageCard pkg={pkg} model={model} popular={pkg.key === 'semi-furnished'} />
          </Reveal>
        ))}
      </div>

      {showClosing && model === 'turnkey' && (
        <Reveal delay={0.25}>
          <p className="mt-10 text-center font-display text-heading-lg font-medium italic text-muted">
            {COMMERCIAL_MODEL.turnkeyClosing}
          </p>
        </Reveal>
      )}
    </>
  );
}

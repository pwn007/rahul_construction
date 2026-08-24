'use client';

import { Dialog } from '@/components/ui';
import { ShortLeadForm } from './ShortLeadForm';
import { useLeadOffer } from './useLeadOffer';

/**
 * One of the site's two lead-capture surfaces; the estimator's PDF gate is the
 * other. Mounted once in the public layout, so there is exactly one instance
 * and two overlays can never race each other.
 *
 * It opens whenever the visitor goes still — see `useLeadOffer` for the rule.
 * Because it reopens on every pause rather than once per visit, what it offers
 * matters more than it would for a one-shot popup: it trades the rate card for
 * a number, which is an exchange, rather than asking for a number in return for
 * being telephoned, which is not.
 */
export function LeadOfferModal() {
  const { open, dismiss, suppress } = useLeadOffer();

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      title="Jaipur construction rates, 2026"
      description="Per-square-foot rates by locality and package — the sheet our own estimators quote from."
      size="sm"
    >
      <ShortLeadForm
        source="idle-popup"
        serviceInterest="Rate card"
        context="Requested the 2026 Jaipur rate card."
        submitLabel="Send me the rate card"
        onDone={suppress}
      />
    </Dialog>
  );
}

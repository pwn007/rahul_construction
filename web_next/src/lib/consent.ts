/**
 * Consent wording, and the metadata every lead carries.
 *
 * One string, one helper, four capture surfaces. Written down once because the
 * thing that has to be provable under the DPDP Act is not that a box was
 * ticked — it is *what* was agreed to — and four hand-written variants of the
 * sentence would make that unanswerable the moment one of them is edited.
 */

import { SITE } from '@/constants/site';
import { getAttribution } from './attribution';
import type { LeadMeta } from '@/types/domain';

/**
 * The exact sentence shown beside the checkbox, stored verbatim on the record.
 *
 * Deliberately plain and deliberately narrow: it names the company, the channel
 * and the purpose, and it promises nothing about marketing lists because we do
 * not ask for that here. Broadening it later means a new string and a new
 * version of this constant, not an edit to this one — records already stored
 * against the old wording must keep pointing at the wording they were given.
 */
export const CONSENT_TEXT =
  `I agree to be contacted by ${SITE.name} about this enquiry on the number I have given, including on WhatsApp.`;

/**
 * Everything the record needs beyond what the visitor typed.
 *
 * Call at submit time, not at render time: the timestamp has to be the moment
 * of the affirmative action, and attribution should be read as late as possible
 * so a visit that starts before the module loads is still captured.
 */
export function leadMeta(): LeadMeta {
  return {
    consentAt: new Date().toISOString(),
    consentText: CONSENT_TEXT,
    ...getAttribution(),
  };
}

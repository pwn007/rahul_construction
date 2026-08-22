/**
 * Tell the office a lead just landed.
 *
 * The MIT/InsideSales study of 15,000+ leads is the reason this exists: calling
 * back within five minutes rather than thirty is worth 100× on contact rate and
 * 21× on qualification. Nothing else in the lead plan comes close to that
 * multiplier, and none of it pays out if the enquiry sits unseen in a JSON file
 * until somebody remembers to look.
 *
 * Fire-and-forget by design. A notification that fails must never fail the
 * request — the lead is already stored, and the visitor has already been told
 * so. Losing the alert costs minutes; losing the record costs the lead.
 */

interface LeadAlert {
  kind: 'enquiry' | 'estimate';
  name: string;
  phone: string;
  email?: string;
  source?: string;
  /** Free-text line: service interest, or the estimate range. */
  detail?: string;
}

function compose(alert: LeadAlert): string {
  const lines = [
    `New ${alert.kind}: ${alert.name}`,
    `Phone: ${alert.phone}`,
    alert.email ? `Email: ${alert.email}` : null,
    alert.detail ? alert.detail : null,
    alert.source ? `Source: ${alert.source}` : null,
    '',
    'Call back within 5 minutes if you can.',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

/**
 * Send the alert, if a channel is configured.
 *
 * `LEAD_ALERT_WEBHOOK` is deliberately generic — a WhatsApp Business endpoint,
 * a Slack incoming webhook and an SMS gateway all accept a POST with a text
 * body, so the transport is a deployment decision rather than a code one. With
 * the variable unset this is a no-op, which is what keeps local development
 * from paging anybody.
 */
export async function notifyLead(alert: LeadAlert): Promise<void> {
  const url = process.env['LEAD_ALERT_WEBHOOK'];
  if (!url) return;

  const body = compose(alert);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      console.error(`[notify] lead alert rejected: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    /*
     * Logged, never thrown. This runs after the response has been sent, so a
     * throw here would surface as an unhandled rejection and, depending on the
     * Node flags, take the process down over a failed webhook.
     */
    console.error('[notify] lead alert failed:', error instanceof Error ? error.message : error);
  }
}

/** True when alerts are wired up — reported by `/health` so a silent misconfiguration is visible. */
export const leadAlertsEnabled = (): boolean => Boolean(process.env['LEAD_ALERT_WEBHOOK']);

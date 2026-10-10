'use client';

import { useId, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button, FormField, Input, Select, Textarea } from '@/components/ui';
import { ConsentCheckbox, CONSENT_REQUIRED } from '@/components/common/ConsentCheckbox';
import { DEVELOPMENT_TYPES } from '@/constants/leads';
import { leadMeta } from '@/lib/consent';
import { track, type LeadSource } from '@/lib/analytics';
import { enquiriesService } from '@/services';
import { markLeadCaptured } from './useLeadOffer';
import { rememberVisitor } from '@/lib/visitor';
import type { DevelopmentType, Enquiry } from '@/types/domain';
import { cn } from '@/lib/cn';

/** Remarks are free text into a TEXT column; the cap is for the reader, not the column. */
const REMARKS_MAX = 1000;

/**
 * The idle popup's form: name, number, what they want built, and room to
 * explain. Its only caller is `LeadOfferModal`.
 *
 * The type of development is required because it is the one answer that
 * decides who calls back — a residential lead and a commercial lead go to
 * different people. Remarks are optional: most visitors will skip them, and a
 * required textarea is where short forms go to die.
 *
 * Consent wording, attribution, the analytics event and the "stop offering,
 * they converted" call all live here so none of them can be forgotten on a
 * submission.
 */
export function ShortLeadForm({
  source,
  serviceInterest,
  /** Extra context for the sales team — the page, the project, the estimate. */
  context,
  submitLabel = 'Request a callback',
  className,
  onDone,
}: {
  source: Extract<LeadSource, 'idle-popup'>;
  serviceInterest: string;
  context?: string;
  submitLabel?: string;
  className?: string;
  onDone?: () => void;
}) {
  const nameId = useId();
  const phoneId = useId();
  const typeId = useId();
  const remarksId = useId();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [developmentType, setDevelopmentType] = useState<DevelopmentType | ''>('');
  const [remarks, setRemarks] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; developmentType?: string; consent?: string }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Please enter your name';
    if (!/^[+]?[\d\s-]{10,15}$/.test(phone.trim())) next.phone = 'Enter a valid 10-digit mobile number';
    if (!developmentType) next.developmentType = 'Please choose the type of development';
    if (!consent) next.consent = CONSENT_REQUIRED;
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const note = remarks.trim();
      /*
       * No `city`. This used to stamp 'Jaipur' on every popup lead, but the
       * visitor is never asked for one — the moment a second city opens, every
       * lead from it would have been recorded in the wrong place. Absent is honest.
       */
      const payload: Partial<Enquiry> = {
        name: name.trim(),
        phone: phone.trim(),
        serviceInterest,
        developmentType: developmentType as DevelopmentType,
        source,
        stage: 'new',
        ...leadMeta(),
      };
      if (context) payload.message = context;
      if (note) payload.remarks = note;

      await enquiriesService.create(payload as Omit<Enquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'>);

      track('lead_submit', { source, fields: note ? 4 : 3 });
      /* They have given us a number. Nothing on this site should ask again. */
      markLeadCaptured();
      /* And we can greet them by name from here on. First name only — see lib/visitor. */
      rememberVisitor(name.trim());
      setDone(true);
      onDone?.();
    } catch {
      /*
       * No optimistic success. The whole promise of this form is that somebody
       * calls back, and a form that says "done" when the record never landed is
       * making a promise the business cannot keep and does not know it made.
       */
      track('lead_submit_failed', { source });
      setErrors({ phone: 'Could not send that. Please try again, or message us on WhatsApp.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={cn('flex items-start gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] p-4', className)}>
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" aria-hidden />
        <div>
          <p className="text-sm font-medium">Got it, {name.trim().split(' ')[0]}.</p>
          <p className="mt-1 text-caption text-muted">We will call you on {phone.trim()} shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('flex flex-col gap-4', className)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Your name" htmlFor={nameId} required error={errors.name}>
          <Input
            id={nameId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ritu Sharma"
            autoComplete="name"
            error={errors.name}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor={phoneId} required error={errors.phone}>
          <Input
            id={phoneId}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98290 00000"
            autoComplete="tel"
            error={errors.phone}
          />
        </FormField>
      </div>

      <FormField label="Type of development" htmlFor={typeId} required error={errors.developmentType}>
        <Select
          id={typeId}
          value={developmentType}
          onChange={(e) => {
            setDevelopmentType(e.target.value as DevelopmentType);
            if (errors.developmentType) setErrors((prev) => ({ ...prev, developmentType: undefined }));
          }}
          error={errors.developmentType}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {DEVELOPMENT_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Remarks" htmlFor={remarksId} description="Optional — plot size, location, timeline, anything that helps us prepare.">
        <Textarea
          id={remarksId}
          rows={3}
          maxLength={REMARKS_MAX}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. 30×50 plot, looking to start in three months"
        />
      </FormField>

      <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent} />

      <Button type="submit" variant="accent" disabled={busy} rightIcon={<ArrowRight className="h-4 w-4" />} className="self-start">
        {busy ? 'Sending…' : submitLabel}
      </Button>
    </form>
  );
}

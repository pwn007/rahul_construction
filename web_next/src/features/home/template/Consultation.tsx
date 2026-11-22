'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/components/ui';
import { leadMeta } from '@/lib/consent';
import { track } from '@/lib/analytics';
import { markLeadCaptured } from '@/features/lead/useLeadOffer';
import { rememberVisitor } from '@/lib/visitor';
import { ROUTES } from '@/constants/routes';
import type { DevelopmentType } from '@/types/domain';
import { CONSULTATION as C } from './content';
import { cn } from '@/lib/cn';
import { Eyebrow, Reveal } from './reveal';

/* The field opens on "+91", as the design's does; accept the ten digits after
   it however they are typed — spaced, with or without the +91, or a leading 0. */
function nationalNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z.string().refine((v) => /^\d{10}$/.test(nationalNumber(v)), 'Please enter a 10-digit number'),
  size: z.string().trim().max(40).optional(),
  type: z.string().optional(),
  scope: z.string().optional(),
});
type Consultation = z.infer<typeof schema>;

const TYPE_TO_DEVELOPMENT: Record<string, DevelopmentType> = {
  'Residential Home / Villa': 'residential',
  'Residential Renovation / Remodel': 'residential',
  'Commercial Building': 'commercial',
};

/* The design's field and label (its `field` / `lab` strings), with a red edge
   for a field that failed. */
const field =
  'w-full min-h-[2.4vw] border border-transparent bg-white px-[0.5vw] text-[1.05vw] outline-none transition duration-200 placeholder:font-light placeholder:text-black/80 hover:border-cyan-500/50 focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(0,187,238,.25)] aria-[invalid=true]:border-[#dc2626] max-lg:min-h-10 max-lg:text-[0.875rem]';
const small = '!text-[0.8vw] leading-snug tracking-wide max-lg:!text-[11px]';
const lab = 'mb-[0.5vw] block text-[0.95vw] font-bold max-lg:text-xs';

/**
 * The design's "Why Neetu Archstone" band and its form — a real lead since
 * 19 Nov 2026 (the design's only flips a flag).
 *
 * It posts to enquiries like the contact page does. The enquiry table has no
 * size or scope columns (and drops unknown keys without a word), so scope is
 * the `serviceInterest`, the type also sets `developmentType` for the admin's
 * Type filter, and all three are spelled out in `message` for the sales team.
 * No backend change.
 */
export function Consultation() {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Consultation>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '+91', size: '', type: '', scope: '' },
  });
  const type = watch('type');
  const scope = watch('scope');

  const onSubmit = async (data: Consultation) => {
    const details = [
      data.type && `Project type: ${data.type}`,
      data.size && `Project size: ${data.size} sq. ft.`,
      data.scope && `Required scope: ${data.scope}`,
    ].filter(Boolean);

    try {
      /* Imported on submit, as the footer's newsletter does: the services layer
         and its seed data stay out of the home page's first load. */
      const { enquiriesService } = await import('@/services');
      await enquiriesService.create({
        name: data.name,
        phone: `+91 ${nationalNumber(data.phone)}`,
        email: data.email,
        serviceInterest: data.scope || 'Free consultation',
        developmentType: data.type ? TYPE_TO_DEVELOPMENT[data.type] : undefined,
        message: details.length ? details.join('\n') : undefined,
        city: 'Jaipur',
        source: 'home-consultation',
        stage: 'new',
        ...leadMeta(),
        consentText: C.notice,
      });
      track('lead_submit', { source: 'home-consultation', fields: 6 });
      /* They have just given us their number. Nothing should pop up asking for it. */
      markLeadCaptured();
      rememberVisitor(data.name);
      reset();
      push({ kind: 'success', title: 'Consultation booked', description: 'We will call you within one working day.' });
    } catch {
      track('lead_submit_failed', { source: 'home-consultation' });
      push({ kind: 'error', title: 'That did not go through', description: 'Please try again, or call us directly.' });
    }
  };

  const error = (msg?: string) =>
    msg && <span className="absolute left-0 top-full mt-[0.2vw] text-[max(0.75vw,11px)] text-[#dc2626]">{msg}</span>;

  /* Type and scope are dropdowns (user, 22 Nov 2026) dressed as the design's
     two-row text boxes. The box is an inline-block that clips, so — like the
     design's <textarea> — it sits on the line's baseline and leaves the same
     7px under it; the hint keeps its height and lists the choices until one is
     picked, and the select lies over the whole box. */
  const choice = (name: 'type' | 'scope', label: string, options: string[], hint: string, value?: string) => (
    <div>
      <label htmlFor={`hc-${name}`} className={lab}>
        {label}
      </label>
      <span
        className={cn(
          field,
          small,
          'relative inline-block overflow-hidden align-baseline focus-within:border-cyan-500 focus-within:shadow-[0_0_0_3px_rgba(0,187,238,.25)]',
        )}
      >
        <span aria-hidden className={cn('block h-[2lh] overflow-hidden font-light text-black/80', value && 'invisible')}>
          {hint}
        </span>
        <select
          id={`hc-${name}`}
          {...register(name)}
          className={cn(
            'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent px-[0.5vw] outline-none',
            small,
            value ? 'text-black' : 'text-transparent',
          )}
        >
          <option value="" disabled hidden />
          {options.map((o) => (
            <option key={o} value={o} className="text-black">
              {o}
            </option>
          ))}
        </select>
      </span>
    </div>
  );

  return (
    <section data-section="consultation" id="consultation" className="scroll-mt-[6.5vw] pb-[4vw] pt-[5vw] max-lg:scroll-mt-16">
      <Reveal className="text-center">
        <div className="flex justify-center">
          <Eyebrow>{C.eyebrow}</Eyebrow>
        </div>
        <h2 className="mt-[1.4vw] text-[3.1vw] font-normal leading-[1.25] text-navy-800 max-lg:text-[1.5rem]">
          {C.title[0]}
          <br />
          <span className="text-cyan-500">{C.title[1]}</span>
        </h2>
        <p className="text-[1.4vw] max-lg:text-sm">{C.sub}</p>
      </Reveal>
      <Reveal delay={120}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative mx-auto mt-[1.4vw] grid w-[67%] gap-x-[3.2%] gap-y-[2vw] bg-[#f2f2f2] px-[3.1%] pb-[4vw] pt-[2.6vw] max-lg:w-[90%] max-lg:py-6 max-sm:gap-y-4 sm:grid-cols-2"
        >
          <div className="relative">
            <label htmlFor="hc-name" className={lab}>
              {C.labels.name}
            </label>
            <input id="hc-name" {...register('name')} placeholder={C.placeholders.name} autoComplete="name" aria-invalid={!!errors.name} className={field} />
            {error(errors.name?.message)}
          </div>
          <div className="relative">
            <label htmlFor="hc-email" className={lab}>
              {C.labels.email}
            </label>
            <input
              id="hc-email"
              {...register('email')}
              type="email"
              placeholder={C.placeholders.email}
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={field}
            />
            {error(errors.email?.message)}
          </div>
          <div className="relative">
            <label htmlFor="hc-phone" className={lab}>
              {C.labels.phone}
            </label>
            <input
              id="hc-phone"
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              className={field}
            />
            {error(errors.phone?.message)}
          </div>
          <div className="relative">
            <label htmlFor="hc-size" className={lab}>
              {C.labels.size}
            </label>
            <input id="hc-size" {...register('size')} inputMode="numeric" placeholder={C.placeholders.size} className={field} />
          </div>
          {choice('type', C.labels.type, C.types, C.typesHint, type)}
          {choice('scope', C.labels.scope, C.scopes, C.scopesHint, scope)}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[3.2vw] bg-cyan-500 text-[1.3vw] tracking-wide text-white transition duration-300 hover:bg-navy-800 hover:shadow-[0_10px_22px_-8px_rgba(3,9,78,.6)] active:scale-[.99] disabled:cursor-progress disabled:opacity-70 max-lg:h-11 max-lg:text-sm sm:col-span-2"
          >
            {isSubmitting ? 'SENDING…' : C.submit}
          </button>
          {/* Ours, not the design's: sits in the form's bottom padding on a
              laptop, so the box keeps the design's size. */}
          <p className="absolute inset-x-[3.1%] bottom-[0.9vw] text-center text-[max(0.75vw,10px)] font-light leading-snug text-black/70 max-lg:static max-lg:text-[11px] sm:col-span-2">
            {C.notice}{' '}
            <Link href={ROUTES.privacy} className="underline underline-offset-2 hover:text-cyan-500">
              Privacy Policy
            </Link>
          </p>
        </form>
      </Reveal>
    </section>
  );
}

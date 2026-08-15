import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { PageHero, SectionHeader } from '@/components/common';
import { Accordion, Button, FormField, Input, Select, Textarea, useToast } from '@/components/ui';
import { Reveal, SplitText } from '@/components/motion';
import { SITE } from '@/constants/site';
import { ROUTES } from '@/constants/routes';
import { services } from '@/data/services';
import { faqs } from '@/data/content';
import { enquiriesService } from '@/services';
import { ProjectAtlas } from '@/features/projects/components';
import { QrCard } from './QrCard';
import { projects } from '@/data/projects';

const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address').or(z.literal('')).optional(),
  serviceInterest: z.string().min(1, 'Please choose a service'),
  budget: z.string().optional(),
  /**
   * The site promises to "book a consultation" in six places and, until now,
   * never asked when. One field turns that from a figure of speech into
   * something the team can actually act on.
   */
  callbackWindow: z.string().optional(),
  message: z.string().min(10, 'Tell us a little more — at least 10 characters'),
});

type ContactForm = z.infer<typeof contactSchema>;

const BUDGETS = ['Not sure yet', 'Under ₹25 L', '₹25 – 50 L', '₹50 L – 1 Cr', '₹1 – 2 Cr', 'Above ₹2 Cr'];

/**
 * The three WhatsApp links on this page used to be bare `wa.me/<number>` with no
 * body, so the conversation opened with the visitor having to explain
 * themselves. The estimator already pre-writes its context into the message;
 * this matches that, at the level of detail a contact page knows.
 */
const WHATSAPP_HREF = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
  'Hi Neetu Archstone, I found you through your website and would like to discuss a project.',
)}`;

const CALLBACK_WINDOWS = [
  'Any time during working hours',
  'Morning (10 AM – 1 PM)',
  'Afternoon (1 – 5 PM)',
  'Evening (5 – 7 PM)',
  'Weekend',
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { push } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '', email: '', serviceInterest: '', budget: '', callbackWindow: CALLBACK_WINDOWS[0], message: '' },
  });

  const onSubmit = async (data: ContactForm) => {
    await enquiriesService.create({
      name: data.name,
      phone: data.phone,
      email: data.email,
      serviceInterest: data.serviceInterest,
      budget: data.budget,
      message: data.callbackWindow ? `${data.message}\n\nBest time to call: ${data.callbackWindow}` : data.message,
      city: 'Jaipur',
      source: 'contact-form',
      stage: 'new',
    });
    setSubmitted(true);
    reset();
    push({ kind: 'success', title: 'Enquiry received', description: 'We respond within one working day.' });
  };

  const contactFaqs = faqs.filter((f) => ['general', 'process'].includes(f.category)).slice(0, 5);

  return (
    <>
      <Seo
        title="Contact — Book a Free Consultation"
        description={`Talk to Neetu Archstone about your project. ${SITE.phone} · ${SITE.email} · ${SITE.address.full}. ${SITE.hours}.`}
      />

      <PageHero
        overline="Contact"
        title="Let's talk about what you want to build"
        lead="Tell us the plot size, the locality and roughly what you have in mind. We reply within one working day — with a real answer, not a brochure."
        breadcrumbs={[{ label: 'Contact' }]}
        actions={
          <>
            <Button href={`tel:${SITE.phoneRaw}`} variant="accent" size="lg" leftIcon={<Phone className="h-4 w-4" />}>
              {SITE.phone}
            </Button>
            <Button
              href={WHATSAPP_HREF}
              external
              variant="secondary"
              size="lg"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
          </>
        }
        aside={
          <div className="surface rounded-2xl border p-6 shadow-lg sm:p-7">
            <p className="text-overline uppercase text-subtle">Reach us directly</p>
            <div className="mt-5 space-y-4">
              {[
                { icon: Phone, label: 'Phone', value: SITE.phone, note: SITE.hours },
                { icon: Mail, label: 'Email', value: SITE.email, note: 'Replies within one working day' },
                { icon: MapPin, label: 'Office', value: SITE.address.full, note: 'Visits by appointment' },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                    <row.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-caption uppercase tracking-wide text-subtle">{row.label}</span>
                    <span className="mt-0.5 block font-medium">{row.value}</span>
                    <span className="mt-0.5 block text-caption text-subtle">{row.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <section className="section-sm">
        <div className="container">
          <div className="grid gap-10 [&>*]:min-w-0 lg:grid-cols-12">
            {/* Details */}
            <div className="lg:col-span-5">
              <div className="space-y-3">
                {[
                  { icon: Phone, label: 'Call us', value: SITE.phone, href: `tel:${SITE.phoneRaw}`, note: SITE.hours },
                  { icon: MessageCircle, label: 'WhatsApp', value: 'Message us instantly', href: WHATSAPP_HREF, note: 'Usually answered within the hour', external: true },
                  { icon: Mail, label: 'Email', value: SITE.email, href: `mailto:${SITE.email}`, note: 'Replies within one working day' },
                  { icon: MapPin, label: 'Office', value: SITE.address.full, note: 'Visits by appointment' },
                ].map((item) => {
                  const Wrapper = item.href ? 'a' : 'div';
                  return (
                    <Reveal key={item.label}>
                      <Wrapper
                        {...(item.href ? { href: item.href, target: item.external ? '_blank' : undefined, rel: item.external ? 'noopener noreferrer' : undefined } : {})}
                        className="surface group flex items-start gap-4 rounded-xl border p-5 shadow-sm transition-all duration-400 hover:border-cyan-500/50 hover:shadow-md"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:text-cyan-400">
                          <item.icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-caption uppercase tracking-wide text-subtle">{item.label}</span>
                          <span className="mt-0.5 block font-medium">{item.value}</span>
                          <span className="mt-0.5 block text-caption text-subtle">{item.note}</span>
                        </span>
                      </Wrapper>
                    </Reveal>
                  );
                })}
              </div>

              <Reveal delay={0.15} className="mt-6">
                <div className="surface rounded-xl border p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-500" />
                    <p className="text-sm font-medium">Working hours</p>
                  </div>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Monday – Saturday</dt>
                      <dd className="num">10:00 AM – 7:00 PM</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Sunday</dt>
                      <dd className="text-subtle">Closed</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>

              <Reveal delay={0.18} className="mt-6">
                <QrCard />
              </Reveal>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              {submitted ? (
                <Reveal>
                  <div className="surface flex flex-col items-center justify-center rounded-xl border border-success/30 bg-success/[0.05] p-12 text-center shadow-sm">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
                      <Check className="h-8 w-8" strokeWidth={2.5} />
                    </span>
                    <h2 className="mt-6 font-display text-display-sm">Thank you — we have it</h2>
                    <p className="mt-3 max-w-md text-muted">
                      One of our team will call you within one working day. If it is urgent, WhatsApp us on{' '}
                      {SITE.phone} and we will pick it up sooner.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <Button href={WHATSAPP_HREF} external variant="accent" size="lg" leftIcon={<MessageCircle className="h-4 w-4" />}>
                        WhatsApp us now
                      </Button>
                      <Button variant="secondary" size="lg" onClick={() => setSubmitted(false)}>
                        Send another enquiry
                      </Button>
                    </div>
                  </div>
                </Reveal>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="surface rounded-xl border p-7 shadow-sm md:p-9">
                  <h2 className="font-display text-heading-lg font-semibold">Send us an enquiry</h2>
                  <p className="mt-1.5 text-caption text-muted">
                    Only name, phone and a short message are required. Everything else helps us prepare a better answer.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <FormField label="Your name" htmlFor="name" required error={errors.name?.message}>
                      <Input id="name" {...register('name')} error={errors.name?.message} placeholder="Your full name" />
                    </FormField>

                    <FormField label="Mobile number" htmlFor="phone" required error={errors.phone?.message}>
                      <Input id="phone" type="tel" {...register('phone')} error={errors.phone?.message} placeholder="98290 00000" />
                    </FormField>

                    <FormField label="Email" htmlFor="email" hint="Optional" error={errors.email?.message}>
                      <Input id="email" type="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
                    </FormField>

                    <FormField label="What do you need?" htmlFor="serviceInterest" required error={errors.serviceInterest?.message}>
                      <Select id="serviceInterest" {...register('serviceInterest')} error={errors.serviceInterest?.message}>
                        <option value="">Choose a service…</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title}
                          </option>
                        ))}
                        <option value="Not sure yet">Not sure yet</option>
                      </Select>
                    </FormField>

                    <FormField label="Indicative budget" htmlFor="budget" hint="Optional">
                      <Select id="budget" {...register('budget')}>
                        <option value="">Prefer not to say</option>
                        {BUDGETS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField label="Best time to call you" htmlFor="callbackWindow" hint="Optional">
                      <Select id="callbackWindow" {...register('callbackWindow')} defaultValue={CALLBACK_WINDOWS[0]}>
                        {CALLBACK_WINDOWS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </Select>
                    </FormField>

                    <FormField
                      label="Tell us about the project"
                      htmlFor="message"
                      required
                      error={errors.message?.message}
                      className="sm:col-span-2"
                      description="Plot size, locality, floors, timeline — whatever you already know."
                    >
                      <Textarea
                        id="message"
                        rows={5}
                        {...register('message')}
                        error={errors.message?.message}
                        placeholder="e.g. I have a 30×50 plot in Vaishali Nagar and want to build G+1, starting after Diwali."
                      />
                    </FormField>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Button type="submit" variant="accent" size="lg" loading={isSubmitting} leftIcon={<Send className="h-4 w-4" />}>
                      Send enquiry
                    </Button>
                    <p className="text-caption text-subtle">We reply within one working day.</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/*
        Where we build — a full-width band of its own.

        The atlas used to sit at the foot of the narrow contact column, where the
        form beside it had already ended: a small map stranded against a column
        of empty space. Given its own band it reads as a section rather than an
        afterthought, and the copy fills the width the map does not need.
      */}
      <section className="section-sm border-t bg-[rgb(var(--c-surface-2))]">
        <div className="container">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="overline">Where we build</p>
              </Reveal>
              <h2 className="mt-3 text-display-sm">
                <SplitText text="Ten projects across Jaipur" />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-5 max-w-lead text-body-lg text-muted">
                  We work across the city — from Vaishali Nagar and Ajmer Road in the west to Jagatpura in the
                  south-east. If your plot is in Jaipur, we have almost certainly built near it.
                </p>
              </Reveal>
              <Reveal delay={0.22}>
                <p className="mt-4 text-caption leading-relaxed text-subtle">
                  Shaded zones are where we have completed or are running work. Tell us your locality and we will
                  send photographs of the nearest site.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <Button href={ROUTES.projects} variant="secondary" className="mt-7" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore the full atlas
                </Button>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal delay={0.1}>
                <ProjectAtlas projects={projects} variant="compact" />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-sm border-t">
        <div className="container max-w-4xl">
          <SectionHeader overline="Before you write" title="You might find your answer here" align="center" />
          <div className="mt-10">
            <Accordion items={contactFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </div>
      </section>
    </>
  );
}

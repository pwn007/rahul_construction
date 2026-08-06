import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Briefcase, Check, MapPin, Paperclip, Send } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { PageHero } from '@/components/common';
import { Badge, Button, FormField, Input, Textarea, useToast } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { ROUTES } from '@/constants/routes';
import { jobs } from '@/data/content';
import { applicationsService } from '@/services';
import { formatRelative } from '@/lib/format';

const applicationSchema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Enter a valid mobile number'),
  experienceYears: z.coerce.number().min(0, 'Cannot be negative').max(50, 'Please check this value'),
  portfolioUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  coverNote: z.string().max(1200, 'Keep it under 1200 characters').optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function CareerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [submitted, setSubmitted] = useState(false);
  const { push } = useToast();

  const job = jobs.find((j) => j.slug === slug);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { name: '', email: '', phone: '', experienceYears: 0, portfolioUrl: '', coverNote: '' },
  });

  if (!job) return <Navigate to={ROUTES.careers} replace />;

  const onSubmit = async (data: ApplicationForm) => {
    await applicationsService.create({
      jobId: job.id,
      jobTitle: job.title,
      name: data.name,
      email: data.email,
      phone: data.phone,
      experienceYears: data.experienceYears,
      resumeUrl: data.portfolioUrl || '#',
      coverNote: data.coverNote,
      stage: 'new',
    });
    setSubmitted(true);
    reset();
    push({ kind: 'success', title: 'Application received', description: 'We review every application and reply within a week.' });
  };

  return (
    <>
      <Seo
        title={`${job.title} — Careers`}
        description={job.summary}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: job.summary,
          datePosted: job.postedAt,
          employmentType: job.type.toUpperCase().replace('-', '_'),
          hiringOrganization: { '@type': 'Organization', name: 'Neetu Archstone' },
          jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: 'Jaipur', addressRegion: 'Rajasthan', addressCountry: 'IN' },
          },
        }}
      />

      <PageHero
        overline={job.department}
        title={job.title}
        lead={job.summary}
        breadcrumbs={[{ label: 'Careers', href: ROUTES.careers }, { label: job.title }]}
        size="sm"
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-caption text-subtle">
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-cyan-500" /> {job.type.replace('-', ' ')}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-500" /> {job.location}
          </span>
          <span className="num">{job.experience}</span>
          {job.salaryRange && <span className="num">{job.salaryRange}</span>}
          <Badge variant="brand" size="sm" className="bg-cyan-500 text-white">
            {job.openings} opening{job.openings === 1 ? '' : 's'}
          </Badge>
          <span>Posted {formatRelative(job.postedAt)}</span>
        </div>
      </PageHero>

      <section className="section-sm">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Role */}
            <div className="lg:col-span-7">
              <Link to={ROUTES.careers} className="inline-flex items-center gap-2 text-caption text-subtle transition-colors hover:text-cyan-700">
                <ArrowLeft className="h-3.5 w-3.5" /> All open roles
              </Link>

              {[
                { title: 'What you will do', items: job.responsibilities },
                { title: 'What we are looking for', items: job.requirements },
                { title: 'What we offer', items: job.benefits },
              ].map((block, i) => (
                <Reveal key={block.title} delay={i * 0.08} className="mt-10">
                  <h2 className="font-display text-heading-lg font-semibold">{block.title}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-500" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>

            {/* Application */}
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                {submitted ? (
                  <Reveal>
                    <div className="surface rounded-xl border border-success/30 bg-success/[0.05] p-8 text-center shadow-sm">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
                        <Check className="h-7 w-7" strokeWidth={2.5} />
                      </span>
                      <h2 className="mt-5 font-display text-heading-lg font-semibold">Application received</h2>
                      <p className="mt-3 text-sm text-muted">
                        Thank you for applying for {job.title}. We read every application and reply within a week — including when the answer is no.
                      </p>
                      <Button variant="secondary" size="md" className="mt-6" onClick={() => setSubmitted(false)}>
                        Submit another application
                      </Button>
                    </div>
                  </Reveal>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="surface rounded-xl border p-7 shadow-sm">
                    <h2 className="font-display text-heading-lg font-semibold">Apply for this role</h2>
                    <p className="mt-1.5 text-caption text-muted">Five fields. We reply to everyone.</p>

                    <div className="mt-6 space-y-5">
                      <FormField label="Full name" htmlFor="name" required error={errors.name?.message}>
                        <Input id="name" {...register('name')} error={errors.name?.message} placeholder="Your name" />
                      </FormField>

                      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
                        <Input id="email" type="email" {...register('email')} error={errors.email?.message} placeholder="you@example.com" />
                      </FormField>

                      <FormField label="Mobile" htmlFor="phone" required error={errors.phone?.message}>
                        <Input id="phone" type="tel" {...register('phone')} error={errors.phone?.message} placeholder="98290 00000" />
                      </FormField>

                      <FormField label="Years of experience" htmlFor="experienceYears" required error={errors.experienceYears?.message}>
                        <Input id="experienceYears" type="number" min={0} {...register('experienceYears')} error={errors.experienceYears?.message} />
                      </FormField>

                      <FormField
                        label="Portfolio / résumé link"
                        htmlFor="portfolioUrl"
                        hint="Optional"
                        error={errors.portfolioUrl?.message}
                        description="Drive, Behance, LinkedIn — anything we can open."
                      >
                        <Input
                          id="portfolioUrl"
                          {...register('portfolioUrl')}
                          error={errors.portfolioUrl?.message}
                          placeholder="https://…"
                          leftIcon={<Paperclip className="h-4 w-4" />}
                        />
                      </FormField>

                      <FormField label="Anything you want us to know" htmlFor="coverNote" hint="Optional" error={errors.coverNote?.message}>
                        <Textarea id="coverNote" rows={4} {...register('coverNote')} error={errors.coverNote?.message} placeholder="A short note — what you have built, what you want to build next." />
                      </FormField>
                    </div>

                    <Button type="submit" variant="accent" size="lg" full loading={isSubmitting} className="mt-6" leftIcon={<Send className="h-4 w-4" />}>
                      Submit application
                    </Button>

                    <p className="mt-4 text-caption text-subtle">
                      Phase 1 prototype: file upload is mocked. In production this posts to the API with a signed
                      upload URL for the résumé.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

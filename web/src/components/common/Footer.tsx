import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Youtube } from 'lucide-react';
import { Button, Input, useToast } from '@/components/ui';
import { Logo } from './Logo';
import { ConsentCheckbox } from './ConsentCheckbox';
import { leadMeta } from '@/lib/consent';
import { track } from '@/lib/analytics';
import { FOOTER_NAV, ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';

/**
 * The newsletter's own consent wording, stored verbatim on the record.
 *
 * Narrower than the shared one in `lib/consent.ts`, and deliberately: that
 * sentence promises a phone call about an enquiry, which is not what this box
 * is for. Consent has to be specific to the purpose under the DPDP Act, so a
 * different purpose gets a different sentence rather than a broader one.
 */
const NEWSLETTER_CONSENT = `I agree to receive occasional project updates from ${SITE.name} by email.`;
const NEWSLETTER_CONSENT_REQUIRED = 'Please tick this so we can email you.';

const SOCIALS = [
  { label: 'Instagram', href: SITE.socials.instagram, icon: Instagram },
  { label: 'LinkedIn', href: SITE.socials.linkedin, icon: Linkedin },
  { label: 'Facebook', href: SITE.socials.facebook, icon: Facebook },
  { label: 'YouTube', href: SITE.socials.youtube, icon: Youtube },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>();
  const { push } = useToast();
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark grain relative overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[120px]"
        aria-hidden
      />

      {/* Main */}
      <div className="relative container py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-3 text-caption uppercase tracking-[0.22em] text-cyan-400">{SITE.tagline}</p>
            {/* `SITE.description` used to sit here — it is the hero sub-headline again,
                three screens later, and it was the tallest thing in this column. */}
            <p className="mt-3 font-deva text-lg text-cyan-400">{SITE.taglineHi}</p>

            <div className="mt-6 space-y-2.5">
              <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-3 py-1 text-sm text-white/70 transition-colors hover:text-cyan-400">
                <Phone className="h-4 w-4 shrink-0 text-cyan-500" /> {SITE.phone}
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 py-1 text-sm text-white/70 transition-colors hover:text-cyan-400">
                <Mail className="h-4 w-4 shrink-0 text-cyan-500" /> {SITE.email}
              </a>
              <p className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                <span>
                  {SITE.address.full}
                  <br />
                  <span className="text-caption text-white/45">{SITE.hours}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <h3 className="text-overline uppercase text-white/40">{col.heading}</h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="link-underline inline-block py-1 text-sm text-white/70 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-overline uppercase text-white/40">Stay informed</h3>
            <p className="mt-4 text-sm text-white/60">
              Practical guides on building in Jaipur — costs, timelines and the decisions that matter. No noise.
            </p>
            {/*
              This used to validate the address, fire a "Subscribed" toast and
              store nothing at all — a form that lied to every visitor who used
              it. It now writes a real lead so the address reaches the same
              inbox as every other enquiry.
            */}
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const address = email.trim();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
                  push({ kind: 'warning', title: 'Enter a valid email address' });
                  return;
                }
                if (!consent) {
                  setConsentError(NEWSLETTER_CONSENT_REQUIRED);
                  return;
                }
                setConsentError(undefined);
                try {
                  /*
                   * Imported on submit, not at module scope.
                   *
                   * The footer renders on every page, so a static import here
                   * pulls the whole services layer — adapters and all seed data —
                   * into the entry chunk. That cost 14 KB gzip at first paint to
                   * support a form almost nobody uses. Same reasoning as the
                   * dynamic jsPDF import in the estimator.
                   */
                  const { enquiriesService } = await import('@/services');
                  await enquiriesService.create({
                    name: address.split('@')[0] ?? 'Newsletter subscriber',
                    phone: '',
                    email: address,
                    serviceInterest: 'Newsletter',
                    message: 'Subscribed to the newsletter from the site footer.',
                    source: 'newsletter',
                    stage: 'new',
                    ...leadMeta(),
                    consentText: NEWSLETTER_CONSENT,
                  });
                  track('lead_submit', { source: 'newsletter', fields: 1 });
                  push({ kind: 'success', title: 'Subscribed', description: 'You will hear from us once a month at most.' });
                  setEmail('');
                  setConsent(false);
                } catch {
                  push({ kind: 'error', title: 'That did not go through', description: 'Please try again, or email us directly.' });
                }
              }}
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              />
              <Button type="submit" variant="accent" size="md" aria-label="Subscribe">
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/*
              This form has always written a real lead record, which means it has
              always needed consent — an email address collected for marketing is
              personal data under the DPDP Act exactly as a phone number is. It
              is the one capture surface whose wording differs, because nobody is
              being telephoned: `consentText` on the record says so.
            */}
            <ConsentCheckbox
              className="mt-3"
              tone="light"
              checked={consent}
              onChange={(next) => {
                setConsent(next);
                if (next) setConsentError(undefined);
              }}
              error={consentError}
            >
              {NEWSLETTER_CONSENT}
            </ConsentCheckbox>

          </div>
        </div>

        {/*
          Legal bar, now carrying the socials too.
          --------------------------------------------------------------
          Two blocks came out of here: the oversized "NEETU ARCHSTONE" watermark
          (up to 12rem tall plus an 80px margin, purely decorative) and the social
          row that sat on its own under the newsletter. Every link survives.
        */}
        <div className="mt-8 flex flex-col items-center gap-5 border-t border-white/10 pt-6 text-caption text-white/40 md:flex-row md:justify-between">
          <p className="order-3 md:order-1">
            © {year} {SITE.legalName}. All rights reserved.
          </p>

          <div className="order-1 flex gap-2 md:order-2">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-md border border-white/12 text-white/60 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500 hover:text-white"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          {/* `md:pr-16` keeps the last link clear of the fixed FloatingRail button,
              which sits over the bottom-right of the viewport. */}
          <div className="order-2 flex items-center gap-6 md:order-3 md:pr-16">
            <Link to={ROUTES.privacy} className="inline-block py-1 transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to={ROUTES.terms} className="inline-block py-1 transition-colors hover:text-white">
              Terms & Conditions
            </Link>
            <Link to={ROUTES.admin} className="inline-block py-1 transition-colors hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

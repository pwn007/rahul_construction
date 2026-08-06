import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Youtube } from 'lucide-react';
import { Button, Input, useToast } from '@/components/ui';
import { Logo } from './Logo';
import { Reveal, SplitText } from '@/components/motion';
import { FOOTER_NAV, ROUTES } from '@/constants/routes';
import { SITE } from '@/constants/site';

const SOCIALS = [
  { label: 'Instagram', href: SITE.socials.instagram, icon: Instagram },
  { label: 'LinkedIn', href: SITE.socials.linkedin, icon: Linkedin },
  { label: 'Facebook', href: SITE.socials.facebook, icon: Facebook },
  { label: 'YouTube', href: SITE.socials.youtube, icon: Youtube },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const { push } = useToast();
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark grain relative overflow-hidden bg-ink-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid-blueprint bg-grid opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[120px]"
        aria-hidden
      />

      {/* CTA band */}
      <div className="relative border-b border-white/10">
        <div className="container py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="overline">Let's build your dream</p>
              <h2 className="mt-4 text-display-md text-white">
                <SplitText text="Ready to experience hassle-free construction?" />
              </h2>
              <p className="mt-5 max-w-lead text-body-lg text-white/60">
                Connect with us today and take the first step toward building your dream space with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end">
              <Button href={ROUTES.estimator} variant="accent" size="xl" rightIcon={<ArrowUpRight className="h-4 w-4" />}>
                Get a free estimate
              </Button>
              <Button href={ROUTES.contact} variant="outline" size="xl" className="border-white/25 text-white hover:bg-white/10">
                Book a consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative container py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-4 text-caption uppercase tracking-[0.22em] text-cyan-400">{SITE.tagline}</p>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-white/55">{SITE.description}</p>
            <p className="mt-4 font-deva text-lg text-cyan-400">{SITE.taglineHi}</p>

            <div className="mt-8 space-y-3">
              <a href={`tel:${SITE.phoneRaw}`} className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-cyan-400">
                <Phone className="h-4 w-4 shrink-0 text-cyan-500" /> {SITE.phone}
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-cyan-400">
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

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <h3 className="text-overline uppercase text-white/40">{col.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="link-underline text-sm text-white/70 transition-colors hover:text-white">
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
            <p className="mt-5 text-sm text-white/60">
              Practical guides on building in Jaipur — costs, timelines and the decisions that matter. No noise.
            </p>
            <form
              className="mt-5 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes('@')) {
                  push({ kind: 'warning', title: 'Enter a valid email address' });
                  return;
                }
                push({ kind: 'success', title: 'Subscribed', description: 'You will hear from us once a month at most.' });
                setEmail('');
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

            <div className="mt-8 flex gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/12 text-white/60 transition-all duration-300 hover:border-cyan-500 hover:bg-cyan-500 hover:text-white"
                >
                  <s.icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Oversized wordmark */}
        <Reveal className="mt-20 select-none" y={40}>
          <p className="text-center font-display text-[clamp(3rem,14vw,12rem)] font-semibold leading-none tracking-tighter text-white/[0.045]">
            NEETU ARCHSTONE
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-caption text-white/40 sm:flex-row">
          <p>
            © {year} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to={ROUTES.privacy} className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to={ROUTES.terms} className="transition-colors hover:text-white">
              Terms & Conditions
            </Link>
            <Link to={ROUTES.admin} className="transition-colors hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

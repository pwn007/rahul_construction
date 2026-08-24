'use client';

import { useState } from 'react';
import { Download, FileText, Lock, Check } from 'lucide-react';
import { CtaBand, PageHero } from '@/components/common';
import { Badge, Button, Dialog, FormField, Input, Tabs, useToast } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { downloads } from '@/data/content';
import { enquiriesService } from '@/services';
import { formatNumber } from '@/lib/format';
import type { Download as DownloadItem } from '@/types/domain';

const CATEGORIES = [
  { value: 'all', label: 'All files' },
  { value: 'profile', label: 'Company profile' },
  { value: 'brochure', label: 'Brochures' },
  { value: 'catalogue', label: 'Catalogues' },
  { value: 'checklist', label: 'Guides' },
  { value: 'certificate', label: 'Certificates' },
];

export function DownloadsView() {
  const [category, setCategory] = useState('all');
  const [gated, setGated] = useState<DownloadItem | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { push } = useToast();

  const items = category === 'all' ? downloads : downloads.filter((d) => d.category === category);

  const startDownload = (item: DownloadItem) => {
    push({
      kind: 'info',
      title: `${item.title} is downloading`,
      description: 'Phase 1 prototype — files are placeholders until the client asset library is supplied.',
    });
  };

  const handleClick = (item: DownloadItem) => {
    if (item.gated) setGated(item);
    else startDownload(item);
  };

  const submitGate = () => {
    if (name.trim().length < 2 || !/^[+]?[\d\s-]{10,15}$/.test(phone.trim())) {
      setError('Please enter your name and a valid mobile number.');
      return;
    }
    /* The file is released either way; only the capture outcome is reported. */
    void enquiriesService
      .create({
        name: name.trim(),
        phone: phone.trim(),
        serviceInterest: gated?.title ?? 'Download',
        message: `Downloaded: ${gated?.title}`,
        source: 'download',
        stage: 'new',
      })
      .catch(() =>
        push({
          kind: 'error',
          title: 'Your download has started',
          description: 'We could not save your details this time — call or WhatsApp us if you would like a follow-up.',
        }),
      );

    if (gated) startDownload(gated);
    setGated(null);
    setName('');
    setPhone('');
    setError('');
  };

  return (
    <>
      <PageHero
        overline="Downloads"
        title="Everything, on paper"
        lead="Our company profile, rate card, capability statements and practical guides. Most are free to download — a couple ask for a phone number so we can follow up properly."
        breadcrumbs={[{ label: 'Downloads' }]}
        stats={[
          { value: downloads.length, label: 'Files available' },
          { value: downloads.filter((d) => !d.gated).length, label: 'Free, no details needed' },
          { value: formatNumber(downloads.reduce((s, d) => s + d.downloads, 0)), label: 'Total downloads' },
        ]}
        aside={
          <div className="space-y-3">
            {downloads.slice(0, 3).map((item, i) => (
              <div
                key={item.id}
                className="surface flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-transform duration-500"
                style={{ marginLeft: `${i * 20}px` }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="num text-caption text-subtle">
                    {item.fileType} · {item.fileSize}
                  </p>
                </div>
                {item.gated ? (
                  <Lock className="h-4 w-4 shrink-0 text-subtle" />
                ) : (
                  <Download className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
            ))}
          </div>
        }
      />

      <section className="section-sm">
        <div className="container">
          <Tabs
            tabs={CATEGORIES.map((c) => ({
              value: c.value,
              label: c.label,
              count: c.value === 'all' ? downloads.length : downloads.filter((d) => d.category === c.value).length,
            }))}
            value={category}
            onChange={setCategory}
            variant="pill"
            className="inline-flex"
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.05}>
                <div className="surface group flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-70 transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-800/90 to-navy-800/20" aria-hidden />
                    <FileText className="absolute left-5 top-5 h-7 w-7 text-white/80" />
                    {item.gated && (
                      <Badge variant="navy" size="sm" className="absolute right-4 top-4 bg-ink-950/70 backdrop-blur-sm">
                        <Lock className="h-3 w-3" /> Requires phone
                      </Badge>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-5 text-caption text-white/70">
                      <span className="num rounded bg-white/15 px-1.5 py-0.5">{item.fileType}</span>
                      <span className="num">{item.fileSize}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-heading-md font-semibold">{item.title}</h2>
                    <p className="mt-2 flex-1 text-caption leading-relaxed text-muted">{item.description}</p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                      <span className="num text-caption text-subtle">{formatNumber(item.downloads)} downloads</span>
                      <Button variant="secondary" size="sm" onClick={() => handleClick(item)} leftIcon={<Download className="h-3.5 w-3.5" />}>
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <p className="mt-8 text-caption text-subtle">
              Phase 1 prototype — download files are placeholders. Replace `fileUrl` in the downloads module of the
              admin panel once the client asset library is supplied.
            </p>
          </Reveal>
        </div>
      </section>

      <Dialog
        open={gated !== null}
        onClose={() => setGated(null)}
        title="Almost there"
        description={`Tell us where to send ${gated?.title ?? 'this file'} and we will keep you posted on anything relevant.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGated(null)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={submitGate} leftIcon={<Download className="h-4 w-4" />}>
              Get the file
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <FormField label="Your name" htmlFor="gate-name" required>
            <Input id="gate-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </FormField>
          <FormField label="Mobile number" htmlFor="gate-phone" required error={error}>
            <Input id="gate-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98290 00000" error={error} />
          </FormField>
          <p className="flex items-start gap-2 text-caption text-subtle">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
            One follow-up call at most. No marketing lists, no sharing your number.
          </p>
        </div>
      </Dialog>

      <CtaBand title="Prefer a conversation to a PDF?" lead="Book a free consultation and we will answer your questions directly." />
    </>
  );
}

import { useEffect, useState } from 'react';
import { Download, QrCode, Smartphone } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { SITE } from '@/constants/site';

/**
 * "SCAN QR" card — Port1.pdf p.24.
 *
 * The encoder is dynamically imported so the ~14 KB of QR tables only load on the
 * contact route. The code encodes the site URL exactly as the printed profile does;
 * the vCard button beside it is the genuine web upgrade — a desktop visitor can
 * save the number to their phone without typing it.
 */
export function QrCard() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const QRCode = await import('qrcode');
      const url = await QRCode.toDataURL(SITE.url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
        color: { dark: '#0A1B4DFF', light: '#00000000' },
      });
      if (!cancelled) setDataUrl(url);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const downloadVCard = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${SITE.name}`,
      `ORG:${SITE.legalName}`,
      `TITLE:${SITE.tagline}`,
      `TEL;TYPE=WORK,VOICE:${SITE.phoneRaw}`,
      `EMAIL;TYPE=WORK:${SITE.email}`,
      `ADR;TYPE=WORK:;;${SITE.address.line1};${SITE.address.city};${SITE.address.state};;${SITE.address.country}`,
      `URL:${SITE.url}`,
      'END:VCARD',
    ].join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'neetu-archstone.vcf';
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="surface rounded-xl border p-5 shadow-sm">
      {/* A 96px QR plus a non-wrapping "Save contact" button will not fit beside
          each other on a 320px screen, so the row stacks below `sm`. */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
        <div className="shrink-0 rounded-lg border bg-[rgb(var(--c-surface-2))] p-2.5">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR code linking to ${SITE.url}`} className="h-24 w-24 dark:invert" />
          ) : (
            <Skeleton className="h-24 w-24" />
          )}
        </div>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-caption uppercase tracking-wide text-subtle">
            <QrCode className="h-3.5 w-3.5" /> Scan QR
          </p>
          <p className="num mt-1 text-sm font-medium">www.neetuarchstone.com</p>
          <p className="mt-1.5 text-caption leading-relaxed text-muted">
            Point your camera here, or save our details straight to your phone.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={downloadVCard}
            leftIcon={<Smartphone className="h-3.5 w-3.5" />}
            rightIcon={<Download className="h-3.5 w-3.5" />}
          >
            Save contact
          </Button>
        </div>
      </div>
    </div>
  );
}

import type { Metadata, Viewport } from 'next';
import { SITE } from '@/constants/site';
import { AppProviders, THEME_BOOT_SCRIPT } from './providers';
import { Boot } from './Boot';
import { JsonLd } from '@/lib/seo';
import '@/styles/globals.css';

export const metadata: Metadata = {
  /* Every canonical and OG url in the app is a bare path resolved against this. */
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline} | Turnkey Construction in Jaipur`,
    /* Reproduces the old Seo component's `${title} | ${SITE.name}`. */
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  /* The .ico + PNGs are rasters of favicon.svg (regenerate them together if the
     mark changes). SVG alone left Google's favicon crawler showing a globe on
     the search result — it wants the classic formats at ≥48px far more
     reliably, and /favicon.ico 404'd. Order matters: ico first as the
     universal fallback, svg after for browsers that prefer it. */
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#03094E',
};

/** Organization + LocalBusiness graph, on every page. */
const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': ['GeneralContractor', 'LocalBusiness'],
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: SITE.phoneRaw,
  email: SITE.email,
  slogan: SITE.tagline,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.line1,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.state,
    addressCountry: 'IN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: SITE.coordinates.lat, longitude: SITE.coordinates.lng },
  openingHours: 'Mo-Sa 10:00-19:00',
  areaServed: { '@type': 'City', name: 'Jaipur' },
  sameAs: Object.values(SITE.socials),
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '4', bestRating: '5' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Blocking, and before anything paints — see THEME_BOOT_SCRIPT. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={ORGANIZATION_JSONLD} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Boot />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

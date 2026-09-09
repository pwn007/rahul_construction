import { AdminModuleScreen } from '@/features/admin/AdminModuleScreen';

/*
 * The 21 data modules, which were generated from MODULES inside a nested
 * <Routes> before. Static siblings (analytics, roles, theme)
 * outrank this segment in the App Router, so they keep their own screens.
 */

/**
 * The static export needs every /admin/{module} page enumerated at build time —
 * there is no server to resolve an unknown one later, and without this list the
 * export build refuses to compile the route at all.
 *
 * Typed out rather than derived because the source of truth,
 * `features/admin/config/modules.tsx`, is a client module ('use client') — its
 * exports reach a server file like this one as opaque client references, not
 * data. If you add a module there, ADD ITS KEY HERE TOO, or its deep link will
 * 404 on the exported site (the sidebar link will still render, which is how
 * you'll notice).
 */
const MODULE_KEYS = [
  'projects', 'services', 'blogs', 'gallery', 'testimonials', 'faqs',
  'client-logos', 'downloads', 'team', 'careers', 'applications', 'enquiries',
  'estimates', 'hero', 'home-sections', 'navbar', 'footer', 'media', 'seo',
  'users', 'settings', 'estimator-prices',
];

export function generateStaticParams() {
  return MODULE_KEYS.map((module) => ({ module }));
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <AdminModuleScreen moduleKey={module} />;
}

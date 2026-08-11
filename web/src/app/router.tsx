import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { Spinner } from '@/components/ui';

/* Public — route-level code splitting keeps the initial bundle small. */
const HomePage = lazy(() => import('@/features/home/HomePage'));
const AboutPage = lazy(() => import('@/features/about/AboutPage'));
const ServicesPage = lazy(() => import('@/features/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/features/services/ServiceDetailPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage'));
const EstimatorPage = lazy(() => import('@/features/estimator/EstimatorPage'));
const PricingPage = lazy(() => import('@/features/pricing/PricingPage'));
const VastuPage = lazy(() => import('@/features/vastu/VastuPage'));
const GalleryPage = lazy(() => import('@/features/gallery/GalleryPage'));
const CareersPage = lazy(() => import('@/features/careers/CareersPage'));
const CareerDetailPage = lazy(() => import('@/features/careers/CareerDetailPage'));
const BlogPage = lazy(() => import('@/features/blog/BlogPage'));
const PostDetailPage = lazy(() => import('@/features/blog/PostDetailPage'));
const DownloadsPage = lazy(() => import('@/features/downloads/DownloadsPage'));
const ContactPage = lazy(() => import('@/features/contact/ContactPage'));
const LegalPage = lazy(() => import('@/features/legal/LegalPage'));
const NotFoundPage = lazy(() => import('@/features/legal/NotFoundPage'));

/*
 * Portal — switched off for now.
 *
 * Commented rather than deleted: the feature is complete and this is a
 * temporary hold, so restoring it is uncommenting this import and the route
 * below, plus the five link sites listed there. Leaving the `lazy()` import
 * commented also keeps the portal chunk out of the build entirely.
 */
// const PortalRoutes = lazy(() => import('@/features/portal/PortalRoutes'));

/* Admin */
const AdminRoutes = lazy(() => import('@/features/admin/AdminRoutes'));

function RootFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function AppRouter() {
  return (
    /*
     * Outermost fallback. `PublicLayout` has its own boundary so the site chrome
     * survives a chunk load, but `/portal/*` and `/admin/*` sit outside that layout —
     * without this they suspend with no boundary above them, which React escalates to
     * the root ErrorBoundary instead of showing a loading state.
     */
    <Suspense fallback={<RootFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />

          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetailPage />} />

          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:slug" element={<ProjectDetailPage />} />

          <Route path="estimator" element={<EstimatorPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="vastu" element={<VastuPage />} />
          <Route path="gallery" element={<GalleryPage />} />

          <Route path="careers" element={<CareersPage />} />
          <Route path="careers/:slug" element={<CareerDetailPage />} />

          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<PostDetailPage />} />

          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="contact" element={<ContactPage />} />

          <Route path="privacy" element={<LegalPage kind="privacy" />} />
          <Route path="terms" element={<LegalPage kind="terms" />} />

          {/* Legacy paths from the previous site — preserve inbound links. */}
          <Route path="calculator" element={<Navigate to="/estimator" replace />} />
          <Route path="services/mep" element={<Navigate to="/services/mepf-consultancy" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/*
          Off for now. Uncomment with the import above to bring the portal back.
          Public entry points also commented, all marked "Client Portal is
          commented out":
            · constants/routes.ts — main nav (Company) and FOOTER_NAV (Resources)
            · components/common/Chrome.tsx — command palette
            · features/home/sections/Narrative.tsx — "Watch your site live"
            · data/ops.ts — admin footer-config seed
        */}
        {/* <Route path="/portal/*" element={<PortalRoutes />} /> */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </Suspense>
  );
}

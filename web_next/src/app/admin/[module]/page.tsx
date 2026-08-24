import { AdminModuleScreen } from '@/features/admin/AdminModuleScreen';

/*
 * The 21 data modules, which were generated from MODULES inside a nested
 * <Routes> before. Static siblings (analytics, estimator-config, roles, theme)
 * outrank this segment in the App Router, so they keep their own screens.
 */
export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  return <AdminModuleScreen moduleKey={module} />;
}

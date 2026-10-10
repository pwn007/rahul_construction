import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminLayout } from '@/features/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

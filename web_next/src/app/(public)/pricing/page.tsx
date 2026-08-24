import type { Metadata } from 'next';
import { PricingView } from '@/features/pricing/PricingView';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Pricing & Packages — Transparent Construction Rates',
    description:
      'Labour-only and turnkey construction rates for Jaipur. Civil ₹1,200–1,400, semi-furnished ₹1,800–2,200 and fully furnished ₹2,500–3,000 per sq ft.',
  },
  '/pricing',
);

export default function Page() {
  return <PricingView />;
}

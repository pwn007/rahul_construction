import { Seo } from '@/components/seo/Seo';
import { Hero } from './sections/Hero';
import { TrustBar, OneSystem, Approach, ServicesSection, WhyChooseUs, VastuTeaser } from './sections/Narrative';
import { LivingSystems } from './sections/LivingSystems';
import { Packages } from './sections/Packages';
import {
  FeaturedProjects,
  LatestInsights,
  ProcessSection,
  SmartConstruction,
  Testimonials,
} from './sections/Showcase';
import { SITE } from '@/constants/site';
import { IMG } from '@/lib/media';

export default function HomePage() {
  return (
    <>
      <Seo
        title="Turnkey Construction & Architecture in Jaipur"
        description={SITE.description}
        image={IMG.wide('og-home')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE.name,
          url: SITE.url,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE.url}/projects?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      <Hero />
      <TrustBar />
      <OneSystem />
      <Approach />
      <ServicesSection />
      {/* MEPF gets its moment straight after the five pillars are introduced. */}
      <LivingSystems />
      <FeaturedProjects />
      <ProcessSection />
      <WhyChooseUs />
      {/* Achievements moved into the hero rail — repeating the same four numbers
          twice on one page weakened both. Still used on /about. */}
      <VastuTeaser />
      <SmartConstruction />
      <Testimonials />
      {/* Published rates answer the question first-time visitors actually arrive with.
          Each card routes into the estimator with the package pre-selected. */}
      <Packages />
      <LatestInsights />
    </>
  );
}

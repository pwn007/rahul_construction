import { Seo } from '@/components/seo/Seo';
import { Hero } from './sections/Hero';
import { TrustBar, OneSystem, WhyChooseUs } from './sections/Narrative';
import { BuildingSystems } from '@/components/common';
// Published rates are hidden for now — see the commented `<Packages />` below.
// import { Packages } from './sections/Packages';
import { FeaturedProjects, ProcessSection, Testimonials } from './sections/Showcase';
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

      {/*
        Eight sections, down from fourteen.
        --------------------------------------------------------------
        The page was not long because any one section was verbose — it was long
        because four of them made the same argument. `Approach` restated
        `OneSystem`; `SmartConstruction` restated process step 04; `VastuTeaser`
        and `LatestInsights` were full sections for pages that already exist.

        What is left is one pass down the funnel with no repetition:
          who we are → what we have built → how we work → why us →
          who vouches for us.

        The pass used to end on "what it costs"; that section is commented out at
        the bottom of this file while published rates are hidden.

        Nothing was deleted from the site. `LivingSystems` moved to
        /services/mepf-consultancy, Vastu and the live cameras are linked from
        `WhyChooseUs`, and the "What we offer" grid came out in favour of the
        /services page itself. Testimonials were briefly folded into `WhyChooseUs`
        and are back on their own band.
      */}
      <Hero />
      <TrustBar />
      <OneSystem />
      {/* Expands the "Engineering" leg OneSystem just named — MEPF is the firm's
          core discipline and the one a visitor is least likely to picture. */}
      <BuildingSystems />
      <FeaturedProjects />
      <ProcessSection />
      <WhyChooseUs />
      {/* The claims, then the people backing them. This band is `--c-surface-2`,
          and with `Packages` switched off below it is now the page's last one —
          the tint carries straight into the footer, which is fine, but restoring
          `Packages` is what puts it back between two sections on page ground. */}
      <Testimonials />
      {/*
        Published rates, hidden at the client's request.

        The section itself and every link into `/pricing` were commented out
        together — see `constants/routes.ts` for the nav and footer entries, and
        `components/common/Chrome.tsx`, `features/estimator/EstimatorPage.tsx`
        and `features/legal/NotFoundPage.tsx` for the rest. The `/pricing` route
        is still live and unchanged; nothing links to it. Uncomment this line and
        the import above to bring the rates back.
      */}
      {/* <Packages /> */}
    </>
  );
}

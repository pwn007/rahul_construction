/**
 * Privacy and Terms copy.
 *
 * Split out of LegalView so the server route files can read `title` and `lead`
 * for their metadata — every export of a 'use client' module is a client
 * reference, not a value the build can read.
 */

import { SITE } from '@/constants/site';

export const LEGAL_CONTENT: Record<'privacy' | 'terms', { title: string; lead: string; sections: { heading: string; body: string[] }[] }> = {
  privacy: {
    title: 'Privacy Policy',
    lead: 'What we collect, why we collect it, and what we will never do with it.',
    sections: [
      {
        heading: 'What we collect',
        body: [
          'When you submit an enquiry, use the cost estimator, download a gated document or apply for a role, we collect the details you enter — typically your name, mobile number and, optionally, your email address and a description of your project.',
      /* This used to claim we collect anonymous usage analytics. There is no
         analytics code on this site — no GA, no GTM, no pixel — so the claim
         was untrue. Restore an accurate sentence if tracking is ever added. */
      'We do not run any third-party analytics, advertising pixels or cross-site trackers on this website. Nothing you do here is shared with an advertising network.',
        ],
      },
      {
        heading: 'Why we collect it',
        body: [
          'To respond to your enquiry and prepare a relevant proposal.',
          'To send you the file or estimate you asked for.',
          'To assess your application if you have applied for a role.',
          'To understand which parts of this site are useful and which are not.',
        ],
      },
      {
        heading: 'What we do not do',
        body: [
          'We do not sell, rent or trade your contact details to anyone.',
          'We do not add you to a marketing list without your consent.',
          'We do not share your project details with third parties other than the suppliers and consultants working directly on your project.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'Enquiry and estimate data is retained for three years so we can maintain continuity if you return to us. Job applications are retained for one year. You can ask us to delete your data at any time and we will do so within thirty days.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'This site uses only functional storage — your theme preference and your in-progress estimator draft, both stored in your own browser. No advertising or cross-site tracking cookies are set.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          `For any privacy question, or to request deletion of your data, write to ${SITE.email} or call ${SITE.phone}.`,
        ],
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    lead: 'The basis on which this website and our estimates are provided.',
    sections: [
      {
        heading: 'About this website',
        body: [
          `This website is operated by ${SITE.legalName}, ${SITE.address.full}. By using it you accept these terms.`,
        ],
      },
      {
        heading: 'Cost estimates are indicative',
        body: [
          'The construction cost estimator provides an indicative budgeting range based on our published rate card and the inputs you supply. It is not a quotation and does not constitute an offer.',
          'Final project cost is established only after site inspection, soil testing where required, approved drawings and a signed bill of quantities. Rates shown exclude GST and exclude government, JDA and municipal approval and development charges.',
        ],
      },
      {
        heading: 'Project imagery',
        body: [
          'Project photographs, renders and case-study narratives are illustrative of our work. Specifications, materials and outcomes vary by project and are defined in each individual agreement.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'All content on this site — text, imagery, drawings and design — is the property of the company and may not be reproduced without written permission.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'We take care to keep the information on this site accurate and current, but we do not warrant that it is free from error. We are not liable for decisions taken solely on the basis of information published here without a written agreement.',
        ],
      },
      {
        heading: 'Governing law',
        body: ['These terms are governed by the laws of India, with jurisdiction in the courts of Jaipur, Rajasthan.'],
      },
    ],
  },
};

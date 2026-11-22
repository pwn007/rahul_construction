import { ROUTES } from '@/constants/routes';

/*
 * Every word of the home page, as the client's Figma Make design prints it
 * ("Interactive Neetu Archstone Slides", v10, Nov 2026). One file, so the
 * dummies they mean to replace later are a one-file change.
 *
 * Kept verbatim, dummies included: the two holding bands, the figures (300+
 * clients, not the 98% used elsewhere) and the footer's "Vatika Road" address.
 * The client stories are not here: they are the real recorded testimonials
 * from Admin → Client videos (ClientStories.tsx). Only their spelling slips are corrected
 * (the user's call, 19 and 22 Nov 2026): WITN, Desiging, acutually,
 * Bussinesses, managment.
 */

export const LOGO_LINE = 'DESIGN.BUILD.DELIVER';

export const HERO = {
  /* Navy, with these two words in cyan. */
  taglineHi: ['नक्शे ', 'से', ' निर्माण ', 'तक'],
  title: ['We Design The Look.', 'We Build The Strength.'],
  accent: 'We Engineer The Heartbeat.',
  sub: 'From blueprint to final handover-complete home building with zero daily stress.',
  primary: { label: 'BOOK FREE CONSULTATION', href: '#consultation' },
  secondary: { label: 'VIEW MEPF', href: ROUTES.service('mepf-consultancy') },
  image: { src: '/images/home/hero-bedroom.webp', width: 1890, height: 1786, alt: 'Luxury bedroom interior' },
};

export const BRANDS = {
  title: 'WE BUILD WITH MATERIAL YOU ALREADY TRUST',
  logos: [
    { name: 'JSW', src: '/images/home/jsw.png', w: 226, h: 123, height: 'h-[5.4vw]' },
    { name: 'Kajaria', src: '/images/home/kajaria.png', w: 294, h: 152, height: 'h-[5.6vw]' },
    { name: 'Ambuja Cement', src: '/images/home/ambuja.png', w: 130, h: 160, height: 'h-[6vw]' },
    { name: 'Tata Steel', src: '/images/home/tata.png', w: 449, h: 81, height: 'h-[4.4vw]' },
  ],
};

export const STATS = [
  { value: 80, label: 'PROJECT\nDELIVERED' },
  { value: 30, label: 'YEARS\nEXPERIENCE' },
  { value: 10, label: 'SKILLED\nPROFESSIONALS' },
  { value: 300, label: 'CLIENTS\nSATISFIED' },
];

export const WHAT_WE_DO = {
  eyebrow: 'What We Do',
  title: ['Hand us One Part, ', 'or The Whole Build.'],
  lede: 'Combining on-site experience with modern technology to design, engineer, and construct spaces that function smoothly and are built to last.',
  cta: 'EXPLORE SERVICE',
  cards: [
    {
      title: 'Project Management & Tracking',
      tagline: 'Complete tracking from first blueprint to final handover.',
      points: ['Design & Drawing Coordination', 'BOQ, Budget & Material Tracking', 'On-site Quality & Milestone Audits', 'Scheduled Handover & Reporting'],
      href: ROUTES.service('project-management'),
    },
    {
      title: 'Architectural Designing',
      tagline: 'Plans your site actually build from.',
      points: ['2D/3D Floor Plans', 'Vastu Planning', '3D Exterior Elevations', 'Structural Drawings'],
      href: ROUTES.service('architectural-design'),
    },
    {
      title: 'MEPF Engineering',
      tagline: 'Heartbeat of your building.',
      points: ['HVAC Design', 'Electrical Load & Routing', 'Plumbing & Drainage', 'Fire Safety Systems'],
      href: ROUTES.service('mepf-consultancy'),
    },
    {
      title: 'Interior Design & Execution',
      tagline: 'Functional spaces designed for everyday living.',
      points: ['3D Interior Renders', 'Space & Furniture Layout', 'Lighting & False Ceiling', 'Material Selection'],
      href: ROUTES.service('interior-design'),
    },
  ],
};

/* The two holding bands — words only, until the client designs them. */
export const WORKFLOW_PLACEHOLDER = ['WORK FLOW', 'HOW WE WORK', 'UNDER DISCUSSION'];
export const SELECTED_WORK_PLACEHOLDER = 'SELECTED WORK';

export const CONSULTATION = {
  eyebrow: 'WHY NEETU ARCHSTONE',
  title: ['Excellence in Design & Engineering.', 'Hassle-Free Execution.'],
  sub: 'Start here — let’s design and build together.',
  labels: {
    name: 'Name*',
    email: 'Email *',
    phone: 'Phone number*',
    size: 'Project Size (in sq. ft.)',
    type: 'Type of Project',
    scope: 'Required Scope',
  },
  placeholders: { name: 'enter your name.', email: 'you@company.com', size: 'e.g. 3000 sq. ft.' },
  submit: 'BOOK FREE CONSULTATION',
  /* The design shows these as free-text boxes whose hint lists the choices;
     here they are dropdowns that look the same until opened (user, 22 Nov). */
  types: ['Residential Home / Villa', 'Residential Renovation / Remodel', 'Commercial Building'],
  typesHint: 'Residential Home / Villa · Residential Renovation / Remodel · Commercial Building',
  scopes: ['Project management & tracking', 'Design', 'Complete Turnkey'],
  scopesHint: 'Project management & tracking / Design / Complete Turnkey',
  /*
   * Not in the design: it has no consent box, and the user chose to keep it
   * that way (19 Nov 2026), so submitting is the affirmative act and this line
   * says what it agrees to. Stored verbatim on the lead as its `consentText`,
   * the way the footer newsletter records its own wording.
   */
  notice: 'By submitting, you agree to be contacted by Neetu Archstone about this enquiry, including on WhatsApp.',
};

export const TESTIMONIAL = {
  eyebrow: 'WHAT OUR CLIENTS SAY',
  title: ['Trusted by', 'Homeowners', 'and Businesses alike.'],
  lede: 'Four projects, four Families and the part they choose to say out loud.',
  quote:
    'Working with Neetu Archstone was a seamless experience. Their modern design approach and attention to detail transformed our vision into reality. Highly recommended for anyone looking for innovative construction solutions.',
  name: 'Dr. A. A. Pathan',
  place: 'Malviya Nagar',
  project: { label: 'Garden House', href: ROUTES.project('malviya-nagar-garden-house') },
};

export const FOOTER = {
  address: 'Vatika Road, Jaipur, Rajasthan',
  phone: '7014934752',
  email: 'Neetuarchstone@gmail.com',
  columns: [
    {
      heading: 'SERVICES',
      links: [
        { label: 'Project Management & tracking', href: ROUTES.service('project-management') },
        { label: 'Architectural Design', href: ROUTES.service('architectural-design') },
        { label: 'MEPF Consultancy', href: ROUTES.service('mepf-consultancy') },
        { label: 'Interior Design', href: ROUTES.service('interior-design') },
      ],
    },
    {
      heading: 'RESOURCES',
      links: [
        { label: 'Cost Estimator', href: ROUTES.estimator },
        { label: 'Gallery', href: ROUTES.gallery },
        { label: 'Downloads', href: ROUTES.downloads },
      ],
    },
    {
      heading: 'COMPANY',
      links: [
        { label: 'About Us', href: ROUTES.about },
        { label: 'Projects', href: ROUTES.projects },
        { label: 'Vastu Planning', href: ROUTES.vastu },
        { label: 'Careers', href: ROUTES.careers },
        { label: 'Insights', href: ROUTES.blog },
      ],
    },
  ],
  /* The design sets two spaces here. */
  follow: 'FOLLOW  US',
  legal: '© 2026 NEETU ARCHSTONE. ALL RIGHTS RESERVED.',
  sign: 'DESIGN. BUILD. DELIVER.',
};

/** Company facts — sourced verbatim from the portfolio PDF (Port1.pdf). */

export const SITE = {
  name: 'Neetu Archstone',
  legalName: 'Neetu Archstone',
  wordmark: { primary: 'Neetu', secondary: 'ARCHSTONE' },
  tagline: 'Design · Build · Deliver',
  /**
   * The three steps, as the firm says them out loud.
   *
   * The hero prints these as captions, one under each station of its
   * illustrated site, so it needs them as items. "We" is deliberate and is not
   * padding: "Design · Build · Deliver" is a list of services, while "We Design
   * · We Build · We Deliver" is a claim about who does them — which is the whole
   * point of showing all three under one roof.
   */
  taglineSteps: ['We Design', 'We Build', 'We Deliver'],
  taglineHi: 'नक़्शे से निर्माण तक',
  headline: 'Building Dreams',
  promise: 'From idea to reality, without the hassle.',
  mission: 'You Relax, We Build',
  vastuLine: 'Right Direction, Happy Living',
  description:
    'Architecture, MEPF engineering, turnkey construction and interiors combined into one seamless system — with Vastu-aligned planning, transparent pricing and a single point of responsibility.',
  url: 'https://www.neetuarchstone.com',
  phone: '+91 70149 34752',
  phoneRaw: '+917014934752',
  whatsapp: '917014934752',
  email: 'neetuarchstone@gmail.com',
  address: {
    line1: 'India Gate',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    full: 'India Gate, Jaipur, Rajasthan',
  },
  hours: 'Mon – Sat, 10:00 AM – 7:00 PM',
  coordinates: { lat: 26.9124, lng: 75.7873 },
  socials: {
    instagram: 'https://instagram.com/neetuarchstone',
    facebook: 'https://facebook.com/neetuarchstone',
    linkedin: 'https://linkedin.com/company/neetuarchstone',
    youtube: 'https://youtube.com/@neetuarchstone',
  },
} as const;

/** Achievements — PDF page 22. */
export const ACHIEVEMENTS = [
  { value: 80, suffix: '+', label: 'Projects Delivered', icon: 'Building2' },
  { value: 30, suffix: '+', label: 'Years Combined Experience', icon: 'Clock' },
  { value: 10, suffix: '+', label: 'Skilled Professionals', icon: 'Users' },
  { value: 98, suffix: '%', label: 'Client Satisfaction', icon: 'Sparkles' },
] as const;

/**
 * Differentiators — PDF page 4.
 *
 * ⚠️ Not rendered anywhere. These four were the `WhyChooseUs` cards on the home
 * page; that section was merged into `OneSystem`, where each claim now hangs off
 * the discipline that actually owns it (quality → Engineering, transparency →
 * Execution, on-time → Handover) and "Zero Chaos" is the headline itself. Kept
 * because it is PDF-sourced copy, not because anything reads it.
 */
export const DIFFERENTIATORS = [
  {
    key: 'transparency',
    title: 'Transparency',
    description: 'Clear costs, clear timelines, clear updates. You always know where your money and your building stand.',
    icon: 'ClipboardCheck',
  },
  {
    key: 'quality',
    title: 'Quality',
    description: 'High standards in materials and execution, verified at every stage by our own site engineers.',
    icon: 'ShieldCheck',
  },
  {
    key: 'timely',
    title: 'Timely Delivery',
    description: 'Projects delivered on schedule against a milestone plan agreed before we break ground.',
    icon: 'CalendarClock',
  },
  {
    key: 'zero-chaos',
    title: 'Zero Chaos',
    description: 'One team, one contract, one point of responsibility. No contractor blame games.',
    icon: 'Workflow',
  },
] as const;

/** Our Approach — PDF page 3. */
export const APPROACH = {
  statement:
    'From concept to completion, every step is aligned under one system. Our integrated MEPF services ensure that technical execution is efficient, accurate, and future-ready.',
  focus: [
    {
      key: 'smart-planning',
      title: 'Smart planning',
      description: 'Every decision sequenced before site, so the programme survives contact with reality.',
      icon: 'ClipboardList',
    },
    {
      key: 'modern-engineering',
      title: 'Modern engineering',
      description: 'Structure and MEPF calculated and coordinated, not estimated by habit.',
      icon: 'Lightbulb',
    },
    {
      key: 'transparent-execution',
      title: 'Transparent execution',
      description: 'Documented stages, live cameras and weekly reporting — nothing happens out of your sight.',
      icon: 'FileBarChart',
    },
  ],
} as const;

/**
 * What Makes Us Different — PDF page 22. Distinct from the four differentiators
 * on page 4.
 *
 * ⚠️ Not rendered anywhere, for the same reason as `DIFFERENTIATORS` above —
 * these five were the chips in `WhyChooseUs`, and each of them restated a claim
 * the page already made somewhere else.
 */
export const WHAT_MAKES_US_DIFFERENT = [
  'Single point of responsibility',
  'Integrated MEPF solutions',
  'Transparent pricing structure',
  'Strong project management',
  'Commitment to quality and durability',
] as const;

/*
  MEPF_MATTERS — the PDF's page 19 benefit list — was removed rather than moved.

  Seven bullets of the "cost efficiency through optimized energy use" kind. All
  defensible and none of them specific, and they were sitting directly beneath
  the `without` copy in data/mepf.ts, which says the same things in terms of a
  bedroom at 34°C and a stack that gurgles. Against that, generalities read as
  padding. If a benefit list is ever wanted again, it is on page 19 of the PDF.
*/

/** MEPF by segment — PDF pages 16 (residential) and 17 (commercial). */
export const MEPF_SEGMENTS = [
  {
    key: 'residential',
    label: 'Residential projects',
    heading: 'Why MEPF is essential for homes',
    statement:
      'In residential construction, MEPF systems directly impact comfort, safety, and efficiency. From maintaining indoor climate to ensuring clean water and fire protection, these systems are essential for modern living.',
    benefits: [
      'Energy efficiency reduces utility costs',
      'Proper ventilation improves health and comfort',
      'Fire safety systems protect your family',
      'Smart systems enhance convenience',
    ],
    icon: 'Home',
  },
  {
    key: 'commercial',
    label: 'Commercial projects',
    heading: 'Why MEPF is essential for commercial spaces',
    statement:
      'Commercial spaces require robust and scalable infrastructure to handle higher usage and strict regulations. Our MEPF solutions ensure operational efficiency and long-term reliability.',
    benefits: [
      '24/7 operational reliability',
      'Compliance with safety standards',
      'Scalable systems for future growth',
      'Energy-efficient operations',
    ],
    icon: 'Building2',
  },
] as const;

/** Service model & turnkey framing — PDF pages 14 and 15. */
export const COMMERCIAL_MODEL = {
  flexibleIntro: 'Our flexible service model allows you to choose the level of involvement and control you prefer.',
  turnkeyIntro:
    'Our turnkey model is designed for complete convenience. From sourcing materials to final execution, we handle every aspect of construction.',
  turnkeyClosing: 'Sit back and watch your dream home take shape.',
} as const;

/** Services intro — PDF page 5. */
export const SERVICES_INTRO =
  'We provide end-to-end construction services tailored to meet diverse project needs — from concept design to final execution.';

/**
 * Process — PDF page 7.
 *
 * Descriptions are deliberately short (≈80 characters). They render in a
 * six-across rail on the home page, so anything longer turns each column into a
 * paragraph and the process stops being readable at a glance.
 */
export const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Understanding Your Vision',
    description: 'Your requirements, lifestyle and goals — mapped before a single line is drawn.',
    icon: 'Target',
  },
  {
    step: 2,
    title: 'Design & Planning',
    description: 'Aesthetics, function and Vastu resolved together, and signed off before anything is issued to site.',
    icon: 'PencilRuler',
  },
  {
    step: 3,
    title: 'Integrated Execution',
    description: 'Civil, MEPF and interiors under one system, so nothing falls between the gaps.',
    icon: 'Hammer',
  },
  {
    step: 4,
    title: 'Regular Updates',
    description: 'Progress every week, plus live camera access to your site from anywhere.',
    icon: 'RefreshCw',
  },
  {
    step: 5,
    title: 'On-Time Delivery',
    description: 'Snagging closed and every item on the checklist cleared before you are given the keys.',
    icon: 'CircleCheck',
  },
  {
    step: 6,
    title: 'Free Maintenance',
    description: 'Twelve months of service after you move in, at no cost, on the same phone number.',
    icon: 'Wrench',
  },
] as const;

/** MEPF disciplines — PDF page 18. */
export const MEPF_DISCIPLINES = [
  {
    key: 'mechanical',
    title: 'Mechanical (HVAC)',
    description: 'Efficient climate control systems ensuring comfort and air quality.',
    detail: 'Centralised and split air conditioning, ventilation design, heat load calculation, duct routing and building automation.',
    icon: 'Fan',
  },
  {
    key: 'electrical',
    title: 'Electrical',
    description: 'Safe and reliable power distribution and lighting systems.',
    detail: 'Load estimation, panel and cable sizing, earthing, lighting design, backup power and smart automation readiness.',
    icon: 'Zap',
  },
  {
    key: 'plumbing',
    title: 'Plumbing',
    description: 'Clean water supply and efficient drainage solutions.',
    detail: 'Supply and drainage layouts, pump sizing, water heating, rainwater harvesting and waterproofing coordination.',
    icon: 'Droplets',
  },
  {
    key: 'fire',
    title: 'Fire Fighting',
    description: 'Advanced fire detection and protection systems.',
    detail: 'Detection and alarm design, sprinkler and hydrant networks, extinguisher placement and evacuation planning.',
    icon: 'FlameKindling',
  },
] as const;

/** Vastu benefits — PDF page 20. */
export const VASTU_BENEFITS = [
  'Enhances mental peace and positivity',
  'Supports financial growth and stability',
  'Improves health and relationships',
  'Creates a balanced and harmonious living environment',
] as const;

/** Smart construction — PDF page 21. */
export const SMART_CONSTRUCTION = [
  {
    title: 'Live Site Monitoring',
    description: 'Access real-time updates of your construction site from anywhere.',
    icon: 'Video',
  },
  {
    title: 'Regular Progress Tracking',
    description: 'Continuous monitoring to ensure work is progressing as planned.',
    icon: 'Activity',
  },
  {
    title: 'Quality Checks at Every Stage',
    description: 'Site supervision by qualified engineers to maintain construction standards.',
    icon: 'BadgeCheck',
  },
  {
    title: 'Transparency & Accountability',
    description: 'Clear visibility reduces miscommunication and delays.',
    icon: 'Eye',
  },
] as const;

export const ROUTES = {
  home: '/',
  about: '/about',
  services: '/services',
  service: (slug: string) => `/services/${slug}`,
  projects: '/projects',
  project: (slug: string) => `/projects/${slug}`,
  estimator: '/estimator',
  pricing: '/pricing',
  vastu: '/vastu',
  gallery: '/gallery',
  careers: '/careers',
  career: (slug: string) => `/careers/${slug}`,
  blog: '/blog',
  post: (slug: string) => `/blog/${slug}`,
  downloads: '/downloads',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',

  portal: '/portal',
  portalOverview: '/portal/overview',
  portalTimeline: '/portal/timeline',
  portalDocuments: '/portal/documents',
  portalInvoices: '/portal/invoices',
  portalUpdates: '/portal/updates',

  admin: '/admin',
} as const;

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  badge?: string;
  children?: NavLink[];
  /**
   * A heading for its dropdown rather than a link to a page.
   *
   * The desktop navbar renders every top-level item as a link, so an item whose
   * own page should not be reachable needs saying so explicitly — `href` stays
   * put, and setting this flag is what stops it being rendered. See `Pricing`.
   */
  menuOnly?: boolean;
}

export const MAIN_NAV: NavLink[] = [
  {
    label: 'Services',
    href: ROUTES.services,
    children: [
      { label: 'Architectural Design', href: ROUTES.service('architectural-design'), description: 'Concept to working drawings, Vastu-aligned.' },
      { label: 'MEPF Consultancy', href: ROUTES.service('mepf-consultancy'), description: 'Mechanical, electrical, plumbing & fire — see what it actually does.', badge: 'New' },
      { label: 'Interior Design & Execution', href: ROUTES.service('interior-design'), description: 'Modular kitchens, wardrobes, ceilings.' },
      { label: 'Project Management & Tracking', href: ROUTES.service('project-management'), description: 'Live monitoring and milestone control.' },
    ],
  },
  {
    label: 'Projects',
    href: ROUTES.projects,
    children: [
      { label: 'All Projects', href: ROUTES.projects, description: 'Filter by market, locality and year.' },
      { label: 'Gallery', href: ROUTES.gallery, description: 'Photos, video, drone and 360° walkthroughs.' },
      { label: 'Vastu Planning', href: ROUTES.vastu, description: 'Right direction, happy living.' },
    ],
  },
  {
    label: 'Pricing',
    /*
      Published rates are hidden for now, so nothing here may reach `/pricing`.

      Commenting out the "Packages & Rates" child alone would have achieved
      nothing: it pointed at the same `href` as this parent, which the navbar
      renders as a link. Hence `menuOnly` — the label still opens the dropdown,
      it just no longer navigates, and the mega menu drops its "View all" link
      too. `href` is left in place so restoring the page is one deleted flag.

      Landing-page section: features/home/HomePage.tsx.
    */
    href: ROUTES.pricing,
    menuOnly: true,
    children: [
      // Packages & Rates is commented out for now — see the note above.
      // { label: 'Packages & Rates', href: ROUTES.pricing, description: 'Labour-only and turnkey models compared.' },
      { label: 'Cost Estimator', href: ROUTES.estimator, description: 'Get an instant costed estimate + PDF.', badge: 'New' },
      { label: 'Downloads', href: ROUTES.downloads, description: 'Company profile, brochure, rate card.' },
    ],
  },
  {
    label: 'Company',
    href: ROUTES.about,
    children: [
      { label: 'About Us', href: ROUTES.about, description: 'Our story, values and leadership.' },
      { label: 'Careers', href: ROUTES.careers, description: 'Build with us.' },
      { label: 'Insights', href: ROUTES.blog, description: 'Guides on building in Jaipur.' },
      // Client Portal is commented out for now — see app/router.tsx.
      // { label: 'Client Portal', href: ROUTES.portal, description: 'Track your project live.' },
    ],
  },
  { label: 'Contact', href: ROUTES.contact },
];

export const FOOTER_NAV = [
  {
    heading: 'Services',
    links: [
      { label: 'Architectural Design', href: ROUTES.service('architectural-design') },
      { label: 'MEPF Consultancy', href: ROUTES.service('mepf-consultancy') },
      { label: 'Interior Design', href: ROUTES.service('interior-design') },
      { label: 'Project Management', href: ROUTES.service('project-management') },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: ROUTES.about },
      { label: 'Projects', href: ROUTES.projects },
      { label: 'Vastu Planning', href: ROUTES.vastu },
      { label: 'Careers', href: ROUTES.careers },
      { label: 'Insights', href: ROUTES.blog },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Cost Estimator', href: ROUTES.estimator },
      // Pricing & Packages is commented out for now — published rates are hidden;
      // see the Pricing entry in MAIN_NAV above.
      // { label: 'Pricing & Packages', href: ROUTES.pricing },
      { label: 'Gallery', href: ROUTES.gallery },
      { label: 'Downloads', href: ROUTES.downloads },
      // Client Portal is commented out for now — see app/router.tsx.
      // { label: 'Client Portal', href: ROUTES.portal },
    ],
  },
] as const;

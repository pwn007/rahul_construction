import type {
  Application,
  Banner,
  Enquiry,
  EstimateRequest,
  FooterColumn,
  HomeSection,
  MediaAsset,
  NavItem,
  Role,
  SeoMeta,
  Setting,
  User,
} from '@/types/domain';
import { IMG, monogram } from '@/lib/media';

const meta = (id: string, createdAt: string, status: 'draft' | 'published' | 'archived' = 'published') => ({
  id,
  createdAt,
  updatedAt: createdAt,
  status,
});

const day = (offset: number) => new Date(Date.UTC(2026, 6, 30 - offset, 9, 30)).toISOString();

/* ==================================================================== */
/* Leads                                                                 */
/* ==================================================================== */

export const enquiries: Enquiry[] = [
  { ...meta('enq_1', day(0)), name: 'Sunil Choudhary', phone: '+91 98290 11223', email: 'sunil.c@example.com', serviceInterest: 'Turnkey Construction', city: 'Jaipur', budget: '₹60 – 80 L', message: 'Have a 30×50 plot in Vaishali Nagar. Looking for G+1, want to start after Diwali.', source: 'contact-form', stage: 'new' },
  { ...meta('enq_2', day(0)), name: 'Meenakshi Rathore', phone: '+91 99285 44551', email: 'meenakshi.r@example.com', serviceInterest: 'Interior Design', city: 'Jaipur', budget: '₹20 – 30 L', message: '3 BHK apartment in Mansarovar, possession next month. Need full interiors.', source: 'contact-form', stage: 'new' },
  { ...meta('enq_3', day(1)), name: 'Deepak Agarwal', phone: '+91 94140 77812', serviceInterest: 'MEPF Consultancy', city: 'Jaipur', budget: 'Not sure', message: 'Building a 3-floor commercial complex on Tonk Road, need MEPF design only.', source: 'contact-form', stage: 'contacted' },
  { ...meta('enq_4', day(2)), name: 'Ritu Sharma', phone: '+91 98871 20034', email: 'ritu.sharma@example.com', serviceInterest: 'Turnkey Construction', city: 'Jaipur', budget: '₹40 – 60 L', message: 'Saw the Mansarovar project. Similar size plot. Please call after 6 pm.', source: 'estimator', stage: 'qualified' },
  { ...meta('enq_5', day(3)), name: 'Abdul Rahman', phone: '+91 90013 55620', email: 'a.rahman@example.com', serviceInterest: 'Architectural Design', city: 'Ajmer', budget: '₹10 L (design only)', message: 'Design-only engagement for a plot in Ajmer. Do you take work outside Jaipur?', source: 'contact-form', stage: 'proposal' },
  { ...meta('enq_6', day(4)), name: 'Karan Vyas', phone: '+91 93520 88104', serviceInterest: 'Turnkey Construction', city: 'Jaipur', budget: '₹80 L – 1 Cr', message: 'NRI, currently in Dubai. Need someone who can handle everything end to end.', source: 'estimator', stage: 'won' },
  { ...meta('enq_7', day(6)), name: 'Pooja Jain', phone: '+91 97993 61120', email: 'pooja.j@example.com', serviceInterest: 'Interior Design', city: 'Jaipur', budget: '₹15 – 20 L', message: 'Just exploring options for now.', source: 'download', stage: 'lost' },
  { ...meta('enq_8', day(7)), name: 'Mohit Saini', phone: '+91 96020 74413', serviceInterest: 'Project Management', city: 'Jaipur', message: 'Already have a contractor, want independent supervision and reporting.', source: 'contact-form', stage: 'contacted' },
];

export const estimateRequests: EstimateRequest[] = [
  { ...meta('est_1', day(0)), name: 'Ritu Sharma', phone: '+91 98871 20034', email: 'ritu.sharma@example.com', propertyType: 'residential', areaPerFloor: 1080, areaUnit: 'sqft', floors: 2, packageType: 'semi-furnished', qualityTier: 'signature', location: 'mansarovar', enhancements: ['modular-kitchen', 'false-ceiling'], builtUpArea: 2160, totalMin: 4243000, totalMax: 4874000, timelineWeeks: 36, stage: 'qualified' },
  { ...meta('est_2', day(1)), name: 'Karan Vyas', phone: '+91 93520 88104', propertyType: 'residential', areaPerFloor: 1728, areaUnit: 'sqft', floors: 3, packageType: 'fully-furnished', qualityTier: 'bespoke', location: 'c-scheme', enhancements: ['modular-kitchen', 'wardrobes', 'home-automation', 'lift'], builtUpArea: 5184, totalMin: 18420000, totalMax: 21160000, timelineWeeks: 58, stage: 'converted' },
  { ...meta('est_3', day(2)), name: 'Aakash Gupta', phone: '+91 89550 33210', email: 'aakash.g@example.com', propertyType: 'commercial', areaPerFloor: 2160, areaUnit: 'sqft', floors: 3, packageType: 'civil', qualityTier: 'essential', location: 'sanganer', enhancements: ['waterproofing', 'elevation'], builtUpArea: 6480, totalMin: 8104000, totalMax: 9310000, timelineWeeks: 48, stage: 'contacted' },
  { ...meta('est_4', day(3)), name: 'Nisha Bhargava', phone: '+91 91166 45520', propertyType: 'interior-only', areaPerFloor: 1800, areaUnit: 'sqft', floors: 1, packageType: 'fully-furnished', qualityTier: 'signature', location: 'vaishali-nagar', enhancements: ['modular-kitchen', 'wardrobes', 'false-ceiling'], builtUpArea: 1800, totalMin: 5920000, totalMax: 6800000, timelineWeeks: 18, stage: 'new' },
  { ...meta('est_5', day(4)), name: 'Suresh Yadav', phone: '+91 94610 20087', propertyType: 'residential', areaPerFloor: 144, areaUnit: 'sqyd', floors: 2, packageType: 'civil', qualityTier: 'essential', location: 'jhotwara', enhancements: ['boundary-wall'], builtUpArea: 2592, totalMin: 3208000, totalMax: 3686000, timelineWeeks: 32, stage: 'new' },
  { ...meta('est_6', day(5)), name: 'Farida Khan', phone: '+91 90790 11556', email: 'farida.k@example.com', propertyType: 'mixed-use', areaPerFloor: 1872, areaUnit: 'sqft', floors: 3, packageType: 'semi-furnished', qualityTier: 'signature', location: 'malviya-nagar', enhancements: ['elevation', 'waterproofing', 'lift'], builtUpArea: 5616, totalMin: 12440000, totalMax: 14290000, timelineWeeks: 52, stage: 'contacted' },
];

export const applications: Application[] = [
  { ...meta('app_1', day(1)), jobId: 'job_arch', jobTitle: 'Senior Architect', name: 'Ankita Bhandari', email: 'ankita.b@example.com', phone: '+91 98330 11002', experienceYears: 6, resumeUrl: '#', coverNote: 'Six years in residential practice in Jaipur, strong working-drawing background.', stage: 'interview' },
  { ...meta('app_2', day(2)), jobId: 'job_arch', jobTitle: 'Senior Architect', name: 'Ravi Prakash', email: 'ravi.p@example.com', phone: '+91 96500 21114', experienceYears: 5, resumeUrl: '#', stage: 'screening' },
  { ...meta('app_3', day(2)), jobId: 'job_mep', jobTitle: 'MEP Design Engineer', name: 'Sameer Ali', email: 'sameer.a@example.com', phone: '+91 99881 30056', experienceYears: 4, resumeUrl: '#', coverNote: 'HVAC-heavy background, keen to work across all four disciplines.', stage: 'new' },
  { ...meta('app_4', day(3)), jobId: 'job_site', jobTitle: 'Site Engineer — Civil', name: 'Naveen Kumawat', email: 'naveen.k@example.com', phone: '+91 90240 66713', experienceYears: 3, resumeUrl: '#', stage: 'offer' },
  { ...meta('app_5', day(4)), jobId: 'job_site', jobTitle: 'Site Engineer — Civil', name: 'Jitendra Singh', email: 'jitendra.s@example.com', phone: '+91 93140 55120', experienceYears: 2, resumeUrl: '#', stage: 'new' },
  { ...meta('app_6', day(5)), jobId: 'job_intern', jobTitle: 'Architecture Intern', name: 'Tanvi Mehta', email: 'tanvi.m@example.com', phone: '+91 88900 47712', experienceYears: 0, resumeUrl: '#', coverNote: 'Final year B.Arch, portfolio attached.', stage: 'screening' },
  { ...meta('app_7', day(6)), jobId: 'job_interior', jobTitle: 'Interior Designer', name: 'Shivani Joshi', email: 'shivani.j@example.com', phone: '+91 97840 21309', experienceYears: 3, resumeUrl: '#', stage: 'rejected' },
];

/* ==================================================================== */
/* Site content management                                               */
/* ==================================================================== */

export const banners: Banner[] = [
  { ...meta('bnr_1', '2026-06-01T09:00:00.000Z'), title: 'Building Dreams', subtitle: 'From idea to reality, without the hassle.', image: IMG.hero('hero-primary'), ctaLabel: 'Start Your Project', ctaHref: '/contact', placement: 'home-hero', order: 1 },
  /* Draft on purpose: no band renders the promo-strip placement yet — publishing it would promise a surface that does not exist. */
  { ...meta('bnr_2', '2026-06-01T09:00:00.000Z', 'draft'), title: 'Monsoon booking window open', subtitle: 'Projects starting before October get design fees waived.', image: IMG.wide('banner-promo'), ctaLabel: 'Get an estimate', ctaHref: '/estimator', placement: 'promo-strip', order: 1 },
  { ...meta('bnr_3', '2026-06-01T09:00:00.000Z', 'draft'), title: 'Now taking commercial projects', subtitle: 'Full MEPF capability in-house.', image: IMG.wide('banner-commercial'), ctaLabel: 'See our MEPF work', ctaHref: '/services/mepf-consultancy', placement: 'projects-top', order: 1 },
];

export const homeSections: HomeSection[] = [
  /*
   * One row per band actually on the home page, top to bottom — rewritten
   * Sep 2026 when the previous 13 rows still described a page (process
   * timeline, stats, monitoring…) that no longer exists. `enabled` switches a
   * band off; heading/subheading flow into the three sections built on
   * SectionHeader (services-index, projects, testimonials) and are '' where a
   * band composes its own copy (trust, mepf, one-system — see the note at the
   * top of MepfTeaser for why it refuses SectionHeader). The hero has no row:
   * its copy is owned by the Hero & banners `home-hero` row.
   */
  { ...meta('hs_trust', '2026-01-01T09:00:00.000Z'), key: 'trust', label: 'Trust bar — client logos', enabled: true, heading: '', subheading: '', order: 1 },
  { ...meta('hs_services', '2026-01-01T09:00:00.000Z'), key: 'services-index', label: 'What we do — services index', enabled: true, heading: 'Hand us one part, or the whole build.', subheading: 'Each of these is a team that already sits in the same office as the others.', order: 2 },
  { ...meta('hs_mepf', '2026-01-01T09:00:00.000Z'), key: 'mepf', label: 'MEPF teaser band', enabled: true, heading: '', subheading: '', order: 3 },
  { ...meta('hs_projects', '2026-01-01T09:00:00.000Z'), key: 'projects', label: 'Featured projects', enabled: true, heading: 'Built across Jaipur', subheading: 'From a narrow 25-foot plot in Pratap Nagar to a mixed-use block in Sanganer — every project documented properly.', order: 4 },
  { ...meta('hs_onesystem', '2026-01-01T09:00:00.000Z'), key: 'one-system', label: 'One system — dark band', enabled: true, heading: '', subheading: '', order: 5 },
  { ...meta('hs_testimonials', '2026-01-01T09:00:00.000Z'), key: 'testimonials', label: 'Testimonials', enabled: true, heading: 'Trusted by homeowners and businesses alike', subheading: 'Four projects, four families, and the part they chose to say out loud. Where a client has recorded their own, the film sits beside the words.', order: 6 },
];

export const navItems: NavItem[] = [
  { ...meta('nav_1', '2026-01-01T09:00:00.000Z'), label: 'Services', href: '/services', order: 1 },
  { ...meta('nav_2', '2026-01-01T09:00:00.000Z'), label: 'Projects', href: '/projects', order: 2 },
  { ...meta('nav_3', '2026-01-01T09:00:00.000Z'), label: 'Pricing', href: '/pricing', order: 3 },
  { ...meta('nav_4', '2026-01-01T09:00:00.000Z'), label: 'Company', href: '/about', order: 4 },
  { ...meta('nav_5', '2026-01-01T09:00:00.000Z'), label: 'Contact', href: '/contact', order: 5 },
  { ...meta('nav_6', '2026-01-01T09:00:00.000Z'), label: 'Get Estimate', href: '/estimator', order: 6, highlight: true, badge: 'New' },
];

export const footerColumns: FooterColumn[] = [
  { ...meta('fc_1', '2026-01-01T09:00:00.000Z'), heading: 'Services', order: 1, links: [ { label: 'Architectural Design', href: '/services/architectural-design' }, { label: 'MEPF Consultancy', href: '/services/mepf-consultancy' }, { label: 'Interior Design', href: '/services/interior-design' }, { label: 'Project Management', href: '/services/project-management' } ] },
  { ...meta('fc_2', '2026-01-01T09:00:00.000Z'), heading: 'Company', order: 2, links: [ { label: 'About Us', href: '/about' }, { label: 'Projects', href: '/projects' }, { label: 'Vastu Planning', href: '/vastu' }, { label: 'Careers', href: '/careers' }, { label: 'Insights', href: '/blog' } ] },
  { ...meta('fc_3', '2026-01-01T09:00:00.000Z'), heading: 'Resources', order: 3, links: [ { label: 'Cost Estimator', href: '/estimator' }, /* Pricing & Packages is commented out for now — published rates are hidden; see the Pricing entry in MAIN_NAV (constants/routes.ts). */ { label: 'Gallery', href: '/gallery' }, { label: 'Downloads', href: '/downloads' } ] /* Client Portal is commented out for now — see features/portal/PortalLayout.tsx. */ },
];

export const seoMeta: SeoMeta[] = [
  { ...meta('seo_home', '2026-01-01T09:00:00.000Z'), route: '/', title: 'Neetu Archstone — Turnkey Construction & Architecture in Jaipur', description: 'Architecture, MEPF, turnkey construction and interiors under one accountable system. Vastu-aligned planning, transparent pricing, 1 year free maintenance.', keywords: ['construction company jaipur', 'turnkey construction jaipur', 'architect jaipur', 'house construction cost jaipur'], ogImage: IMG.wide('og-home'), noIndex: false },
  { ...meta('seo_estimator', '2026-01-01T09:00:00.000Z'), route: '/estimator', title: 'Construction Cost Estimator — Jaipur 2026 | Neetu Archstone', description: 'Get an instant, itemised construction cost estimate for your plot in Jaipur. Head-wise breakdown, timeline and a downloadable PDF in under two minutes.', keywords: ['construction cost calculator jaipur', 'house construction cost per sq ft jaipur', 'building cost estimator'], ogImage: IMG.wide('og-estimator'), noIndex: false },
  { ...meta('seo_projects', '2026-01-01T09:00:00.000Z'), route: '/projects', title: 'Projects — Residential, Commercial & Interiors | Neetu Archstone', description: 'Completed and ongoing projects across Jaipur — Mansarovar, Jagatpura, Pratap Nagar, Sanganer and Malviya Nagar.', keywords: ['construction projects jaipur', 'residential projects jaipur'], ogImage: IMG.wide('og-projects'), noIndex: false },
  { ...meta('seo_pricing', '2026-01-01T09:00:00.000Z'), route: '/pricing', title: 'Pricing & Packages — Transparent Construction Rates | Neetu Archstone', description: 'Labour-only and turnkey construction rates for Jaipur. Civil ₹1,200–1,400, semi-furnished ₹1,800–2,200, fully furnished ₹2,500–3,000 per sq ft.', keywords: ['construction rates jaipur', 'turnkey construction cost'], ogImage: IMG.wide('og-pricing'), noIndex: false },
  { ...meta('seo_admin', '2026-01-01T09:00:00.000Z'), route: '/admin', title: 'Admin', description: 'Internal administration.', keywords: [], ogImage: '', noIndex: true },
];

export const settings: Setting[] = [
  { ...meta('set_name', '2026-01-01T09:00:00.000Z'), key: 'site.name', label: 'Company name', value: 'Neetu Archstone', group: 'general', type: 'text' },
  { ...meta('set_tagline', '2026-01-01T09:00:00.000Z'), key: 'site.tagline', label: 'Tagline', value: 'Design · Build · Deliver', group: 'general', type: 'text' },
  { ...meta('set_tagline_hi', '2026-01-01T09:00:00.000Z'), key: 'site.taglineHi', label: 'Tagline (Hindi)', value: 'नक़्शे से निर्माण तक', group: 'general', type: 'text' },
  { ...meta('set_desc', '2026-01-01T09:00:00.000Z'), key: 'site.description', label: 'Meta description', value: 'Architecture, MEPF engineering, turnkey construction and interiors under one accountable system.', group: 'general', type: 'textarea' },
  { ...meta('set_phone', '2026-01-01T09:00:00.000Z'), key: 'contact.phone', label: 'Phone', value: '+91 70149 34752', group: 'contact', type: 'text' },
  { ...meta('set_email', '2026-01-01T09:00:00.000Z'), key: 'contact.email', label: 'Email', value: 'neetuarchstone@gmail.com', group: 'contact', type: 'text' },
  { ...meta('set_address', '2026-01-01T09:00:00.000Z'), key: 'contact.address', label: 'Address', value: 'India Gate, Jaipur, Rajasthan', group: 'contact', type: 'textarea' },
  { ...meta('set_hours', '2026-01-01T09:00:00.000Z'), key: 'contact.hours', label: 'Working hours', value: 'Mon – Sat, 10:00 AM – 7:00 PM', group: 'contact', type: 'text' },
  { ...meta('set_whatsapp', '2026-01-01T09:00:00.000Z'), key: 'contact.whatsapp', label: 'WhatsApp number', value: '917014934752', group: 'contact', type: 'text' },
  { ...meta('set_ig', '2026-01-01T09:00:00.000Z'), key: 'social.instagram', label: 'Instagram', value: 'https://instagram.com/neetuarchstone', group: 'social', type: 'url' },
  { ...meta('set_li', '2026-01-01T09:00:00.000Z'), key: 'social.linkedin', label: 'LinkedIn', value: 'https://linkedin.com/company/neetuarchstone', group: 'social', type: 'url' },
  { ...meta('set_yt', '2026-01-01T09:00:00.000Z'), key: 'social.youtube', label: 'YouTube', value: 'https://youtube.com/@neetuarchstone', group: 'social', type: 'url' },
  { ...meta('set_ga', '2026-01-01T09:00:00.000Z'), key: 'analytics.ga4', label: 'GA4 Measurement ID', value: 'G-XXXXXXXXXX', group: 'analytics', type: 'text' },
  { ...meta('set_brand', '2026-01-01T09:00:00.000Z'), key: 'theme.brandColor', label: 'Brand accent colour', value: '#00BBEE', group: 'theme', type: 'color' },
  { ...meta('set_navy', '2026-01-01T09:00:00.000Z'), key: 'theme.primaryColor', label: 'Primary dark colour', value: '#03094E', group: 'theme', type: 'color' },
  { ...meta('set_radius', '2026-01-01T09:00:00.000Z'), key: 'theme.radius', label: 'Base corner radius (px)', value: '16', group: 'theme', type: 'number' },
];

/* ==================================================================== */
/* Access control                                                        */
/* ==================================================================== */

const MODULES = ['projects', 'services', 'blogs', 'gallery', 'testimonials', 'faqs', 'team', 'careers', 'applications', 'enquiries', 'estimates', 'downloads', 'media', 'seo', 'users', 'settings'];

const allPerms = MODULES.reduce<Record<string, ('view' | 'create' | 'edit' | 'delete' | 'publish')[]>>((acc, m) => {
  acc[m] = ['view', 'create', 'edit', 'delete', 'publish'];
  return acc;
}, {});

const editorPerms = MODULES.reduce<Record<string, ('view' | 'create' | 'edit' | 'delete' | 'publish')[]>>((acc, m) => {
  acc[m] = ['users', 'settings', 'seo'].includes(m) ? ['view'] : ['view', 'create', 'edit'];
  return acc;
}, {});

const viewerPerms = MODULES.reduce<Record<string, ('view' | 'create' | 'edit' | 'delete' | 'publish')[]>>((acc, m) => {
  acc[m] = ['view'];
  return acc;
}, {});


export const users: User[] = [
  { ...meta('usr_0', '2026-09-01T09:00:00.000Z'), name: 'Super Admin', email: 'superadmin@neetuarchstone.com', roleId: 'role_superadmin', roleName: 'Super Admin', roleSlug: 'superadmin', avatar: monogram('Super Admin'), lastActiveAt: day(0), active: true },
  { ...meta('usr_1', '2025-03-01T09:00:00.000Z'), name: 'Neetu Sharma', email: 'neetu@neetuarchstone.com', roleId: 'role_owner', roleName: 'Owner', roleSlug: 'owner', avatar: monogram('Neetu Sharma'), lastActiveAt: day(0), active: true },
  { ...meta('usr_2', '2025-03-01T09:00:00.000Z'), name: 'Rahul Verma', email: 'rahul@neetuarchstone.com', roleId: 'role_superadmin', roleName: 'Super Admin', roleSlug: 'superadmin', avatar: monogram('Rahul Verma'), lastActiveAt: day(0), active: true },
  { ...meta('usr_3', '2025-05-14T09:00:00.000Z'), name: 'Priya Nathani', email: 'priya@neetuarchstone.com', roleId: 'role_admin', roleName: 'Administrator', roleSlug: 'admin', avatar: monogram('Priya Nathani'), lastActiveAt: day(1), active: true },
  { ...meta('usr_4', '2025-08-02T09:00:00.000Z'), name: 'Shruti Agarwal', email: 'shruti@neetuarchstone.com', roleId: 'role_editor', roleName: 'Editor', roleSlug: 'editor', avatar: monogram('Shruti Agarwal'), lastActiveAt: day(2), active: true },
  { ...meta('usr_5', '2026-01-20T09:00:00.000Z'), name: 'Vikas Saini', email: 'vikas@neetuarchstone.com', roleId: 'role_editor', roleName: 'Editor', roleSlug: 'editor', avatar: monogram('Vikas Saini'), lastActiveAt: day(3), active: true },
  { ...meta('usr_6', '2026-02-11T09:00:00.000Z'), name: 'Mahesh Jangid', email: 'mahesh@neetuarchstone.com', roleId: 'role_viewer', roleName: 'Viewer', roleSlug: 'viewer', avatar: monogram('Mahesh Jangid'), lastActiveAt: day(9), active: false },
];

/**
 * Derived, not typed in.
 *
 * These four numbers were hand-written and two of them had gone stale — editor
 * said 3 against two actual editors, viewer said 2 against one. Nobody would
 * notice: the roles screen is read-only and the count is decoration until it
 * contradicts the user list beside it. The Laravel API computes `memberCount`
 * from the users relation for the same reason, so this keeps the two adapters
 * agreeing as well as keeping the number true.
 */
const countIn = (roleId: string) => users.filter((u) => u.roleId === roleId).length;

export const roles: Role[] = [
  /* The one account the System group answers to. Everything in the sidebar's
     System section — media, seo, users, settings, estimator-config, roles,
     theme — renders only for this role; see the gate in AdminLayout. */
  { ...meta('role_superadmin', '2026-01-01T09:00:00.000Z'), name: 'Super Admin', slug: 'superadmin', description: 'Everything, including the System modules — users, roles, settings, SEO, media and theme.', permissions: allPerms, memberCount: countIn('role_superadmin') },
  { ...meta('role_owner', '2026-01-01T09:00:00.000Z'), name: 'Owner', slug: 'owner', description: 'Full access to every module, including users, roles and billing.', permissions: allPerms, memberCount: countIn('role_owner') },
  { ...meta('role_admin', '2026-01-01T09:00:00.000Z'), name: 'Administrator', slug: 'admin', description: 'Full content and lead access. Cannot manage roles or billing.', permissions: { ...allPerms, users: ['view'] }, memberCount: countIn('role_admin') },
  { ...meta('role_editor', '2026-01-01T09:00:00.000Z'), name: 'Editor', slug: 'editor', description: 'Can create and edit content but not delete or publish.', permissions: editorPerms, memberCount: countIn('role_editor') },
  { ...meta('role_viewer', '2026-01-01T09:00:00.000Z'), name: 'Viewer', slug: 'viewer', description: 'Read-only access for reporting and review.', permissions: viewerPerms, memberCount: countIn('role_viewer') },
];

/* ==================================================================== */
/* Media library                                                         */
/* ==================================================================== */

const mediaSeeds = [
  ['jagatpura-cover.jpg', 'projects/jagatpura'],
  ['jagatpura-1.jpg', 'projects/jagatpura'],
  ['jagatpura-2.jpg', 'projects/jagatpura'],
  ['pratapnagar-cover.jpg', 'projects/pratap-nagar'],
  ['mansarovar-cover.jpg', 'projects/mansarovar'],
  ['gaushala-cover.jpg', 'projects/gaushala'],
  ['sanganer-cover.jpg', 'projects/sanganer'],
  ['malviya-cover.jpg', 'projects/malviya-nagar'],
  ['vaishali-1.jpg', 'projects/vaishali'],
  ['tonk-cover.jpg', 'projects/tonk-road'],
  ['team-founder.jpg', 'team'],
  ['team-director.jpg', 'team'],
  ['service-architecture.jpg', 'services'],
  ['service-mepf.jpg', 'services'],
  ['post-cost.jpg', 'blog'],
  ['post-vastu.jpg', 'blog'],
  ['hero-primary.jpg', 'banners'],
  ['og-home.jpg', 'seo'],
];

export const mediaAssets: MediaAsset[] = mediaSeeds.map(([filename, folder], i) => ({
  ...meta(`med_${i + 1}`, day(i + 1)),
  filename: filename ?? '',
  url: IMG.card((filename ?? '').replace('.jpg', '')),
  mimeType: 'image/jpeg',
  sizeBytes: 320_000 + i * 47_000,
  width: 1200,
  height: 800,
  folder: folder ?? 'uploads',
  alt: (filename ?? '').replace('.jpg', '').replace(/-/g, ' '),
}));

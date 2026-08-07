/**
 * Domain model — single source of truth for the frontend, the mock JSON,
 * the Express API and `prisma/schema.prisma`.
 *
 * Conventions on every persisted entity:
 *   id, createdAt, updatedAt, status, and `order` where sortable.
 */

export type EntityStatus = 'draft' | 'published' | 'archived';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: EntityStatus;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectCategory = 'residential' | 'commercial' | 'interior' | 'mepf' | 'turnkey' | 'mixed-use';
export type ProjectStage = 'completed' | 'ongoing' | 'upcoming';

export interface ProjectImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  order: number;
}

export interface ProjectSpec {
  label: string;
  value: string;
}

export interface Project extends BaseEntity {
  slug: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  stage: ProjectStage;
  locality: string;
  city: string;
  coordinates: { lat: number; lng: number };
  /**
   * Jaipur municipal zone, from JAIPUR_DISTRICTS in @/data/jaipur-districts.
   *
   * Optional, and absent means "outside the mapped zones" rather than unknown —
   * some of Jaipur is JDA-administered land beyond the JMC limit. When unset,
   * `resolveDistrictId` falls back to matching `locality`; it never guesses
   * from coordinates, so a project is only ever placed in a zone deliberately.
   */
  districtId?: string;
  year: number;
  areaSqft: number;
  floors: string;
  durationMonths: number;
  packageType: 'civil' | 'semi-furnished' | 'fully-furnished';
  client?: string;
  featured: boolean;
  order: number;
  coverImage: string;
  images: ProjectImage[];
  beforeImage?: string;
  afterImage?: string;
  excerpt: string;
  challenge: string;
  approach: string;
  outcome: string;
  specs: ProjectSpec[];
  services: string[];
  tags: string[];
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export interface ServiceFeature {
  title: string;
  description: string;
  icon: string;
}

export interface Service extends BaseEntity {
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  icon: string;
  order: number;
  featured: boolean;
  heroImage: string;
  summary: string;
  description: string;
  features: ServiceFeature[];
  deliverables: string[];
  process: { step: number; title: string; description: string }[];
  faqIds: string[];
  stats: { label: string; value: string }[];
}

/* ------------------------------------------------------------------ */
/* Social proof                                                        */
/* ------------------------------------------------------------------ */

export interface Testimonial extends BaseEntity {
  name: string;
  title?: string;
  locality: string;
  rating: number;
  quote: string;
  language: 'en' | 'hi' | 'hinglish';
  projectId?: string;
  avatar?: string;
  image?: string;
  featured: boolean;
  order: number;
}

export interface TeamMember extends BaseEntity {
  name: string;
  role: string;
  department: 'leadership' | 'design' | 'engineering' | 'site' | 'support';
  bio: string;
  photo: string;
  experienceYears: number;
  expertise: string[];
  order: number;
  socials?: { linkedin?: string; email?: string };
}

export interface ClientLogo extends BaseEntity {
  name: string;
  logo: string;
  website?: string;
  order: number;
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export type GalleryKind = 'photo' | 'video' | 'drone' | '360';

export interface GalleryItem extends BaseEntity {
  title: string;
  kind: GalleryKind;
  category: ProjectCategory | 'process' | 'team';
  url: string;
  thumbnail: string;
  projectId?: string;
  duration?: string;
  order: number;
}

export interface MediaAsset extends BaseEntity {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  folder: string;
  alt?: string;
}

/* ------------------------------------------------------------------ */
/* Editorial                                                           */
/* ------------------------------------------------------------------ */

export interface Post extends BaseEntity {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorRole: string;
  authorAvatar: string;
  publishedAt: string;
  readingMinutes: number;
  featured: boolean;
}

export interface Faq extends BaseEntity {
  question: string;
  answer: string;
  category: 'general' | 'pricing' | 'process' | 'mepf' | 'interiors' | 'vastu' | 'careers';
  order: number;
}

/* ------------------------------------------------------------------ */
/* People ops                                                          */
/* ------------------------------------------------------------------ */

export interface Job extends BaseEntity {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  salaryRange?: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  openings: number;
  postedAt: string;
}

export interface Application extends BaseEntity {
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  resumeUrl: string;
  coverNote?: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'rejected';
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */

export interface Enquiry extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  serviceInterest: string;
  city?: string;
  budget?: string;
  message: string;
  /**
   * Where the lead came from. Only values the site actually produces.
   * `service-page`, `project-page` and `exit-intent` were removed — they were
   * in the union and in the admin filter dropdown, but no code path ever set
   * them, so the filter offered three options that could never match a row.
   */
  source: 'contact-form' | 'estimator' | 'download' | 'newsletter';
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  assignedTo?: string;
}

export interface EstimateRequest extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  propertyType: string;
  plotArea: number;
  areaUnit: string;
  floors: number;
  packageType: string;
  qualityTier: string;
  location: string;
  enhancements: string[];
  /** Material specification captured from the estimator's step 5. */
  materialMode?: 'recommended' | 'custom';
  materials?: Record<string, Record<string, string>>;
  specAdjustment?: number;
  builtUpArea: number;
  totalMin: number;
  totalMax: number;
  timelineWeeks: number;
  stage: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
}

/* ------------------------------------------------------------------ */
/* Site content                                                        */
/* ------------------------------------------------------------------ */

export interface Download extends BaseEntity {
  title: string;
  description: string;
  category: 'profile' | 'brochure' | 'certificate' | 'catalogue' | 'checklist';
  fileUrl: string;
  fileType: string;
  fileSize: string;
  thumbnail: string;
  gated: boolean;
  downloads: number;
  order: number;
}

export interface Banner extends BaseEntity {
  title: string;
  subtitle?: string;
  image: string;
  ctaLabel?: string;
  ctaHref?: string;
  placement: 'home-hero' | 'promo-strip' | 'projects-top' | 'contact-top';
  order: number;
}

export interface HomeSection extends BaseEntity {
  key: string;
  label: string;
  enabled: boolean;
  heading: string;
  subheading: string;
  order: number;
}

export interface NavItem extends BaseEntity {
  label: string;
  href: string;
  parentId?: string;
  order: number;
  highlight?: boolean;
  badge?: string;
}

export interface FooterColumn extends BaseEntity {
  heading: string;
  order: number;
  links: { label: string; href: string }[];
}

export interface SeoMeta extends BaseEntity {
  route: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  noIndex: boolean;
}

export interface Setting extends BaseEntity {
  key: string;
  label: string;
  value: string;
  group: 'general' | 'contact' | 'social' | 'analytics' | 'theme';
  type: 'text' | 'textarea' | 'color' | 'number' | 'boolean' | 'url';
}

/* ------------------------------------------------------------------ */
/* Access control                                                      */
/* ------------------------------------------------------------------ */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'publish';

export interface Role extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  permissions: Record<string, PermissionAction[]>;
  memberCount: number;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  avatar: string;
  lastActiveAt: string;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/* Estimator configuration (admin-editable → drives public calculator)  */
/* ------------------------------------------------------------------ */

export interface BaseRate extends BaseEntity {
  key: string;
  label: string;
  description: string;
  minRate: number;
  maxRate: number;
  labourOnlyRate: number;
  order: number;
}

export interface QualityTier extends BaseEntity {
  key: string;
  label: string;
  description: string;
  multiplier: number;
  highlights: string[];
  order: number;
}

export interface LocationMultiplier extends BaseEntity {
  key: string;
  label: string;
  zone: string;
  multiplier: number;
  order: number;
}

export interface Enhancement extends BaseEntity {
  key: string;
  label: string;
  description: string;
  icon: string;
  pricingModel: 'per-sqft' | 'lumpsum' | 'per-floor';
  unitPrice: number;
  appliesTo: string[];
  order: number;
}

/* ------------------------------------------------------------------ */
/* Client portal                                                       */
/* ------------------------------------------------------------------ */

export interface Milestone {
  id: string;
  title: string;
  description: string;
  plannedDate: string;
  actualDate?: string;
  progress: number;
  state: 'completed' | 'in-progress' | 'upcoming' | 'delayed';
}

export interface Invoice {
  id: string;
  number: string;
  title: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  state: 'paid' | 'due' | 'overdue' | 'scheduled';
  milestone: string;
}

export interface PortalDocument {
  id: string;
  title: string;
  category: 'drawing' | 'approval' | 'contract' | 'report' | 'invoice';
  fileType: string;
  fileSize: string;
  uploadedAt: string;
  url: string;
}

export interface SiteUpdate {
  id: string;
  title: string;
  note: string;
  date: string;
  images: string[];
  author: string;
}

export interface PortalProject extends BaseEntity {
  code: string;
  title: string;
  address: string;
  packageType: string;
  areaSqft: number;
  contractValue: number;
  startDate: string;
  targetDate: string;
  progress: number;
  projectManager: { name: string; phone: string; avatar: string };
  cameraFeedUrl?: string;
  milestones: Milestone[];
  invoices: Invoice[];
  documents: PortalDocument[];
  updates: SiteUpdate[];
}

/* ------------------------------------------------------------------ */
/* Transport                                                           */
/* ------------------------------------------------------------------ */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

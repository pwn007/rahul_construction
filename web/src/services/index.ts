import { createResourceService } from './resource.service';
import type {
  Application,
  Banner,
  BaseRate,
  ClientLogo,
  Download,
  Enhancement,
  Enquiry,
  EstimateRequest,
  Faq,
  FooterColumn,
  GalleryItem,
  HomeSection,
  Job,
  LocationMultiplier,
  MediaAsset,
  NavItem,
  PortalProject,
  Post,
  Project,
  MaterialSpec,
  Role,
  SeoMeta,
  Service,
  Setting,
  TeamMember,
  Testimonial,
  User,
} from '@/types/domain';

/**
 * Resource registry. `RESOURCES[key]` is the single name used by:
 *  - the mock adapter's seed map
 *  - the Express route table
 *  - the admin module configs
 *  - TanStack Query cache keys
 */
export const RESOURCES = {
  projects: 'projects',
  services: 'services',
  testimonials: 'testimonials',
  team: 'team',
  clientLogos: 'client-logos',
  blogs: 'blogs',
  faqs: 'faqs',
  careers: 'careers',
  gallery: 'gallery',
  downloads: 'downloads',
  applications: 'applications',
  enquiries: 'enquiries',
  estimates: 'estimates',
  banners: 'banners',
  homeSections: 'home-sections',
  navbar: 'navbar',
  footer: 'footer',
  seo: 'seo',
  settings: 'settings',
  users: 'users',
  roles: 'roles',
  media: 'media',
  portalProjects: 'portal-projects',
  estimatorRates: 'estimator-rates',
  estimatorMaterials: 'estimator-materials',
  estimatorLocations: 'estimator-locations',
  estimatorEnhancements: 'estimator-enhancements',
} as const;

export const projectsService = createResourceService<Project>(RESOURCES.projects);
export const servicesService = createResourceService<Service>(RESOURCES.services);
export const testimonialsService = createResourceService<Testimonial>(RESOURCES.testimonials);
export const teamService = createResourceService<TeamMember>(RESOURCES.team);
export const clientLogosService = createResourceService<ClientLogo>(RESOURCES.clientLogos);
export const blogsService = createResourceService<Post>(RESOURCES.blogs);
export const faqsService = createResourceService<Faq>(RESOURCES.faqs);
export const careersService = createResourceService<Job>(RESOURCES.careers);
export const galleryService = createResourceService<GalleryItem>(RESOURCES.gallery);
export const downloadsService = createResourceService<Download>(RESOURCES.downloads);
export const applicationsService = createResourceService<Application>(RESOURCES.applications);
export const enquiriesService = createResourceService<Enquiry>(RESOURCES.enquiries);
export const estimatesService = createResourceService<EstimateRequest>(RESOURCES.estimates);
export const bannersService = createResourceService<Banner>(RESOURCES.banners);
export const homeSectionsService = createResourceService<HomeSection>(RESOURCES.homeSections);
export const navbarService = createResourceService<NavItem>(RESOURCES.navbar);
export const footerService = createResourceService<FooterColumn>(RESOURCES.footer);
export const seoService = createResourceService<SeoMeta>(RESOURCES.seo);
export const settingsService = createResourceService<Setting>(RESOURCES.settings);
export const usersService = createResourceService<User>(RESOURCES.users);
export const rolesService = createResourceService<Role>(RESOURCES.roles);
export const mediaService = createResourceService<MediaAsset>(RESOURCES.media);
export const portalService = createResourceService<PortalProject>(RESOURCES.portalProjects);
export const estimatorRatesService = createResourceService<BaseRate>(RESOURCES.estimatorRates);
export const estimatorMaterialsService = createResourceService<MaterialSpec>(RESOURCES.estimatorMaterials);
export const estimatorLocationsService = createResourceService<LocationMultiplier>(RESOURCES.estimatorLocations);
export const estimatorEnhancementsService = createResourceService<Enhancement>(RESOURCES.estimatorEnhancements);

export { createResourceService };
export type { ResourceService } from './resource.service';

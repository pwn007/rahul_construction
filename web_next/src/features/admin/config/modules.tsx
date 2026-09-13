'use client';

import { Badge } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { DEVELOPMENT_TYPES, developmentTypeLabel } from '@/constants/leads';
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber } from '@/lib/format';
import {
  applicationsService,
  bannersService,
  blogsService,
  careersService,
  clientLogosService,
  downloadsService,
  enquiriesService,
  estimatesService,
  estimatorPricesService,
  faqsService,
  footerService,
  galleryService,
  homeSectionsService,
  mediaService,
  navbarService,
  projectsService,
  rolesService,
  seoService,
  servicesService,
  settingsService,
  teamService,
  testimonialsService,
  usersService,
} from '@/services';
import type { ResourceConfig } from '../types';
import { JAIPUR_DISTRICTS } from '@/data/jaipur-districts';
import { projects, CATEGORY_LABEL } from '@/data/projects';
import { services } from '@/data/services';
import { faqs } from '@/data/content';

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const statusColumn = {
  key: 'status',
  label: 'Status',
  width: '120px',
  render: (row: { status?: string }) => (
    <Badge variant={row.status === 'published' ? 'success' : row.status === 'draft' ? 'warning' : 'default'} size="sm">
      {row.status ?? '—'}
    </Badge>
  ),
};

const statusField = {
  name: 'status',
  label: 'Status',
  type: 'select' as const,
  options: STATUS_OPTIONS,
  span: 6 as const,
  defaultValue: 'draft',
  section: 'Publishing',
};

const orderField = { name: 'order', label: 'Display order', type: 'number' as const, span: 6 as const, section: 'Publishing', defaultValue: 0, help: 'Lower numbers appear first.' };

/*
 * Project vocabulary — see the note above `CATEGORY_LABEL` in data/projects.ts.
 *
 * Both the category dropdowns and the table column printed raw slugs, so the
 * panel said "mixed-use" where the site says "Mixed use". Derived from the map
 * rather than hand-listed, so a category added to the type cannot be silently
 * missed here — which is exactly what happened to `turnkey` on the public side.
 */
const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

const STAGE_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'ongoing', label: 'In progress' },
  { value: 'upcoming', label: 'Upcoming' },
];

const truncate = (v: unknown, n = 48) => {
  const s = String(v ?? '');
  return s.length > n ? `${s.slice(0, n - 1)}…` : s || '—';
};

/* ==================================================================== */
/* Module registry                                                       */
/* ==================================================================== */

/* Adding a module? Its key must ALSO go into MODULE_KEYS in
   `src/app/admin/[module]/page.tsx` — the static export enumerates admin pages
   at build time, and a key missing there is a 404 on the live site. */
export const MODULES: ResourceConfig<never>[] = [
  /* ---------------------------- CONTENT ---------------------------- */
  {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    description: 'Case studies shown on the public projects library and detail pages.',
    icon: 'Building2',
    group: 'Content',
    service: projectsService as never,
    searchPlaceholder: 'Search by title…',
    publicHref: (row: never) => ROUTES.project((row as { slug: string }).slug),
    filters: [
      { key: 'category', label: 'Category', options: CATEGORY_OPTIONS },
      { key: 'stage', label: 'Stage', options: STAGE_OPTIONS },
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
    columns: [
      {
        key: 'title',
        label: 'Project',
        render: (row: never) => {
          const p = row as unknown as { title: string; coverImage: string; locality: string };
          return (
            <div className="flex items-center gap-3">
              <img src={p.coverImage} alt="" className="h-10 w-14 shrink-0 rounded object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-caption text-subtle">{p.locality}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'category',
        label: 'Category',
        width: '130px',
        render: (row: never) => CATEGORY_LABEL[(row as unknown as { category: keyof typeof CATEGORY_LABEL }).category],
      },
      { key: 'year', label: 'Year', width: '80px' },
      {
        key: 'areaSqft',
        label: 'Area',
        width: '110px',
        align: 'right',
        render: (row: never) => <span className="num">{formatNumber((row as unknown as { areaSqft: number }).areaSqft)} sq ft</span>,
      },
      {
        key: 'featured',
        label: 'Featured',
        width: '100px',
        align: 'center',
        render: (row: never) => ((row as unknown as { featured: boolean }).featured ? <Badge variant="brand" size="sm">Featured</Badge> : <span className="text-subtle">—</span>),
      },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 8, section: 'Basics' },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, span: 4, section: 'Basics', help: '/projects/your-slug' },
      { name: 'subtitle', label: 'Subtitle', type: 'text', required: true, span: 12, section: 'Basics' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, span: 12, section: 'Basics' },
      { name: 'category', label: 'Category', type: 'select', required: true, span: 4, section: 'Classification', options: CATEGORY_OPTIONS },
      { name: 'stage', label: 'Stage', type: 'select', span: 4, section: 'Classification', options: STAGE_OPTIONS },
      {
        name: 'packageType',
        label: 'Package',
        type: 'select',
        span: 4,
        section: 'Classification',
        options: [
          { value: 'civil', label: 'Civil work' },
          { value: 'semi-furnished', label: 'Semi furnished' },
          { value: 'fully-furnished', label: 'Fully furnished' },
        ],
      },
      {
        /* Which disciplines the firm actually ran on this site. The panel had no
           field for it at all, so a project created here could never get one —
           and this is now printed on every project card, not just buried in the
           detail page's sidebar. Chip order on the card comes from services.ts,
           so the order these are clicked in does not matter. */
        name: 'services',
        label: 'Services used',
        type: 'multiselect',
        span: 12,
        section: 'Classification',
        options: services.map((sv) => ({ value: sv.slug, label: sv.shortTitle })),
        help: 'Shown as chips on the project card and in “Services used” on the detail page.',
      },
      { name: 'locality', label: 'Locality', type: 'text', required: true, span: 6, section: 'Location' },
      { name: 'city', label: 'City', type: 'text', span: 6, section: 'Location', defaultValue: 'Jaipur' },
      {
        /**
         * Which zone the project sits in on the Project Atlas. Left blank, the
         * atlas falls back to matching `locality`; if that fails too the project
         * is shown beyond the municipal limit rather than guessed into a zone.
         * Imports district *metadata* only — never the geometry module, which
         * would drag the map's path data into the admin bundle.
         */
        name: 'districtId',
        label: 'Municipal zone',
        type: 'select',
        span: 12,
        section: 'Location',
        options: [
          { value: '', label: 'Outside the JMC limit / auto-detect from locality' },
          ...JAIPUR_DISTRICTS.map((d) => ({ value: d.id, label: `${d.label}  ·  JMC ${d.official}` })),
        ],
      },
      {
        /* The atlas pin. Optional — without it the map falls back to the zone
           centroid via districtId, so a project is never lost, just less
           precisely placed. */
        name: 'coordinates',
        label: 'Map pin (lat / lng)',
        type: 'latlng',
        span: 12,
        section: 'Location',
        help: 'Right-click the spot in Google Maps → the first menu row is these two numbers.',
      },
      { name: 'year', label: 'Year', type: 'number', required: true, span: 4, section: 'Specifications', min: 2000, max: 2100 },
      { name: 'areaSqft', label: 'Built-up area (sq ft)', type: 'number', required: true, span: 4, section: 'Specifications' },
      { name: 'durationMonths', label: 'Duration (months)', type: 'number', required: true, span: 4, section: 'Specifications' },
      { name: 'floors', label: 'Configuration', type: 'text', required: true, span: 6, section: 'Specifications', placeholder: 'G+2' },
      { name: 'client', label: 'Client name', type: 'text', span: 6, section: 'Specifications' },
      { name: 'coverImage', label: 'Cover image', type: 'image', required: true, span: 12, section: 'Media' },
      { name: 'beforeImage', label: 'Before image', type: 'image', span: 6, section: 'Media' },
      { name: 'afterImage', label: 'After image', type: 'image', span: 6, section: 'Media' },
      {
        /* The detail page's photo gallery. Before this field existed a project
           created in the panel simply had no gallery — the seed projects carry
           4–5 photos each and there was nowhere to type them. */
        name: 'images',
        label: 'Photo gallery',
        type: 'image-list',
        span: 12,
        section: 'Media',
        help: 'Shown in display order on the project page. Alt text is what a screen reader speaks.',
      },
      {
        /* The label/value strip on the detail page — Plot size, Built-up area,
           Structure… Same gap as the gallery: renderable, never editable. */
        name: 'specs',
        label: 'Specifications',
        type: 'kv-list',
        span: 12,
        section: 'Details',
        help: 'Rows render in order on the project page.',
      },
      { name: 'challenge', label: 'The challenge', type: 'textarea', required: true, span: 12, section: 'Narrative' },
      { name: 'approach', label: 'Our approach', type: 'textarea', required: true, span: 12, section: 'Narrative' },
      { name: 'outcome', label: 'The outcome', type: 'textarea', required: true, span: 12, section: 'Narrative' },
      { name: 'tags', label: 'Tags', type: 'tags', span: 12, section: 'Narrative' },
      { name: 'featured', label: 'Feature on homepage', type: 'boolean', span: 6, section: 'Publishing' },
      orderField,
      statusField,
    ],
    preview: (row: never) => {
      const p = row as unknown as { title: string; subtitle: string; coverImage: string; excerpt: string; locality: string; year: number; areaSqft: number };
      return (
        <div>
          <img src={p.coverImage} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" />
          <h3 className="mt-5 font-display text-heading-lg font-semibold">{p.title}</h3>
          <p className="mt-1 text-caption text-cyan-700 dark:text-cyan-400">{p.subtitle}</p>
          <p className="num mt-3 text-caption text-subtle">
            {p.locality} · {p.year} · {formatNumber(p.areaSqft)} sq ft
          </p>
          <p className="mt-4 leading-relaxed text-muted">{p.excerpt}</p>
        </div>
      );
    },
  },

  {
    key: 'services',
    label: 'Services',
    singular: 'Service',
    description: 'The four service pillars, their capabilities and process steps.',
    icon: 'Layers',
    group: 'Content',
    service: servicesService as never,
    publicHref: (row: never) => ROUTES.service((row as { slug: string }).slug),
    filters: [{ key: 'status', label: 'Status', options: STATUS_OPTIONS }],
    columns: [
      { key: 'title', label: 'Service', render: (row: never) => <span className="font-medium">{(row as unknown as { title: string }).title}</span> },
      { key: 'tagline', label: 'Tagline', render: (row: never) => <span className="text-muted">{truncate((row as unknown as { tagline: string }).tagline, 44)}</span> },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 8, section: 'Basics' },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, span: 4, section: 'Basics', help: 'Changing an existing slug breaks its URL — and mepf-consultancy is wired to the 3D house, so never rename that one.' },
      { name: 'shortTitle', label: 'Short title', type: 'text', span: 6, section: 'Basics', help: 'Used in navigation and chips.' },
      { name: 'icon', label: 'Lucide icon name', type: 'text', span: 6, section: 'Basics', placeholder: 'Compass' },
      { name: 'tagline', label: 'Tagline', type: 'text', span: 12, section: 'Basics' },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, span: 12, section: 'Content' },
      { name: 'description', label: 'Full description', type: 'richtext', span: 12, section: 'Content' },
      { name: 'heroImage', label: 'Hero image', type: 'image', span: 12, section: 'Media' },
      {
        /* The icon-led card grid on the service page — and the home page's
           "What we do" chips read features[n].title, so an edit here flows to
           both without either knowing about the other. */
        name: 'features',
        label: 'Features',
        type: 'feature-list',
        span: 12,
        section: 'Content',
      },
      {
        name: 'deliverables',
        label: 'Deliverables',
        type: 'tags',
        span: 12,
        section: 'Content',
        help: 'One per entry — what the client walks away with.',
      },
      {
        name: 'process',
        label: 'Process steps',
        type: 'step-list',
        span: 12,
        section: 'Content',
        help: 'Numbered automatically, in row order.',
      },
      {
        name: 'stats',
        label: 'Stats',
        type: 'kv-list',
        span: 12,
        section: 'Content',
        help: 'Label + value pairs — e.g. "Projects delivered" / "80+".',
      },
      {
        /* FAQs are their own module; this only picks which of them this
           service's page shows. Options come from the compiled seed, so a
           brand-new FAQ appears in this picker after the next rebuild — the
           list itself is small and stable. */
        name: 'faqIds',
        label: 'FAQs on this page',
        type: 'multiselect',
        span: 12,
        section: 'Content',
        options: faqs.map((f) => ({ value: f.id, label: f.question })),
      },
      { name: 'featured', label: 'Show on homepage', type: 'boolean', span: 6, section: 'Publishing' },
      orderField,
      statusField,
    ],
  },

  {
    key: 'blogs',
    label: 'Insights',
    singular: 'Article',
    description: 'Blog articles published to /blog, with categories, tags and authorship.',
    icon: 'Newspaper',
    group: 'Content',
    service: blogsService as never,
    publicHref: (row: never) => ROUTES.post((row as { slug: string }).slug),
    filters: [{ key: 'status', label: 'Status', options: STATUS_OPTIONS }],
    columns: [
      {
        key: 'title',
        label: 'Article',
        render: (row: never) => {
          const p = row as unknown as { title: string; coverImage: string; category: string };
          return (
            <div className="flex items-center gap-3">
              <img src={p.coverImage} alt="" className="h-10 w-14 shrink-0 rounded object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate font-medium">{truncate(p.title, 52)}</p>
                <p className="text-caption text-subtle">{p.category}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'author', label: 'Author', width: '150px' },
      {
        key: 'publishedAt',
        label: 'Published',
        width: '130px',
        render: (row: never) => <span className="num text-caption text-muted">{formatDate((row as unknown as { publishedAt: string }).publishedAt)}</span>,
      },
      { key: 'readingMinutes', label: 'Read', width: '80px', align: 'center', render: (row: never) => <span className="num">{(row as unknown as { readingMinutes: number }).readingMinutes}m</span> },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 8, section: 'Basics' },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, span: 4, section: 'Basics' },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, span: 12, section: 'Basics' },
      { name: 'body', label: 'Article body', type: 'richtext', required: true, span: 12, section: 'Content', help: 'Markdown-style: ## headings, - bullets, **bold**.' },
      { name: 'coverImage', label: 'Cover image', type: 'image', required: true, span: 12, section: 'Media' },
      { name: 'category', label: 'Category', type: 'text', span: 6, section: 'Classification' },
      { name: 'tags', label: 'Tags', type: 'tags', span: 6, section: 'Classification' },
      { name: 'author', label: 'Author', type: 'text', required: true, span: 6, section: 'Author' },
      { name: 'authorRole', label: 'Author role', type: 'text', required: true, span: 6, section: 'Author' },
      { name: 'authorAvatar', label: 'Author photo', type: 'image', required: true, span: 12, section: 'Author' },
      { name: 'publishedAt', label: 'Publish date', type: 'date', span: 6, section: 'Publishing' },
      { name: 'readingMinutes', label: 'Reading time (min)', type: 'number', required: true, span: 6, section: 'Publishing' },
      { name: 'featured', label: 'Feature at top of blog', type: 'boolean', span: 6, section: 'Publishing', defaultValue: false },
      statusField,
    ],
  },

  {
    key: 'gallery',
    label: 'Gallery',
    singular: 'Media item',
    description: 'Photos, video, drone footage and 360° items shown on the gallery page.',
    icon: 'Images',
    group: 'Content',
    service: galleryService as never,
    filters: [
      { key: 'kind', label: 'Type', options: ['photo', 'video', 'drone', '360'].map((v) => ({ value: v, label: v })) },
      { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    ],
    columns: [
      {
        key: 'title',
        label: 'Item',
        render: (row: never) => {
          const g = row as unknown as { title: string; thumbnail: string; category: string };
          return (
            <div className="flex items-center gap-3">
              <img src={g.thumbnail} alt="" className="h-10 w-14 shrink-0 rounded object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate font-medium">{truncate(g.title, 46)}</p>
                <p className="text-caption capitalize text-subtle">{g.category}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'kind', label: 'Type', width: '110px', render: (row: never) => <Badge variant="brand" size="sm">{(row as unknown as { kind: string }).kind}</Badge> },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 12, section: 'Basics' },
      {
        name: 'kind',
        label: 'Media type',
        type: 'select',
        required: true,
        span: 6,
        section: 'Basics',
        options: [
          { value: 'photo', label: 'Photo' },
          { value: 'video', label: 'Video' },
          { value: 'drone', label: 'Drone' },
          { value: '360', label: '360° view' },
        ],
      },
      { name: 'category', label: 'Category', type: 'text', required: true, span: 6, section: 'Basics' },
      {
        /* Options are the compiled seed, like the services faqIds picker — a
           brand-new project appears here after the next rebuild. Optional:
           process/team shots have no project to point at. */
        name: 'projectId',
        label: 'Linked project',
        type: 'select',
        span: 6,
        section: 'Basics',
        options: projects.map((p) => ({ value: p.id, label: p.title })),
      },
      { name: 'thumbnail', label: 'Thumbnail', type: 'image', required: true, span: 6, section: 'Media' },
      { name: 'url', label: 'Full-size / source URL', type: 'image', required: true, span: 6, section: 'Media' },
      { name: 'duration', label: 'Duration', type: 'text', span: 6, section: 'Media', placeholder: '2:34' },
      orderField,
      statusField,
    ],
  },

  {
    key: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    description: 'Client reviews shown on the homepage and about page. Hindi and Hinglish supported.',
    icon: 'Quote',
    group: 'Content',
    service: testimonialsService as never,
    filters: [{ key: 'status', label: 'Status', options: STATUS_OPTIONS }],
    columns: [
      {
        key: 'name',
        label: 'Client',
        render: (row: never) => {
          const t = row as unknown as { name: string; locality: string; avatar?: string };
          return (
            <div className="flex items-center gap-3">
              {t.avatar && <img src={t.avatar} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />}
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-caption text-subtle">{t.locality}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'quote', label: 'Quote', render: (row: never) => <span className="text-muted">{truncate((row as unknown as { quote: string }).quote, 64)}</span> },
      { key: 'rating', label: 'Rating', width: '100px', align: 'center', render: (row: never) => <span className="text-warning">{'★'.repeat((row as unknown as { rating: number }).rating)}</span> },
      statusColumn as never,
    ],
    fields: [
      { name: 'name', label: 'Client name', type: 'text', required: true, span: 6, section: 'Basics' },
      {
        /* "Director, XYZ Developers" / "Jagatpura homeowner" — the line under
           the name. The card renders it when present; the panel simply had no
           box for it, so every panel-born testimonial was name-only. */
        name: 'title',
        label: 'Designation / relation',
        type: 'text',
        span: 6,
        section: 'Person',
        placeholder: 'Homeowner, Jagatpura',
      },
      { name: 'locality', label: 'Locality', type: 'text', required: true, span: 6, section: 'Basics' },
      { name: 'quote', label: 'Testimonial', type: 'textarea', required: true, span: 12, section: 'Basics' },
      {
        name: 'language',
        label: 'Language',
        type: 'select',
        span: 4,
        section: 'Basics',
        options: [
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'Hindi (Devanagari)' },
          { value: 'hinglish', label: 'Hinglish (Roman)' },
        ],
        defaultValue: 'en',
      },
      { name: 'rating', label: 'Rating', type: 'rating', span: 8, section: 'Basics', defaultValue: 5 },
      /* What the card's "See the project" link points at. `span: 12` because
         Basics' rows are already full at 6+6 / 12 / 4+8 — a 6 here would leave
         the last row 14 columns wide and wrap it. */
      {
        name: 'projectId',
        label: 'Linked project',
        type: 'select',
        span: 12,
        section: 'Basics',
        options: projects.map((p) => ({ value: p.id, label: `${p.title} — ${p.locality}` })),
      },
      { name: 'avatar', label: 'Client photo', type: 'image', span: 6, section: 'Media' },
      { name: 'image', label: 'Project image', type: 'image', span: 6, section: 'Media' },
      /* Paste a YouTube/Vimeo link or a direct file URL — VideoLightbox works
         out which player to use. Leave blank and the card shows its poster with
         no play button, which is the normal case. */
      { name: 'videoUrl', label: 'Video URL (YouTube, Vimeo or file)', type: 'url', span: 12, section: 'Media' },
      { name: 'videoPoster', label: 'Video poster (falls back to project image)', type: 'image', span: 6, section: 'Media' },
      { name: 'videoDuration', label: 'Video length', type: 'text', span: 6, section: 'Media', placeholder: '1:24' },
      { name: 'featured', label: 'Show on homepage', type: 'boolean', span: 6, section: 'Publishing' },
      orderField,
      statusField,
    ],
  },

  {
    key: 'faqs',
    label: 'FAQs',
    singular: 'FAQ',
    description: 'Questions and answers surfaced across service, pricing and contact pages.',
    icon: 'HelpCircle',
    group: 'Content',
    service: faqsService as never,
    filters: [
      { key: 'category', label: 'Category', options: ['general', 'pricing', 'process', 'mepf', 'interiors', 'vastu', 'careers'].map((v) => ({ value: v, label: v })) },
    ],
    columns: [
      { key: 'question', label: 'Question', render: (row: never) => <span className="font-medium">{truncate((row as unknown as { question: string }).question, 68)}</span> },
      { key: 'category', label: 'Category', width: '130px', render: (row: never) => <Badge variant="default" size="sm">{(row as unknown as { category: string }).category}</Badge> },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
      statusColumn as never,
    ],
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, span: 12 },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, span: 12 },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        span: 6,
        options: ['general', 'pricing', 'process', 'mepf', 'interiors', 'vastu', 'careers'].map((v) => ({ value: v, label: v })),
      },
      orderField,
      statusField,
    ],
  },

  {
    key: 'client-logos',
    label: 'Client logos',
    singular: 'Logo',
    description: 'Brand and supplier marks shown in the homepage trust marquee.',
    icon: 'BadgeCheck',
    group: 'Content',
    service: clientLogosService as never,
    columns: [
      {
        key: 'name',
        label: 'Brand',
        render: (row: never) => {
          const l = row as unknown as { name: string; logo: string };
          return (
            <div className="flex items-center gap-3">
              <img src={l.logo} alt="" className="h-8 w-auto max-w-[120px] object-contain" loading="lazy" />
              <span className="font-medium">{l.name}</span>
            </div>
          );
        },
      },
      { key: 'website', label: 'Website' },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
      statusColumn as never,
    ],
    fields: [
      { name: 'name', label: 'Brand name', type: 'text', required: true, span: 6 },
      { name: 'website', label: 'Website', type: 'url', span: 6 },
      { name: 'logo', label: 'Logo', type: 'image', required: true, span: 12 },
      orderField,
      statusField,
    ],
  },

  {
    key: 'downloads',
    label: 'Downloads',
    singular: 'Download',
    description: 'Files offered in the downloads centre, including gated lead-capture files.',
    icon: 'Download',
    group: 'Content',
    service: downloadsService as never,
    filters: [{ key: 'category', label: 'Category', options: ['profile', 'brochure', 'certificate', 'catalogue', 'checklist'].map((v) => ({ value: v, label: v })) }],
    columns: [
      { key: 'title', label: 'File', render: (row: never) => <span className="font-medium">{(row as unknown as { title: string }).title}</span> },
      { key: 'category', label: 'Category', width: '130px' },
      { key: 'fileSize', label: 'Size', width: '100px' },
      {
        key: 'gated',
        label: 'Gated',
        width: '100px',
        align: 'center',
        render: (row: never) => ((row as unknown as { gated: boolean }).gated ? <Badge variant="warning" size="sm">Gated</Badge> : <Badge variant="success" size="sm">Free</Badge>),
      },
      { key: 'downloads', label: 'Downloads', width: '110px', align: 'right', render: (row: never) => <span className="num">{formatNumber((row as unknown as { downloads: number }).downloads)}</span> },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 8, section: 'Basics' },
      {
        name: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        span: 4,
        section: 'Basics',
        options: ['profile', 'brochure', 'certificate', 'catalogue', 'checklist'].map((v) => ({ value: v, label: v })),
      },
      { name: 'description', label: 'Description', type: 'textarea', span: 12, section: 'Basics' },
      { name: 'fileUrl', label: 'File URL', type: 'url', span: 6, section: 'File' },
      { name: 'fileType', label: 'File type', type: 'text', span: 4, section: 'File', placeholder: 'PDF' },
      { name: 'fileSize', label: 'File size', type: 'text', span: 4, section: 'File', placeholder: '2.4 MB' },
      { name: 'thumbnail', label: 'Thumbnail', type: 'image', span: 12, section: 'File' },
      { name: 'gated', label: 'Require name & phone', type: 'boolean', span: 6, section: 'Publishing' },
      orderField,
      statusField,
    ],
  },

  /* ---------------------------- PEOPLE ---------------------------- */
  {
    key: 'team',
    label: 'Team',
    singular: 'Team member',
    description: 'People shown on the about page team grid.',
    icon: 'Users',
    group: 'People',
    service: teamService as never,
    filters: [{ key: 'department', label: 'Department', options: ['leadership', 'design', 'engineering', 'site', 'support'].map((v) => ({ value: v, label: v })) }],
    columns: [
      {
        key: 'name',
        label: 'Member',
        render: (row: never) => {
          const m = row as unknown as { name: string; role: string; photo: string };
          return (
            <div className="flex items-center gap-3">
              <img src={m.photo} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-caption text-subtle">{m.role}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'department', label: 'Department', width: '140px' },
      { key: 'experienceYears', label: 'Experience', width: '110px', align: 'right', render: (row: never) => <span className="num">{(row as unknown as { experienceYears: number }).experienceYears} yrs</span> },
      statusColumn as never,
    ],
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, span: 6, section: 'Basics' },
      { name: 'role', label: 'Role', type: 'text', required: true, span: 6, section: 'Basics' },
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        required: true,
        span: 6,
        section: 'Basics',
        options: ['leadership', 'design', 'engineering', 'site', 'support'].map((v) => ({ value: v, label: v })),
      },
      { name: 'experienceYears', label: 'Years of experience', type: 'number', required: true, span: 6, section: 'Basics' },
      { name: 'bio', label: 'Short bio', type: 'textarea', required: true, span: 12, section: 'Basics' },
      { name: 'photo', label: 'Photograph', type: 'image', required: true, span: 12, section: 'Media' },
      { name: 'expertise', label: 'Areas of expertise', type: 'tags', span: 12, section: 'Details' },
      { name: 'socials', label: 'Social links', type: 'socials', span: 12, section: 'Details', help: 'Shown as icons on the about-page photo. Leave both blank for none.' },
      orderField,
      statusField,
    ],
  },

  {
    key: 'careers',
    label: 'Job openings',
    singular: 'Job',
    description: 'Open roles listed on the careers page.',
    icon: 'Briefcase',
    group: 'People',
    service: careersService as never,
    publicHref: (row: never) => ROUTES.career((row as { slug: string }).slug),
    filters: [{ key: 'department', label: 'Department', options: ['Design', 'Engineering', 'Site'].map((v) => ({ value: v, label: v })) }],
    columns: [
      { key: 'title', label: 'Role', render: (row: never) => <span className="font-medium">{(row as unknown as { title: string }).title}</span> },
      { key: 'department', label: 'Department', width: '130px' },
      { key: 'type', label: 'Type', width: '120px' },
      { key: 'openings', label: 'Openings', width: '100px', align: 'center', render: (row: never) => <span className="num">{(row as unknown as { openings: number }).openings}</span> },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Job title', type: 'text', required: true, span: 8, section: 'Basics' },
      { name: 'slug', label: 'URL slug', type: 'slug', required: true, span: 4, section: 'Basics' },
      { name: 'department', label: 'Department', type: 'text', required: true, span: 4, section: 'Basics' },
      {
        name: 'type',
        label: 'Employment type',
        type: 'select',
        required: true,
        span: 4,
        section: 'Basics',
        options: ['full-time', 'part-time', 'contract', 'internship'].map((v) => ({ value: v, label: v })),
      },
      { name: 'openings', label: 'Number of openings', type: 'number', span: 4, section: 'Basics', defaultValue: 1 },
      { name: 'location', label: 'Location', type: 'text', span: 6, section: 'Details', defaultValue: 'Jaipur, Rajasthan' },
      { name: 'experience', label: 'Experience required', type: 'text', required: true, span: 6, section: 'Details', placeholder: '3–6 years' },
      { name: 'salaryRange', label: 'Salary range', type: 'text', span: 6, section: 'Details', placeholder: '₹6 – 11 LPA' },
      { name: 'postedAt', label: 'Posted on', type: 'date', span: 6, section: 'Details' },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, span: 12, section: 'Content' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'tags', span: 12, section: 'Content', help: 'One per entry — press Enter after each.' },
      { name: 'requirements', label: 'Requirements', type: 'tags', span: 12, section: 'Content', help: 'One per entry — press Enter after each.' },
      { name: 'benefits', label: 'Benefits', type: 'tags', span: 12, section: 'Content', help: 'One per entry — press Enter after each.' },
      statusField,
    ],
  },

  {
    key: 'applications',
    label: 'Job applications',
    singular: 'Application',
    description: 'Applications submitted through the careers pages.',
    icon: 'FileUser',
    group: 'People',
    service: applicationsService as never,
    canCreate: false,
    filters: [{ key: 'stage', label: 'Stage', options: ['new', 'screening', 'interview', 'offer', 'rejected'].map((v) => ({ value: v, label: v })) }],
    badge: (rows: never[]) => (rows as unknown as { stage: string }[]).filter((r) => r.stage === 'new').length || undefined,
    columns: [
      {
        key: 'name',
        label: 'Applicant',
        render: (row: never) => {
          const a = row as unknown as { name: string; email: string };
          return (
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-caption text-subtle">{a.email}</p>
            </div>
          );
        },
      },
      { key: 'jobTitle', label: 'Applied for', width: '190px' },
      { key: 'experienceYears', label: 'Exp.', width: '80px', align: 'center', render: (row: never) => <span className="num">{(row as unknown as { experienceYears: number }).experienceYears}y</span> },
      {
        key: 'stage',
        label: 'Stage',
        width: '130px',
        render: (row: never) => {
          const stage = (row as unknown as { stage: string }).stage;
          const tone = stage === 'offer' ? 'success' : stage === 'rejected' ? 'danger' : stage === 'new' ? 'brand' : 'warning';
          return <Badge variant={tone} size="sm">{stage}</Badge>;
        },
      },
      { key: 'createdAt', label: 'Received', width: '130px' },
    ],
    fields: [
      { name: 'name', label: 'Applicant name', type: 'text', span: 6 },
      { name: 'email', label: 'Email', type: 'email', span: 6 },
      { name: 'phone', label: 'Phone', type: 'text', span: 6 },
      { name: 'experienceYears', label: 'Years of experience', type: 'number', span: 6 },
      { name: 'jobTitle', label: 'Applied for', type: 'text', span: 12 },
      {
        name: 'stage',
        label: 'Hiring stage',
        type: 'select',
        span: 6,
        options: ['new', 'screening', 'interview', 'offer', 'rejected'].map((v) => ({ value: v, label: v })),
      },
      { name: 'resumeUrl', label: 'Résumé link', type: 'url', span: 6 },
      { name: 'coverNote', label: 'Cover note', type: 'textarea', span: 12 },
    ],
  },

  /* ----------------------------- LEADS ----------------------------- */
  {
    key: 'enquiries',
    label: 'Enquiries',
    singular: 'Enquiry',
    description: 'Leads captured from contact forms, service pages and gated downloads.',
    icon: 'Inbox',
    group: 'Leads',
    service: enquiriesService as never,
    canCreate: false,
    filters: [
      { key: 'stage', label: 'Stage', options: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((v) => ({ value: v, label: v })) },
      /* Must match the `source` union on `Enquiry` — an option here that no code
         path writes is a filter that can never match a row. `idle-popup` was
         missing, so popup leads could not be filtered at all. */
      { key: 'source', label: 'Source', options: ['contact-form', 'estimator', 'idle-popup', 'download', 'newsletter'].map((v) => ({ value: v, label: v })) },
      { key: 'developmentType', label: 'Type', options: DEVELOPMENT_TYPES.map((t) => ({ value: t.key, label: t.label })) },
    ],
    badge: (rows: never[]) => (rows as unknown as { stage: string }[]).filter((r) => r.stage === 'new').length || undefined,
    columns: [
      {
        key: 'name',
        label: 'Contact',
        render: (row: never) => {
          const e = row as unknown as { name: string; phone: string };
          return (
            <div>
              <p className="font-medium">{e.name}</p>
              <p className="num text-caption text-subtle">{e.phone}</p>
            </div>
          );
        },
      },
      { key: 'serviceInterest', label: 'Interested in', width: '190px' },
      {
        key: 'developmentType',
        label: 'Type',
        width: '120px',
        /* Only popup leads carry a type; older rows and the other sources show a dash. */
        render: (row: never) => {
          const type = (row as unknown as { developmentType?: string }).developmentType;
          return type ? <Badge variant="default" size="sm">{developmentTypeLabel(type)}</Badge> : <span className="text-subtle">—</span>;
        },
      },
      { key: 'budget', label: 'Budget', width: '130px' },
      { key: 'source', label: 'Source', width: '130px', render: (row: never) => <Badge variant="default" size="sm">{(row as unknown as { source: string }).source}</Badge> },
      {
        key: 'stage',
        label: 'Stage',
        width: '120px',
        render: (row: never) => {
          const stage = (row as unknown as { stage: string }).stage;
          const tone = stage === 'won' ? 'success' : stage === 'lost' ? 'danger' : stage === 'new' ? 'brand' : 'warning';
          return <Badge variant={tone} size="sm">{stage}</Badge>;
        },
      },
      { key: 'createdAt', label: 'Received', width: '120px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', span: 6 },
      { name: 'phone', label: 'Phone', type: 'text', span: 6 },
      { name: 'email', label: 'Email', type: 'email', span: 6 },
      { name: 'city', label: 'City', type: 'text', span: 6 },
      { name: 'serviceInterest', label: 'Service interest', type: 'text', span: 6 },
      { name: 'budget', label: 'Budget', type: 'text', span: 6 },
      { name: 'message', label: 'Message', type: 'textarea', span: 12 },
      {
        name: 'developmentType',
        label: 'Type of development',
        type: 'select',
        span: 6,
        options: DEVELOPMENT_TYPES.map((t) => ({ value: t.key, label: t.label })),
      },
      { name: 'remarks', label: 'Remarks (from visitor)', type: 'textarea', span: 12 },
      {
        name: 'stage',
        label: 'Pipeline stage',
        type: 'select',
        span: 6,
        options: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((v) => ({ value: v, label: v })),
      },
      { name: 'assignedTo', label: 'Assigned to', type: 'text', span: 6 },
    ],
  },

  {
    key: 'estimates',
    label: 'Estimate requests',
    singular: 'Estimate',
    description: 'Every estimate generated by the public cost estimator, with the full configuration.',
    icon: 'Calculator',
    group: 'Leads',
    service: estimatesService as never,
    canCreate: false,
    filters: [{ key: 'stage', label: 'Stage', options: ['new', 'contacted', 'qualified', 'converted', 'lost'].map((v) => ({ value: v, label: v })) }],
    badge: (rows: never[]) => (rows as unknown as { stage: string }[]).filter((r) => r.stage === 'new').length || undefined,
    columns: [
      {
        key: 'name',
        label: 'Contact',
        render: (row: never) => {
          const e = row as unknown as { name: string; phone: string };
          return (
            <div>
              <p className="font-medium">{e.name}</p>
              <p className="num text-caption text-subtle">{e.phone}</p>
            </div>
          );
        },
      },
      { key: 'propertyType', label: 'Type', width: '130px' },
      { key: 'builtUpArea', label: 'Built-up', width: '110px', align: 'right', render: (row: never) => <span className="num">{formatNumber((row as unknown as { builtUpArea: number }).builtUpArea)}</span> },
      {
        key: 'totalMax',
        label: 'Estimate',
        width: '170px',
        align: 'right',
        render: (row: never) => {
          const e = row as unknown as { totalMin: number; totalMax: number };
          return <span className="num text-caption">{formatCurrencyCompact(e.totalMin)} – {formatCurrencyCompact(e.totalMax)}</span>;
        },
      },
      {
        key: 'stage',
        label: 'Stage',
        width: '120px',
        render: (row: never) => {
          const stage = (row as unknown as { stage: string }).stage;
          const tone = stage === 'converted' ? 'success' : stage === 'lost' ? 'danger' : stage === 'new' ? 'brand' : 'warning';
          return <Badge variant={tone} size="sm">{stage}</Badge>;
        },
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', span: 6 },
      { name: 'phone', label: 'Phone', type: 'text', span: 6 },
      { name: 'email', label: 'Email', type: 'email', span: 6 },
      { name: 'location', label: 'Locality', type: 'text', span: 6 },
      { name: 'city', label: 'City', type: 'text', span: 6 },
      { name: 'state', label: 'State', type: 'text', span: 6 },
      { name: 'propertyType', label: 'Property type', type: 'text', span: 4 },
      { name: 'packageType', label: 'Package', type: 'text', span: 4 },
      { name: 'qualityTier', label: 'Quality tier', type: 'text', span: 4 },
      { name: 'areaPerFloor', label: 'Area per floor', type: 'number', span: 4 },
      { name: 'floors', label: 'Floors', type: 'number', span: 4 },
      { name: 'builtUpArea', label: 'Built-up area', type: 'number', span: 4 },
      { name: 'totalMin', label: 'Estimate — low', type: 'currency', span: 4 },
      { name: 'totalMax', label: 'Estimate — high', type: 'currency', span: 4 },
      { name: 'timelineWeeks', label: 'Timeline (weeks)', type: 'number', span: 4 },
      {
        name: 'stage',
        label: 'Pipeline stage',
        type: 'select',
        span: 12,
        options: ['new', 'contacted', 'qualified', 'converted', 'lost'].map((v) => ({ value: v, label: v })),
      },
    ],
    preview: (row: never) => {
      const e = row as unknown as {
        name: string; phone: string; propertyType: string; packageType: string; qualityTier: string;
        location: string; state?: string; city?: string; areaPerFloor: number; builtUpArea: number;
        floors: number; totalMin: number; totalMax: number; timelineWeeks: number; enhancements: string[];
      };
      return (
        <div>
          <div className="rounded-xl bg-navy-800 p-6 text-white">
            <p className="text-caption uppercase tracking-wide text-white/50">Estimate generated</p>
            <p className="num mt-2 text-2xl font-semibold">
              {formatCurrencyCompact(e.totalMin)} – {formatCurrencyCompact(e.totalMax)}
            </p>
            <p className="num mt-1 text-caption text-white/50">
              {formatNumber(e.builtUpArea)} sq ft built-up · {e.timelineWeeks} weeks
            </p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            {[
              ['Contact', e.name],
              ['Phone', e.phone],
              ['Property type', e.propertyType],
              ['Package', e.packageType],
              ['Quality', e.qualityTier],
              /* Old rows predate the pickers — fall back to the locality
                 column so the cell never sits empty. */
              ['City', e.city ?? e.location],
              ['State', e.state ?? '—'],
              ['Area per floor', `${formatNumber(e.areaPerFloor)}`],
              ['Floors', String(e.floors)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-caption uppercase tracking-wide text-subtle">{k}</dt>
                <dd className="mt-0.5 text-sm">{v}</dd>
              </div>
            ))}
          </dl>
          {e.enhancements?.length > 0 && (
            <div className="mt-6">
              <p className="text-caption uppercase tracking-wide text-subtle">Enhancements selected</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {e.enhancements.map((x) => (
                  <Badge key={x} variant="brand" size="sm">{x}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    },
  },

  /* -------------------------- PAGE BUILDER -------------------------- */
  {
    key: 'hero',
    label: 'Hero & banners',
    singular: 'Banner',
    description: 'Hero content and promotional banners placed across the site.',
    icon: 'Presentation',
    group: 'Page builder',
    service: bannersService as never,
    filters: [{ key: 'placement', label: 'Placement', options: ['home-hero', 'promo-strip', 'projects-top', 'contact-top'].map((v) => ({ value: v, label: v })) }],
    columns: [
      {
        key: 'title',
        label: 'Banner',
        render: (row: never) => {
          const b = row as unknown as { title: string; subtitle?: string; image: string };
          return (
            <div className="flex items-center gap-3">
              <img src={b.image} alt="" className="h-10 w-16 shrink-0 rounded object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="truncate font-medium">{b.title}</p>
                <p className="truncate text-caption text-subtle">{b.subtitle}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'placement', label: 'Placement', width: '150px', render: (row: never) => <Badge variant="default" size="sm">{(row as unknown as { placement: string }).placement}</Badge> },
      statusColumn as never,
    ],
    fields: [
      { name: 'title', label: 'Headline', type: 'text', required: true, span: 12 },
      { name: 'subtitle', label: 'Subheading', type: 'text', span: 12 },
      { name: 'image', label: 'Background image', type: 'image', span: 12 },
      { name: 'ctaLabel', label: 'CTA label', type: 'text', span: 6 },
      { name: 'ctaHref', label: 'CTA link', type: 'text', span: 6 },
      {
        name: 'placement',
        label: 'Placement',
        type: 'select',
        required: true,
        span: 6,
        help: 'Only home-hero renders today — it drives the home page headline and subheading (the hero design has no CTA button or photo). The other placements have no band on the site yet; keep those rows as drafts.',
        options: ['home-hero', 'promo-strip', 'projects-top', 'contact-top'].map((v) => ({ value: v, label: v })),
      },
      orderField,
      statusField,
    ],
  },

  {
    key: 'home-sections',
    label: 'Home page sections',
    singular: 'Section',
    description: 'Enable, reorder and re-title each section of the homepage.',
    icon: 'LayoutTemplate',
    group: 'Page builder',
    service: homeSectionsService as never,
    canCreate: false,
    canDelete: false,
    columns: [
      { key: 'label', label: 'Section', render: (row: never) => <span className="font-medium">{(row as unknown as { label: string }).label}</span> },
      { key: 'heading', label: 'Heading', render: (row: never) => <span className="text-muted">{truncate((row as unknown as { heading: string }).heading, 44)}</span> },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
      {
        key: 'enabled',
        label: 'Visible',
        width: '110px',
        align: 'center',
        render: (row: never) => ((row as unknown as { enabled: boolean }).enabled ? <Badge variant="success" size="sm">Visible</Badge> : <Badge variant="default" size="sm">Hidden</Badge>),
      },
    ],
    fields: [
      { name: 'label', label: 'Section name', type: 'text', span: 6 },
      { name: 'key', label: 'Section key', type: 'text', span: 6, readOnly: true },
      { name: 'heading', label: 'Heading', type: 'text', span: 12, help: 'Flows into the sections built on a standard header — What we do, Featured projects, Testimonials. The other bands compose their own copy, so this stays blank for them.' },
      { name: 'subheading', label: 'Subheading', type: 'textarea', span: 12 },
      { name: 'enabled', label: 'Show this section', type: 'boolean', span: 6 },
      orderField,
    ],
  },

  {
    key: 'navbar',
    label: 'Navigation',
    singular: 'Nav item',
    description: 'Primary navigation links, order and highlight badges.',
    icon: 'Menu',
    group: 'Page builder',
    service: navbarService as never,
    columns: [
      { key: 'label', label: 'Label', render: (row: never) => <span className="font-medium">{(row as unknown as { label: string }).label}</span> },
      { key: 'href', label: 'Link', render: (row: never) => <span className="num text-caption text-muted">{(row as unknown as { href: string }).href}</span> },
      { key: 'badge', label: 'Badge', width: '110px' },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
    ],
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true, span: 6 },
      { name: 'href', label: 'Link', type: 'text', required: true, span: 6 },
      { name: 'badge', label: 'Badge text', type: 'text', span: 6, placeholder: 'New' },
      { name: 'highlight', label: 'Highlight as primary CTA', type: 'boolean', span: 6 },
      orderField,
      statusField,
    ],
  },

  {
    key: 'footer',
    label: 'Footer',
    singular: 'Footer column',
    description: 'Footer link columns and their contents.',
    icon: 'PanelBottom',
    group: 'Page builder',
    service: footerService as never,
    columns: [
      { key: 'heading', label: 'Column', render: (row: never) => <span className="font-medium">{(row as unknown as { heading: string }).heading}</span> },
      { key: 'links', label: 'Links', render: (row: never) => <span className="num text-caption text-muted">{(row as unknown as { links: unknown[] }).links.length} links</span> },
      { key: 'order', label: 'Order', width: '80px', align: 'center' },
    ],
    fields: [
      { name: 'heading', label: 'Column heading', type: 'text', required: true, span: 6 },
      { name: 'links', label: 'Links', type: 'link-list', span: 12, help: 'Row order is display order. Internal links start with / — e.g. /gallery.' },
      orderField,
      statusField,
    ],
  },

  /* ----------------------------- SYSTEM ----------------------------- */
  {
    key: 'media',
    label: 'Media library',
    singular: 'Asset',
    description: 'All uploaded images and documents, organised by folder.',
    icon: 'FolderOpen',
    group: 'System',
    service: mediaService as never,
    filters: [{ key: 'folder', label: 'Folder', options: ['projects/jagatpura', 'team', 'services', 'blog', 'banners', 'seo'].map((v) => ({ value: v, label: v })) }],
    columns: [
      {
        key: 'filename',
        label: 'Asset',
        render: (row: never) => {
          const m = row as unknown as { filename: string; url: string; folder: string };
          return (
            <div className="flex items-center gap-3">
              <img src={m.url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" loading="lazy" />
              <div className="min-w-0">
                <p className="num truncate text-caption font-medium">{m.filename}</p>
                <p className="num text-caption text-subtle">{m.folder}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'mimeType', label: 'Type', width: '120px' },
      {
        key: 'sizeBytes',
        label: 'Size',
        width: '100px',
        align: 'right',
        render: (row: never) => <span className="num">{Math.round((row as unknown as { sizeBytes: number }).sizeBytes / 1024)} KB</span>,
      },
      { key: 'createdAt', label: 'Uploaded', width: '130px' },
    ],
    fields: [
      { name: 'filename', label: 'File name', type: 'text', required: true, span: 6 },
      { name: 'folder', label: 'Folder', type: 'text', span: 6 },
      { name: 'url', label: 'Asset', type: 'image', required: true, span: 12 },
      { name: 'alt', label: 'Alt text', type: 'text', span: 12, help: 'Describe the image for screen readers and SEO.' },
    ],
  },

  {
    key: 'seo',
    label: 'SEO & meta',
    singular: 'Meta record',
    description: 'Per-route titles, descriptions, keywords and Open Graph images.',
    icon: 'Search',
    group: 'System',
    service: seoService as never,
    columns: [
      { key: 'route', label: 'Route', width: '150px', render: (row: never) => <span className="num text-caption">{(row as unknown as { route: string }).route}</span> },
      { key: 'title', label: 'Title', render: (row: never) => <span className="font-medium">{truncate((row as unknown as { title: string }).title, 54)}</span> },
      {
        key: 'noIndex',
        label: 'Indexed',
        width: '110px',
        align: 'center',
        render: (row: never) => ((row as unknown as { noIndex: boolean }).noIndex ? <Badge variant="warning" size="sm">No-index</Badge> : <Badge variant="success" size="sm">Indexed</Badge>),
      },
    ],
    fields: [
      { name: 'route', label: 'Route', type: 'text', required: true, span: 6, placeholder: '/projects' },
      { name: 'noIndex', label: 'Exclude from search engines', type: 'boolean', span: 6 },
      { name: 'title', label: 'Meta title', type: 'text', required: true, span: 12, help: 'Aim for 50–60 characters.' },
      { name: 'description', label: 'Meta description', type: 'textarea', required: true, span: 12, help: 'Aim for 140–160 characters.' },
      { name: 'keywords', label: 'Keywords', type: 'tags', span: 12 },
      { name: 'ogImage', label: 'Open Graph image', type: 'image', span: 12, help: '1200 × 630 px recommended.' },
    ],
  },

  {
    key: 'users',
    label: 'Users',
    singular: 'User',
    description: 'People with access to this admin panel.',
    icon: 'UserCog',
    group: 'System',
    service: usersService as never,
    filters: [{ key: 'roleName', label: 'Role', options: ['Owner', 'Administrator', 'Editor', 'Viewer'].map((v) => ({ value: v, label: v })) }],
    columns: [
      {
        key: 'name',
        label: 'User',
        render: (row: never) => {
          const u = row as unknown as { name: string; email: string; avatar: string };
          return (
            <div className="flex items-center gap-3">
              <img src={u.avatar} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-caption text-subtle">{u.email}</p>
              </div>
            </div>
          );
        },
      },
      { key: 'roleName', label: 'Role', width: '150px', render: (row: never) => <Badge variant="brand" size="sm">{(row as unknown as { roleName: string }).roleName}</Badge> },
      { key: 'lastActiveAt', label: 'Last active', width: '140px' },
      {
        key: 'active',
        label: 'State',
        width: '110px',
        align: 'center',
        render: (row: never) => ((row as unknown as { active: boolean }).active ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="default" size="sm">Disabled</Badge>),
      },
    ],
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, span: 6 },
      { name: 'email', label: 'Email', type: 'email', required: true, span: 6 },
      {
        name: 'roleName',
        label: 'Role',
        type: 'select',
        required: true,
        span: 6,
        options: ['Owner', 'Administrator', 'Editor', 'Viewer'].map((v) => ({ value: v, label: v })),
      },
      { name: 'active', label: 'Account active', type: 'boolean', span: 6, defaultValue: true },
      { name: 'avatar', label: 'Avatar', type: 'image', span: 12 },
    ],
  },

  {
    key: 'settings',
    label: 'Settings',
    singular: 'Setting',
    description: 'Company details, contact information, social links and analytics IDs.',
    icon: 'Settings',
    group: 'System',
    service: settingsService as never,
    canCreate: false,
    canDelete: false,
    filters: [{ key: 'group', label: 'Group', options: ['general', 'contact', 'social', 'analytics', 'theme'].map((v) => ({ value: v, label: v })) }],
    columns: [
      { key: 'label', label: 'Setting', render: (row: never) => <span className="font-medium">{(row as unknown as { label: string }).label}</span> },
      { key: 'key', label: 'Key', width: '190px', render: (row: never) => <span className="num text-caption text-subtle">{(row as unknown as { key: string }).key}</span> },
      { key: 'value', label: 'Value', render: (row: never) => <span className="text-muted">{truncate((row as unknown as { value: string }).value, 40)}</span> },
      { key: 'group', label: 'Group', width: '120px', render: (row: never) => <Badge variant="default" size="sm">{(row as unknown as { group: string }).group}</Badge> },
    ],
    fields: [
      { name: 'label', label: 'Label', type: 'text', span: 6, readOnly: true },
      { name: 'key', label: 'Key', type: 'text', span: 6, readOnly: true },
      { name: 'value', label: 'Value', type: 'textarea', required: true, span: 12 },
    ],
  },

  {
    key: 'estimator-prices',
    label: 'Estimator prices',
    singular: 'Price',
    /* The one knob the owner turns most. Rows are created by the deploy seed,
       never here — the quote engine matches on the fixed `key`, so the list is
       read-and-edit only. Parking a row in Draft makes the engine fall back to
       the built-in default rate: the kill-switch for a bad edit. The old 20%
       wastage buffer is baked into these rates (client's call, Sep 2026) —
       quantities on the public page read net. */
    description: 'Every rate the public cost estimator charges — materials by brand, labour per sq ft, and site overheads. The wastage allowance is baked into these rates.',
    icon: 'SlidersHorizontal',
    group: 'System',
    service: estimatorPricesService as never,
    canCreate: false,
    canDelete: false,
    searchPlaceholder: 'Search by material or brand…',
    columns: [
      {
        key: 'label',
        label: 'Item',
        render: (row: never) => {
          const r = row as unknown as { label: string; image?: string };
          return (
            <div className="flex items-center gap-3">
              {r.image ? (
                <img src={r.image} alt="" className="h-8 w-10 shrink-0 rounded border bg-white object-contain p-0.5" loading="lazy" />
              ) : (
                <span className="h-8 w-10 shrink-0 rounded border bg-[rgb(var(--c-text))]/[0.04]" />
              )}
              <span className="font-medium">{r.label}</span>
            </div>
          );
        },
      },
      { key: 'unit', label: 'Unit', width: '190px', render: (row: never) => <span className="text-caption text-subtle">{(row as unknown as { unit: string }).unit}</span> },
      {
        key: 'rate',
        label: 'Rate',
        width: '120px',
        align: 'right',
        render: (row: never) => {
          const r = row as unknown as { rate: number; key: string };
          return <span className="num font-medium">{r.key === 'overheads' ? `${r.rate}%` : `₹${formatNumber(r.rate)}`}</span>;
        },
      },
      statusColumn as never,
    ],
    fields: [
      { name: 'label', label: 'Item', type: 'text', span: 8, readOnly: true },
      { name: 'unit', label: 'Unit', type: 'text', span: 4, readOnly: true },
      { name: 'rate', label: 'Rate', type: 'number', required: true, span: 6, help: 'Whole rupees — except Site overheads, where this is a percent. Rows ending in “fixing labour” are the installation charge per running ft for that door-frame type, added on top of its material rate.' },
      {
        name: 'image',
        label: 'Image',
        type: 'image',
        span: 12,
        help: 'The brand logo or material photo shown on the calculator card. Upload a new file or paste a URL; leave the Labour and Site overheads rows empty — they have no card.',
      },
      statusField,
    ],
  },
];

export const MODULE_BY_KEY = Object.fromEntries(MODULES.map((m) => [m.key, m]));

export const MODULE_GROUPS = ['Content', 'People', 'Leads', 'Page builder', 'System'] as const;

/** Screens with no generic CRUD shape — dashboards and matrices, not resources. */
export const EXTRA_NAV = [
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', group: 'Overview' as const },
  { key: 'roles', label: 'Roles & permissions', icon: 'ShieldCheck', group: 'System' as const },
  { key: 'theme', label: 'Theme', icon: 'Palette', group: 'System' as const },
];

export { rolesService, formatCurrency };

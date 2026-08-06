# 02 — Sitemap, Feature List & User Journeys

---

## 1. Sitemap

```
PUBLIC SITE
│
├── /                               Home — cinematic scroll narrative
├── /about                          About: story · mission · vision · values · timeline · leadership · certifications
├── /services                       Services hub (5 pillars)
│   ├── /services/architectural-design
│   ├── /services/mepf-consultancy          ← technical depth, commercial-buyer bait
│   ├── /services/turnkey-construction
│   ├── /services/interior-design
│   └── /services/project-management
├── /projects                       Filterable project library (market · type · location · year · status)
│   └── /projects/:slug             Case study: hero · specs · narrative · gallery · before/after · map · next
├── /estimator                      ★ Construction Cost Estimator (7-step wizard + material spec + PDF)
├── /pricing                        Packages, labour vs turnkey chooser, inclusion matrix, FAQs
├── /vastu                          Vastu-aligned planning system (differentiator page)
├── /gallery                        Photos · videos · drone · 360° (mock)
├── /careers                        Culture · benefits · open roles
│   └── /careers/:slug              Role detail + application form
├── /blog                           Insights: search · categories · featured
│   └── /blog/:slug                 Article: reading progress · TOC · related
├── /downloads                      Company profile · brochure · rate card · certificates · checklists
├── /contact                        Enquiry form · map · branches · WhatsApp · hours
├── /portal                         ★ Client Portal (prototype, mock auth)
│   ├── /portal/overview            Project progress, next milestone, live site camera
│   ├── /portal/timeline            Milestone timeline + delays
│   ├── /portal/documents           Drawings, approvals, contracts
│   ├── /portal/invoices            Payment schedule + status
│   └── /portal/updates             Site update feed with photos
├── /privacy · /terms
└── *                               404 (designed, not default)

ADMIN PANEL  (/admin — prototype, mock data, API-shaped)
│
├── /admin                          Dashboard (KPIs, funnel, recent activity)
├── /admin/analytics                Traffic · leads · estimator usage · conversion
│
├── CONTENT
│   ├── /admin/projects             ├── /admin/services       ├── /admin/blogs
│   ├── /admin/gallery              ├── /admin/testimonials   ├── /admin/faqs
│   ├── /admin/clients              (client logos)            └── /admin/downloads
│
├── PEOPLE
│   ├── /admin/team                 ├── /admin/careers        └── /admin/applications
│
├── LEADS
│   ├── /admin/enquiries            └── /admin/estimates      (estimator submissions)
│
├── PAGE BUILDER
│   ├── /admin/hero                 ├── /admin/home-sections  ├── /admin/about-page
│   ├── /admin/banners              ├── /admin/navbar         └── /admin/footer
│
├── SYSTEM
│   ├── /admin/estimator-config     ★ rates, multipliers, packages, cities
│   ├── /admin/media                ├── /admin/forms          ├── /admin/seo
│   ├── /admin/users                ├── /admin/roles          ├── /admin/theme
│   └── /admin/settings
```

**Route count:** 30 public + 28 admin modules.

---

## 2. Master Feature List

### 2.1 Global / cross-cutting
| # | Feature | Notes |
| --- | --- | --- |
| G1 | Lenis inertia smooth scroll | Disabled under `prefers-reduced-motion` |
| G2 | Route transition curtain + scroll restoration | 480 ms, non-blocking |
| G3 | First-visit preloader with logo draw + counter | Once per session (`sessionStorage`) |
| G4 | Magnetic cursor + hover states on desktop | Pointer-fine only |
| G5 | Sticky adaptive navbar (transparent → glass on scroll) | Mega-menu on desktop, full-screen drawer on mobile |
| G6 | Floating action rail: WhatsApp · Call · Estimate | Persistent, thumb-reachable on mobile |
| G7 | Command palette (`⌘K`) for search & navigation | Enterprise signal, real utility |
| G8 | Dark / light theme with system sync | Tokenised, admin-configurable |
| G9 | SEO head manager per route + JSON-LD | Organization, LocalBusiness, Article, BreadcrumbList |
| G10 | Accessibility: focus rings, skip link, ARIA, keyboard-complete | WCAG 2.2 AA target |
| G11 | Error boundary + designed 404/500 | |
| G12 | Toast system + optimistic form states | |

### 2.2 Home
Cinematic hero (kinetic type, blueprint canvas, parallax media) · trust bar · "single point of
responsibility" narrative · services grid with animated cards · featured projects with
image-reveal transitions · pinned 6-step process timeline · animated statistics counters ·
Vastu teaser · why-choose-us · testimonials (bilingual) · live-monitoring teaser ·
estimator CTA band · contact CTA.

### 2.3 Projects
Masonry/grid toggle · multi-facet filters (category, location, status, year) · sort ·
URL-synced filter state · skeleton loading · hover video/parallax preview · detail page with
sticky spec rail, narrative, gallery lightbox, **before/after drag slider**, location map,
related projects, prev/next.

### 2.4 Cost Estimator ★
Seven steps: **Intent → Site → Structure → Package → Materials → Enhancements → Result.**
- Property type (residential/commercial/mixed/interior-only)
- Plot area + unit switch (sqft / sq yard / bigha) with live conversion
- Floors (G, G+1 … G+4) + basement, stilt parking
- Built-up ratio auto-derived, user-overridable
- Package: Civil · Semi-Furnished · Fully Furnished (labour-only vs turnkey toggle)
- Material quality tier: Essential / Signature / Bespoke (multiplier)
- Locality (Jaipur zones + other cities) → location multiplier
- Enhancements: modular kitchen, false ceiling, elevation, landscaping, solar, waterproofing,
  termite treatment, home automation, boundary wall, borewell
- **Material specification (step 5)** — full parity with the client's existing calculator: 14 categories
  (TMT Steel, Bricks, Cement, Electrical, Flooring, Door, Windows, Wall Finish, Hand Rails, Stone,
  Mix Concrete, Sand, Plumbing, Preferences), every published brand and rate, plus the Water Proofing /
  Termite Solution yes-no toggles. Skippable — "use our recommended spec" is one click.
  **Unlike the original, every choice moves the estimate**, priced as a delta from each group's baseline
  because the package rate already includes a standard grade. Items priced per RFT/TON/CUM/NOS are
  listed at unit rate and marked "quantified at BOQ" rather than guessed.
- **Live cost meter that updates on every keystroke** (sticky, always visible)
- Result: total range · per-sqft · **head-wise breakdown** (Structure/Finishing/MEP/Interior/Misc)
  with animated donut · **payment milestone schedule** · **estimated timeline in weeks with Gantt strip** ·
  assumptions & exclusions · **Download PDF estimate** · Email/WhatsApp share · book consultation.
- Validation via Zod, per-step, with inline errors; state persisted to `sessionStorage` so a
  refresh never loses progress; deep-linkable via query params.

### 2.5 Client Portal (prototype)
Mock login (any credentials, seeded demo user) · project selector · overall progress ring ·
milestone timeline with actual-vs-planned · document vault with categories · invoice ledger with
paid/due/overdue states · site update feed with photos · live camera placeholder · support contact.

### 2.6 Admin Panel
- **Declarative CRUD engine**: each module is a `ResourceConfig` (fields, columns, validators,
  relations). One table engine + one form engine render all 28 modules → consistent UX,
  minimal surface area, trivially extendable.
- Per-module: list (search, filter, sort, paginate, bulk select), create, edit, delete with
  confirm, **preview drawer**, duplicate, publish/draft toggle, reorder (drag) where ordered.
- Dashboard: KPI tiles, lead funnel, estimator usage chart, recent enquiries, activity log.
- Media library with grid/list, upload dropzone (mock), copy-URL.
- Estimator config: edit base rates, multipliers, enhancement prices → **the public estimator
  reads from this store**, so admin edits change the live calculator. Demonstrates real coupling.
- Theme settings: brand colour, radius, font scale → writes CSS variables live.
- RBAC: roles matrix (Owner/Admin/Editor/Viewer) with permission grid.

---

## 3. User Journeys

### J1 — Homeowner, high intent (primary conversion path)
```
Google "house construction cost jaipur"
      ↓
Lands /estimator (SEO + ad target)
      ↓  live cost meter builds confidence with every input
6-step wizard  ──►  Result screen: ₹ range + head-wise split + 9-month timeline
      ↓
"Download PDF Estimate"  ──►  lead captured (name + phone gate before download)
      ↓
Auto-suggest: "3 projects we built in Mansarovar"  ──►  /projects (proof)
      ↓
"Book Free Consultation"  ──►  /contact  ──►  WhatsApp confirmation
```
**Friction removed:** no login, no email wall until value is delivered, PDF is the reward.

### J2 — Homeowner, exploratory
`/` cinematic hero → scrolls the "one system" narrative → services → featured projects →
process timeline → testimonials → sticky estimator CTA follows them → estimator.

### J3 — Commercial developer
`/services/mepf-consultancy` (from search or nav) → sub-discipline depth → commercial projects
filter → team credentials → downloads company profile → enquiry with project brief attached.

### J4 — NRI / remote owner
`/` → "Live site monitoring" teaser → `/portal` demo → sees progress ring, invoices, photo feed →
trust established → consultation.

### J5 — Candidate
`/careers` → culture + benefits → role detail → application form (resume upload mock) → confirmation.

### J6 — Admin/editor
`/admin` dashboard → new enquiry badge → enquiry detail → status change → adds project to
`/admin/projects` → preview drawer → publish → verifies on public site.

---

## 4. Conversion Architecture

| Placement | Component | Intent stage |
| --- | --- | --- |
| Navbar (persistent) | "Get Estimate" primary button | any |
| Hero | Dual CTA: Start Your Project / Explore Projects | discovery |
| After every service card | "Discuss this service" | consideration |
| Mid-scroll band (home, pricing, projects) | Estimator CTA with live number teaser | consideration |
| Project detail footer | "Build something like this" | high |
| Floating rail (mobile) | WhatsApp · Call · Estimate | any |
| Estimator result | PDF download → consultation booking | decision |
| Footer | Newsletter + brochure download | passive |
| Exit-intent (desktop, once/session) | Brochure download offer | any |

**Lead capture minimalism:** name + phone only. Email optional. Every extra field costs ~7% completion.

---

## 5. Non-Goals for Phase 1
- Real authentication / sessions (mock only)
- Real database (Prisma schema authored, not connected)
- Real payments, real file storage, real email/SMS dispatch
- Real 360°/drone media (placeholders with correct component contracts)
- CMS-grade page builder drag-and-drop (config-driven section toggles instead)

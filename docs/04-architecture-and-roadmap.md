# 04 — Architecture & Implementation Roadmap

---

## 1. Architectural Principles

1. **Feature-first, not type-first.** Code is grouped by business capability (`features/estimator`),
   not by technical kind (`containers/`, `reducers/`). A feature owns its components, hooks,
   schemas, types and logic; deleting a feature is one folder.
2. **The UI never talks to a transport.** Components call feature hooks → hooks call
   `services/*` → services call an **adapter**. Phase 1 ships a `mock` adapter reading local JSON;
   Production swaps in an `http` adapter. **Zero component changes.**
3. **Contracts before implementations.** `types/` holds the domain model; the database schema is
   authored from the same model. Mock JSON is validated against the same shapes.
4. **Server state ≠ client state.** TanStack Query owns server state (cache, loading, retry).
   Zustand-lite context owns UI state (theme, nav, palette). No global store dumping ground.
5. **Motion is a layer, not a dependency.** Presentational components are motion-agnostic; motion
   wrappers compose over them. Reduced-motion is handled once, centrally.
6. **Declarative admin.** 28 CRUD modules are 28 *config objects*, not 28 hand-built screens.
7. **Performance by construction.** Route-level code splitting, transform-only animation,
   lazy media, no barrel-file re-export chains that defeat tree-shaking.

---

## 2. Repository Layout

```
Phase_1/
├── docs/                              ← this research & planning set
├── web_next/                          ← Next 15 + React 19 + TS frontend
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx
│       ├── styles/
│       │   ├── globals.css            ← tokens, base, utilities
│       │   └── fonts.css
│       │
│       ├── app/                       ← application shell
│       │   ├── App.tsx
│       │   ├── router.tsx             ← route table, lazy imports
│       │   ├── providers.tsx          ← Query, Theme, Toast, Motion
│       │   └── layouts/
│       │       ├── PublicLayout.tsx
│       │       ├── AdminLayout.tsx
│       │       └── PortalLayout.tsx
│       │
│       ├── components/
│       │   ├── ui/                    ← design-system primitives
│       │   ├── motion/                ← Reveal, SplitText, Parallax, Counter…
│       │   ├── common/                ← brand composites (Navbar, Footer, CtaBand…)
│       │   └── seo/
│       │
│       ├── features/                  ← business capabilities
│       │   ├── home/       ├── about/      ├── services/
│       │   ├── projects/   ├── estimator/  ├── pricing/
│       │   ├── vastu/      ├── gallery/    ├── careers/
│       │   ├── blog/       ├── contact/    ├── downloads/
│       │   ├── portal/     └── admin/
│       │       ├── config/             ← ResourceConfig per module  ★
│       │       ├── engine/             ← ResourceTable, ResourceForm, FieldRenderer
│       │       └── modules/            ← module-specific overrides only
│       │
│       ├── services/                  ← API boundary
│       │   ├── adapters/mock.adapter.ts
│       │   ├── adapters/http.adapter.ts   ← Phase 2, already wired
│       │   ├── client.ts                  ← adapter selection by env
│       │   └── *.service.ts               ← one per resource
│       │
│       ├── data/                      ← mock JSON (single source for Phase 1)
│       ├── hooks/                     ← useMediaQuery, useLenis, useScrollProgress…
│       ├── lib/                       ← cn, format, storage, seo, pdf, analytics
│       ├── constants/                 ← routes, nav, site config, estimator rates
│       └── types/                     ← domain model
│
└── backend/                           ← Laravel 13 · PHP 8.3+ · MySQL — JSON API only
    ├── routes/api.php                 ← the whole surface; no routes/web.php
    ├── config/resources.php           ← ★ 27 resources → Model, searchable fields, visibility
    ├── app/Models/                    ← one per table, camelCase columns
    ├── app/Http/Controllers/          ← ResourceController · LeadController · AuthController
    ├── app/Http/Requests/             ← lead validation (consent + UTM included)
    ├── app/Http/Middleware/           ← CheckPermission (roles.permissions JSON)
    ├── app/Notifications/             ← lead email · generic {text} webhook · auto-reply
    └── database/{migrations,seeders}/ ← seeded from web_next/src/data/*.ts
```

The public site ships as a **static export**: `npm run build` in `web_next/` writes plain HTML to
`out/`, which Apache serves directly. Node is a build-time tool, never a runtime one — which is what
makes PHP shared hosting viable at all.

---

## 3. The Data Access Seam (one env var swaps the backend)

**Frontend**
```ts
// services/client.ts
export const api = process.env.NEXT_PUBLIC_API_MODE === 'http'
  ? httpAdapter(process.env.NEXT_PUBLIC_API_URL)
  : mockAdapter();

// services/projects.service.ts   ← never changes
export const projectsService = {
  list:   (q?: ProjectQuery) => api.get<Paginated<Project>>('/projects', q),
  bySlug: (slug: string)     => api.get<Project>(`/projects/${slug}`),
  create: (dto: ProjectDto)  => api.post<Project>('/projects', dto),
};
```
Flip one env var → the entire app talks to Laravel instead of local seed data. Components untouched.

**Backend** — one generic controller, not 27 hand-written ones:
```php
// config/resources.php — the whole API surface as data
'projects' => ['model' => Project::class, 'public' => true,
               'search' => ['title', 'excerpt', 'locality']],
```
`ResourceController` reads that map and implements list / show / store / update / destroy for every
resource. **The specification is `web_next/src/services/adapters/mock.adapter.ts`** — its
`applyQuery()` defines pagination, the searchable-field list, sorting and the
any-query-key-is-a-filter rule. The mock adapter is the contract; Laravel is one implementation of
it, and a diff between the two is the test.

---

## 4. Domain Model (drives types, mock JSON *and* `schema.prisma`)

`Project` · `ProjectImage` · `Service` · `ServiceFeature` · `Testimonial` · `TeamMember` ·
`ClientLogo` · `GalleryItem` · `Post` · `Category` · `Tag` · `Faq` · `Job` · `Application` ·
`Enquiry` · `EstimateRequest` · `Download` · `Banner` · `HomeSection` · `NavItem` · `FooterColumn` ·
`SeoMeta` · `MediaAsset` · `User` · `Role` · `Permission` · `Setting` · `EstimatorConfig`
(`BaseRate`, `QualityTier`, `LocationMultiplier`, `Enhancement`) · `PortalProject` ·
`Milestone` · `Invoice` · `Document` · `SiteUpdate`.

Shared conventions on every entity: `id` (cuid-style string), `createdAt`, `updatedAt`,
`status: 'draft' | 'published' | 'archived'`, `order: number` where sortable, `slug` where routable.

---

## 5. Estimator Cost Model (transparent & configurable)

```
builtUpArea      = plotArea × builtUpRatio × floorCount           (+ basement/stilt factors)
baseRate         = packageRate[package]                            ₹/sqft  ← admin-editable
qualityFactor    = { essential: 0.92, signature: 1.00, bespoke: 1.18 }
locationFactor   = { jaipur-core: 1.00, jagatpura: 0.98, ... other-city: 1.06 }
typeFactor       = { residential: 1.00, commercial: 1.12, mixed: 1.08, interior: 1.00 }
core             = builtUpArea × baseRate × qualityFactor × locationFactor × typeFactor
enhancements     = Σ (unitPrice × qty | area-based)
subtotal         = core + enhancements
total            = subtotal × (1 + contingency 0.03)
range            = total × [0.94, 1.08]
```
**Head-wise split** (structure 40 / finishing 25 / MEP 15 / interior 12 / misc 8, re-weighted per
package). **Timeline** = `f(builtUpArea, floors, package)` in weeks, clamped 16–104, with a
6-phase Gantt. Every constant lives in `constants/estimator.ts` **and** is overridable from
`/admin/estimator-config` — proving the admin↔site contract.

---

## 6. Quality Gates
- TypeScript `strict`, `noUncheckedIndexedAccess`; zero `any` in `src/**` public APIs.
- Zod validates every form **and** every mock JSON payload at the adapter boundary.
- ESLint (react-hooks, a11y) + Prettier.
- `npm run build` must pass clean before any hand-off.
- Manual a11y pass: keyboard-only traversal of every route, focus visible, no trap.

---

## 7. Roadmap

| Sprint | Scope | Exit criteria |
| --- | --- | --- |
| **0 — Research & Plan** ✅ | Audit, benchmark, IA, journeys, design system, architecture | This docs set |
| **1 — Foundation** | Vite/TS/Tailwind, tokens, fonts, UI primitives, motion primitives, layouts, router, providers, mock data + service seam | Dev server renders shell; primitives documented |
| **2 — Public core** | Home, Projects (+detail), Services (+5 details), About, Pricing, Vastu | All hero/scroll narratives working, reduced-motion safe |
| **3 — Signature feature** | Cost Estimator wizard, live meter, result screen, PDF export, lead capture | PDF downloads with correct maths |
| **4 — Public secondary** | Gallery, Careers (+detail), Blog (+detail), Contact, Downloads, legal, 404 | Full nav coverage, no dead links |
| **5 — Portal** | Client portal prototype (5 screens, mock auth) | Demo login → progress → invoices |
| **6 — Admin** | Shell, dashboard, analytics, CRUD engine, 28 module configs, estimator config, theme, RBAC | Every module: add/edit/delete/preview |
| **7 — Backend** | Laravel API mirroring the frontend service contract; MySQL, Sanctum auth, lead notifications | `GET /api/projects` returns the same shape the mock adapter does |
| **8 — Hardening** | Perf pass, a11y pass, SEO/JSON-LD, README, hand-off notes | Clean production build |

### Still open (post-prototype)
Real file uploads (media library + career résumés) · `/admin`'s four mock screens — analytics,
roles, theme, estimator-config · real analytics · CI/CD · i18n (EN/हिं) · CMS-grade page builder.

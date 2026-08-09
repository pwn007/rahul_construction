# Neetu Archstone — Enterprise Website (Phase 1 Prototype)

A premium, production-quality website prototype for **Neetu Archstone**, a Jaipur construction and
architecture firm — plus a complete admin panel and an API-shaped, Prisma-ready backend.

> **Design · Build · Deliver** · नक़्शे से निर्माण तक

---

## Quick start

```bash
# Frontend (React + Vite)
cd web
npm install
npm run dev            # → http://localhost:5173

# Backend (Express) — optional in Phase 1
cd ../server
npm install
npm run seed           # generate JSON data from the shared typed source
npm run dev            # → http://localhost:4000/api
```

By default the frontend runs entirely on its **mock adapter** (no backend needed).
To point it at the Express API instead, create `web/.env.local`:

```
VITE_API_MODE=http
VITE_API_URL=/api
```

That single flag is the whole migration. No component, hook or service changes.

---

## What is here

```
Phase_1/
├── docs/     research, sitemap, design system, architecture & roadmap
├── web/      React 18 · Vite · TypeScript · Tailwind · Framer Motion · Lenis
└── server/   Node · Express · TypeScript · Prisma schema (authored, not migrated)
```

### Documentation (read these first)
| File | Contents |
| --- | --- |
| [`docs/01-research-and-audit.md`](docs/01-research-and-audit.md) | Portfolio analysis, audit of the existing site, competitor teardown, global benchmarks, opportunity map |
| [`docs/02-sitemap-features-journeys.md`](docs/02-sitemap-features-journeys.md) | Full sitemap, master feature list, five user journeys, conversion architecture |
| [`docs/03-design-system.md`](docs/03-design-system.md) | Colour, typography, spacing, elevation, motion doctrine, component library |
| [`docs/04-architecture-and-roadmap.md`](docs/04-architecture-and-roadmap.md) | Architectural principles, folder layout, the data-access seam, cost model, roadmap |

---

## Routes

### Public site — 30 routes
`/` · `/about` · `/services` (+ 5 detail pages) · `/projects` (+ detail) · **`/estimator`** ·
`/pricing` · `/vastu` · `/gallery` · `/careers` (+ detail) · `/blog` (+ detail) · `/downloads` ·
`/contact` · `/privacy` · `/terms` · designed 404

Legacy paths from the previous site are preserved as redirects
(`/calculator → /estimator`, `/services/mep → /services/mepf-consultancy`).

### Client Portal — `/portal`
Mock login (any credentials) → project selector → overall progress ring · milestone timeline with
planned-vs-actual variance · document vault · invoice ledger · site update feed · live camera panel.

### Admin panel — `/admin`
Dashboard · Analytics · 20 CRUD modules · Estimator configuration · Roles & permissions matrix ·
Theme editor with live preview.

---

## The four things worth looking at

### 1. Construction Cost Estimator — `/estimator`
The competitive wedge. **Two screens** — where and how big, then a material list you build yourself —
a **live cost meter**, and a result that discloses progressively: a four-way commercial split, then
materials itemised down to the bag of cement, then the programme, payment schedule and a **branded,
vector PDF**.

- **Two questions, not seven.** The model needs one required input, the area. Everything else either
  defaults (residential, turnkey, no basement) or moves behind an *Advanced* disclosure.
- **Nothing is pre-selected.** Step 2 arrives empty. You tap a material, pick its brand, and add it.
  Every material in the estimate is there because someone put it there — which is the whole point of
  the screen, and what the competitor's calculator gets right.
- **21 materials, 58 brand options**, restored from the client's own published calculator: cement
  (UltraTech/Ambuja, JK Super, ACC, Wonder/Shree), steel (JSW/Jindal, TATA TISCON, Kamadhenu/Rathi),
  flooring at three tile price points, paint from Tractor to Royal Matt, CP sets, kitchens at
  ₹1L/₹1.5L/₹2L, tanks by size. Never ranked, never tier-named — two window options cost the same,
  and the cheapest cement is not "Economy".
- **Scope is derived, never asked.** Pick a kitchen and the build is fully furnished; pick only
  cement and bricks and it is structural. Nobody types "semi-furnished" — a contract term with a rate
  band attached, and not a question a homeowner can answer.
- **A partial selection is labelled as one.** Pick three materials and the headline reads *"Cost of
  the work you selected"* with a strip naming what a complete build still needs. The competitor
  produces a confident total no matter what you selected; naming the gap costs nothing.
- **Ready-mix and site-mix are mutually exclusive.** Same concrete bought two ways; selecting one
  drops the other. The competitor lists Cement *and* Mix Concrete as additive rows and charges for
  the same cubic metre twice.

**The pricing model is bottom-up, and that is the whole point.**

```
materialsCost = Σ quantity × brandRate × locality × buildingType   over selected materials
total         = materialsCost ÷ materialsShare                     ← the inversion
```

The estimator used to run top-down: a package rate produced a total and the material lines were
normalised into a share of it. That guaranteed reconciliation, but it also meant **a material choice
could not move the number** — the normalisation factor absorbed it. Dividing by the share runs the
same relationship the other way, so every selection moves the estimate by exactly what it costs.

- **The breakdown cannot lie**, and now as plain arithmetic rather than something engineered. `total`
  is *defined* as materialsCost ÷ share, so the Materials head cannot fail to equal the lines that
  produced it, and `quantity × rate = amount` holds on every line.
- **Inverting the model did not invent a new price list.** Selecting every material at its default
  brand lands inside the client's own published rate card for all three scopes — ₹1,329 against a
  ₹1,200–1,400 card, ₹2,047 against ₹1,800–2,200, ₹2,603 against ₹2,500–3,000. That is the
  calibration alarm, asserted on every run.
- `npm run check:estimator` proves it across **12,288 configurations**, plus: exactly one default
  brand per material, ready-mix actually supplanting site-mix, and an **empty selection pricing zero
  without NaN or a divide-by-zero**.
- Icons are **21 inline SVG glyphs** in Lucide's drawing grammar (~1 KB gzip). Lucide has no cement
  bag, rebar, tile, transit mixer or sanitaryware icon, and emoji render as different artwork on
  every platform.
- Selection persists to `sessionStorage` and packs into the URL as `?m=cement:jk-super,steel:tata…`.
  Legacy `?pkg=` and `?tier=` links resolve onto an equivalent selection.
- The PDF is vector (jsPDF), ~30 KB, **dynamically imported** so 114 KB gzip never touches first paint.
- Lead capture sits *after* value is delivered: name + phone, only at the download. The record stores
  the exact material-and-brand map, so an estimator can rebuild the quotation line by line.

### 2. The declarative admin engine — `web/src/features/admin/`
Twenty CRUD modules are **twenty config objects**, not twenty screens.

```ts
// config/modules.tsx
{ key: 'projects', label: 'Projects', service: projectsService,
  columns: [...], fields: [...], filters: [...], preview: (row) => <JSX/> }
```

One `ResourceTable` + one `ResourceForm` render all of them, so every module gets search, filters,
sorting, pagination, bulk select, create, edit, duplicate, preview drawer and delete-with-confirm
**for free** — and they all behave identically. Adding a module is adding a config.

Admin edits persist to `localStorage` as an overlay on the seed data and appear on the public site
immediately, which proves the admin↔site contract without a database. *Reset mock data* is in the
sidebar footer.

### 3. Project Atlas — the real map of Jaipur
Where the firm has built, drawn on **the actual municipal geography** rather than a decorative
schematic. Ten Jaipur Municipal Corporation zones, hoverable and clickable, filtering the project
grid beneath them.

- Boundaries come from [DataMeet's Jaipur zone polygons](https://github.com/datameet/Municipal_Spatial_Data)
  (CC BY 4.0), projected with the **cos(mid-latitude) correction** — skip it and the city renders
  12.1% too wide.
- **No mapping library.** [`web/scripts/build-districts.mjs`](web/scripts/build-districts.mjs)
  simplifies the polygons at build time into ~6 KB gzip of SVG path data, sitting in the lazily
  loaded atlas chunk. MapLibre would have been 260 KB gzip — 1.6× the entire current first-paint
  payload — and Leaflet's free tile providers forbid commercial use.
- The generator **fails the build** if the editorial district labels ever disagree with
  point-in-polygon on the raw geometry, and prints a reconciliation table on every run. The office
  coordinates act as an independent control point: they must land in Civil Lines.
- Two projects in Pratap Nagar fall **outside every municipal zone** — it is JDA-administered land
  beyond the JMC limit. They are drawn where they actually are, with a dashed pin and a note, rather
  than snapped into the nearest polygon.
- It is called an atlas, **not a digital twin**. That term means a live bi-directional link to a
  physical asset; claiming it for a map invites a knowledgeable client to discount the BIM and QA
  claims too.

Regenerate with `npm run build:districts` after editing
[`web/scripts/districts.config.mjs`](web/scripts/districts.config.mjs).

### 4. The data-access seam — how Prisma drops in later
```
Component → feature hook → services/*.service.ts → ApiAdapter
                                                    ├── mockAdapter()   ← Phase 1
                                                    └── httpAdapter()   ← Phase 2 (already written)
```
```
Route → Controller → Service → Repository<T>
                                ├── JsonRepository    ← Phase 1
                                └── PrismaRepository  ← Phase 2 (already written)
```
The ORM is invisible above the repository line. `server/prisma/schema.prisma` is fully authored
(30 models, enums, indexes, relations) and mirrors the domain types and JSON seed exactly — Phase 2
is a migration, not a modelling exercise.

**Both layers share one authored source of seed data.** `server/scripts/seed.ts` generates the API's
JSON files from the same typed modules the frontend imports, so `GET /api/projects` and the mock
adapter cannot drift apart.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite 5 | Fast HMR, native route-level code splitting |
| UI | React 18 + TypeScript (strict) | — |
| Styling | Tailwind CSS 3.4 + CSS custom properties | Tokens are runtime-themeable, so `/admin/theme` can change the brand colour live |
| Motion | Framer Motion + Lenis | Declarative, reduced-motion-aware, no imperative timeline cleanup burden |
| Forms | React Hook Form + Zod | One schema validates the client form *and* the API route |
| Server state | TanStack Query | Cache, loading and retry handled once |
| Charts | Recharts | Admin only — lazy-loaded |
| PDF | jsPDF | Vector output, dynamically imported |
| Icons | Lucide (curated registry) | See performance note below |
| Backend | Express + Zod | Thin, RESTful, repository-backed |
| DB | *None in Phase 1* | Prisma schema authored and ready |

### Two stack decisions worth stating plainly

**GSAP was not used.** It was on the suggested list, but every animation this site needed — scroll
reveals, kinetic type, mask reveals, pinned progress spines, parallax, counters — is expressed more
cleanly in Framer Motion, which the project already depends on. Adding a second animation runtime
would have cost ~70 KB gzip for duplicated capability. The hero's drifting blueprint grid is a
~2 KB custom `<canvas>` rather than Three.js, for the same reason: same atmosphere, no WebGL context,
and it degrades to nothing under reduced motion.

**Icons go through a curated registry** ([`web/src/lib/icons.tsx`](web/src/lib/icons.tsx)).
Data records reference icons by *name* so they can be edited from the admin panel, but
`import * as Icons from 'lucide-react'` defeats tree-shaking and pulled **1.4 MB** into the shared
vendor chunk. The registry keeps the name-based indirection while shipping ~70 icons instead of ~1,500.

---

## Performance

Measured on the production build (`npm run build`):

| Metric | Result |
| --- | --- |
| **Initial JS (gzip)** | **158 KB** — under the 200 KB budget set in the design system |
| Deferred | Admin (138 KB), PDF generator (120 KB), Recharts, every route beyond the first |
| Animation | `transform` / `opacity` / `clip-path` only |
| Images | Lazy, explicit dimensions, `object-cover`, mask-reveal on entry |

Getting there required removing a hand-rolled `manualChunks` config that was forcing lazily-imported
libraries into the entry graph — Vite's default chunking follows the dynamic-import boundaries
correctly. Both fixes are documented inline at the sites they affect.

## Accessibility

WCAG 2.2 AA target. Skip link, visible focus rings on every interactive element, keyboard-complete
navigation (including the ⌘K palette, the before/after slider and the estimator wizard), ARIA roles
on tabs/switches/dialogs/progress, and semantic landmarks throughout.

**Accent contrast.** Brand cyan `#00AEEF` is a fill colour — it measures 2.3:1 on a light ground.
Accent *text* (eyebrows, links) and focus rings use `--c-brand-text`, which resolves to cyan-700
(**5.6:1**) on light and cyan-300 on dark. Sections that are dark regardless of theme carry an
`.on-dark` class that flips the token. Links moved from `cyan-600` (3.9:1) to `cyan-700`.

**Text ramp.** Three steps, all AA on paper: `text` 17.0:1 · `muted` 7.2:1 · `subtle` 4.8:1.
`subtle` previously sat at 3.2:1 — it *looks* de-emphasised but still carries real information
(captions, meta, stat labels), so it has to clear 4.5:1. Dark-theme equivalents are 8.3:1 and 5.2:1.

`prefers-reduced-motion` is honoured through a **single global gate**: Lenis is not initialised,
reveals collapse to instant opacity, parallax and magnetic cursors are disabled, and marquees stop.
It is handled once in `usePrefersReducedMotion()` rather than re-implemented per component.

---

## Content provenance — please read before showing the client

Everything factual comes from **Port1.pdf**: services, the six-step process, both pricing models and
all rates, the four 5★ testimonials (verbatim, including Hindi and Hinglish), achievement figures,
MEPF disciplines, Vastu positioning, contact details and the five project localities.

**Two deviations you should know about:**

1. The existing site claims *500+ projects / 15+ years*; the portfolio says *80+ projects / 30+ years
   combined*. We used the **portfolio numbers** as the source of truth. This conflict needs resolving
   before launch.
2. The portfolio lists "80+ client satisfaction", which is almost certainly meant as a percentage.
   We render **98% satisfaction**. Please confirm the intended figure.

**Placeholder content, clearly marked in-app:**
- Team member names, photographs and biographies (roles are accurate to the portfolio)
- Project case-study narratives — the challenge/approach/outcome text is illustrative
- Blog articles, job listings, certifications, and the legal pages
- All imagery uses a deterministic placeholder provider via
  [`web/src/lib/media.ts`](web/src/lib/media.ts). Swapping in the client's real photography is a
  **one-file change** — replace the body of `img()` with a CDN base URL and keep the seed keys as
  filenames.

Nothing invented is presented as verified fact.

---

## Scripts

```bash
# web/
npm run dev          # dev server, port 5173
npm run build        # typecheck + production build
npm run typecheck    # tsc --noEmit
npm run build:districts  # regenerate the Project Atlas geometry (output is committed)
npm run check:estimator   # assert every estimator breakdown reconciles to the level above it
npm run preview      # serve the production build

# server/
npm run seed         # regenerate src/data/*.json from the shared typed source
npm run dev          # API with watch, port 4000
npm run build        # tsc → dist/
npm run typecheck
```

## Phase 2

Prisma + PostgreSQL migration · real JWT auth with server-enforced RBAC · S3/Cloudinary media with
signed uploads · transactional email + WhatsApp Business API · real analytics · 360°/video players ·
payment gateway in the portal · CI/CD · full EN/हिं internationalisation.

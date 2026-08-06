# 03 — Design System: "Archstone"

> **Design thesis.** A construction brand's website should feel like the thing it builds:
> structural, precise, materially honest, generous with light and space. We use *architectural
> restraint* — big type, deep negative space, a strict grid you can feel, and a single confident
> accent — rather than decorative gloss. Luxury here is **calm**, not loud.

---

## 1. Colour

### 1.1 Brand (derived from the portfolio PDF)
| Token | Hex | Role |
| --- | --- | --- |
| `--brand-navy` | `#0A1B4D` | Wordmark navy, headings on light, deep surfaces |
| `--brand-cyan` | `#00AEEF` | Primary accent, CTAs, links, active states |
| `--brand-cyan-deep` | `#0089BF` | Hover / pressed |
| `--brand-cyan-wash` | `#E6F7FE` | Tinted surfaces, badges |

### 1.2 Extended palette (added for depth — the PDF has only 2 colours, which cannot carry a full site)
| Token | Hex | Rationale |
| --- | --- | --- |
| `--sand-*` | `#B99465` … `#F7F3EC` | Warm counterweight to cold cyan; echoes the PDF's paper-texture cover; signals *material* (stone, timber, plaster) |
| `--ink-*` | `#05070D` → `#0F1420` → `#1A2032` | Cinematic dark sections, not pure black |
| `--paper` | `#F7F6F2` | Off-white page ground (pure white reads cheap at scale) |

### 1.3 Neutrals
A 11-step slate ramp (`50 → 950`) with a slight blue cast so it sits under navy without muddying.

### 1.4 Semantic
`success #16A34A` · `warning #D97706` · `danger #DC2626` · `info` = brand cyan.

### 1.5 Accent: fill vs. text
Brand cyan `#00AEEF` is a **fill** colour, not a text colour. It measures only **2.3:1** on a light
ground — fine behind white type, far below the 4.5:1 that small uppercase eyebrows and links need.

The system therefore splits the accent into two tokens:

| Token | Light ground | Dark ground | Used for |
| --- | --- | --- | --- |
| `--c-brand` | `#00AEEF` | `#00AEEF` | Fills, buttons, selection, glows, chart series |
| `--c-brand-text` | `#026C97` (cyan-700, **5.6:1**) | `#4FC8F6` (cyan-300) | Eyebrows, links, focus rings |

Sections that are dark *regardless of the active theme* (hero, footer, CTA bands, MEPF spotlight)
carry an **`.on-dark`** class, which flips `--c-brand-text` back to the bright cyan. That is why the
same `.overline` class reads correctly on both grounds without a per-usage variant.

Links follow the same rule: `text-cyan-700 dark:text-cyan-400`, not `cyan-600` (which is 3.9:1 and
fails AA for body text).

### 1.6 Application rules
- **60 / 30 / 10** — 60% paper or ink ground, 30% navy/slate structure, 10% cyan accent.
- Cyan is **never** used for large fills except deliberate "brand blocks" (mirrors PDF pages 4, 14, 18).
- Sand appears in editorial and material contexts only (about, vastu, project narrative).
- Every text/background pair is validated to **≥ 4.5:1** (AA), large display ≥ 3:1.

### 1.7 Hero grounds & the navbar
The navbar is **transparent at scroll-top**, so it inherits whatever hero sits behind it.

- **Landing page** — a **light hero on the page's own `--c-bg`**. A full-bleed near-black hero was
  tried and rejected: scrolling out of it produced a hard dark→light seam at the fold, and the navbar
  had to swap tone at the same instant, so the whole chrome appeared to flicker. Value continuity
  beats contrast here.
- **Interior pages** (estimator, projects, services, about, careers, blog, contact, downloads, vastu,
  pricing) use a light hero on `--c-surface-2` with a sand wash and a faint blueprint grid.
- **Project case studies and 404** keep a **dark hero** — a case study opens on full-bleed
  photography where a dark ground is doing real work, and 404 is a dead end where a mood shift is
  appropriate. These declare `useRegisterHeroTone('dark')` and the navbar inverts.

**Rules for hero surfaces**
1. Never place the transparent navbar over a dark ground without registering the tone — that is what
   made the wordmark and nav links disappear.
2. A hero must not change background *value* on scroll. Fade atmosphere layers (grid, glows, canvas)
   and drift media; leave the ground alone.
3. Mask atmosphere toward the bottom edge (`mask-fade-b`) so the hero dissolves into the next section
   instead of ending on a line.
4. Dark bands mid-page are fine and give the scroll rhythm — they are *chapters* with generous
   padding, not a full-viewport surface the user scrolls out of.

---

## 2. Typography

| Role | Family | Weights | Notes |
| --- | --- | --- | --- |
| Display | **Outfit** | 300–700 | Geometric, close in spirit to the PDF's Poppins-family wordmark but more refined. Used for h1–h3 and stats. |
| Body / UI | **Inter** | 400–600 | Highest-legibility UI workhorse. |
| Numeric / technical | **JetBrains Mono** | 400–600 | Costs, specs, dimensions, IDs, admin tables. Monospace makes numbers feel *engineered*. |
| Devanagari | **Noto Sans Devanagari** | 400–600 | For नक़्शे से निर्माण तक and Hindi testimonials. Non-negotiable — the brand is bilingual. |

### 2.1 Type scale (fluid, `clamp()`)
| Token | Min → Max | Use |
| --- | --- | --- |
| `display-xl` | 3.25rem → 7.5rem | Hero |
| `display-lg` | 2.5rem → 5rem | Section openers |
| `display-md` | 2rem → 3.5rem | h2 |
| `heading-lg` | 1.5rem → 2.25rem | h3 |
| `heading-md` | 1.25rem → 1.5rem | h4 / card titles |
| `body-lg` | 1.0625rem → 1.25rem | Lead paragraphs |
| `body` | 1rem | Default |
| `caption` | 0.8125rem | Meta, labels |
| `overline` | 0.75rem, `0.18em` tracking, uppercase | Section eyebrows |

### 2.2 Rules
- Display type: `letter-spacing: -0.03em`, `line-height: 0.95–1.05`. Tight tracking = expensive.
- Measure capped at `68ch`; lead paragraphs at `56ch`.
- Never centre more than 3 lines of body copy.
- One display weight per viewport where possible.

---

## 3. Space, Grid & Radius

- **Base unit 4px.** Spacing scale: 1,2,3,4,6,8,10,12,16,20,24,32,40 (×4px).
- **Container:** `1440px` max, `1280px` content, gutters `20px → 40px → 64px`.
- **Grid:** 12-col desktop / 8 tablet / 4 mobile, `24px` gap.
- **Section rhythm:** `py-24` mobile → `py-40` desktop. Generosity is the luxury signal.
- **Radius:** `sm 6px` · `md 10px` · `lg 16px` · `xl 24px` · `2xl 32px` · `full`.
  Architectural surfaces (image frames, project cards) use **larger** radii; data surfaces
  (tables, inputs) use **smaller** — this contrast is intentional.

---

## 4. Elevation, Glass & Material

| Token | Definition | Use |
| --- | --- | --- |
| `shadow-xs` | `0 1px 2px rgb(10 27 77 / .06)` | Inputs |
| `shadow-sm` | `0 2px 8px rgb(10 27 77 / .06)` | Cards at rest |
| `shadow-md` | `0 12px 32px -8px rgb(10 27 77 / .12)` | Card hover, dropdowns |
| `shadow-lg` | `0 32px 64px -16px rgb(10 27 77 / .18)` | Modals, floating rails |
| `shadow-glow` | `0 0 0 1px rgb(0 174 239 / .3), 0 8px 32px rgb(0 174 239 / .18)` | Primary CTA hover, active step |

**Glassmorphism** — used in exactly four places, never decoratively:
scrolled navbar · estimator sticky cost meter · portal/admin overlays · media lightbox chrome.
Recipe: `backdrop-blur-xl` + `bg-white/70` (or `bg-ink-900/70`) + `border-white/12` + inner top highlight.

**Textures:** a 2% opacity noise/grain overlay on dark sections (kills banding, adds film quality),
and a 1px blueprint grid at 4% opacity behind technical sections.

---

## 5. Iconography & Imagery
- **Lucide** icons, `1.5px` stroke, `20/24px`. Never mix icon families.
- Custom SVG line icons for the 5 services and MEPF's 4 disciplines (matching the PDF's line style).
- **Photography direction:** dusk/blue-hour elevations (as in the portfolio renders), warm interior
  glow, human scale in frame. Consistent `4:5` for portraits, `16:9` heroes, `3:2` cards.
- All images: `loading="lazy"`, explicit `width/height`, blur-up placeholder, `object-cover`.

---

## 6. Motion System

### 6.1 Easing & duration
| Token | Curve | Duration | Use |
| --- | --- | --- | --- |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | 600–900 ms | Entrances, reveals |
| `ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)` | 400–700 ms | Page transitions, drawers |
| `ease-spring` | Framer `{ stiffness: 260, damping: 30 }` | — | Interactive/hover |
| `ease-out-soft` | `cubic-bezier(0.4, 0, 0.2, 1)` | 150–250 ms | Micro-states |

### 6.2 Canonical patterns
| Pattern | Spec |
| --- | --- |
| **Reveal** | `y: 24px → 0`, `opacity 0 → 1`, `800ms ease-out-expo`, stagger `60ms`, trigger at 15% viewport, **once** |
| **Mask reveal** | `clip-path: inset(100% 0 0 0) → inset(0)` for images/headlines |
| **Kinetic headline** | Per-word `y:110% → 0` inside `overflow:hidden`, stagger `45ms` |
| **Counter** | `requestAnimationFrame` easeOutExpo over 1800 ms, Indian-locale formatted |
| **Pinned timeline** | GSAP ScrollTrigger pin, progress line scrub, step activation |
| **Parallax** | `translateY` −8% to +8%, `will-change: transform`, transform-only |
| **Magnetic** | Cursor-proximity translate up to 8px, spring return |
| **Page transition** | Curtain wipe from ink-950, 480 ms, scroll to top at midpoint |
| **Marquee** | CSS `translate3d` infinite, pauses on hover, `aria-hidden` duplicate |

### 6.3 Performance & accessibility budget
- Animate **only** `transform` / `opacity` / `clip-path` / `filter`.
- Max 3 concurrent ScrollTriggers per viewport; all killed on route unmount.
- `prefers-reduced-motion: reduce` → Lenis off, all reveals become instant opacity, marquees static,
  parallax disabled. Implemented once in a `useReducedMotion` gate, not per-component.
- Mobile: parallax + magnetic + cursor disabled; reveal distance halved.
- Targets: **LCP < 2.0s · CLS < 0.05 · INP < 200ms · initial JS < 200KB gzip** (route-split).

---

## 7. Component Library

### 7.1 Primitives (`components/ui`)
`Button` (variants: primary · secondary · ghost · outline · link · danger; sizes sm/md/lg/xl; loading; icon slots) ·
`IconButton` · `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `RadioCard` · `Switch` ·
`Slider` · `Label` · `FieldError` · `Badge` · `Chip` · `Card` · `Separator` · `Avatar` ·
`Tooltip` · `Dialog` · `Drawer` · `Sheet` · `DropdownMenu` · `Tabs` · `Accordion` · `Progress` ·
`Skeleton` · `Spinner` · `Toast` · `Pagination` · `Table` · `EmptyState` · `Breadcrumbs`.

### 7.2 Motion primitives (`components/motion`)
`Reveal` · `StaggerGroup` · `SplitText` · `MaskImage` · `Parallax` · `Counter` · `Marquee` ·
`Magnetic` · `CursorFollower` · `PageTransition` · `ScrollProgress`.

### 7.3 Composite / brand (`components/common`)
`SectionHeader` (overline + display + lead) · `StatTile` · `ServiceCard` · `ProjectCard` ·
`TestimonialCard` (bilingual-aware) · `ProcessTimeline` · `BeforeAfterSlider` · `LogoMarquee` ·
`FaqAccordion` · `CtaBand` · `PageHero` · `Lightbox` · `FilterBar` · `MapPanel` · `ShareRow` ·
`FloatingActionRail` · `CommandPalette` · `Logo` · `ThemeToggle`.

### 7.4 Feature components
Estimator: `WizardShell` · `StepIndicator` · `LiveCostMeter` · `OptionGrid` · `AreaInput` ·
`FloorPicker` · `PackageSelector` · `EnhancementList` · `ResultSummary` · `CostBreakdownChart` ·
`TimelineStrip` · `PaymentSchedule` · `PdfEstimate`.
Admin: `AdminShell` · `ResourceTable` · `ResourceForm` · `FieldRenderer` · `PreviewDrawer` ·
`ConfirmDialog` · `KpiTile` · `ChartCard` · `StatusPill` · `BulkBar`.

### 7.5 Component contract rules
1. Every component is typed; no `any` in public props.
2. Presentational components never fetch — data enters via props or a feature-level hook.
3. Variants via `cva`; class merging via `cn()` (clsx + tailwind-merge).
4. `forwardRef` on every interactive primitive.
5. Motion is opt-in via wrapper components, never baked into primitives.
6. Every interactive element: visible focus ring, accessible name, keyboard path.

---

## 8. Voice & Tone
Confident, plain, specific. Numbers over adjectives. Never "world-class" — show the work.
Hindi appears where it carries warmth (tagline, testimonials), never machine-translated UI.
Microcopy is helpful, never cute: *"Indicative range. Final cost depends on soil, site access and
approved drawings."*

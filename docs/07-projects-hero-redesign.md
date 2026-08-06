# 07 — Projects Page Hero: Critique & Redesign

---

## 1. Critique of the current design

### What is working — keep these

| Strength | Why it matters |
| --- | --- |
| **The copy is genuinely differentiated** | *"Not a wall of renders"* is a real position, not filler. It directly attacks how every competitor presents work. This line is the best asset on the page and the redesign must protect it. |
| **Correct information order** | Breadcrumb → eyebrow → headline → lead → proof. That sequence is right; the execution is what fails. |
| **Restraint suits the brand** | Architectural clients respond to calm. The answer is not to make it louder — it is to make it *composed*. |
| **Typography and contrast are clean** | Navy on paper measures 15:1. Nothing to fix here. |

### What is failing

**1. It is a Projects page that shows no projects.** This is the fundamental error. The single job of a work-index hero is to prove the work exists. A visitor lands and sees *a paragraph about* projects. Every strong agency and architecture index puts evidence above the fold.

**2. ~60% of the canvas is empty.** At 2000px the composition occupies the left 45% and simply stops. Negative space is only luxurious when it is *deliberate and balanced* — here it reads as an unfinished layout, not restraint.

**3. The background image is invisible and therefore pointless.** The light `PageHero` renders imagery at `opacity-[0.13] saturate-[0.65]` under a paper gradient. In the screenshot it resolves to a faint blue-grey wash in the corners. It costs a network request and delivers nothing. Either commit to imagery or drop it.

**4. Headline is undersized for its role.** `compact` mode renders the h1 at `display-sm` — `clamp(1.625rem, 3vw, 2.5rem)`. Against a 17px lead paragraph that is roughly a 2:1 ratio, far too tight for a page hero. It does not read as the dominant element; the eye lands on the paragraph instead.

**5. The statistics undercut themselves.** "10 Projects shown" and "10 Jaipur localities" sit two columns apart with an identical value. At a glance it looks like a rendering bug. They also float without separators or a baseline, so they read as loose text rather than a data rail.

**6. There is nothing to click.** The only interactive element above the fold is a breadcrumb pointing *backwards*. The hero gives the visitor no agency and no path forward.

**7. No handoff to the content below.** The section terminates on a hard rule with nothing carrying the eye down.

---

## 2. Research findings

| Source | Finding | Applied here |
| --- | --- | --- |
| Lexington Themes, *Stunning hero sections 2026* | Heroes are becoming **layout systems** — "typography, hierarchy, rhythm and negative space do most of the talking", moving away from heavy motion | Composition over spectacle; no video, no WebGL |
| Same | Designers are moving away from centred templates toward **editorial grids, type-first heroes, asymmetry, cinematic framing** | Asymmetric 6/6 split with an offset card cluster |
| Crocoblock, portfolio analysis | **Asymmetry and rhythm create visual tension** while staying readable; magazine-style rhythm | Offset two-column card stack, not a symmetric grid |
| Progress / Prismic hero guides | Everything essential — headline, subhead, **primary visual and CTA** — must be visible without scrolling | Project imagery and filter chips move above the fold |
| Omniconvert | **Limit to one CTA.** Multiple competing buttons reduce click-through | Filter chips are one CTA *system*, not five buttons |
| Prismic | Most common failure is cramming competing messages and visuals into one space | Stat rail is separated into its own band rather than stacked into the column |

---

## 3. Redesign concept — "The Index"

> **Principle: on a work page, the hero should not describe the work. It should be the first instalment of it.**

```
┌────────────────────────────────────────────────────────────────────┐
│  Home › Projects                                                   │
│                                                                    │
│  SELECTED WORK                          ┌─────────┐                │
│                                         │         │  ┌──────────┐  │
│  Every project,                         │  tall   │  │  wide    │  │
│  documented properly.                   │  cover  │  └──────────┘  │
│                                         │         │  ┌──────────┐  │
│  Not a wall of renders. Each project    │         │  │  wide    │  │
│  has a brief, a constraint, an          └─────────┘  └──────────┘  │
│  approach and a measurable outcome.        ↑ parallax ↑ counter-   │
│                                              slow        drift     │
│  Jump to  ▸ Residential  Commercial  Mixed use  Interiors  MEPF    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  10            84,450          5             10                    │
│  Projects      Sq ft built     Markets       Jaipur localities     │
└────────────────────────────────────────────────────────────────────┘
```

### Decision-by-decision reasoning

| Decision | Reasoning |
| --- | --- |
| **Real project covers in the hero** | Fixes the core failure. The imagery is pulled from the actual `projects` data, so it can never drift from the library below and never shows a project that isn't there. |
| **Offset two-column cluster, not a 2×2 grid** | A symmetric grid reads as a component. The offset — tall card left, two wide cards dropped 3rem right — reads as an *editorial spread*. This is the asymmetry the research points to. |
| **Counter-drifting parallax (+6% / −4%)** | Two speeds create depth without motion for its own sake. Transform-only, so it stays on the compositor. Disabled entirely under `prefers-reduced-motion`. |
| **Headline jumps to `display-md`** | ~3.5rem against a 17px lead gives a ~3:1 ratio — the headline becomes unambiguously dominant. |
| **Background image removed** | It was invisible. The project cards now carry the visual weight, and the ground stays a clean paper gradient with the blueprint grid — consistent with the new landing hero. |
| **Filter chips as the CTA** | Gives the visitor agency *before* they scroll, and signals the library is filterable. Clicking sets the filter and scrolls to the grid, so it is a genuine shortcut rather than decoration. Chips are text-weight, so they read as one CTA system rather than five competing buttons. |
| **Stats moved to a full-width bottom rail** | Separates data from narrative — the Prismic "don't cram" finding. It also anchors the hero and hands off to the filter bar, exactly as the landing hero's achievement rail does. Reusing that pattern makes the two pages feel like one site. |
| **Stat set changed** | Was `10 / 84,450 / 10` with two identical values adjacent. Now `Projects · Sq ft built · Markets · Localities` — the duplicate 10s are separated by two columns and a new *Markets* metric adds real information. |
| **Bespoke component, not `PageHero`** | The Projects index has a job no other interior page has. Bending the generic hero with more props would degrade it for the other ten pages. A dedicated `ProjectsHero` keeps both clean. |

---

## 4. Accessibility

| Concern | Treatment |
| --- | --- |
| Contrast | Navy headline 15.2:1, muted lead 7.2:1, subtle labels 4.8:1 on paper — all AA |
| Card links | Each card is a single `<a>` wrapping image + meta, with an accessible name of the project title and locality |
| Decorative imagery | Grid, glows and card images inside a labelled link are `aria-hidden` where they add no information |
| Filter chips | Real `<button>`s with `aria-pressed`, keyboard reachable, visible focus ring at 5.5:1 |
| Motion | Parallax, card entrance and headline split all gated on `prefers-reduced-motion`; the layout is identical without them |
| Heading order | Single `<h1>`; stat rail uses `<dl>/<dt>/<dd>` so the numbers are announced with their labels |
| Scroll-on-filter | Uses the existing `scrollToTarget` helper, which falls back to `behavior: instant` under reduced motion |

## 5. Responsive behaviour

| Breakpoint | Layout |
| --- | --- |
| `< 640px` | Single column. Text block, then the three covers as a horizontal snap-scroll strip (thumb-friendly, no vertical cost). Stats 2×2. |
| `640–1024px` | Text full width; card cluster becomes a 3-up row. Stats 2×2. |
| `≥ 1024px` | 6/6 asymmetric split with the offset cluster and parallax. Stats 4-across with hairline dividers. |

Images use the existing `IMG.card()` sizes, `loading="lazy"` on all but the first, explicit aspect ratios to prevent CLS.

## 6. Implementation notes

- **Stack:** React + Tailwind + Framer Motion — no new dependencies.
- **Parallax** reuses the existing `Parallax` primitive from `components/motion`.
- **Headline** reuses `SplitText`; **stats** reuse `Counter`.
- **Filter wiring:** `ProjectsHero` takes an `onJumpToCategory(category)` callback so it stays presentational; `ProjectsPage` owns the URL-synced filter state exactly as it does today.
- **Cost:** roughly +2 KB gzip on the Projects chunk. No effect on the initial payload — the page is already route-split.

### If this were Next.js rather than Vite
The only change worth making is swapping `<img>` for `next/image` with `priority` on the lead cover and `sizes` hints for the cluster; everything else — the layout, motion primitives and Tailwind classes — ports unchanged.

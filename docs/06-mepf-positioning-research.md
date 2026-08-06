# 06 — Making MEPF the Thing They Remember

**Question:** Neetu Archstone's core focus is MEPF. How do we make it the single thing a visitor
remembers after leaving the site?

**Status:** Research and strategy. No implementation yet.

---

## 1. The actual problem

MEPF has four properties that make it uniquely hard to market, and they compound:

| Property | Consequence |
| --- | --- |
| **It is literally invisible** — buried in walls, slabs and ceilings | Nothing to photograph. No hero shot. |
| **It has an ugly acronym** | ~60% of their audience (Jaipur homeowners) cannot expand MEPF |
| **Its value is felt as an absence** | Good MEPF = nothing goes wrong. Absence is not a memory. |
| **It is judged years later** | The failure arrives in year five, long after the buying decision |

You cannot make someone remember a thing they cannot picture. **So the entire creative problem is:
give MEPF a shape.**

This is also why the current site under-serves it. We built MEPF depth — four disciplines, segment
pages, a seven-point benefits band — but it is *explanatory*, not *memorable*. Explanation informs.
It does not stick.

---

## 2. What the evidence actually supports

The research turned up numbers that are far stronger than anything currently on the site. These are
the raw material for a memorable position.

### 2.1 The reframe: MEPF is not a line item, it is a third of the build

| Finding | Figure | Source |
| --- | --- | --- |
| MEP as share of total project budget | **25–40%** (residential 25–35%, commercial 35–40%) | AECORD India |
| Split within MEP | HVAC 35–45% · Electrical 30–40% · Plumbing 20–30% | AECORD India |
| MEP *design fees* | 4–7% of project cost; ₹2–15/sq ft residential, ₹8–20+/sq ft commercial | AECORD India |

> **A quarter to a third of what you spend, you will never see.**
> That single sentence is more persuasive than any feature list we have written.

Most homeowners assume MEP is a small trade line. It is the second-largest cost head after structure —
and our own estimator already proves it, showing MEPF at 16% of a semi-furnished package (we count
only concealed services; the AECORD figure includes fittings and fixtures).

### 2.2 The stake: what it costs to get it wrong

| When the problem is caught | Cost | Multiplier |
| --- | --- | --- |
| During design | ~₹60,000 | **1×** |
| During construction | ₹4.25 lakh+ | **~7×** |
| After handover | 3–10× remediation cost | **3–10×** |
| Rewiring post-possession | ₹1–3 lakh + downtime | — |
| Relocating concealed wiring after plastering | ₹100–200 / sq ft extra | — |

*Sources: Midori Architects, Construction Estimator India, FieldPie, HouseYog.*

This is the emotional engine. Every Indian homeowner has heard a horror story about walls being
broken open. **The fear already exists — we do not have to manufacture it, only name it.**

### 2.3 The upside

- Energy-efficient systems: **30–50% operating savings over 10 years** for 15–25% more upfront.
- Early MEP involvement **reduces MEP cost by 10–15%** — coordination pays for itself.
- Defects caught at installation cost **3–10× less** than after handover.

---

## 3. How the best in the world do it

| Firm | Positioning line | What they actually do |
| --- | --- | --- |
| **Hoare Lea** | *"Engineers of human experiences"* | Never says "MEP" in the promise. Three pillars: human-centric, planet-conscious, insight-driven. Thought leadership sits **above** project work. Photography and film, minimal technical diagrams. |
| **Buro Happold** | *"Why shouldn't your project use high performance, low energy building systems?"* | Opens with a provocative question, not a definition. Anchors in an external fact (buildings = 40% of energy). Presents services **holistically**, refusing the M/E/P silo. CTA is relational — named humans, not a form. |
| **Arup** | *"…the key systems that keep buildings operational and create a delightful environment for the people who use them"* | Outcome language ("delightful environment") carrying technical substance underneath. |

**The consistent pattern: none of them lead with the acronym, the equipment, or the discipline list.
They lead with the human outcome and let MEPF be the mechanism.**

### 3.1 But — an important caveat

Those are global consultancies selling to developers, architects and estate directors. Neetu
Archstone sells primarily to **Jaipur homeowners building one house, once, with their own money.**

Pure abstraction ("engineers of human experiences") would float straight past that buyer. They need
the opposite of abstraction: something concrete, visual, local and countable.

> **Global firms make MEP feel important. This audience needs it to feel tangible.**
> The winning approach has to do both.

### 3.2 The local competitive picture

Neither competitor makes MEPF memorable, which is the whole opportunity:

- **Archubic** has an `/services/mep` page — a solid explainer, four pillars, benefits list. Static,
  text-led, no visual, no number. It informs and is forgotten.
- **Reidius** does not present MEPF as a discipline at all.

Nobody in this market has given MEPF a *shape*. The category is unclaimed.

---

## 4. Six approaches

Ranked by how well each answers *"what do they remember?"*

---

### A. The X-Ray House — make the invisible visible
**The signature object.** A cutaway of a house where the walls dissolve and the four systems light up
in sequence: electrical, then plumbing, then HVAC, then fire. Scroll-driven, or toggled by the user.

- **Why it works:** solves the core problem literally. Gives MEPF a shape you can hold in your head.
- **Memorability:** ★★★★★ — this is the thing people describe to their spouse
- **Effort:** High. Layered SVG is the right call (~30–60 KB, fast, accessible, animatable,
  works on mobile) over Three.js/WebGL, which costs 150 KB+ and buys little here.
- **Risk:** needs real artwork. Generic stock diagrams would undercut the whole claim.
- **Precedent:** BIMx real-time cutaway; xeokit X-ray mode; VIZ Graphics interactive cutaways.

### B. The Rework Multiplier — "₹1 now or ₹7 later"
An interactive slider: *when is this clash found?* Design → Construction → After handover. The cost
counts up 1× → 7× → 10× as you drag, with the wall visually breaking open at the last stage.

- **Why it works:** converts an abstract virtue (coordination) into a number people repeat.
- **Memorability:** ★★★★★ — a ratio is the most portable form of an argument
- **Effort:** Medium. Reuses the estimator's counter and chart primitives.
- **Bonus:** sits naturally beside the cost estimator, which is already the site's strongest asset.

### C. The Invisible Third — the budget reframe
Hero statistic treatment: **"25–40% of your budget is behind the wall."** Uses the estimator's
existing donut with the MEPF slice pulled out and everything else desaturated.

- **Why it works:** genuinely surprising. Surprise is the precondition for memory.
- **Memorability:** ★★★★☆
- **Effort:** Low — the donut component already exists.

### D. The Four Systems That Keep a Building Alive — the body analogy
Electrical = nervous system · Plumbing = circulatory · HVAC = respiratory · Fire = immune system.

- **Why it works:** instantly graspable by a non-technical buyer; the four disciplines stop being a
  list and become a body. Well-established in BIM education, so it is *understood*, not gimmicky.
- **Memorability:** ★★★★☆ — highly repeatable, but only with restraint. Overplayed, it turns cute
  and undermines the engineering authority.
- **Effort:** Low–medium.

### E. One Team vs. Four Contractors — the competitive wedge
Side-by-side: four separate trades pointing at each other, versus one accountable team. This is their
*actual* differentiator and it is unclaimed locally.

- **Why it works:** speaks directly to the fear that a homeowner already has.
- **Memorability:** ★★★☆☆ — persuasive, less visual
- **Effort:** Low. Strongest with commercial buyers.

### F. Thread MEPF through the entire journey — not a page
The others are moments. This is the *system*:

- Home hero secondary line and a dedicated scroll chapter
- **MEPF slice pulled out in every estimate** the user generates
- An "MEPF scope" badge and section on every project case study
- A named MEPF stage in the process timeline
- MEPF filter on the projects library
- An MEPF section in the client portal (first-fix / second-fix / testing sign-offs)
- MEPF specification tab in the estimator's material step *(already built — Electrical and Plumbing
  are two of the 14 categories)*

- **Why it works:** memory is a function of **repetition across contexts**, not intensity in one place.
  A single brilliant page is remembered by the people who reach it. A thread is remembered by everyone.
- **Memorability:** ★★★★★ in aggregate
- **Effort:** Medium, distributed across many files.

---

## 5. Recommendation

**No single approach achieves "the one thing they remember." Memory needs four ingredients, and they
map onto four of the approaches:**

| Ingredient | Delivered by |
| --- | --- |
| **Surprise** — a fact that resets their assumption | C · The Invisible Third (25–40%) |
| **Shape** — something they can picture | A · The X-Ray House |
| **Stake** — an emotional consequence | B · The Rework Multiplier (₹1 → ₹7) |
| **Repetition** — the same idea in many contexts | F · Threading it through the journey |

Approaches D and E are supporting arguments — good copy, not load-bearing structure.

### 5.1 The line to build everything around

The strategy needs a handle that is not the acronym. Candidates:

| Line | Read |
| --- | --- |
| **"The 30% you'll never see."** | Strongest. Surprising, concrete, provocative, own-able. Sets up everything else. |
| "Everything behind the wall." | Warm, plain-language, very Indian-homeowner-friendly. Less numeric bite. |
| "We build the half of the house you can't photograph." | Memorable, slightly long, has real charm. |
| "Right the first time. Because the second time costs seven." | Leads with the multiplier. Better as a sub-line than a headline. |

Recommendation: **"The 30% you'll never see"** as the umbrella, with MEPF retained as the technical
term underneath it. That keeps the client's own vocabulary (and the portfolio's) intact while giving
homeowners something they can actually hold.

### 5.2 Suggested phasing

1. **Foundation (low effort, high return):** the umbrella line, the 30% reframe on the home page, the
   MEPF slice pulled out of every estimate, the body analogy on the MEPF page.
2. **Signature moment:** the X-Ray House on the MEPF service page, teased on the home page.
3. **The stake:** the rework multiplier, placed between the estimator and the MEPF page.
4. **The thread:** project badges, portal section, process stage, projects filter.

---

## 6. How we would know it worked

| Signal | Where |
| --- | --- |
| MEPF page share of total sessions | Admin → Analytics |
| Time on the MEPF page vs. site average | Admin → Analytics |
| X-Ray interaction rate (layers toggled) | Custom event |
| Enquiries citing MEPF as service interest | Admin → Enquiries, `serviceInterest` |
| Commercial-segment enquiry share | Admin → Enquiries |

---

## Sources
- [MEP design cost India — AECORD](https://aecord.com/blog/mep-design-cost-india-residential-commercial)
- [4 design missteps that cost builders ₹50L+ in reworks — Midori Architects](https://www.midoriarchitects.com/4-design-missteps-that-costs-builders-%E2%82%B950l-in-reworks/)
- [7 common & expensive mistakes in house construction in India — Construction Estimator India](https://constructionestimatorindia.com/7-common-expensive-mistakes-in-house-construction-in-india/)
- [15 common house construction mistakes in India — HouseYog](https://www.houseyog.com/blog/top-15-house-construction-mistakes-in-india-and-how-to-avoid-them/)
- [MEP inspection in construction — FieldPie](https://www.fieldpie.com/blog/mep-inspection-in-construction/)
- [The hidden MEP risks that quietly derail building projects — ECF Consultants](https://www.ecfconsultants.com/post/the-hidden-mep-risks-that-quietly)
- [Building services engineering (MEP) — Buro Happold](https://www.burohappold.com/specialisms/building-services-engineering-mep/)
- [Hoare Lea — Engineers of human experiences](https://hoarelea.com/)
- [Building services engineering — Arup](https://www.arup.com/en-us/services/building-services-engineering/)
- [Architectural vs structural vs MEP building systems in BIM — BIMcafe](https://bimcafe.in/blog/architectural-vs-structural-vs-mep-building-systems-bim/)
- [xeokit BIM viewer — X-ray, highlight, section](https://github.com/xeokit/xeokit-bim-viewer)
- [BIMx real-time cutaway](https://en.wikipedia.org/wiki/BIMx)
- [Interactive cutaway renderings — VIZ Graphics](https://www.vizgraphics.com/showcase/interactive-cutaway-renderings/)
- [Best engineering website design examples — Windmill Strategy](https://www.windmillstrategy.com/best-engineering-aec-ed-epc-website-design-examples/)
- [Engineering website examples — OpenAsset](https://openasset.com/resources/engineering-website-examples/)

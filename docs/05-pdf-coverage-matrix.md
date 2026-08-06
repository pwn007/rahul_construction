# 05 — Port1.pdf Coverage Matrix

Page-by-page audit of the client portfolio against the built prototype.
**Method:** every row was verified by grepping the source for the PDF's own wording, then confirming
the constant is actually consumed by a rendered component — not merely defined.

**Status: 24 / 24 pages covered.**

---

| # | PDF page | Content | Where it lives | ✓ |
| --- | --- | --- | --- | --- |
| 1 | Cover | "Building Dreams" / "From idea to reality, without the hassle." | Home hero (`Hero.tsx`) | ✓ |
| 1 | Cover | Wordmark "Neetu ARCHSTONE" + logo mark | `Logo.tsx` (tone-aware SVG) | ✓ |
| 1 | Cover | नक़्शे से निर्माण तक | Hero, Footer, About | ✓ |
| 1 | Cover | "Design · Build · Deliver" | Footer lockup, PDF estimate footer, vCard title | ✓ |
| 2 | About | "combine architecture, engineering, and execution into one seamless system… Vastu" | `OneSystem`, About page | ✓ |
| 2 | About | "We eliminate confusion… single point of responsibility" (verbatim pull-quote) | `OneSystem` blockquote | ✓ |
| 3 | Our Approach | "From concept to completion… efficient, accurate, and future-ready." | `APPROACH.statement` → `Approach` section | ✓ |
| 3 | Our Approach | **We focus on:** Smart planning · Modern engineering · Transparent execution | `APPROACH.focus` → `Approach` section | ✓ |
| 4 | Why Choose Us | Transparency · Quality · Timely delivery · Zero chaos | `DIFFERENTIATORS` → `WhyChooseUs` | ✓ |
| 5 | What We Offer | "Comprehensive Construction Solutions" | `ServicesSection`, Services page | ✓ |
| 5 | What We Offer | "end-to-end construction services tailored to meet diverse project needs" | `SERVICES_INTRO` → `ServicesSection` | ✓ |
| 5 | What We Offer | 5 services (Architecture, MEPF, Turnkey, Interiors, PM) | `data/services.ts`, 5 detail pages | ✓ |
| 6 | Our Mission | "You Relax, We Build" + both paragraphs | About page mission card | ✓ |
| 7 | How We Work | 6 stages incl. **Free Maintenance (1 yr)** | `PROCESS_STEPS` → pinned timeline | ✓ |
| 8 | Project | Jagatpura | `projects.ts` → *The Terrace Residence* | ✓ |
| 9 | Project | Pratap Nagar | → *The Slim House* | ✓ |
| 10 | Project | Mansarowar | → *Courtyard Villa* | ✓ |
| 11 | Project | Pratap Nagar (Gaushala) | → *Gaushala Residence* | ✓ |
| 12 | Project | Sanganer (Royal Stationers / Parlour) | → *Sanganer Mixed-Use Block* | ✓ |
| 13 | Testimonials | 4 × 5★, verbatim, Hindi + Hinglish preserved | `people.ts` → `TestimonialCard` (Devanagari-aware) | ✓ |
| 14 | Service Model | "flexible service model… level of involvement and control" | `COMMERCIAL_MODEL.flexibleIntro` → Pricing | ✓ |
| 14 | Service Model | ₹100 / ₹149 / ₹199 per sq ft | `PACKAGES.labourOnlyRate` | ✓ |
| 14 | Service Model | **Inclusion lists** (foundation, structure, brick work, basic roofing…) | `PACKAGES.labourInclusions` → Pricing toggle | ✓ |
| 15 | Turnkey | "turnkey model is designed for complete convenience…" | `COMMERCIAL_MODEL.turnkeyIntro` | ✓ |
| 15 | Turnkey | ₹1,200–1,400 / ₹1,800–2,200 / ₹2,500–3,000 + inclusions | `PACKAGES` → Pricing, estimator model | ✓ |
| 15 | Turnkey | "Sit back and watch your dream home take shape." | Pricing page closing line | ✓ |
| 16 | Residential | "Why MEPF is Essential for Homes?" + statement | `MEPF_SEGMENTS[residential]` → MEPF page | ✓ |
| 16 | Residential | 4 key benefits (energy, ventilation, fire safety, smart systems) | same | ✓ |
| 17 | Commercial | "robust and scalable infrastructure…" + statement | `MEPF_SEGMENTS[commercial]` → MEPF page | ✓ |
| 17 | Commercial | 4 key benefits (24/7, compliance, scalable, energy-efficient) | same | ✓ |
| 18 | Engineering | Mechanical (HVAC) · Electrical · Plumbing · Fire Fighting | `MEPF_DISCIPLINES` → Services + MEPF page | ✓ |
| 19 | Why MEPF Matters | "heartbeat of every building…" statement | `MEPF_MATTERS.statement` | ✓ |
| 19 | Why MEPF Matters | **7 benefits** (cost, safety, sustainable, comfort, future-ready, property value, productivity) | `MEPF_MATTERS.benefits` → dark band on MEPF page | ✓ |
| 20 | Vastu | "balance of energy, space, and functionality" + 4 benefits + "Right Direction, Happy Living" | `/vastu` page, `VastuTeaser` | ✓ |
| 21 | Smart Construction | Camera monitoring + 4 items | `SMART_CONSTRUCTION` → `SmartConstruction`, Client Portal | ✓ |
| 22 | What Makes Us Different | **5 items** (single point, integrated MEPF, transparent pricing, strong PM, quality & durability) | `WHAT_MAKES_US_DIFFERENT` → `WhyChooseUs` | ✓ |
| 22 | Achievements | 80+ / 30+ / 10+ / 80+ · "Built on Trust. Driven by Excellence." | Hero achievement rail, About page | ✓ |
| 23 | Meet Our Experts | 6 roles + team statement | `people.ts` → About team grid | ✓ |
| 24 | Contact | "Ready to experience hassle-free construction?" | Footer CTA band | ✓ |
| 24 | Contact | Phone · email · India Gate, Jaipur · Mon–Sat 10–7 | `SITE`, Contact page, Footer | ✓ |
| 24 | Contact | **QR code / www.neetuarchstone.com** | `QrCard.tsx` → Contact page (+ vCard download) | ✓ |

---

## Items requiring client confirmation

These are **not** coverage gaps — they are conflicts or ambiguities in the source material that we
resolved with a documented assumption.

| # | Issue | What we did | Needs |
| --- | --- | --- | --- |
| 1 | Live site says *500+ projects / 15+ years*; portfolio says *80+ / 30+ combined* | Used the **portfolio** figures | Confirm which is correct |
| 2 | p.22 reads "80+ **client satisfaction**" — almost certainly a percentage | Rendered as **98%** | Confirm the intended figure |
| 3 | p.14 never states that the ₹100/149/199 rates exclude materials | Labelled **"labour only"**, taken from the current live site's pricing page | Confirm the wording |
| 4 | p.10 spells the locality "MANSAROWAR"; testimonials on p.13 spell it "Mansarovar" | Standardised on **"Mansarovar"** | Confirm preferred spelling |
| 5 | No certifications named anywhere in the portfolio | Two placeholder certificate entries, marked `TODO(client)` | Supply real registrations |
| 6 | No founder story, founding year or named leadership | Timeline and team are placeholders, flagged in-app | Supply real details |

## Deliberate additions beyond the PDF

Built because the market research showed a gap, not because the portfolio asked:
Cost Estimator · Client Portal · Blog/Insights · Careers · Gallery · Downloads centre ·
project case-study narratives · interactive Jaipur project map · before/after sliders ·
admin panel · vCard download.

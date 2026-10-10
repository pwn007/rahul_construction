import type { Post, Faq, Job, GalleryItem, Download } from '@/types/domain';
import { IMG, monogram } from '@/lib/media';

const meta = (id: string, createdAt: string) => ({
  id,
  createdAt,
  updatedAt: createdAt,
  status: 'published' as const,
});

/* ==================================================================== */
/* Blog / Insights                                                       */
/* ==================================================================== */

export const posts: Post[] = [
  {
    ...meta('post_cost_2026', '2026-07-12T09:00:00.000Z'),
    slug: 'what-it-actually-costs-to-build-a-house-in-jaipur-2026',
    title: 'What it actually costs to build a house in Jaipur in 2026',
    excerpt:
      'A head-by-head breakdown of where every rupee goes on a turnkey house — and the four line items that quietly blow most budgets.',
    coverImage: IMG.wide('post-cost'),
    category: 'Cost & Budget',
    tags: ['Costing', 'Turnkey', 'Jaipur'],
    author: 'Rahul Verma',
    authorRole: 'Director — Operations',
    authorAvatar: monogram('Rahul Verma'),
    publishedAt: '2026-07-12T09:00:00.000Z',
    readingMinutes: 8,
    featured: true,
    body: `Almost every conversation we have starts the same way: "What will it cost per square foot?"

It is the right question asked at the wrong resolution. A per-square-foot number is an average of five very different cost heads, and the reason two houses on the same street can differ by 40% is almost never the structure.

## Where the money actually goes

On a typical turnkey semi-furnished house in Jaipur, the split looks roughly like this:

- **Structure — 42%.** Foundation, RCC frame, brickwork, roofing. This is the most predictable head. Steel and cement prices move, but quantities do not surprise you.
- **Finishing — 27%.** Plaster, flooring, paint, doors, windows. This is where specification choices swing hardest. The same 2,000 sq ft can be floored for ₹3 lakh or ₹11 lakh.
- **MEPF — 16%.** Electrical, plumbing, HVAC, fire. Under-budgeted more often than any other head, and the most expensive to fix later.
- **Interiors — 5%** in semi-furnished, rising past 20% in a fully furnished package.
- **Approvals, supervision and contingency — 10%.**

## The four line items that blow budgets

**1. Elevation.** A premium facade — louvers, stone cladding, CNC panels, facade lighting — adds ₹150–200 per sq ft of built-up area. It is the single most common late addition, and because it happens after the structure is up, it is never in the original number.

**2. Waterproofing done properly.** Terrace, bathrooms, sunken slabs and external walls. Around ₹40 per sq ft. Skipping it saves about 1.5% of your budget and costs several times that within five years.

**3. Boundary wall, gate and landscaping.** Routinely excluded from "construction cost", routinely ₹4–6 lakh.

**4. Approvals and development charges.** JDA and municipal fees are not part of any contractor's rate.

## What a real estimate looks like

An honest estimate names its assumptions. Ours states the built-up area it assumed, the quality tier it priced, what is excluded, and the range — not a single fake-precise number.

If someone quotes you an exact figure to the rupee before soil testing and approved drawings, they are quoting a number, not a cost.`,
  },
  {
    ...meta('post_vastu', '2026-06-02T09:00:00.000Z'),
    slug: 'vastu-without-compromise-planning-not-patching',
    title: 'Vastu without compromise: plan it, do not patch it',
    excerpt:
      'Vastu applied at concept stage costs nothing. Vastu applied after the drawings are frozen costs you a bedroom.',
    coverImage: IMG.wide('post-vastu'),
    category: 'Design',
    tags: ['Vastu', 'Planning', 'Design'],
    author: 'Neetu Sharma',
    authorRole: 'Founder & Principal Architect',
    authorAvatar: monogram('Neetu Sharma'),
    publishedAt: '2026-06-02T09:00:00.000Z',
    readingMinutes: 6,
    featured: true,
    body: `There is a version of Vastu that improves houses and a version that ruins them. The difference is entirely about when it enters the process.

## Vastu as a planning constraint

Treated as a constraint at concept stage, Vastu is no different from a setback rule or a sun path. It says: entrance in this range of directions, kitchen in the south-east, master bedroom in the south-west, water in the north-east, heavy mass to the south and west.

Those are spatial constraints. Architects work with spatial constraints for a living. Given at the start, they shape the plan and cost nothing.

## Vastu as a retrofit

Applied after drawings are frozen, the same rules become demolition. The kitchen moves, so the plumbing stack moves, so the bathroom above moves, so the structural grid no longer works. We have seen clients lose an entire bedroom to a change that would have been free eight weeks earlier.

## What we do

Vastu placement is resolved in the first planning cycle, before elevations, before structure, before anyone falls in love with a drawing. When something genuinely cannot be reconciled, we say so and explain the trade-off, rather than quietly moving a wall and hoping.

Right direction, happy living — but only if the direction is decided before the concrete.`,
  },
  {
    ...meta('post_mepf', '2026-05-08T09:00:00.000Z'),
    slug: 'why-mepf-is-the-most-under-budgeted-part-of-your-home',
    title: 'Why MEPF is the most under-budgeted part of your home',
    excerpt:
      'Sixteen percent of the budget decides thirty years of comfort. Here is what proper services design actually buys you.',
    coverImage: IMG.wide('post-mepf'),
    category: 'Engineering',
    tags: ['MEPF', 'HVAC', 'Electrical'],
    author: 'Farhan Qureshi',
    authorRole: 'MEP Engineer',
    authorAvatar: monogram('Farhan Qureshi'),
    publishedAt: '2026-05-08T09:00:00.000Z',
    readingMinutes: 7,
    featured: false,
    body: `You will never see your MEPF. That is precisely why it gets cut.

## The failure mode

The typical sequence: an architect draws the plan, a contractor builds it, and an electrician arrives after the walls are up to decide where the points go. Chases get cut into fresh plaster. Cable sizing is done by habit rather than load calculation. The drainage slope is whatever the plumber judged by eye.

Everything works on day one. The problems arrive in years three to eight, and every one of them is now behind a finished wall.

## What designed services buy you

- **Correct load sizing.** Undersized cable runs hot, wastes energy and eventually fails. Oversizing wastes capital. A load calculation takes an afternoon.
- **Coordinated routing.** Services drawn against the structure means no slab is cut after casting. We treat a post-cast slab cut as a design failure.
- **Real drainage falls.** Calculated, not eyeballed. This is the difference between a bathroom that drains and one that smells.
- **Fire compliance that would actually pass.** Not a token extinguisher.
- **Capacity headroom.** An EV charger, a solar inverter, a heat pump — all of these need a spare way in.

## The number

Proper MEPF design adds roughly 3–5% to a project's cost and reduces running cost by up to 30% over the building's life. It is the best-value line item on the whole BOQ, and it is the first one people cut.`,
  },
  {
    ...meta('post_turnkey', '2026-04-14T09:00:00.000Z'),
    slug: 'turnkey-vs-labour-contract-which-one-is-right-for-you',
    title: 'Turnkey vs labour contract: which one is right for you?',
    excerpt:
      'One saves money if you have time and knowledge. The other saves time and risk. Choosing wrong is expensive either way.',
    coverImage: IMG.wide('post-turnkey'),
    category: 'Cost & Budget',
    tags: ['Turnkey', 'Contracts', 'Decision'],
    author: 'Rahul Verma',
    authorRole: 'Director — Operations',
    authorAvatar: monogram('Rahul Verma'),
    publishedAt: '2026-04-14T09:00:00.000Z',
    readingMinutes: 6,
    featured: false,
    body: `We offer both models, and we genuinely do not mind which you choose — but we do mind that you choose the right one.

## Labour-only

You buy the materials. We provide supervised labour at ₹100–199 per sq ft depending on scope.

**This works if** you have time to visit site weekly, someone in the family understands materials, and you have storage and cash flow to buy in bulk at the right moment.

**The saving** is real — typically 8–12% — because you capture the material margin yourself.

**The risk** is also real. You own every procurement decision, every shortfall, every wrong delivery. A delayed steel order is your delay.

## Turnkey

We handle everything at ₹1,200–3,000 per sq ft depending on package.

**This works if** your time is worth more than the margin, you live away from the site, or you simply do not want to think about cement grades on a Tuesday.

**The saving** is in risk and time, not rupees.

## The honest test

If you cannot commit one site visit a week for the full duration, take turnkey. The labour model does not save money for an absent owner — it costs more, because unsupervised procurement leaks in every direction.`,
  },
  {
    ...meta('post_timeline', '2026-03-03T09:00:00.000Z'),
    slug: 'how-long-does-it-really-take-to-build-a-house',
    title: 'How long does it really take to build a house?',
    excerpt: 'A stage-by-stage programme for a G+1 house in Jaipur, and the three things that actually cause delay.',
    coverImage: IMG.wide('post-timeline'),
    category: 'Process',
    tags: ['Timeline', 'Programme', 'Delays'],
    author: 'Priya Nathani',
    authorRole: 'Project Manager',
    authorAvatar: monogram('Priya Nathani'),
    publishedAt: '2026-03-03T09:00:00.000Z',
    readingMinutes: 5,
    featured: false,
    body: `A 2,500 sq ft G+1 house, turnkey semi-furnished, runs about 38 weeks from agreement to keys. Here is where that time goes.

| Stage | Duration |
| --- | --- |
| Design, approvals and BOQ | 5–6 weeks |
| Foundation and plinth | 4–5 weeks |
| Structure and slabs | 10–11 weeks |
| Masonry and plaster | 6 weeks |
| MEPF and waterproofing | 4–5 weeks (overlapping) |
| Flooring, painting, fittings | 7 weeks |
| Snagging and handover | 1–2 weeks |

## The three real causes of delay

**1. Decisions, not construction.** Tile selection, sanitary ware, paint shades. Every week a decision sits open is a week the relevant trade cannot start. We front-load these deliberately.

**2. Payment timing.** Material orders are placed against milestone payments. A payment released a week late moves the whole downstream chain.

**3. Scope changes after casting.** Moving a wall on paper is free. Moving it after the slab is cast costs three weeks and real money.

Weather, contrary to reputation, is rarely the cause. Monsoon slows external finishing, but the programme already accounts for it.`,
  },
  {
    ...meta('post_monsoon', '2026-02-10T09:00:00.000Z'),
    slug: 'building-through-a-jaipur-monsoon',
    title: 'Building through a Jaipur monsoon',
    excerpt: 'What can safely continue, what must stop, and how to sequence a programme so the rain costs you nothing.',
    coverImage: IMG.wide('post-monsoon'),
    category: 'Process',
    tags: ['Monsoon', 'Scheduling', 'Waterproofing'],
    author: 'Mahesh Jangid',
    authorRole: 'Senior Site Engineer',
    authorAvatar: monogram('Mahesh Jangid'),
    publishedAt: '2026-02-10T09:00:00.000Z',
    readingMinutes: 5,
    featured: false,
    body: `Jaipur gets most of its rain across roughly eight weeks. Handled well, that period costs a project almost nothing.

## What continues

Internal work of every kind: electrical and plumbing first fix, internal plaster, flooring, joinery installation, painting in enclosed areas. If the roof is on, work continues.

## What stops

External plaster and paint, terrace waterproofing, excavation in open ground, and any concrete pour where the mix cannot be protected. Curing is actually easier in humidity — it is placement and finishing that suffer.

## Sequencing

The trick is simply to arrange the programme so the monsoon lands on internal work. On projects starting in October, we plan the structure to be topped out and roofed by June. On projects starting in March, we accept that external finishing waits until September and pull internal work forward.

Waterproofing is never done during the monsoon. It is done before, and then tested by it.`,
  },
];

/* ==================================================================== */
/* FAQs                                                                  */
/* ==================================================================== */

export const faqs: Faq[] = [
  {
    ...meta('faq_pricing_1', '2025-01-01T09:00:00.000Z'),
    question: 'What is the difference between your labour-only and turnkey rates?',
    answer:
      'Labour-only rates (₹100–199 per sq ft) cover supervised labour and execution — you procure all materials yourself. Turnkey rates (₹1,200–3,000 per sq ft) cover everything: design, materials, labour, services and finishes under one agreement. Labour-only typically saves 8–12% but requires you to manage procurement and visit site weekly.',
    category: 'pricing',
    order: 1,
  },
  {
    ...meta('faq_pricing_2', '2025-01-01T09:00:00.000Z'),
    question: 'Is GST included in your quoted rates?',
    answer:
      'No. All quoted rates are exclusive of GST, which is charged at the applicable rate. Government approvals, JDA and municipal development charges are also excluded and are paid directly by you.',
    category: 'pricing',
    order: 2,
  },
  {
    ...meta('faq_pricing_3', '2025-01-01T09:00:00.000Z'),
    question: 'How accurate is the online cost estimator?',
    answer:
      'The estimator is built on our real rate card and typically lands within 8–10% of the final BOQ for a standard plot. It cannot account for soil conditions, unusual site access, or design decisions not yet made. It gives you a defensible budgeting range, not a quotation.',
    category: 'pricing',
    order: 3,
  },
  {
    ...meta('faq_pricing_4', '2025-01-01T09:00:00.000Z'),
    question: 'How is payment structured?',
    answer:
      'Payments are linked to construction milestones, not to dates. You pay 10% on agreement and the balance in six tranches as each stage completes and is verified — plinth, ground floor slab, final slab, plaster, finishing, and 5% held to handover.',
    category: 'pricing',
    order: 4,
  },
  {
    ...meta('faq_process_1', '2025-01-01T09:00:00.000Z'),
    question: 'How do I track progress if I cannot visit the site?',
    answer:
      'Every project gets live camera access, a weekly photo report, and a client portal showing milestone progress, documents and payment status. A large share of our clients live outside Jaipur and manage their build entirely through these.',
    category: 'process',
    order: 1,
  },
  {
    ...meta('faq_process_2', '2025-01-01T09:00:00.000Z'),
    question: 'What does the 1 year free maintenance actually cover?',
    answer:
      'Twelve months from handover, covering workmanship and installation defects — plumbing leaks, electrical faults, plaster or paint failures, door and window adjustment, and waterproofing issues. It excludes damage from misuse and normal wear on consumables.',
    category: 'process',
    order: 2,
  },
  {
    ...meta('faq_process_3', '2025-01-01T09:00:00.000Z'),
    question: 'What happens if the project runs late?',
    answer:
      'The milestone programme is agreed and published before we mobilise. If a milestone slips, it is flagged in that week\'s report with the cause and a recovery plan — not discovered at the end. Delays caused by client-side decisions or payment timing are tracked separately and transparently.',
    category: 'process',
    order: 3,
  },
  {
    ...meta('faq_arch_1', '2025-01-01T09:00:00.000Z'),
    question: 'Can I engage you for design only, without construction?',
    answer:
      'Yes. Architectural design, MEPF consultancy and interior design are each available as standalone engagements. Many clients start with design, see how we work, and then extend into construction.',
    category: 'general',
    order: 1,
  },
  {
    ...meta('faq_arch_2', '2025-01-01T09:00:00.000Z'),
    question: 'How many design revisions are included?',
    answer:
      'Unlimited revisions until the plan is frozen. After the design freeze, changes are chargeable because they cascade into structure, services and quantities.',
    category: 'general',
    order: 2,
  },
  {
    ...meta('faq_vastu_1', '2025-01-01T09:00:00.000Z'),
    question: 'Do you follow Vastu, and does it limit the design?',
    answer:
      'Yes, and no. Vastu placement is resolved in the first planning cycle, where it behaves like any other spatial constraint and costs nothing. It only limits design when it is introduced after the plan is frozen. If a specific requirement genuinely conflicts with the site, we explain the trade-off rather than quietly ignoring it.',
    category: 'vastu',
    order: 1,
  },
  {
    ...meta('faq_mepf_1', '2025-01-01T09:00:00.000Z'),
    question: 'Why should MEPF be designed rather than left to the contractor?',
    answer:
      'Because it is concealed. Undersized cabling, uncalculated drainage falls and uncoordinated routing all work on day one and fail in year five — behind a finished wall. Designed services add 3–5% to project cost and reduce running cost by up to 30% across the building\'s life.',
    category: 'mepf',
    order: 1,
  },
  {
    ...meta('faq_mepf_2', '2025-01-01T09:00:00.000Z'),
    question: 'Do you provide MEPF for projects you are not building?',
    answer:
      'Yes. We take on MEPF design and site supervision as a standalone consultancy for residential, commercial and healthcare projects being built by others.',
    category: 'mepf',
    order: 2,
  },
  {
    ...meta('faq_mepf_3', '2025-01-01T09:00:00.000Z'),
    question: 'Is fire fighting design mandatory for my building?',
    answer:
      'It depends on height, use and occupancy. Residential buildings above a certain height and nearly all commercial buildings require fire detection and protection systems for approval and occupancy. We assess this at concept stage so it never becomes a late surprise.',
    category: 'mepf',
    order: 3,
  },
  {
    ...meta('faq_interior_1', '2025-01-01T09:00:00.000Z'),
    question: 'Can you do interiors in an apartment I already own?',
    answer:
      'Yes — interior-only fit-outs are a significant part of our work. Roughly 70% of joinery is fabricated off-site, which keeps on-site time short and is usually what society rules require.',
    category: 'interiors',
    order: 1,
  },
  {
    ...meta('faq_interior_2', '2025-01-01T09:00:00.000Z'),
    question: 'How long does a full interior fit-out take?',
    answer:
      'Twelve to sixteen weeks for a typical 3–4 BHK, assuming material selections are frozen at the start. Delayed selections are the single largest cause of interior overruns.',
    category: 'interiors',
    order: 2,
  },
  {
    ...meta('faq_general_1', '2025-01-01T09:00:00.000Z'),
    question: 'Which areas do you work in?',
    answer:
      'All of Jaipur, with completed projects in Mansarovar, Jagatpura, Pratap Nagar, Sanganer, Malviya Nagar and Vaishali Nagar. We take selected projects elsewhere in Rajasthan, priced with a small location factor.',
    category: 'general',
    order: 3,
  },
  {
    ...meta('faq_careers_1', '2025-01-01T09:00:00.000Z'),
    question: 'Do you take architecture and engineering interns?',
    answer:
      'Yes. We run a structured internship with site exposure from week one, and we hire from it regularly. Open positions are listed on our careers page.',
    category: 'careers',
    order: 1,
  },
];

/* ==================================================================== */
/* Careers                                                               */
/* ==================================================================== */

export const jobs: Job[] = [
  {
    ...meta('job_arch', '2026-07-01T09:00:00.000Z'),
    slug: 'senior-architect',
    title: 'Senior Architect',
    department: 'Design',
    location: 'Jaipur, Rajasthan',
    type: 'full-time',
    experience: '5–8 years',
    salaryRange: '₹8 – 14 LPA',
    openings: 2,
    postedAt: '2026-07-01T09:00:00.000Z',
    summary:
      'Own residential and mixed-use projects from concept through working drawings, with real authority over the design and direct access to the client.',
    responsibilities: [
      'Lead concept design and design development on 3–5 concurrent projects',
      'Resolve Vastu placement within the plan at concept stage',
      'Produce and check complete working drawing sets',
      'Coordinate with structural and MEPF teams to close clashes before issue',
      'Present to clients and run the design freeze process',
      'Support the site team during construction',
    ],
    requirements: [
      'B.Arch with COA registration',
      '5+ years in residential or mixed-use practice',
      'Fluency in AutoCAD, SketchUp and Revit',
      'Demonstrated working-drawing capability, not just concept work',
      'Working understanding of Vastu principles in planning',
      'Comfortable presenting directly to clients',
    ],
    benefits: [
      'Direct client ownership from day one',
      'Annual learning and site-visit budget',
      'Health cover for you and immediate family',
      'Five-day week with genuine flexibility',
      'Profit share linked to project delivery',
    ],
  },
  {
    ...meta('job_mep', '2026-06-20T09:00:00.000Z'),
    slug: 'mep-design-engineer',
    title: 'MEP Design Engineer',
    department: 'Engineering',
    location: 'Jaipur, Rajasthan',
    type: 'full-time',
    experience: '3–6 years',
    salaryRange: '₹6 – 11 LPA',
    openings: 1,
    postedAt: '2026-06-20T09:00:00.000Z',
    summary:
      'Design mechanical, electrical, plumbing and fire systems across residential, commercial and healthcare projects — and then supervise them being built properly.',
    responsibilities: [
      'Heat load and electrical load calculations',
      'HVAC, electrical, plumbing and fire-fighting layouts',
      'Services coordination against structural drawings',
      'Panel schedules, single line diagrams and BOQs',
      'First-fix and second-fix site inspections',
      'Testing, commissioning and handover documentation',
    ],
    requirements: [
      'B.E./B.Tech in Mechanical or Electrical Engineering',
      '3+ years in building services design',
      'AutoCAD and Revit MEP proficiency',
      'Familiarity with NBC and local fire regulations',
      'Willing to spend real time on site, not only at a desk',
    ],
    benefits: [
      'Work across all four disciplines rather than one silo',
      'Certification support (LEED / IGBC / fire safety)',
      'Health cover',
      'Five-day week',
    ],
  },
  {
    ...meta('job_site', '2026-06-10T09:00:00.000Z'),
    slug: 'site-engineer-civil',
    title: 'Site Engineer — Civil',
    department: 'Site',
    location: 'Jaipur, Rajasthan',
    type: 'full-time',
    experience: '2–5 years',
    salaryRange: '₹4.5 – 8 LPA',
    openings: 3,
    postedAt: '2026-06-10T09:00:00.000Z',
    summary:
      'Run day-to-day execution on live residential sites, own the quality checklist, and be the reason a project stays on programme.',
    responsibilities: [
      'Daily site supervision and labour deployment',
      'Setting out, level checks and dimensional verification',
      'Stage-wise quality checks with documented sign-off',
      'Material inspection, testing and inventory control',
      'Daily progress reporting with photographs',
      'Coordination between civil, MEPF and interior trades',
    ],
    requirements: [
      'B.E./Diploma in Civil Engineering',
      '2+ years of site execution experience',
      'Strong grasp of RCC and masonry practice',
      'Ability to read and check working drawings',
      'Two-wheeler and valid licence',
    ],
    benefits: [
      'Site allowance and travel reimbursement',
      'Clear progression to Senior Site Engineer',
      'Health cover',
      'Performance bonus on on-time delivery',
    ],
  },
  {
    ...meta('job_interior', '2026-05-28T09:00:00.000Z'),
    slug: 'interior-designer',
    title: 'Interior Designer',
    department: 'Design',
    location: 'Jaipur, Rajasthan',
    type: 'full-time',
    experience: '2–4 years',
    salaryRange: '₹4 – 8 LPA',
    openings: 1,
    postedAt: '2026-05-28T09:00:00.000Z',
    summary:
      'Take interiors from concept to fabrication drawings to installed reality — you will see everything you draw get built.',
    responsibilities: [
      'Space planning and furniture layouts',
      'Material and finish curation with physical sample boards',
      '3D visualisation for client approval',
      'Detailed joinery fabrication drawings',
      'Coordination with the workshop and installation crews',
      'Site visits during installation and snagging',
    ],
    requirements: [
      'B.Des / Diploma in Interior Design',
      '2+ years in residential interiors',
      'SketchUp, AutoCAD and a rendering engine',
      'Genuine understanding of joinery construction',
    ],
    benefits: ['In-house workshop access', 'Material library and supplier visits', 'Health cover', 'Five-day week'],
  },
  {
    ...meta('job_intern', '2026-07-15T09:00:00.000Z'),
    slug: 'architecture-intern',
    title: 'Architecture Intern',
    department: 'Design',
    location: 'Jaipur, Rajasthan',
    type: 'internship',
    experience: '0–1 years',
    salaryRange: '₹15,000 – 25,000 / month',
    openings: 4,
    postedAt: '2026-07-15T09:00:00.000Z',
    summary:
      'A six-month internship with site exposure from week one. We hire from this programme regularly.',
    responsibilities: [
      'Support concept development and 3D modelling',
      'Assist in preparing working drawings',
      'Weekly site visits and documentation',
      'Material research and sample coordination',
    ],
    requirements: [
      'Currently pursuing or recently completed B.Arch',
      'AutoCAD and SketchUp proficiency',
      'Genuine curiosity about how things get built',
    ],
    benefits: ['Paid internship', 'Site exposure from week one', 'Mentorship from senior architects', 'Strong conversion to full-time'],
  },
];

/* ==================================================================== */
/* Gallery                                                               */
/* ==================================================================== */

const galleryDefs: Array<[string, GalleryItem['kind'], GalleryItem['category'], string, string?]> = [
  ['Terrace Residence — dusk elevation', 'photo', 'residential', 'jagatpura-cover', 'prj_jagatpura'],
  ['Slim House — street facade', 'photo', 'residential', 'pratapnagar-cover', 'prj_pratapnagar'],
  ['Courtyard Villa — jali screen', 'photo', 'residential', 'mansarovar-cover', 'prj_mansarovar'],
  ['Gaushala Residence — entrance', 'photo', 'residential', 'gaushala-cover', 'prj_gaushala'],
  ['Sanganer Block — retail frontage', 'photo', 'mixed-use', 'sanganer-cover', 'prj_sanganer'],
  ['Garden House — courtyard', 'photo', 'residential', 'malviya-cover', 'prj_malviya'],
  ['Apartment interiors — living room', 'photo', 'interior', 'vaishali-1', 'prj_vaishali_interior'],
  ['Modular kitchen detail', 'photo', 'interior', 'vaishali-2', 'prj_vaishali_interior'],
  ['Corporate office — atrium', 'photo', 'commercial', 'tonk-2', 'prj_tonk_office'],
  ['Slab casting in progress', 'photo', 'process', 'process-slab'],
  ['MEPF first fix', 'photo', 'process', 'process-mepf'],
  ['Site quality inspection', 'photo', 'process', 'process-qc'],
  ['Terrace Residence — drone flyover', 'drone', 'residential', 'drone-jagatpura', 'prj_jagatpura'],
  ['Sanganer Block — drone approach', 'drone', 'mixed-use', 'drone-sanganer', 'prj_sanganer'],
  ['Tonk Road office — aerial progress', 'drone', 'commercial', 'drone-tonk', 'prj_tonk_office'],
  ['Courtyard Villa — walkthrough', 'video', 'residential', 'video-mansarovar', 'prj_mansarovar'],
  ['How we run a site', 'video', 'process', 'video-process'],
  ['Meet the team', 'video', 'team', 'video-team'],
  ['Terrace Residence — 360° living room', '360', 'residential', 'pano-jagatpura', 'prj_jagatpura'],
  ['Apartment — 360° kitchen', '360', 'interior', 'pano-vaishali', 'prj_vaishali_interior'],
];

export const gallery: GalleryItem[] = galleryDefs.map(([title, kind, category, seed, projectId], i) => ({
  ...meta(`gal_${i + 1}`, '2026-01-05T09:00:00.000Z'),
  title,
  kind,
  category,
  url: IMG.hero(seed),
  thumbnail: IMG.card(seed),
  projectId,
  duration: kind === 'video' || kind === 'drone' ? `${1 + (i % 3)}:${String(10 + i * 3).slice(0, 2)}` : undefined,
  order: i + 1,
}));

/* ==================================================================== */
/* Downloads                                                             */
/* ==================================================================== */

export const downloads: Download[] = [
  {
    ...meta('dl_profile', '2026-01-02T09:00:00.000Z'),
    title: 'Company Profile 2026',
    description: 'Our full portfolio — services, process, projects, team and commercial models.',
    category: 'profile',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    thumbnail: IMG.card('dl-profile'),
    gated: true,
    downloads: 1284,
    order: 1,
  },
  {
    ...meta('dl_brochure', '2026-01-02T09:00:00.000Z'),
    title: 'Turnkey Construction Brochure',
    description: 'What is included at each package level, with worked examples and rates.',
    category: 'brochure',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    thumbnail: IMG.card('dl-brochure'),
    gated: true,
    downloads: 962,
    order: 2,
  },
  {
    ...meta('dl_ratecard', '2026-01-02T09:00:00.000Z'),
    title: 'Rate Card 2026',
    description: 'Current per-square-foot rates for every package and service model.',
    category: 'catalogue',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '780 KB',
    thumbnail: IMG.card('dl-ratecard'),
    gated: false,
    downloads: 2140,
    order: 3,
  },
  {
    ...meta('dl_mepf', '2026-01-02T09:00:00.000Z'),
    title: 'MEPF Capability Statement',
    description: 'Scope, standards and deliverables for our MEPF consultancy practice.',
    category: 'catalogue',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '1.9 MB',
    thumbnail: IMG.card('dl-mepf'),
    gated: false,
    downloads: 511,
    order: 4,
  },
  {
    ...meta('dl_checklist', '2026-01-02T09:00:00.000Z'),
    title: 'Pre-Construction Checklist',
    description: 'Twenty-eight things to settle before you break ground. Free, no email required.',
    category: 'checklist',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '420 KB',
    thumbnail: IMG.card('dl-checklist'),
    gated: false,
    downloads: 3305,
    order: 5,
  },
  {
    ...meta('dl_vastu', '2026-01-02T09:00:00.000Z'),
    title: 'Vastu Planning Guide',
    description: 'Direction-wise placement principles, explained for people who have to live in the result.',
    category: 'checklist',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '1.1 MB',
    thumbnail: IMG.card('dl-vastu'),
    gated: false,
    downloads: 1876,
    order: 6,
  },
  {
    ...meta('dl_gst', '2026-01-02T09:00:00.000Z'),
    title: 'GST Registration Certificate',
    description: 'Statutory registration document.',
    category: 'certificate',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '180 KB',
    thumbnail: IMG.card('dl-gst'),
    gated: false,
    downloads: 122,
    order: 7,
  },
  {
    ...meta('dl_iso', '2026-01-02T09:00:00.000Z'),
    title: 'Quality Management Certificate',
    description: 'TODO(client): confirm certification details before publishing.',
    category: 'certificate',
    fileUrl: '#',
    fileType: 'PDF',
    fileSize: '210 KB',
    thumbnail: IMG.card('dl-iso'),
    gated: false,
    downloads: 89,
    order: 8,
  },
];

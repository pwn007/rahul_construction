/**
 * Split out of RealEstateView so app/(public)/services/real-estate/page.tsx can
 * read the title and summary for its metadata and JSON-LD — every export of a
 * 'use client' module is a client reference, not a value the build can read.
 */
export const REAL_ESTATE_COPY = {
  tagline: 'Find the right plot before you build on it',
  title: 'Real Estate Advisory',
  summary:
    'Plot and property sourcing, title verification, valuation and negotiation — so the land you buy is land you can actually build on.',
  description:
    'Most construction problems are bought, not built. A plot with an unclear title, a setback that kills the plan you had in mind, or a rate paid twenty percent over the locality average — all of it is decided before a single drawing is made. We look at the land first, with the same people who will later build on it.',

  stats: [
    { value: '120+', label: 'Plots evaluated' },
    { value: '7 days', label: 'Typical title check' },
    { value: 'Jaipur', label: 'Primary market' },
  ],

  deliverables: [
    'Shortlist of plots matched to your brief and budget',
    'Title and encumbrance verification report',
    'Approval and land-use status check',
    'Comparable-sale valuation for the locality',
    'Buildability note — setbacks, FAR, access, orientation',
    'Negotiation support and offer strategy',
    'Registry and stamp-duty coordination',
    'Handover pack with every document in one place',
  ],

  /*
   * `icon` must name something in the curated registry at `lib/icons.tsx` —
   * it imports ~70 icons by hand rather than pulling all ~1,500 from lucide,
   * and an unregistered name silently falls back to a plain square. The first
   * pass here used MapPin, IndianRupee, Ruler, Handshake and FileCheck, none
   * of which are registered, so five of these six rendered as blank boxes.
   * Every name below is registered, and each is a closer fit than what it
   * replaced — Stamp for stamp duty, ReceiptIndianRupee for valuation.
   */
  features: [
    { title: 'Plot sourcing', description: 'Options matched to your budget, locality and what you intend to build.', icon: 'Compass' },
    { title: 'Title verification', description: 'Ownership chain, encumbrances and litigation history checked before you commit.', icon: 'ShieldCheck' },
    { title: 'Valuation', description: 'What the locality has actually transacted at, not what the asking price says.', icon: 'ReceiptIndianRupee' },
    { title: 'Buildability review', description: 'Setbacks, ground coverage and access assessed against your brief.', icon: 'PencilRuler' },
    { title: 'Negotiation', description: 'Offer strategy and price discussion handled on your behalf.', icon: 'Users' },
    { title: 'Registry support', description: 'Stamp duty, registration and document handover coordinated end to end.', icon: 'Stamp' },
  ],

  process: [
    { step: 1, title: 'Brief and budget', description: 'What you want to build, where, and what you are willing to spend on land against construction.' },
    { step: 2, title: 'Shortlist', description: 'A handful of genuine options rather than a long list of listings.' },
    { step: 3, title: 'Due diligence', description: 'Title, approvals and encumbrance checked on the plots you are serious about.' },
    { step: 4, title: 'Valuation and offer', description: 'Comparable sales, a defensible number, and the negotiation itself.' },
    { step: 5, title: 'Registry', description: 'Documentation, stamp duty and registration through to handover.' },
  ],

  faqs: [
    {
      id: 're-1',
      question: 'Do you charge a brokerage fee?',
      answer: 'Placeholder answer. Commercial terms for this service have not been finalised — replace this before the page goes live.',
    },
    {
      id: 're-2',
      question: 'Can you check a plot I have already found?',
      answer: 'Placeholder answer. Describe the standalone due-diligence engagement here once the scope is agreed.',
    },
    {
      id: 're-3',
      question: 'Do you work outside Jaipur?',
      answer: 'Placeholder answer. Confirm the serviceable geography with the business and replace this text.',
    },
  ],
} as const;

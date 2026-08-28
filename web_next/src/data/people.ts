import type { Testimonial, TeamMember, ClientLogo } from '@/types/domain';
import { IMG, logoMark, monogram } from '@/lib/media';

const meta = (id: string, createdAt = '2025-01-15T09:00:00.000Z') => ({
  id,
  createdAt,
  updatedAt: createdAt,
  status: 'published' as const,
});

/** Verbatim from the portfolio PDF (page 13) — four real 5★ reviews, bilingual. */
export const testimonials: Testimonial[] = [
  {
    ...meta('tst_ashok'),
    name: 'Dr. Ashok Verma',
    locality: 'Mansarovar',
    rating: 5,
    language: 'hinglish',
    quote:
      'Neetu Archstone ke saath kaam karke hamara sapna sach hua. Unka technical gyan aur design ki samajh kamal ki hai. Samay par kaam pura karne ke liye unki team ki jitni tareef karein kam hai.',
    projectId: 'prj_mansarovar',
    avatar: monogram('Dr. Ashok Verma'),
    image: IMG.card('mansarovar-cover'),
    /*
     * ⚠️ PLACEHOLDER — must not go live.
     *
     * This is 24 seconds of drone b-roll over earthworks. It is here so the
     * video card can be seen working, and for no other reason.
     *
     * It is deliberately NOT footage of a person talking. Dr. Ashok Verma is a
     * real, named client; putting a stranger's talking head under his name would
     * fabricate testimony from an identifiable individual — the same objection
     * `monogram()` in lib/media.ts documents for stock faces, only worse,
     * because a video reads as evidence.
     *
     * Replace with the client's own recorded testimonial before launch, or
     * delete this line and the file at public/video/.
     */
    videoUrl: '/video/testimonial-placeholder.mp4',
    videoDuration: '0:24',
    featured: true,
    order: 1,
  },
  {
    ...meta('tst_uday'),
    name: 'Uday Singh Chauhan',
    locality: 'Mansarovar',
    rating: 5,
    language: 'hinglish',
    quote:
      'Hamein ek aise partner ki talash thi jo quality aur transparency dono ka dhyaan rakhe. Neetu Archstone ne har mod par hamara bharosa banaye rakha. Kaam ki finishing aur professionalism lajawab hai.',
    avatar: monogram('Uday Singh Chauhan'),
    image: IMG.card('jagatpura-cover'),
    /*
     * ⚠️ DEMO LINK — a guess, not a record.
     *
     * This is the one testimonial that was written without a `projectId`. Its
     * cover image is already Jagatpura's, so that is very likely what the author
     * meant — but the locality on the card reads "Mansarovar", so the two do not
     * agree and neither of them is evidence.
     *
     * It is here so the fourth card has a working link to demonstrate. Ask the
     * client which project is actually his and set it from Admin → Testimonials
     * → Linked project.
     */
    projectId: 'prj_jagatpura',
    featured: true,
    order: 2,
  },
  {
    ...meta('tst_raghuraj'),
    name: 'RaghuRaj Vijayvargiya',
    locality: 'Pratap Nagar (Gaushala)',
    rating: 5,
    language: 'hi',
    quote:
      'Neetu Archstone के साथ काम करने का सबसे बड़ा फायदा यह रहा कि पूरा प्रोजेक्ट बिल्कुल tension-free रहा। शुरुआत से लेकर completion तक टीम ने हर चीज़ को professionally handle किया। हमें किसी भी तरह की चिंता नहीं करनी पड़ी और काम समय पर और बेहतरीन क्वालिटी के साथ पूरा हुआ।',
    projectId: 'prj_gaushala',
    avatar: monogram('RaghuRaj Vijayvargiya'),
    image: IMG.card('gaushala-cover'),
    featured: true,
    order: 3,
  },
  {
    ...meta('tst_pathan'),
    name: 'Dr. A. A. Pathan',
    locality: 'Malviya Nagar',
    rating: 5,
    language: 'en',
    quote:
      'Working with Neetu Archstone was a seamless experience. Their modern design approach and attention to detail transformed our vision into reality. Highly recommended for anyone looking for innovative construction solutions.',
    projectId: 'prj_malviya',
    avatar: monogram('Dr. A. A. Pathan'),
    image: IMG.card('malviya-cover'),
    featured: true,
    order: 4,
  },
];

/**
 * Team roles are taken from the portfolio (page 23). Individual names, photos and
 * biographies are placeholders pending client confirmation.
 * TODO(client): replace names, photos and bios with real team details.
 */
export const team: TeamMember[] = [
  {
    ...meta('tm_founder'),
    name: 'Neetu Sharma',
    role: 'Founder & Principal Architect',
    department: 'leadership',
    bio: 'Leads design across every project, with a particular focus on resolving Vastu within the plan rather than around it.',
    photo: monogram('Neetu Sharma'),
    experienceYears: 14,
    expertise: ['Architectural design', 'Vastu planning', 'Client advisory'],
    order: 1,
    socials: { email: 'neetuarchstone@gmail.com' },
  },
  {
    ...meta('tm_director'),
    name: 'Rahul Verma',
    role: 'Director — Operations',
    department: 'leadership',
    bio: 'Runs delivery across all live sites and owns the commercial relationship with every client.',
    photo: monogram('Rahul Verma'),
    experienceYears: 16,
    expertise: ['Turnkey delivery', 'Commercial', 'Vendor management'],
    order: 2,
  },
  {
    ...meta('tm_civil'),
    name: 'Anand Meena',
    role: 'Head — Civil & Structural',
    department: 'engineering',
    bio: 'Responsible for structural design and every stage-wise quality gate on site.',
    photo: monogram('Anand Meena'),
    experienceYears: 12,
    expertise: ['RCC design', 'Structural detailing', 'Quality assurance'],
    order: 3,
  },
  {
    ...meta('tm_mep'),
    name: 'Farhan Qureshi',
    role: 'MEP Engineer',
    department: 'engineering',
    bio: 'Designs and supervises mechanical, electrical, plumbing and fire systems across residential and commercial work.',
    photo: monogram('Farhan Qureshi'),
    experienceYears: 10,
    expertise: ['HVAC', 'Electrical load design', 'Fire compliance'],
    order: 4,
  },
  {
    ...meta('tm_interior'),
    name: 'Shruti Agarwal',
    role: 'Head — Interior Design',
    department: 'design',
    bio: 'Takes interiors from concept through fabrication drawings to installation on site.',
    photo: monogram('Shruti Agarwal'),
    experienceYears: 9,
    expertise: ['Interior design', 'Joinery detailing', 'Material curation'],
    order: 5,
  },
  {
    ...meta('tm_site1'),
    name: 'Mahesh Jangid',
    role: 'Senior Site Engineer',
    department: 'site',
    bio: 'Runs day-to-day execution and the stage-wise quality checklist on residential sites.',
    photo: monogram('Mahesh Jangid'),
    experienceYears: 11,
    expertise: ['Site execution', 'Labour management', 'Quality checks'],
    order: 6,
  },
  {
    ...meta('tm_pm'),
    name: 'Priya Nathani',
    role: 'Project Manager',
    department: 'engineering',
    bio: 'Owns the milestone programme, weekly reporting and client communication on every live project.',
    photo: monogram('Priya Nathani'),
    experienceYears: 8,
    expertise: ['Programme control', 'Reporting', 'Client communication'],
    order: 7,
  },
  {
    ...meta('tm_support'),
    name: 'Vikas Saini',
    role: 'Client Relations & Support',
    department: 'support',
    bio: 'The first person you reach, and the one who makes sure your question does not go anywhere else.',
    photo: monogram('Vikas Saini'),
    experienceYears: 6,
    expertise: ['Client support', 'Documentation', 'Coordination'],
    order: 8,
  },
];

/** TODO(client): replace with real client/partner marks. */
export const clientLogos: ClientLogo[] = [
  { ...meta('cl_1'), name: 'UltraTech', logo: logoMark('UltraTech'), order: 1 },
  { ...meta('cl_2'), name: 'TATA TISCON', logo: logoMark('TATA TISCON'), order: 2 },
  { ...meta('cl_3'), name: 'JSW Steel', logo: logoMark('JSW Steel'), order: 3 },
  { ...meta('cl_4'), name: 'Asian Paints', logo: logoMark('Asian Paints'), order: 4 },
  { ...meta('cl_5'), name: 'Jaquar', logo: logoMark('Jaquar'), order: 5 },
  { ...meta('cl_6'), name: 'Kajaria', logo: logoMark('Kajaria'), order: 6 },
  { ...meta('cl_7'), name: 'Havells', logo: logoMark('Havells'), order: 7 },
  { ...meta('cl_8'), name: 'Hindware', logo: logoMark('Hindware'), order: 8 },
];

/**
 * Everything the MEPF page says.
 *
 * ── Three questions, and nothing else ───────────────────────────────────────
 * The page answers *what is MEPF*, *where is it in my house*, and *why do I
 * need it*. An earlier version answered a great deal more — five scrolling
 * chapters, four discipline essays, three worked project cases — and was ten
 * screens long, which meant a visitor who wanted the first answer had to go
 * looking for it. Everything below maps to one of the three questions, and
 * anything that maps to none of them does not belong in this file.
 *
 * ── Two rules every line here has to meet ───────────────────────────────────
 *
 * **1. Specific.** "Poor ventilation" persuades nobody, because nobody has ever
 * experienced "poor ventilation" — they have experienced a bedroom at 34°C. Say
 * the thing a person actually feels, with a number where there is one, and never
 * as a threat: a firm that frightens people into hiring it has already lost the
 * argument it is making.
 *
 * **2. No word anybody has to look up.** An earlier draft of this file passed
 * rule one and failed rule two badly — *heat load*, *tonnage*, *the stack
 * gurgles*, *the trap siphons dry*, *a 4 mm² run*, *chased wall*, *conduit*,
 * *occupancy certificate*. That is not a small stylistic problem. Jargon
 * measurably disrupts reading fluency *separately from* comprehension, and it
 * correlates with people resisting the argument being made — so it does not just
 * cost you understanding, it costs you the customer. Worse, readers disengage
 * **even when the term is defined right next to it**: a specialised word is read
 * as a signal that the page is not for you, and a glossary does not undo that
 * signal. So the words are gone rather than footnoted.
 *
 * Length is the other half. Difficulty climbs sharply past a twenty-word
 * sentence; everything below averages under fifteen. Plain, though — not
 * childish. Copy that has been simplified past the point of saying anything
 * reads as talking down, and an engineering firm cannot afford that either.
 *
 * "False ceiling" is the one term kept, because in India it is ordinary
 * household vocabulary rather than a trade word.
 */

/** The four disciplines, in the coordination order they occupy a ceiling void. */
export type SystemKey = 'hvac' | 'plumbing' | 'electrical' | 'fire';

export const SYSTEM_ORDER: SystemKey[] = ['hvac', 'plumbing', 'electrical', 'fire'];

export interface SystemFacts {
  /** The word a homeowner would use, not the discipline's formal name. */
  name: string;
  /** The discipline, for anyone who wants the proper term. */
  discipline: string;
  icon: string;
  /** One line: what it is. */
  what: string;
  /** One line: where it runs, in rooms rather than in engineering. */
  where: string;
  /** The decision nobody took, and what it costs. */
  without: string;
  /** Four words for the drawing's legend. */
  legend: string;
}

/**
 * The whole page, essentially.
 *
 * `where` is written in rooms on purpose — "a shaft serving the wet cores" is
 * true and useless, "the kitchen and both bathrooms" is a place somebody has
 * stood in. That column is what turns an abstract service into something a
 * visitor can point at in the drawing beside it.
 */
export const SYSTEMS: Record<SystemKey, SystemFacts> = {
  hvac: {
    name: 'Air',
    discipline: 'Mechanical · HVAC',
    icon: 'Fan',
    legend: 'Cooling & fresh air',
    what: 'Keeps your rooms cool and the air fresh.',
    where: 'Outdoor unit on the roof. Pipes above your ceiling. An AC in each room.',
    without: 'Guess the AC size, and rooms still sit at 34°C on a June afternoon. Damp then collects above the ceiling.',
  },
  plumbing: {
    name: 'Water',
    discipline: 'Plumbing',
    icon: 'Droplets',
    legend: 'Clean water & drains',
    what: 'Brings clean water in and takes dirty water out.',
    where: 'Tank on the roof. One pipe shaft down the middle. Taps in the kitchen and bathrooms.',
    without: 'Upstairs taps only trickle. Drains gurgle when someone flushes above you. And the bathroom starts to smell.',
  },
  electrical: {
    name: 'Power',
    discipline: 'Electrical',
    icon: 'Zap',
    legend: 'Power & lighting',
    what: 'Runs every light, socket and appliance in the house.',
    where: 'Meter by the door. Wires inside every wall. Switches and sockets in each room.',
    without: 'A thin wire feeding a big AC works for two summers. Then it overheats inside a wall nobody can open.',
  },
  fire: {
    name: 'Fire safety',
    discipline: 'Fire Fighting',
    icon: 'FlameKindling',
    legend: 'Alarms & a way out',
    what: 'Warns you early, and keeps a way out clear.',
    where: 'Smoke alarms on the ceilings. An extinguisher by the stairs. A clear route out.',
    without: 'No alarm above the false ceiling, which is where house fires usually start. And your completion certificate gets held up.',
  },
};

/** What MEPF stands for, said once, for the visitor who wondered. */
export const MEPF_EXPANSION = 'Mechanical, Electrical, Plumbing and Fire-fighting';

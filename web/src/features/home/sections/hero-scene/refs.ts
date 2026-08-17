/**
 * How the frame loop reaches the handful of things that move.
 *
 * The scene is ~200 filled shapes and almost all of them are furniture: walls,
 * pipes, a roof, a pair of boots. Putting that through React on every frame
 * would be absurd, so the illustration renders **once** and the loop writes
 * attributes directly to the dozen nodes that actually animate.
 *
 * A component takes `reg` and calls `ref={reg('jib')}` on whatever it wants the
 * loop to be able to find. The loop looks the key up and writes to it. No
 * prop-drilling of refs, no context, and a station file stays readable as an
 * illustration rather than as a wiring diagram.
 */
export type Reg = (key: string) => (el: SVGGraphicsElement | null) => void;

/** Keys the frame loop writes to. Listed so a typo is a compile error. */
export type MoverKey =
  | 'jib'
  | 'trolley'
  | 'hook'
  | 'load'
  | 'cloud0'
  | 'cloud1'
  | 'cloud2'
  | 'plan0'
  | 'plan1'
  | 'plan2'
  | 'plan3'
  | 'glow0'
  | 'glow1'
  | 'glow2'
  | 'gravel'
  | 'glint'
  | 'back'
  | 'mid'
  | 'front';

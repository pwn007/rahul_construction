'use client';

import { Person, POSES } from './Person';
import { CYAN, GLOW, NAVY, PAPER, SAND } from './palette';
import type { Reg } from './refs';

/**
 * The narrow scene: the same site, authored down.
 *
 *   690 × 300. Far ground y = 236, near ground y = 282.
 *
 *   A · WE DESIGN    101 wide, centred 115   board and one architect
 *   B · WE BUILD     199 wide, centred 345   wall + mason, frame, crane, tipper
 *   C · WE DELIVER   191 wide, centred 575   the home, the family, the keys
 *
 * As on the wide scene, each station is authored around its own origin and moved
 * into place by a `translate` on its group — see `SHIFT`.
 *
 * ── What a third of a phone costs ───────────────────────────────────────────
 * All three stations stay on screen, because a story readable at a glance is the
 * entire reason for laying it out horizontally. At 390px that leaves each about
 * 130px, and a budget that tight is spent by removing objects rather than by
 * shrinking them, so this is authored, not scaled:
 *
 *   · Two storeys on the frame instead of three, and a shorter crane.
 *   · No pipe stack, no stretcher under the board, half the secondary lines.
 *   · No tree, no brick stack, no mortar tub.
 *   · Five figures rather than eight.
 *
 * ── Why it is 690 wide and not 600 ──────────────────────────────────────────
 * Station centres are pinned to 1/6, 1/2 and 5/6, so the gap between neighbours
 * is forced to `W/3 − (w₁+w₂)/2`. At 600 the stations left gaps of 13 and 9
 * units and the three of them read as one continuous strip with three captions
 * floating under it. Trimming what was left to trim and widening to 690 opens
 * those to 80 and 36. It costs about 13% of scale on a phone, which is the
 * binding constraint here: DELIVER cannot shrink further without pulling the
 * architect inside the family's reach.
 *
 * ── What survives every cut ─────────────────────────────────────────────────
 * The blueprint board, the crane, the hi-vis vests, the lit windows and the key.
 * Those five carry design, build and deliver on their own.
 */

/** Where each station sits. Authored positions are unchanged from 600 wide. */
const SHIFT = { design: 7.5, build: 82.5, deliver: 78.5 } as const;

export function SceneNarrow({ reg }: { reg: Reg }) {
  return (
    <>
      <g ref={reg('back')}>
        <g fill={PAPER} opacity={0.75}>
          <g ref={reg('cloud0')}>
            <ellipse cx={120} cy={48} rx={30} ry={12} />
            <ellipse cx={100} cy={53} rx={20} ry={9} />
          </g>
          <g ref={reg('cloud1')}>
            <ellipse cx={410} cy={36} rx={26} ry={10} />
          </g>
          <g ref={reg('cloud2')}>
            <ellipse cx={540} cy={62} rx={32} ry={12} />
          </g>
        </g>
        <g fill={NAVY[200]} opacity={0.45}>
          <rect x={16} y={172} width={30} height={64} />
          <rect x={52} y={152} width={24} height={84} />
          <rect x={470} y={166} width={28} height={70} />
          <rect x={648} y={158} width={26} height={78} />
        </g>
      </g>

      <g ref={reg('mid')}>
                <g transform={`translate(${SHIFT.build} 0)`}>
  {/* ── B · the frame. Two storeys, permanently unfinished. ────────── */}
          <g>
            <rect x={204} y={230} width={118} height={8} fill={NAVY[800]} />
            <rect x={200} y={182} width={126} height={7} fill={NAVY[700]} />
            <rect x={200} y={134} width={126} height={7} fill={NAVY[700]} />
            <rect x={208} y={134} width={9} height={98} fill={NAVY[800]} />
            <rect x={258} y={134} width={9} height={98} fill={NAVY[800]} />
            <rect x={310} y={134} width={9} height={98} fill={NAVY[800]} />
            <g fill={CYAN[300]} opacity={0.5}>
              <rect x={219} y={192} width={38} height={36} />
              <rect x={268} y={192} width={41} height={36} />
            </g>
          </g>

          {/* ── The crane. Working jib left, out over the frame. ───────────── */}
          <rect x={340} y={54} width={9} height={182} fill={CYAN[600]} />
          <rect x={330} y={232} width={29} height={5} fill={NAVY[700]} />
          <g ref={reg('jib')}>
            <rect x={258} y={50} width={148} height={8} fill={CYAN[600]} />
            <rect x={340} y={26} width={9} height={26} fill={CYAN[600]} />
            <path d="M344 26 L266 50 L280 50 L344 34 Z" fill={CYAN[600]} opacity={0.8} />
            <path d="M344 26 L400 50 L390 50 L344 34 Z" fill={CYAN[600]} opacity={0.8} />
            <rect x={384} y={44} width={20} height={16} rx={2} fill={NAVY[700]} />
            <g ref={reg('trolley')}>
              <rect x={-7} y={53} width={14} height={7} rx={2} fill={NAVY[700]} />
              <rect x={-1} y={58} width={2} height={30} fill={NAVY[700]} />
              <g ref={reg('hook')}>
                <rect x={-12} y={0} width={24} height={14} rx={2} fill={SAND[500]} />
                <rect x={-12} y={0} width={24} height={4} fill={SAND[400]} />
              </g>
            </g>
          </g>
        </g>

                <g transform={`translate(${SHIFT.deliver} 0)`}>
  {/* ── C · the delivered home ─────────────────────────────────────── */}
          <g>
            {/* Twenty units wider than it was, and the door pushed to the far
                right of the facade. Both are to make room: a family of three plus
                the architect handing the keys over needs frontage that the
                original 112-unit house simply did not have. */}
            <rect x={452} y={148} width={132} height={88} fill={SAND[200]} />
            <rect x={562} y={148} width={22} height={88} fill={SAND[300]} />
            <rect x={444} y={138} width={148} height={11} rx={2} fill={NAVY[700]} />
            <rect x={526} y={118} width={22} height={14} rx={2} fill={CYAN[600]} />
            <rect x={532} y={132} width={3} height={7} fill={NAVY[600]} />
            <rect x={540} y={132} width={3} height={7} fill={NAVY[600]} />
            <rect x={452} y={190} width={132} height={5} fill={SAND[300]} />

            <rect ref={reg('glow0')} x={466} y={160} width={30} height={26} fill={GLOW} />
            <rect ref={reg('glow1')} x={518} y={160} width={30} height={26} fill={GLOW} />
            <rect ref={reg('glow2')} x={466} y={202} width={30} height={26} fill={GLOW} />
            <g fill="none" stroke={NAVY[700]} strokeWidth={3.5}>
              <rect x={466} y={160} width={30} height={26} />
              <rect x={518} y={160} width={30} height={26} />
              <rect x={466} y={202} width={30} height={26} />
            </g>
            {/* Door at the far right, clear of the family standing in front. */}
            <rect x={548} y={200} width={28} height={36} rx={2} fill={CYAN[600]} />
          </g>
        </g>

      </g>

      {/* Runs well past the viewBox on both sides so the horizon still reaches
          the frame edges when `meet` letterboxes the drawing — an SVG clips to
          its element box, not to its viewBox. */}
      <rect x={-500} y={236} width={1600} height={64} fill={SAND[300]} />
      <rect x={-500} y={236} width={1600} height={4} fill={SAND[400]} />

      {/* Grouped by station and shifted with them. */}
      <g fill={SAND[500]} opacity={0.28}>
        {(
          [
            ['design', [[66, 18]]],
            ['build', [[174, 18]]],
            ['deliver', [[412, 18], [488, 18], [508, 11], [528, 18]]],
          ] as const
        ).map(([station, feet]) => (
          <g key={station} transform={`translate(${SHIFT[station]} 0)`}>
            {feet.map(([cx, rx]) => (
              <ellipse key={cx} cx={cx} cy={283} rx={rx} ry={3.5} />
            ))}
          </g>
        ))}
      </g>

      <g ref={reg('front')}>
                <g transform={`translate(${SHIFT.design} 0)`}>
  {/* ── A · the board. Face on, on straight legs — never a tilted
                 quadrilateral, which is what read as a slingshot. ──────────── */}
          <g>
            <rect x={80} y={240} width={8} height={42} fill={SAND[500]} />
            <rect x={142} y={240} width={8} height={42} fill={SAND[500]} />
            <rect x={80} y={258} width={70} height={6} fill={SAND[500]} />
            <rect x={72} y={168} width={86} height={76} rx={3} fill={NAVY[800]} />
            <rect x={76} y={172} width={78} height={68} fill={CYAN[700]} />
            <g fill="none" stroke={PAPER} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={1}>
              <rect ref={reg('plan0')} x={85} y={184} width={60} height={40} />
              <path ref={reg('plan1')} d="M85 206 H145" />
              <path ref={reg('plan2')} d="M112 224 V206" />
              <path ref={reg('plan3')} d="M94 224 a9 9 0 0 1 9 -9" />
            </g>
          </g>

          <Person x={66} y={282} scale={0.95} role="architect" pose={POSES.point} skin={1} />
        </g>

                <g transform={`translate(${SHIFT.build} 0)`}>
  {/* ── B · the bricklaying ──────────────────────────────────────────
              Both the wall and the tipper survive the cut here, because between
              them they now *are* the station: one person putting material in
              place and one delivery arriving say "work is happening" far more
              directly than the frame alone ever did. The foreground worker who
              used to stand at 234 with a clipboard is the mason now — a third
              body would not fit in front of the frame at this width.

              Top course short on the side he is standing, so his trowel lands in
              the gap. */}
          <g>
            <rect x={188} y={248} width={46} height={34} fill={NAVY[700]} />
            {[0, 1, 2].map((row) => {
              const y = 272 - row * 8;
              const offset = row % 2 === 0 ? 0 : -5.5;
              return [0, 1, 2, 3].map((col) => {
                const x = 189 + offset + col * 11.5;
                if (x < 188 || x + 10.5 > 234) return null;
                if (row === 2 && x < 204) return null;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={x}
                    y={y}
                    width={10.5}
                    height={7}
                    fill={(row + col) % 2 === 0 ? SAND[500] : SAND[400]}
                  />
                );
              });
            })}
          </g>
          {/* ── B · the tipper, unloading ────────────────────────────────────
              Body permanently raised — see the note in `SceneWide.tsx` for why it
              never tips down. */}
          <g>
            <path d="M238 282 Q260 258 282 282 Z" fill={SAND[500]} />
            <path d="M248 282 Q260 268 272 282 Z" fill={SAND[400]} />

            <rect x={270} y={252} width={90} height={8} rx={2} fill={NAVY[800]} />
            <path d="M273 252 L332 233 L326 212 L267 231 Z" fill={NAVY[600]} />
            <path d="M273 252 L332 233 L329 225 L270 244 Z" fill={NAVY[700]} />
            <path d="M267 231 L252 245 L256 250 L272 236 Z" fill={NAVY[700]} />

            <clipPath id="na-gravel-clip-n">
              <path d="M254 236 L272 228 L284 262 L250 267 Z" />
            </clipPath>
            <g clipPath="url(#na-gravel-clip-n)">
              <g ref={reg('gravel')} fill={SAND[500]}>
                {/* The repeat starts at −1, one whole spacing *above* the clip.
                    Without it the first frame after each wrap has nothing at the
                    top of the fall: the i=0 group has just travelled 14 units
                    down and there is nobody behind it. One extra group off-screen
                    is what makes "travel equals spacing" actually seamless. */}
                {[-1, 0, 1, 2, 3, 4].map((i) => (
                  <g key={i} transform={`translate(0 ${i * 14})`}>
                    <circle cx={260} cy={231} r={2.6} />
                    <circle cx={266} cy={235} r={2} />
                    <circle cx={257} cy={237} r={1.7} />
                  </g>
                ))}
              </g>
            </g>

            <path d="M334 252 V222 q0 -4 4 -4 h20 q4 0 4 4 v30 Z" fill={CYAN[600]} />
            <rect x={338} y={224} width={19} height={13} rx={1.5} fill={CYAN[100]} opacity={0.85} />

            {[286, 308, 348].map((cx) => (
              <g key={cx}>
                <circle cx={cx} cy={269} r={12} fill={NAVY[900]} />
                <circle cx={cx} cy={269} r={5.4} fill={SAND[300]} />
              </g>
            ))}
          </g>

          <Person x={174} y={282} scale={0.95} role="worker" pose={POSES.lay} prop="trowel" skin={2} />
          <Person x={264} y={189} scale={0.55} role="worker" pose={POSES.hammer} prop="hammer" skin={0} face={false} />
        </g>

                <g transform={`translate(${SHIFT.deliver} 0)`}>
  <g ref={reg('glint')}>
            <path d="M455 232 l3.5 -9 l3.5 9 l9 3.5 l-9 3.5 l-3.5 9 l-3.5 -9 l-9 -3.5 Z" fill={GLOW} opacity={0} />
          </g>
          <Person x={412} y={282} scale={0.95} role="architect" pose={POSES.offer} prop="key" skin={0} />
          <Person
            x={488}
            y={282}
            facing={-1}
            scale={0.95}
            role="client"
            pose={POSES.receive}
            top={CYAN[500]}
            skin={1}
          />
          <Person
            x={528}
            y={282}
            facing={-1}
            scale={0.95}
            role="client"
            pose={POSES.pleased}
            hair="long"
            top={NAVY[400]}
            skin={2}
          />
          {/* Last, so the child overlaps both parents — see the note in
              `SceneWide.tsx` for why that overlap is doing the work. */}
          <Person
            x={508}
            y={282}
            facing={-1}
            scale={0.55}
            role="client"
            pose={POSES.wave}
            top={CYAN[300]}
            skin={1}
          />
        </g>

      </g>
    </>
  );
}

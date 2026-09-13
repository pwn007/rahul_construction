'use client';

import { MARK_BBOX, MARK_PATH } from '@/components/common/Logo';
import { Person, POSES } from './Person';
import { BAND, CYAN, GLOW, NAVY, PAPER, SAND } from './palette';
import type { Reg } from './refs';

/**
 * The wide scene: one construction site, read left to right.
 *
 *   1260 × 420. Far ground (buildings stand here)  y = 340
 *               Near ground (foreground people)    y = 400
 *
 * ── Why two ground lines ────────────────────────────────────────────────────
 * This is the whole depth trick. Buildings sit on the far line at ~0.7 scale;
 * the people stand 60 units lower at full scale, and are drawn last so they
 * overlap the site behind them. That single offset is the difference between a
 * picture of a place and a diagram of one.
 *
 * ── The three stations, and the gaps between them ───────────────────────────
 *   A · WE DESIGN    221 wide, centred 210    board, blueprint, two architects
 *   B · WE BUILD     399 wide, centred 630    wall + mason, frame, crane, tipper
 *   C · WE DELIVER   282 wide, centred 1081   home, tree, family, the keys
 *
 * Each is authored around its own local origin and then moved into place by a
 * `translate` on its group — see `SHIFT` below. Nothing here is positioned by
 * absolute coordinate.
 *
 * Those centres are 1/6, 1/2 and 5/6 of the width because the caption row under
 * the scene is an equal three-column grid. That pins the distance between
 * neighbouring centres at `W/3`, which in turn *forces* the gap between two
 * stations:
 *
 *     gap = W/3 − (w₁ + w₂)/2
 *
 * So the gaps are not a free parameter — the only way to widen them is to make
 * stations narrower or the drawing wider, and the drawing renders at
 * `screenWidth / W`, so widening costs size. At 1200 units the stations were
 * 241/443/290 and the gaps came out at 46 and 28, which was the ceiling for
 * those widths and read as one continuous mass rather than three steps. Trimming
 * ~90 units and widening to 1260 opens them to 110 and 82 for ~5% of scale.
 *
 * ── Why DELIVER is not on 5/6 ───────────────────────────────────────────────
 * The other two sit on their thirds; this one is pushed 31 units past its, which
 * takes the bare ground right of the house from 72 units down to 38. That margin
 * is otherwise fixed — `W/6 − w_C/2` — so with the caption row locked to equal
 * thirds there was no way to reach it: moving the station left its caption
 * behind, widening the station ate the gap behind it, and narrowing the whole
 * drawing collapsed both gaps. The caption now follows the station instead (see
 * `--hero-step-3` in `Hero.tsx`), and the payoff is that the two gaps come out at
 * 110 and 110.5 — even, which is why 90 and not more.
 *
 * ── About the board at station A ────────────────────────────────────────────
 * It is a rectangle, face on, on two straight vertical legs. An earlier version
 * drew it as a tilted quadrilateral on splayed legs and it was read — correctly
 * — as a slingshot. A shape that has to be interpreted has already failed.
 */

/**
 * Where each station sits. Authored positions are unchanged from when the scene
 * was 1200 wide; these move the whole group, so a station can be recentred
 * without touching a single shape inside it.
 */
const SHIFT = { design: 5.5, build: 59.5, deliver: 90 } as const;

export function SceneWide({ reg }: { reg: Reg }) {
  return (
    <>
      {/* ══ BACKGROUND ═════════════════════════════════════════════════════
          Low contrast on purpose. It is atmosphere and distance; the moment it
          competes for attention the foreground stops reading as foreground. */}
      <g ref={reg('back')}>
        {/* Clouds — the slowest thing in the hero at 90s, which is the point:
            movement you notice only if you have been here a while. */}
        <g fill={PAPER} opacity={0.75}>
          <g ref={reg('cloud0')}>
            <ellipse cx={210} cy={74} rx={44} ry={17} />
            <ellipse cx={182} cy={80} rx={30} ry={13} />
            <ellipse cx={244} cy={82} rx={26} ry={12} />
          </g>
          <g ref={reg('cloud1')}>
            <ellipse cx={690} cy={50} rx={38} ry={14} />
            <ellipse cx={664} cy={56} rx={26} ry={11} />
          </g>
          <g ref={reg('cloud2')}>
            <ellipse cx={1010} cy={92} rx={50} ry={18} />
            <ellipse cx={1052} cy={98} rx={30} ry={13} />
          </g>
        </g>

        {/* Distant city. Flat blocks, one value, no detail — a skyline reads
            from its silhouette and gains nothing from windows at this size. */}
        {/* The outermost blocks sit past the viewBox on both sides on purpose.
            When the scene is height-capped it letterboxes, and those side bands
            were bare sky while the ground band below them already ran edge to
            edge — which is a good part of what read as empty space out here. An
            SVG clips to its element box rather than its viewBox, so geometry
            outside the viewBox still paints into them. */}
        <g fill={NAVY[200]} opacity={0.45}>
          <rect x={-160} y={236} width={58} height={104} />
          <rect x={-84} y={268} width={44} height={72} />
          <rect x={40} y={246} width={54} height={94} />
          <rect x={104} y={214} width={40} height={126} />
          <rect x={152} y={262} width={64} height={78} />
          <rect x={286} y={230} width={46} height={110} />
          <rect x={342} y={268} width={58} height={72} />
          <rect x={846} y={238} width={50} height={102} />
          <rect x={1136} y={222} width={44} height={118} />
          <rect x={1096} y={266} width={34} height={74} />
          <rect x={1252} y={252} width={52} height={88} />
          <rect x={1322} y={228} width={40} height={112} />
          <rect x={1378} y={264} width={56} height={76} />
        </g>
        {/* Two distant tower cranes, paler still. Depth cue and category cue in
            the same four rectangles. */}
        <g fill={NAVY[200]} opacity={0.34}>
          <rect x={126} y={168} width={5} height={172} />
          <rect x={78} y={166} width={116} height={5} />
          <rect x={124} y={150} width={5} height={20} />
          <rect x={1156} y={186} width={5} height={154} />
          <rect x={1112} y={184} width={100} height={5} />
        </g>
      </g>

      {/* ══ MIDGROUND ══════════════════════════════════════════════════════ */}
      <g ref={reg('mid')}>
                <g transform={`translate(${SHIFT.build} 0)`}> {/* scaffold, frame, crane */}
  {/* ── B · the site ─────────────────────────────────────────────── */}

          {/* The pipe stack that used to sit here is gone, and so is the brick
              pallet that stood at 752. Both were "materials" scenery, and the
              bricklaying and the tipper's gravel now say the same thing while
              also showing somebody doing something with it. */}

          {/* Scaffold against the left face. */}
          <g fill={NAVY[400]}>
            <rect x={500} y={150} width={5} height={190} />
            <rect x={514} y={150} width={5} height={190} />
            <rect x={500} y={264} width={24} height={4} />
            <rect x={500} y={196} width={24} height={4} />
            <rect x={500} y={150} width={24} height={4} />
          </g>

          {/* The frame. Three storeys, and permanently unfinished — the top floor
              has no glazing and never gets any, because this station's job is to
              *be* the building phase rather than to pass through it. */}
          <g>
            <rect x={519} y={332} width={212} height={10} fill={NAVY[800]} />
            {/* Slabs */}
            <rect x={513} y={264} width={224} height={9} fill={NAVY[700]} />
            <rect x={513} y={198} width={224} height={9} fill={NAVY[700]} />
            <rect x={513} y={132} width={224} height={9} fill={NAVY[700]} />
            {/* Columns */}
            <rect x={525} y={132} width={11} height={200} fill={NAVY[800]} />
            <rect x={619} y={132} width={11} height={200} fill={NAVY[800]} />
            <rect x={714} y={132} width={11} height={200} fill={NAVY[800]} />
            {/* Glazing on the finished storeys only. */}
            <g fill={CYAN[300]} opacity={0.5}>
              <rect x={539} y={278} width={76} height={50} />
              <rect x={633} y={278} width={78} height={50} />
              <rect x={539} y={212} width={76} height={50} />
              <rect x={633} y={212} width={78} height={50} />
            </g>
            <g fill={CYAN[500]} opacity={0.35}>
              <rect x={539} y={278} width={76} height={12} />
              <rect x={633} y={278} width={78} height={12} />
            </g>
          </g>

          {/* ── The tower crane ──────────────────────────────────────────────
              Asymmetric, as a real one is: a long working jib reaching left over
              the frame, a short counter-jib with the counterweight to the right.
              A symmetrical jib under a low apex reads as an umbrella. */}
          <rect x={757} y={70} width={11} height={270} fill={CYAN[600]} />
          <rect x={745} y={336} width={35} height={6} fill={NAVY[700]} />
          <g ref={reg('jib')}>
            <rect x={636} y={66} width={218} height={9} fill={CYAN[600]} />
            <rect x={757} y={34} width={11} height={34} fill={CYAN[600]} />
            <path d="M762 34 L646 66 L662 66 L762 43 Z" fill={CYAN[600]} opacity={0.8} />
            <path d="M762 34 L846 66 L832 66 L762 43 Z" fill={CYAN[600]} opacity={0.8} />
            <rect x={826} y={58} width={28} height={22} rx={2} fill={NAVY[700]} />
            <g ref={reg('trolley')}>
              <rect x={-9} y={70} width={18} height={8} rx={2} fill={NAVY[700]} />
              <rect x={-1} y={76} width={2} height={40} fill={NAVY[700]} />
              <g ref={reg('hook')}>
                <rect x={-16} y={0} width={32} height={18} rx={2} fill={SAND[500]} />
                <rect x={-16} y={0} width={32} height={5} fill={SAND[400]} />
              </g>
            </g>
          </g>
        </g>

                <g transform={`translate(${SHIFT.deliver} 0)`}>
  {/* ── C · the delivered home ───────────────────────────────────────
              Cream walls, a navy roof, a cyan door and warm windows. It is the
              only building in the scene with light in it, which is what makes it
              read as finished rather than merely as another block. */}
          <g>
            {/* Tree, left of the house, balancing the group against its mass. */}
            <rect x={878} y={294} width={11} height={46} fill={SAND[500]} />
            {/* A stylised teal tree. The brand has no green, and inventing one
                for a single object would be a fifth colour for no message; a
                deep cyan canopy is a long-standing flat-illustration convention
                and stays inside the palette. It needs to be *solid* — at half
                opacity it read as a cloud that had landed. */}
            <g fill={CYAN[700]} opacity={0.85}>
              <circle cx={884} cy={284} r={25} />
              <circle cx={884} cy={258} r={19} />
              <circle cx={866} cy={272} r={16} />
              <circle cx={902} cy={272} r={16} />
            </g>

            <rect x={900} y={196} width={220} height={144} fill={SAND[200]} />
            <rect x={1082} y={196} width={38} height={144} fill={SAND[300]} />
            <rect x={888} y={182} width={244} height={15} rx={2} fill={NAVY[700]} />
            <rect x={900} y={166} width={16} height={17} fill={NAVY[600]} />
            <rect x={1104} y={166} width={16} height={17} fill={NAVY[600]} />
            <rect x={900} y={166} width={220} height={6} fill={NAVY[600]} opacity={0.45} />
            {/* Water tank on the roof — small, and very specifically residential
                here rather than anywhere else. */}
            <rect x={1032} y={150} width={34} height={20} rx={3} fill={CYAN[600]} />
            <rect x={1038} y={170} width={4} height={12} fill={NAVY[600]} />
            <rect x={1056} y={170} width={4} height={12} fill={NAVY[600]} />

            <rect x={900} y={264} width={220} height={7} fill={SAND[300]} />

            {/* Lit windows. */}
            <g>
              <rect ref={reg('glow0')} x={926} y={212} width={48} height={40} fill={GLOW} />
              <rect ref={reg('glow1')} x={1024} y={212} width={48} height={40} fill={GLOW} />
              <rect ref={reg('glow2')} x={926} y={286} width={48} height={40} fill={GLOW} />
            </g>
            <g fill="none" stroke={NAVY[700]} strokeWidth={4}>
              <rect x={926} y={212} width={48} height={40} />
              <rect x={1024} y={212} width={48} height={40} />
              <rect x={926} y={286} width={48} height={40} />
            </g>
            <g fill={NAVY[700]}>
              <rect x={948} y={212} width={4} height={40} />
              <rect x={1046} y={212} width={4} height={40} />
              <rect x={948} y={286} width={4} height={40} />
            </g>

            {/* Door, on the half of the facade the handover does not occupy. */}
            <rect x={1060} y={282} width={46} height={58} rx={3} fill={CYAN[600]} />
            <circle cx={1098} cy={312} r={3} fill={SAND[300]} />

            {/* The mark, over the door — the same path and ink box as `LogoMark`,
                so a brand change reaches the scene with it. Move the ink box to
                the origin, scale to 30 units tall, then place; scaling by the
                kit's 1000-unit artboard instead would shrink the sign to a dot. */}
            <g transform={`translate(1068 236) scale(${30 / MARK_BBOX.h}) translate(${-MARK_BBOX.x} ${-MARK_BBOX.y})`}>
              <path d={MARK_PATH} fill={CYAN[500]} />
            </g>
          </g>
        </g>

      </g>

      {/* ══ GROUND ═════════════════════════════════════════════════════════
          One band, with a darker lip at the far edge. The lip is what reads as
          a horizon; without it the ground and the sky merely meet.

          Both rects run far past the viewBox on each side, and that is not
          slack — it is what makes letterboxing invisible. An SVG clips to its
          *element* box rather than to its viewBox, so once the scene's height is
          capped and `meet` starts centring the drawing inside a wider container,
          this band keeps running edge to edge instead of stopping at a seam. */}
      <rect x={-900} y={340} width={3000} height={80} fill={SAND[300]} />
      <rect x={-900} y={340} width={3000} height={5} fill={SAND[400]} />
      <g fill={SAND[400]} opacity={0.7}>
        <ellipse cx={330} cy={376} rx={26} ry={5} />
        <ellipse cx={810} cy={366} rx={20} ry={4} />
        <ellipse cx={1150} cy={390} rx={30} ry={5} />
      </g>

      {/* A hairline of shadow under every foreground figure, so they stand on
          the ground rather than float above it. Drawn *before* them — after,
          and each one is an oil slick across a pair of boots — and multiplied
          down to almost nothing, because at full strength it reads as a
          puddle rather than as contact. */}
      {/* Grouped by station and shifted with them, rather than carrying eight
          hand-shifted x values that would drift out of step the next time a
          station moves. */}
      <g fill={SAND[500]} opacity={0.28}>
        {(
          [
            ['design', [[105, 22], [302, 22]]],
            ['build', [[382, 22], [532, 22]]],
            ['deliver', [[906, 22], [984, 22], [1012, 14], [1038, 22]]],
          ] as const
        ).map(([station, feet]) => (
          <g key={station} transform={`translate(${SHIFT[station]} 0)`}>
            {feet.map(([cx, rx]) => (
              <ellipse key={cx} cx={cx} cy={401} rx={rx} ry={4} />
            ))}
          </g>
        ))}
      </g>

      {/* ══ FOREGROUND ═════════════════════════════════════════════════════
          Everything here stands on y=400 at full scale and is drawn last, so it
          sits in front of the site rather than beside it. */}
      <g ref={reg('front')}>
                <g transform={`translate(${SHIFT.design} 0)`}>
  {/* ── A · the drawing board ────────────────────────────────────────
              Face on, on two straight legs. See the note at the top of this file
              for why that is not negotiable. */}
          <g>
            {/* The board top sits at y=260, not 236, and the 24 units that buys
                are not spare. On a 1280×720 laptop the scene is 62% of the
                viewport, which brought the board's top corner up into the
                Devanagari line; dropping it clears the copy at every size without
                a scrim, and a scrim was the wrong tool anyway — paper-coloured
                gradient over pale sky reads as a patch. */}
            <rect x={142} y={348} width={11} height={52} fill={SAND[500]} />
            <rect x={257} y={348} width={11} height={52} fill={SAND[500]} />
            <rect x={142} y={370} width={126} height={8} fill={SAND[500]} />
            <rect x={130} y={258} width={150} height={94} rx={4} fill={NAVY[800]} />
            <rect x={136} y={264} width={138} height={82} fill={CYAN[700]} />
            {/* The plan on the sheet: white on blue, which is what a blueprint
                looks like and therefore what one is recognised as. */}
            <g
              fill="none"
              stroke={PAPER}
              strokeWidth={2.4}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
            >
              <rect ref={reg('plan0')} x={152} y={276} width={106} height={52} />
              <path ref={reg('plan1')} d="M152 304 H258" />
              <path ref={reg('plan2')} d="M196 328 V304" />
              <path ref={reg('plan3')} d="M170 328 a13 13 0 0 1 13 -13" />
            </g>
            <rect x={152} y={336} width={106} height={2.4} fill={PAPER} opacity={0.5} />
          </g>

          {/* Two architects at the board: one indicating it, one with the file. */}
          <Person x={105} y={400} role="architect" pose={POSES.point} skin={1} />
          <Person x={302} y={400} facing={-1} role="architect" pose={POSES.hold} prop="clipboard" skin={0} />
        </g>

                <g transform={`translate(${SHIFT.build} 0)`}>
  {/* ── B · the bricklaying ──────────────────────────────────────────
              A wall built to chest height with its **top course two bricks
              short**. That gap is the entire point: a finished wall is a wall,
              and only an unfinished one is construction.

              The bricks sit on a dark ground and are inset from each other, so
              what shows between them reads as mortar. Without that the sand
              bricks would sit on the sand ground at almost no contrast and the
              whole thing would flatten into a beige slab. */}
          <g>
            <rect x={402} y={344} width={70} height={56} fill={NAVY[700]} />
            {[0, 1, 2, 3, 4].map((row) => {
              const y = 388 - row * 11;
              // Alternate courses start half a brick over — the stagger is what
              // makes a grid of rectangles read as bonded brickwork.
              const offset = row % 2 === 0 ? 0 : -8.5;
              return [0, 1, 2, 3, 4].map((col) => {
                const x = 403.5 + offset + col * 17;
                if (x < 402 || x + 15.5 > 472) return null;
                // The top course stops short *on the side he is standing*, so his
                // trowel hand lands in the gap. Short on the far side instead and
                // he reads as working on finished brickwork.
                if (row === 4 && x < 426) return null;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={x}
                    y={y}
                    width={15.5}
                    height={9.5}
                    fill={(row + col) % 2 === 0 ? SAND[500] : SAND[400]}
                  />
                );
              });
            })}
          </g>

          {/* His stack and his mortar tub. */}
          <g>
            <rect x={478} y={378} width={30} height={8} fill={SAND[500]} />
            <rect x={478} y={370} width={30} height={7} fill={SAND[400]} />
            <rect x={478} y={362} width={30} height={7} fill={SAND[500]} />
            <path d="M478 400 L482 388 H506 L510 400 Z" fill={NAVY[400]} />
            <rect x={481} y={388} width={26} height={4} fill={NAVY[200]} />
          </g>

          {/* ── B · the tipper, unloading ────────────────────────────────────
              Cab at the right, body hinged at its rear-bottom and permanently
              raised, tailgate open, gravel running out to a heap on the left —
              toward the building it is delivering to, which also keeps its mass
              away from DELIVER.

              The body never moves. Tipping it up and down on a cycle was the
              obvious idea and is the wrong one: for half of every cycle the truck
              would not be unloading, and every station here is a permanent state
              so that nothing can be missed. The motion is the material instead. */}
          <g>
            {/* Heap first, so the tailgate and the falling gravel land on top. */}
            <path d="M560 400 Q594 362 628 400 Z" fill={SAND[500]} />
            <path d="M574 400 Q594 376 614 400 Z" fill={SAND[400]} />

            <rect x={604} y={356} width={166} height={11} rx={2} fill={NAVY[800]} />
            {/* Raised body: hinged at the rear-bottom, front lifted ~18°. */}
            <path d="M608 356 L724 320 L713 286 L597 322 Z" fill={NAVY[600]} />
            <path d="M608 356 L724 320 L720 308 L604 344 Z" fill={NAVY[700]} />
            {/* Tailgate, swung down and open. */}
            <path d="M597 322 L574 344 L580 351 L604 329 Z" fill={NAVY[700]} />
            {/* Hydraulic ram between chassis and body. */}
            <rect x={650} y={330} width={5} height={28} rx={2.5} fill={NAVY[400]} transform="rotate(-16 652 344)" />

            {/* Gravel, running out of the open tail. Clipped so it appears at the
                tailgate and disappears into the heap. */}
            <clipPath id="na-gravel-clip">
              <path d="M578 330 L606 318 L624 372 L572 380 Z" />
            </clipPath>
            <g clipPath="url(#na-gravel-clip)">
              <g ref={reg('gravel')} fill={SAND[500]}>
                {/* The repeat starts at −1, one whole spacing *above* the clip.
                    Without it the first frame after each wrap has nothing at the
                    top of the fall: the i=0 group has just travelled 14 units
                    down and there is nobody behind it. One extra group off-screen
                    is what makes "travel equals spacing" actually seamless. */}
                {[-1, 0, 1, 2, 3, 4].map((i) => (
                  <g key={i} transform={`translate(0 ${i * 14})`}>
                    <circle cx={588} cy={324} r={3.4} />
                    <circle cx={597} cy={330} r={2.6} />
                    <circle cx={583} cy={333} r={2.2} />
                  </g>
                ))}
              </g>
            </g>

            {/* Cab. Same cyan as the crane, so the plant reads as one firm's
                fleet rather than as hired-in odds and ends. */}
            <path d="M726 356 V308 q0 -6 6 -6 h32 q6 0 6 6 v48 Z" fill={CYAN[600]} />
            <rect x={732} y={312} width={30} height={20} rx={2} fill={CYAN[100]} opacity={0.85} />
            <rect x={726} y={340} width={44} height={5} fill={NAVY[800]} opacity={0.25} />

            {/* Wheels: one front, a rear pair. */}
            {[
              [632, 18],
              [670, 18],
              [748, 18],
            ].map(([cx, r]) => (
              <g key={cx}>
                <circle cx={cx} cy={382} r={r} fill={NAVY[900]} />
                <circle cx={cx} cy={382} r={r! * 0.45} fill={SAND[300]} />
              </g>
            ))}
          </g>

          {/* ── B · the crew ─────────────────────────────────────────────────
              One on the first slab, the mason at his wall, and the foreman on the
              ground between them. The worker who used to stand pointing on the
              right has gone: the truck parks where he stood, and five people at
              one station would have swamped DESIGN and DELIVER either side. */}
          <Person x={563} y={273} scale={0.62} role="worker" pose={POSES.hammer} prop="hammer" skin={0} face={false} />
          <Person x={382} y={400} scale={0.96} role="worker" pose={POSES.lay} prop="trowel" skin={0} />
          <Person x={532} y={400} scale={0.96} role="worker" pose={POSES.hold} prop="clipboard" skin={2} />
        </g>

                <g transform={`translate(${SHIFT.deliver} 0)`}>
  {/* ── C · the handover ─────────────────────────────────────────────
              The architect keeps her hard hat and the family have none, which is
              the fastest way to say that one of these people works here and three
              of them are about to live here.

              A family rather than two adults: the difference between "we hand the
              keys over" and "we hand your home to your family" is the entire
              emotional point of this station, and it costs one more figure. */}
          <g ref={reg('glint')}>
            <path
              d="M953 322 l4.5 -12 l4.5 12 l12 4.5 l-12 4.5 l-4.5 12 l-4.5 -12 l-12 -4.5 Z"
              fill={GLOW}
              opacity={0}
            />
          </g>
          <Person x={906} y={400} role="architect" pose={POSES.offer} prop="key" skin={0} />
          <Person x={984} y={400} facing={-1} role="client" pose={POSES.receive} skin={1} top={CYAN[500]} />
          <Person
            x={1038}
            y={400}
            facing={-1}
            role="client"
            pose={POSES.pleased}
            hair="long"
            top={NAVY[400]}
            skin={2}
          />
          {/*
            The child is drawn last, so it overlaps both parents rather than
            standing in line with them — that overlap is what makes three figures
            read as *a family* instead of as three people queuing. Facing left, the
            wave carries up toward the person handing over the keys.
          */}
          <Person
            x={1012}
            y={400}
            facing={-1}
            scale={0.6}
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

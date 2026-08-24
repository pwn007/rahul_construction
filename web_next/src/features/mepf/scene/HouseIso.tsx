'use client';

import { motion } from 'framer-motion';
import { SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { at, box, face, floorSlab, HOUSE, run, slab, TERMINALS, U, wallX, wallY } from './iso';
import { CEIL, INCOMING, perLevel, perLevelDrops, ROUTES, WASTE } from './routes';
import type { Reg } from './refs';
import { AIR_SPACING, VOLT_SPACING, WATER_SPACING } from './loops';
import { DEAD, FURNITURE, GLOW, INK, PAPER, SLAB, SLAB_DARK, SYSTEM_STYLES, WALL, WALL_SIDE } from './systems';

/*
  The house, cut open.

  Everything is written in house units and projected by `iso()`. Read it as a
  plan, not as SVG: `run([6.7, .75, 7], [6.7, .75, 3])` is a duct from the roof
  down to the ground-floor ceiling, and it stays that duct if the storey height
  changes.

  ── Drawing order is not negotiable ─────────────────────────────────────────
  Painter's algorithm, furthest first:

      far walls (full height)  →  ground slab  →  ground contents
      →  first slab  →  first contents  →  roof  →  parapet  →  plant

  The two far walls go first precisely because everything else is nearer than
  they are. Slabs then interleave in ascending z, each one correctly covering
  the part of the wall it stands in front of. Move a block and something ends up
  in front of a wall it is behind.

  The four service runs are the exception: they are drawn last, on top of
  everything. Strictly that is a cheat — a riser passing behind a slab should be
  occluded by it — but a services drawing whose services keep disappearing
  behind the building is not doing its job, and every MEP drawing ever made
  makes the same cheat.
*/

const { levels, X, Y, roof, parapet, slabD } = HOUSE;

const EASE = [0.16, 1, 0.3, 1] as const;

export interface HouseProps {
  reg: Reg;
  /** Null means every system at once, which is the default and the resting state. */
  focus: SystemKey | null;
  off: Record<SystemKey, boolean>;
  /** Ambient loops running. False on the teaser, where the house is a still. */
  live: boolean;
  reduced: boolean;
  /** Drops the room labels and the furniture, for the small end of the range. */
  compact?: boolean;
}

export function HouseIso({ reg, focus, off, live, reduced, compact = false }: HouseProps) {
  /** A system nobody is looking at fades back; it never disappears. */
  const dim = (key: SystemKey) => (focus && focus !== key ? 0.12 : 1);

  return (
    <>
      {/* Ground, run well past the viewBox. An SVG clips to its element box, not
          its viewBox, so this still paints edge to edge under `meet`. */}
      <path d={slab(-20, 34, -20, 26, 0)} fill={SLAB_DARK} opacity={0.28} />

      {/* ── The two far walls, full height. Everything else is nearer. */}
      <path d={wallY(0, 0, X, 0, parapet)} fill={WALL} />
      <path d={wallX(0, 0, Y, 0, parapet)} fill={WALL_SIDE} />

      {/* ── Ground floor. */}
      <Slab z={0} />
      {!compact && (
        <g fill={FURNITURE}>
          <Solid {...box(1.4, 4.4, 2.7, 4.15, 0, 0.85)} />
          <Solid {...box(10.3, 12.7, 2.9, 4.15, 0, 1.0)} />
        </g>
      )}
      <LightPools reg={reg} z={0} index={0} off={off.electrical} dim={dim('electrical')} />

      {/* ── First floor. */}
      <Slab z={levels[1]!} />
      {!compact && (
        <g fill={FURNITURE}>
          <Solid {...box(1.2, 4.6, 2.5, 4.15, levels[1]!, levels[1]! + 0.7)} />
          <Solid {...box(10.7, 12.7, 2.8, 4.15, levels[1]!, levels[1]! + 0.62)} />
        </g>
      )}
      <LightPools reg={reg} z={levels[1]!} index={2} off={off.electrical} dim={dim('electrical')} />

      {/* ── Heat, once nobody is moving it. Deliberately not fire-coloured: this
             is a room that is unpleasant, not a room that is dangerous. */}
      <g ref={reg('haze')} opacity={0}>
        {levels.map((z) => (
          <path key={z} d={slab(0, X, 0, Y, z + 1.5)} fill="#E88B3C" opacity={0.17} />
        ))}
      </g>

      {/* ── Roof, then the parapet on top of it. */}
      <Slab z={roof} />
      <path d={wallY(0, 0, X, roof, parapet)} fill={WALL} />
      <path d={wallX(0, 0, Y, roof, parapet)} fill={WALL_SIDE} />

      <g opacity={dim('hvac')} style={{ transition: 'opacity .35s ease' }}>
        <Solid {...box(5.8, 7.6, 0.3, 1.5, roof, roof + 0.75)} fill={WALL} stroke />
        <Fan reg={reg} dead={off.hvac} />
      </g>

      <g opacity={dim('plumbing')} style={{ transition: 'opacity .35s ease' }}>
        <Solid {...box(9.0, 10.8, 0.3, 1.5, roof, roof + 1.3)} fill={WALL} stroke />
        <path
          d={slab(9.15, 10.65, 0.42, 1.38, off.plumbing ? roof + 0.2 : roof + 1.2)}
          fill={SYSTEM_STYLES.plumbing.colour}
          opacity={0.34}
          style={{ transition: 'all .6s cubic-bezier(.16,1,.3,1)' }}
        />
      </g>

      {/* Consumer unit, on the wall where you would actually find it. */}
      <g opacity={dim('electrical')} style={{ transition: 'opacity .35s ease' }}>
        <path
          d={wallY(0.28, 6.5, 7.6, 1.05, 2.15)}
          fill={WALL}
          stroke={off.electrical ? DEAD : SYSTEM_STYLES.electrical.colour}
          strokeWidth={2}
        />
      </g>

      {/* ── The services, drawn over the house they run through. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {SYSTEM_ORDER.map((key, si) => {
          const s = SYSTEM_STYLES[key];
          const dead = off[key];
          const colour = dead ? DEAD : s.colour;
          const lead = reduced ? 0 : 0.15 + si * 0.18;
          const segments: { d: string; w: number; delay: number }[] = [
            { d: run(...ROUTES[key].riser), w: s.weight, delay: lead },
            ...levels.flatMap((_, li) => [
              ...perLevel(key, li).map((pts, bi) => ({
                d: run(...pts),
                w: s.weight,
                delay: lead + 0.3 + li * 0.1 + bi * 0.06,
              })),
              ...perLevelDrops(key, li).map((pts, di) => ({
                d: run(...pts),
                w: s.weight * 0.6,
                delay: lead + 0.46 + li * 0.1 + di * 0.06,
              })),
            ]),
          ];

          return (
            <g key={key} opacity={dim(key) * (dead ? 0.6 : 1)} style={{ transition: 'opacity .35s ease' }}>
              {segments.map((seg, i) => (
                <motion.path
                  key={i}
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : seg.delay, ease: EASE }}
                  d={seg.d}
                  stroke={colour}
                  strokeWidth={seg.w}
                  strokeDasharray={dead ? '9 8' : undefined}
                />
              ))}
              {levels.map((z, li) => (
                <Fitting key={z} kind={key} z={z} index={li} colour={colour} reg={reg} />
              ))}
            </g>
          );
        })}

        <motion.path
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.9, ease: EASE }}
          d={run(...WASTE)}
          stroke={off.plumbing ? DEAD : SYSTEM_STYLES.plumbing.colour}
          strokeWidth={SYSTEM_STYLES.plumbing.weight * 0.85}
          strokeDasharray={off.plumbing ? '9 8' : undefined}
          opacity={dim('plumbing') * 0.75}
          style={{ transition: 'opacity .35s ease' }}
        />
        <motion.path
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.95, ease: EASE }}
          d={run(...INCOMING)}
          stroke={off.electrical ? DEAD : SYSTEM_STYLES.electrical.colour}
          strokeWidth={SYSTEM_STYLES.electrical.weight}
          opacity={dim('electrical') * 0.75}
          style={{ transition: 'opacity .35s ease' }}
        />
      </g>

      {/* ── Flow. Everything that moves, and nothing else, is in this block. */}
      {live && !reduced && (
        <g fill="none" strokeLinecap="round">
          <g ref={reg('water')} opacity={off.plumbing ? 0 : dim('plumbing')} style={{ transition: 'opacity .35s ease' }}>
            <path d={run(...ROUTES.plumbing.riser)} stroke="#8CE2FA" strokeWidth={2.4} strokeDasharray={`8 ${WATER_SPACING - 8}`} />
          </g>
          <g ref={reg('waste')} opacity={off.plumbing ? 0 : dim('plumbing') * 0.8} style={{ transition: 'opacity .35s ease' }}>
            <path d={run(...WASTE)} stroke="#7F94CB" strokeWidth={2} strokeDasharray={`7 ${WATER_SPACING - 7}`} />
          </g>
          {levels.map((_, i) => (
            <g key={`air${i}`} ref={reg(`air${i}`)} opacity={off.hvac ? 0 : dim('hvac') * 0.9} style={{ transition: 'opacity .35s ease' }}>
              <path
                d={run(...ROUTES.hvac.branches[i]!)}
                stroke={PAPER}
                strokeWidth={2.8}
                strokeDasharray={`10 ${AIR_SPACING - 10}`}
                opacity={0.9}
              />
            </g>
          ))}
          {levels.map((_, i) => (
            <g key={`volt${i}`} ref={reg(`volt${i}`)} opacity={off.electrical ? 0 : dim('electrical')} style={{ transition: 'opacity .35s ease' }}>
              <path
                d={run(...ROUTES.electrical.branches[i * 2]!)}
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeDasharray={`14 ${VOLT_SPACING - 14}`}
              />
            </g>
          ))}
        </g>
      )}

      {!compact && (
        <g fill={INK} opacity={0.4} fontSize={13}>
          <text {...at([3.0, 4.2, 0.06])} textAnchor="middle">
            Living room
          </text>
          <text {...at([11.5, 4.2, 0.06])} textAnchor="middle">
            Kitchen
          </text>
          <text {...at([2.8, 4.2, levels[1]! + 0.06])} textAnchor="middle">
            Bedroom
          </text>
          <text {...at([11.7, 4.2, levels[1]! + 0.06])} textAnchor="middle">
            Bathroom
          </text>
          <text {...at([6.7, 0.9, roof + 1.35])} textAnchor="middle" opacity={0.85}>
            AC outdoor unit
          </text>
          <text {...at([9.9, 0.9, roof + 1.95])} textAnchor="middle" opacity={0.85}>
            Water tank
          </text>
        </g>
      )}
    </>
  );
}

/** A floor with its cut edges showing, so it reads as concrete and not as paper. */
function Slab({ z }: { z: number }) {
  const s = floorSlab(0, X, 0, Y, z, slabD);
  return (
    <g>
      <path d={s.front} fill={SLAB_DARK} />
      <path d={s.right} fill={SLAB_DARK} opacity={0.82} />
      <path d={s.top} fill={z === 0 ? PAPER : SLAB} />
    </g>
  );
}

/** The three visible faces of a solid, shaded so it reads as one. */
function Solid({
  top,
  right,
  front,
  fill = FURNITURE,
  stroke = false,
}: {
  top: string;
  right: string;
  front: string;
  fill?: string;
  stroke?: boolean;
}) {
  const edge = stroke ? { stroke: INK, strokeWidth: 1.1, strokeOpacity: 0.26 } : {};
  return (
    <g>
      <path d={front} fill={fill} opacity={0.68} {...edge} />
      <path d={right} fill={fill} opacity={0.84} {...edge} />
      <path d={top} fill={fill} {...edge} />
    </g>
  );
}

function Fan({ reg, dead }: { reg: Reg; dead: boolean }) {
  const c = at([6.7, 0.9, roof + 0.77]);
  return (
    <g ref={reg('fan')} data-pivot={`${c.x.toFixed(1)} ${c.y.toFixed(1)}`}>
      <ellipse cx={c.x} cy={c.y} rx={0.62 * U * 2.4} ry={0.62 * U} fill="none" stroke={INK} strokeWidth={1.2} strokeOpacity={0.3} />
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={c.x}
          y1={c.y}
          x2={c.x + 0.55 * U * 2.4 * Math.cos((a * Math.PI) / 180)}
          y2={c.y + 0.55 * U * Math.sin((a * Math.PI) / 180)}
          stroke={dead ? DEAD : SYSTEM_STYLES.hvac.colour}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={dead ? 0.4 : 0.9}
        />
      ))}
    </g>
  );
}

/**
 * Light on the floor.
 *
 * The only place electricity is visible in a finished house, which is exactly
 * why it is what goes dark when the switch comes off. A circle on the ground
 * projects to an ellipse whose axes follow the projection's own 2.4:1.
 */
function LightPools({ reg, z, index, off, dim }: { reg: Reg; z: number; index: number; off: boolean; dim: number }) {
  return (
    <>
      {[TERMINALS.lightL(z), TERMINALS.lightR(z)].map((p, i) => {
        const c = at([p[0], p[1], z + 0.03]);
        return (
          <ellipse
            key={i}
            ref={reg(`lit${index + i}`)}
            cx={c.x}
            cy={c.y}
            rx={1.5 * U * 2.4}
            ry={1.5 * U}
            fill={GLOW}
            opacity={off ? 0 : 0.36 * dim}
            style={{ transition: 'opacity .5s ease' }}
          />
        );
      })}
    </>
  );
}

/** The end of every run — the only part of a service anybody ever touches. */
function Fitting({
  kind,
  z,
  index,
  colour,
  reg,
}: {
  kind: SystemKey;
  z: number;
  index: number;
  colour: string;
  reg: Reg;
}) {
  if (kind === 'hvac') {
    const p = TERMINALS.ac(z);
    return (
      <path
        d={face([p[0] - 0.75, p[1], p[2] - 0.24], [p[0] + 0.75, p[1], p[2] - 0.24], [p[0] + 0.75, p[1], p[2] + 0.24], [p[0] - 0.75, p[1], p[2] + 0.24])}
        fill={colour}
        opacity={0.92}
        stroke="none"
      />
    );
  }
  if (kind === 'plumbing') {
    const c = at(TERMINALS.fixture(z));
    return <ellipse cx={c.x} cy={c.y} rx={0.5 * U * 2.4} ry={0.5 * U} fill={colour} opacity={0.9} stroke="none" />;
  }
  if (kind === 'electrical') {
    return (
      <g fill={colour} stroke="none">
        {[TERMINALS.lightL(z), TERMINALS.lightR(z)].map((p, i) => {
          const c = at(p);
          return <path key={i} d={`M${c.x - 12} ${c.y + 5} L${c.x} ${c.y - 7} L${c.x + 12} ${c.y + 5} Z`} opacity={0.92} />;
        })}
      </g>
    );
  }
  const c = at(TERMINALS.detector(z));
  return (
    <g fill={colour} stroke="none">
      <ellipse cx={c.x} cy={c.y} rx={0.34 * U * 2.4} ry={0.34 * U} opacity={0.95} />
      {index === 0 && <ellipse ref={reg('standby')} cx={c.x} cy={c.y} rx={0.7 * U * 2.4} ry={0.7 * U} fill={colour} opacity={0} />}
    </g>
  );
}

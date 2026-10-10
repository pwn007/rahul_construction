'use client';

import * as THREE from 'three';
import { SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { HOUSE, TERMINALS, type Pt } from './iso';
import { allRuns, INCOMING, WASTE } from './routes';
import { DEAD, FURNITURE, GLOW, PAPER, SLAB, SLAB_DARK, SYSTEM_STYLES, WALL, WALL_SIDE } from './systems';

/**
 * The house, built out of the same numbers the flat drawing is built out of.
 *
 * ── No model file, and that is the point ────────────────────────────────────
 * There is no `.glb` here, nothing exported from Blender, nothing to keep in a
 * folder and forget to update. `HOUSE` already says how big the plan is and how
 * tall a storey is; `ROUTES` already says where every pipe goes; `TERMINALS`
 * already says where every fitting sits. This file turns those numbers into
 * boxes and cylinders. The flat drawing turns the same numbers into paths.
 *
 * Which means the two cannot disagree. Move the bathroom in `iso.ts` and it
 * moves in both.
 *
 * ── Cylinders per segment, not a swept tube ─────────────────────────────────
 * `TubeGeometry` over a curve through the route points would be one line of
 * code and would round every corner off. The right angles *are* the drawing —
 * a services run bends at 90° because a building does — so each straight
 * segment gets its own cylinder and each corner gets a small sphere to cap the
 * join. Slightly more geometry, honest bends.
 *
 * ── Axis convention ─────────────────────────────────────────────────────────
 * House coordinates are x along the length, y towards the front, z up. Three.js
 * is y-up. The conversion happens once, in `v()`, and nowhere else: house
 * (x, y, z) becomes three (x, z, y). Every other function here works in house
 * units.
 */

/** House coordinates → three.js world. The only place the two systems meet. */
const v = (p: Pt) => new THREE.Vector3(p[0], p[2], p[1]);

const { X, Y, levels, slabD, roof, parapet } = HOUSE;

/** Everything the viewer needs to reach after the scene is built. */
export interface HouseModel {
  root: THREE.Group;
  /** One group per system, so a whole service can be dimmed or greyed at once. */
  systems: Record<SystemKey, THREE.Group>;
  /** The pipes, kept apart from the fittings because only pipes go dashed. */
  pipeMaterials: Record<SystemKey, THREE.MeshStandardMaterial>;
  fittingMaterials: Record<SystemKey, THREE.MeshStandardMaterial>;
  /** Warm pools under each pendant — the only visible sign of electricity. */
  lightPools: THREE.Mesh[];
  /** The water in the tank, scaled down to nothing when plumbing is switched off. */
  tankWater: THREE.Mesh;
  /** The outdoor unit's fan. */
  fan: THREE.Group;
  /** Heat filling the rooms, shown only when the air is switched off. */
  haze: THREE.Mesh[];
  /** Room names, kept in world space so HTML can be pinned over them. */
  labels: { text: string; at: [number, number, number] }[];
  /** Everything created here, for disposal. A leaked scene is a leaked GPU. */
  dispose: () => void;
}

/**
 * The four rooms, by name.
 *
 * The flat drawing prints these as `<text>` inside the SVG. Three.js has no
 * equivalent worth having — text in a 3D scene means either a sprite sheet or a
 * canvas texture, and both come out fuzzy at exactly the size a label needs to
 * be readable. So the positions live here and `HouseThree` pins real HTML over
 * them, which is the same trick the project atlas uses over its map.
 */
const ROOM_LABELS: { text: string; p: Pt }[] = [
  { text: 'Living room', p: [3.0, 2.5, 1.4] },
  { text: 'Kitchen', p: [11.4, 2.5, 1.4] },
  { text: 'Bedroom', p: [2.8, 2.5, 4.8] },
  { text: 'Bathroom', p: [11.6, 2.5, 4.8] },
];

export function buildHouse(): HouseModel {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const track = <T extends THREE.BufferGeometry>(g: T) => (geometries.push(g), g);
  const mat = <T extends THREE.Material>(m: T) => (materials.push(m), m);

  const solid = (colour: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    mat(new THREE.MeshStandardMaterial({ color: colour, roughness: 0.92, metalness: 0, ...opts }));

  /** A box given in house units, positioned by its own extents. */
  const boxAt = (
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
    material: THREE.Material,
  ) => {
    const g = track(new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0));
    const m = new THREE.Mesh(g, material);
    m.position.set((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2);
    return m;
  };

  // ── Ground. A pad, not a landscape: at ninety units square it filled the
  //    frame and turned the whole picture the same grey as the house.
  const groundMat = solid(SLAB_DARK, { roughness: 1, transparent: true, opacity: 0.45 });
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(26, 17)), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(X / 2, -0.02, Y / 2);
  ground.receiveShadow = true;
  root.add(ground);

  // ── Shell. Two far walls only: this is a cutaway, and the near pair is the
  //    cut. Unlike the flat drawing the walls stay correct at every angle,
  //    because you can simply turn the house round and look at them.
  const wallMat = solid(WALL);
  const wallSideMat = solid(WALL_SIDE);
  const wallT = 0.22;
  root.add(boxAt(-wallT, X, -wallT, 0, 0, parapet, wallMat));
  root.add(boxAt(-wallT, 0, 0, Y, 0, parapet, wallSideMat));

  // ── Slabs: two floors and a roof.
  const slabMat = solid(SLAB);
  const paperMat = solid(PAPER);
  root.add(boxAt(0, X, 0, Y, -slabD, 0, paperMat));
  root.add(boxAt(0, X, 0, Y, levels[1]! - slabD, levels[1]!, slabMat));
  root.add(boxAt(0, X, 0, Y, roof - slabD, roof, slabMat));

  // ── Furniture. Not decoration: without it the storeys read as empty trays and
  //    nobody believes anybody lives here.
  const furnitureMat = solid(FURNITURE);
  root.add(boxAt(1.4, 4.4, 2.7, 4.15, 0, 0.85, furnitureMat));
  root.add(boxAt(10.3, 12.7, 2.9, 4.15, 0, 1.0, furnitureMat));
  root.add(boxAt(1.2, 4.6, 2.5, 4.15, levels[1]!, levels[1]! + 0.7, furnitureMat));
  root.add(boxAt(10.7, 12.7, 2.8, 4.15, levels[1]!, levels[1]! + 0.62, furnitureMat));

  // ── Roof plant, and the meter.
  root.add(boxAt(5.8, 7.6, 0.3, 1.5, roof, roof + 0.75, wallMat));
  root.add(boxAt(9.0, 10.8, 0.3, 1.5, roof, roof + 1.3, wallMat));
  root.add(boxAt(6.5, 7.6, 0.28, 0.5, 1.05, 2.15, wallMat));

  const waterMat = solid(SYSTEM_STYLES.plumbing.colour, { transparent: true, opacity: 0.55, roughness: 0.25 });
  const tankWater = boxAt(9.15, 10.65, 0.42, 1.38, roof + 0.1, roof + 1.2, waterMat);
  root.add(tankWater);

  // The fan sits in its own group so one rotation drives it.
  const fan = new THREE.Group();
  fan.position.set(6.7, roof + 0.78, 0.9);
  const bladeMat = solid(SYSTEM_STYLES.hvac.colour, { roughness: 0.5 });
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.Mesh(track(new THREE.BoxGeometry(0.62, 0.03, 0.14)), bladeMat);
    blade.position.set(0.31, 0, 0);
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI * 2) / 3;
    arm.add(blade);
    fan.add(arm);
  }
  root.add(fan);

  // ── The four services.
  const systems = {} as Record<SystemKey, THREE.Group>;
  const pipeMaterials = {} as Record<SystemKey, THREE.MeshStandardMaterial>;
  const fittingMaterials = {} as Record<SystemKey, THREE.MeshStandardMaterial>;

  /** A run of pipe: one cylinder per straight, one sphere per corner. */
  const addRun = (group: THREE.Group, pts: Pt[], radius: number, material: THREE.Material) => {
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = v(pts[i]!);
      const b = v(pts[i + 1]!);
      const length = a.distanceTo(b);
      if (length < 1e-4) continue;
      const g = track(new THREE.CylinderGeometry(radius, radius, length, 10, 1));
      const m = new THREE.Mesh(g, material);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      // A cylinder is born pointing up Y; aim it along the segment.
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      m.castShadow = true;
      group.add(m);
    }
    for (let i = 1; i < pts.length - 1; i += 1) {
      const j = new THREE.Mesh(track(new THREE.SphereGeometry(radius, 10, 8)), material);
      j.position.copy(v(pts[i]!));
      group.add(j);
    }
  };

  for (const key of SYSTEM_ORDER) {
    const group = new THREE.Group();
    const style = SYSTEM_STYLES[key];
    // The flat drawing's stroke weights are in screen units; these keep the same
    // relative thickness in house units — a duct fatter than a cable, which is
    // the fact that decides which one goes highest in the ceiling.
    const radius = 0.062 + style.weight * 0.017;
    const pipe = solid(style.colour, { roughness: 0.55 });
    const fitting = solid(style.colour, { roughness: 0.4 });
    pipeMaterials[key] = pipe;
    fittingMaterials[key] = fitting;

    for (const pts of allRuns(key)) addRun(group, pts, radius, pipe);

    if (key === 'plumbing') addRun(group, WASTE, radius * 0.85, pipe);
    if (key === 'electrical') addRun(group, INCOMING, radius, pipe);

    // Fittings — the end of every run, and the only part anybody touches.
    for (const z of levels) {
      if (key === 'hvac') {
        const p = TERMINALS.ac(z);
        group.add(boxAt(p[0] - 0.75, p[0] + 0.75, p[1] - 0.14, p[1] + 0.14, p[2] - 0.24, p[2] + 0.24, fitting));
      }
      if (key === 'plumbing') {
        const p = TERMINALS.fixture(z);
        group.add(boxAt(p[0] - 0.5, p[0] + 0.5, p[1] - 0.4, p[1] + 0.4, p[2] - 0.1, p[2] + 0.1, fitting));
      }
      if (key === 'electrical') {
        for (const p of [TERMINALS.lightL(z), TERMINALS.lightR(z)]) {
          const g = track(new THREE.ConeGeometry(0.3, 0.34, 14));
          const m = new THREE.Mesh(g, fitting);
          m.position.set(p[0], p[2] - 0.17, p[1]);
          m.rotation.x = Math.PI;
          group.add(m);
        }
      }
      if (key === 'fire') {
        const p = TERMINALS.detector(z);
        const g = track(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 14));
        const m = new THREE.Mesh(g, fitting);
        m.position.set(p[0], p[2], p[1]);
        group.add(m);
      }
    }

    systems[key] = group;
    root.add(group);
  }

  // ── Light pools, sitting just above each floor.
  const glowMat = mat(
    new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0.34, depthWrite: false }),
  );
  const lightPools: THREE.Mesh[] = [];
  for (const z of levels) {
    for (const p of [TERMINALS.lightL(z), TERMINALS.lightR(z)]) {
      const disc = new THREE.Mesh(track(new THREE.CircleGeometry(1.5, 28)), glowMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(p[0], z + 0.03, p[1]);
      lightPools.push(disc);
      root.add(disc);
    }
  }

  // ── Heat. Warm, not fire-coloured: this is a room that is unpleasant to be
  //    in, not a room that is dangerous.
  const hazeMat = mat(
    new THREE.MeshBasicMaterial({ color: '#E88B3C', transparent: true, opacity: 0, depthWrite: false }),
  );
  const haze: THREE.Mesh[] = [];
  for (const z of levels) {
    const g = track(new THREE.BoxGeometry(X, 2.9, Y));
    const m = new THREE.Mesh(g, hazeMat);
    m.position.set(X / 2, z + 1.45, Y / 2);
    haze.push(m);
    root.add(m);
  }

  // The house is authored from a corner; centre it so it turns about itself.
  root.position.set(-X / 2, 0, -Y / 2);

  return {
    root,
    // World space, so the HTML overlay does not have to know about the group's
    // own offset. Same conversion as `v()`, plus the recentring applied to root.
    labels: ROOM_LABELS.map(({ text, p }) => ({ text, at: [p[0] - X / 2, p[2], p[1] - Y / 2] as [number, number, number] })),
    systems,
    pipeMaterials,
    fittingMaterials,
    lightPools,
    tankWater,
    fan,
    haze,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

/** The grey a switched-off service goes. Not invisible: it is still there, just never designed. */
export const DEAD_COLOUR = new THREE.Color(DEAD);

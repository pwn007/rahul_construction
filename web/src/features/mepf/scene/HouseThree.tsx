import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SYSTEM_ORDER, type SystemKey } from '@/data/mepf';
import { buildHouse, DEAD_COLOUR, type HouseModel } from './build';
import { SYSTEM_STYLES } from './systems';

/**
 * The house you can turn.
 *
 * ── Why this exists at all ──────────────────────────────────────────────────
 * The flat drawing answers "where is it in my house" better than a section did,
 * but it answers from one fixed angle. For *spatial* questions specifically —
 * unlike abstract ones — being able to turn a thing measurably builds a better
 * mental map of it than any still image can. This is the one place on the site
 * where more interaction is the right answer rather than the lazy one.
 *
 * ── Scroll is sacred ────────────────────────────────────────────────────────
 * The orbit control that ships with three.js swallows every drag inside its
 * canvas. On a phone that means a visitor who touches the house can no longer
 * scroll the page, and the only escape is to find a margin — which most people
 * read as the page being broken. So there is no `OrbitControls` here:
 *
 *   · touch  — a horizontal drag turns the house, a vertical drag scrolls the
 *              page. Decided once, from the first six pixels of the gesture.
 *   · mouse  — drag turns and tilts.
 *   · wheel  — deliberately does nothing. Wheel-to-zoom traps the page scroll
 *              just as badly, and the buttons do the job without stealing a
 *              gesture the browser already owns.
 *   · keys   — arrows turn and tilt, which is why the frame is focusable.
 *
 * ── One build, then refs ────────────────────────────────────────────────────
 * The scene is ~250 meshes and none of it depends on props, so it is built once
 * and every subsequent prop change is a material write. React never re-renders
 * anything here after mount.
 */

const MIN_POLAR = 0.2;
const MAX_POLAR = Math.PI / 2 - 0.05;
const MIN_DIST = 15;
const MAX_DIST = 36;
/**
 * Where the camera starts.
 *
 * Low, and that is the whole trick. The first attempt looked down from 32° above
 * the horizon and every floor slab covered the storey underneath it — the same
 * failure the flat drawing had, arrived at from the opposite direction. You are
 * looking *in through the open side*, not down from above, so the camera has to
 * sit near the height of the thing it is looking into. At 15° the roof clears
 * the top storey and the pipes in both ceilings are visible.
 */
const HOME = { azimuth: -0.86, polar: 1.31, distance: 25 };

/** Roof level, and the two heights the tank's water sits at when full and empty. */
const TANK_FULL_Y = 7.45;
const TANK_EMPTY_Y = 6.97;

interface Api {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: HouseModel;
  orbit: { azimuth: number; polar: number; distance: number };
  /** True once anybody has taken hold of it; stops the idle drift for good. */
  touched: boolean;
  /** Opacity the light pools should breathe around, given focus and switches. */
  glowTarget: number;
  place: () => void;
  draw: () => void;
}

/**
 * Room names as HTML, pinned over the canvas.
 *
 * Text inside a three.js scene means a sprite sheet or a canvas texture, and
 * both go fuzzy at exactly the size a label has to be readable. Real HTML gets
 * the site's own type, stays crisp at any zoom, and can be read by a screen
 * reader — the same reasoning the project atlas uses for its map pins. The cost
 * is four `transform` writes per frame, which is nothing.
 *
 * A label behind the house is hidden rather than drawn through it: `w < 0` after
 * projection means the point is behind the camera, and a depth over ~1 means it
 * has fallen out of the frustum.
 */
function positionLabels(
  labels: HouseModel['labels'],
  nodes: HTMLElement[],
  camera: THREE.PerspectiveCamera,
  el: HTMLElement,
) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  const v = new THREE.Vector3();
  labels.forEach((label, i) => {
    const node = nodes[i];
    if (!node) return;
    v.set(label.at[0], label.at[1], label.at[2]).project(camera);
    const visible = v.z < 1;
    node.style.opacity = visible ? '1' : '0';
    node.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * w}px, ${((-v.y + 1) / 2) * h}px)`;
  });
}

export interface HouseThreeProps {
  focus: SystemKey | null;
  off: Record<SystemKey, boolean>;
  reduced: boolean;
  /** False when the figure is off screen — the loop stops rather than burn a GPU. */
  inView: boolean;
  className?: string;
}

export default function HouseThree({ focus, off, reduced, inView, className }: HouseThreeProps) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const labelHost = useRef<HTMLDivElement>(null);
  const offRef = useRef(off);
  const reducedRef = useRef(reduced);
  offRef.current = off;
  reducedRef.current = reduced;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      return; // No WebGL. MepfTwin leaves the flat house on screen.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // The one line that keeps a phone scrolling: the browser keeps vertical
    // panning, this component only ever claims the horizontal.
    canvas.style.touchAction = 'pan-y';
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
    const model = buildHouse();
    scene.add(model.root);

    // Flat, even light. No shadow maps: on a drawing whose job is legibility
    // rather than realism they cost more than they add.
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a927f, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(9, 14, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.38);
    fill.position.set(-8, 5, -6);
    scene.add(fill);

    const orbit = { ...HOME };

    const place = () => {
      const { azimuth, polar, distance } = orbit;
      camera.position.set(
        distance * Math.sin(polar) * Math.sin(azimuth),
        distance * Math.cos(polar),
        distance * Math.sin(polar) * Math.cos(azimuth),
      );
      camera.lookAt(0, 3.4, 0);
    };
    const draw = () => renderer.render(scene, camera);

    const labelNodes = () => Array.from(labelHost.current?.children ?? []) as HTMLElement[];
    const draw2 = () => {
      draw();
      positionLabels(model.labels, labelNodes(), camera, el);
    };
    const state: Api = { renderer, scene, camera, model, orbit, touched: false, glowTarget: 0.32, place, draw: draw2 };
    api.current = state;

    const resize = () => {
      const w = el.clientWidth;
      const h = Math.max(el.clientHeight, 1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
      positionLabels(model.labels, labelNodes(), camera, el);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    place();
    draw2();

    /*
      One gesture, one decision.

      `axis` is settled from the first few pixels of a touch and then held for
      the rest of the drag. Re-deciding per frame makes the house judder and the
      page fight the finger; deciding once means a swipe that began as a scroll
      stays a scroll even if the thumb wanders sideways.
    */
    let dragging = false;
    let axis: 'turn' | 'scroll' | null = null;
    let pointerType = 'mouse';
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      pointerType = e.pointerType;
      axis = e.pointerType === 'mouse' ? 'turn' : null;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      if (e.pointerType === 'mouse') {
        canvas.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;

      if (axis === null) {
        const ax = Math.abs(e.clientX - startX);
        const ay = Math.abs(e.clientY - startY);
        if (ax < 6 && ay < 6) return;
        if (ay >= ax) {
          dragging = false; // hand the gesture back to the browser
          return;
        }
        axis = 'turn';
        canvas.setPointerCapture(e.pointerId);
      }

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      state.touched = true;
      orbit.azimuth -= dx * 0.008;
      // Touch only ever turns. Tilting is a mouse affordance, because on a phone
      // the vertical axis already belongs to the page.
      if (pointerType === 'mouse') {
        orbit.polar = Math.min(MAX_POLAR, Math.max(MIN_POLAR, orbit.polar - dy * 0.006));
      }
      place();
      draw2();
    };

    const onUp = () => {
      dragging = false;
      axis = null;
      el.style.cursor = 'grab';
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    el.style.cursor = 'grab';

    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      model.dispose();
      renderer.dispose();
      // Without this the context outlives the unmount, and a browser starts
      // dropping the oldest one after about sixteen. This is a single-page app;
      // sixteen route changes is a normal visit.
      renderer.forceContextLoss();
      canvas.remove();
      api.current = null;
    };
  }, []);

  // ── The loop. Runs only while the house is on screen and motion is wanted.
  useEffect(() => {
    if (!inView || reduced) {
      api.current?.draw();
      return;
    }
    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const state = api.current;
      if (state) {
        const dt = Math.min(now - last, 64);
        last = now;
        const dead = offRef.current;

        /*
          A slow sway until somebody takes hold of it — the only hint most
          visitors get that the house is theirs to turn.

          A sway rather than a rotation, because a continuous spin eventually
          parks the house showing its blank back wall, and whether a visitor
          arrives at a useful angle then depends on when they happened to scroll
          past. Oscillating around the opening keeps every idle frame worth
          looking at, and still says "this moves".
        */
        if (!state.touched) {
          elapsed += dt;
          state.orbit.azimuth = HOME.azimuth + 0.26 * Math.sin(elapsed / 4200);
          state.place();
        }
        if (!dead.hvac) state.model.fan.rotation.y += dt * 0.005;

        const glow = state.model.lightPools[0]?.material as THREE.MeshBasicMaterial | undefined;
        if (glow) glow.opacity = state.glowTarget * (0.88 + 0.12 * Math.sin(now / 1500));

        state.draw();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced]);

  // ── Selection and switches. Materials are shared per system, so one write
  //    recolours every pipe and fitting of that service at once.
  useEffect(() => {
    const state = api.current;
    if (!state) return;
    const { model } = state;

    for (const k of SYSTEM_ORDER) {
      const dead = off[k];
      const dimmed = focus !== null && focus !== k;
      for (const m of [model.pipeMaterials[k], model.fittingMaterials[k]]) {
        m.color.copy(dead ? DEAD_COLOUR : new THREE.Color(SYSTEM_STYLES[k].colour));
        m.transparent = dimmed || dead;
        m.opacity = dimmed ? 0.1 : dead ? 0.6 : 1;
        m.needsUpdate = true;
      }
    }

    state.glowTarget = off.electrical ? 0 : focus && focus !== 'electrical' ? 0.08 : 0.32;
    const glow = model.lightPools[0]?.material as THREE.MeshBasicMaterial | undefined;
    if (glow) glow.opacity = state.glowTarget;

    // The tank empties downward, so the mesh has to move as it shrinks — scaling
    // alone would drain it from both ends at once.
    model.tankWater.scale.y = off.plumbing ? 0.12 : 1;
    model.tankWater.position.y = off.plumbing ? TANK_EMPTY_Y : TANK_FULL_Y;

    const haze = model.haze[0]?.material as THREE.MeshBasicMaterial | undefined;
    if (haze) haze.opacity = off.hvac ? 0.2 : 0;

    state.draw();
  }, [focus, off]);

  const step = useCallback((d: Partial<Api['orbit']>) => {
    const state = api.current;
    if (!state) return;
    state.touched = true;
    if (d.azimuth) state.orbit.azimuth += d.azimuth;
    if (d.polar) state.orbit.polar = Math.min(MAX_POLAR, Math.max(MIN_POLAR, state.orbit.polar + d.polar));
    if (d.distance) state.orbit.distance = Math.min(MAX_DIST, Math.max(MIN_DIST, state.orbit.distance + d.distance));
    state.place();
    state.draw();
  }, []);

  const reset = useCallback(() => {
    const state = api.current;
    if (!state) return;
    state.orbit = { ...HOME };
    state.touched = true;
    state.place();
    state.draw();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, Partial<Api['orbit']>> = {
      ArrowLeft: { azimuth: -0.16 },
      ArrowRight: { azimuth: 0.16 },
      ArrowUp: { polar: -0.1 },
      ArrowDown: { polar: 0.1 },
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    step(move);
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={host}
        tabIndex={0}
        role="img"
        aria-label="A three-dimensional cutaway of a two-storey house showing where air, water, power and fire safety run through it. Drag to turn it, or use the arrow keys."
        onKeyDown={onKeyDown}
        className="h-[46svh] w-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:h-[58svh]"
      />

      {/* The four rooms, so "where is it in my house" has an answer you can
          point at rather than only read about. */}
      <div ref={labelHost} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {['Living room', 'Kitchen', 'Bedroom', 'Bathroom'].map((room) => (
          <span
            key={room}
            className="absolute left-0 top-0 whitespace-nowrap rounded bg-[rgb(var(--c-surface))]/70 px-1.5 py-0.5 text-caption text-subtle transition-opacity duration-200"
            style={{ opacity: 0 }}
          >
            {room}
          </span>
        ))}
      </div>

      {/* Real buttons, so turning the house never depends on owning a mouse. */}
      <div className="pointer-events-none absolute bottom-3 right-3 flex gap-1.5">
        {[
          { label: 'Zoom in', Ico: Plus, run: () => step({ distance: -3 }) },
          { label: 'Zoom out', Ico: Minus, run: () => step({ distance: 3 }) },
          { label: 'Reset the view', Ico: RotateCcw, run: reset },
        ].map(({ label, Ico, run }) => (
          <button
            key={label}
            type="button"
            onClick={run}
            aria-label={label}
            className="glass pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md border text-[rgb(var(--c-text-muted))] transition-colors hover:text-cyan-700 dark:hover:text-cyan-400"
          >
            <Ico className="h-4 w-4" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

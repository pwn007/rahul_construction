/**
 * GSAP's eases, as plain functions, so the map's motion matches the benchmark
 * (residences.loamhouse.com.au, which runs on GSAP 3.13) without shipping GSAP.
 *
 * GSAP names its power eases by the exponent minus one: power1 is quadratic,
 * power2 cubic, power3 quartic, power4 quintic.
 */

export type Ease = (t: number) => number;

const pow = (p: number) => {
  const easeIn: Ease = (t) => t ** p;
  const easeOut: Ease = (t) => 1 - (1 - t) ** p;
  const easeInOut: Ease = (t) => (t < 0.5 ? (2 * t) ** p / 2 : 1 - (2 * (1 - t)) ** p / 2);
  return { in: easeIn, out: easeOut, inOut: easeInOut };
};

const expoIn: Ease = (t) => (t ? 2 ** (10 * (t - 1)) : 0);
const expoOut: Ease = (t) => 1 - expoIn(1 - t);

export const EASES = {
  'power1.in': pow(2).in,
  'power1.out': pow(2).out,
  'power1.inOut': pow(2).inOut,
  'power2.in': pow(3).in,
  'power2.out': pow(3).out,
  'power2.inOut': pow(3).inOut,
  'power3.in': pow(4).in,
  'power3.out': pow(4).out,
  'power3.inOut': pow(4).inOut,
  'power4.in': pow(5).in,
  'power4.out': pow(5).out,
  'expo.in': expoIn,
  'expo.out': expoOut,
  'sine.in': (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  'sine.out': (t: number) => Math.sin((t * Math.PI) / 2),
  'sine.inOut': (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  none: (t: number) => t,
} satisfies Record<string, Ease>;

export type EaseName = keyof typeof EASES;

/** The benchmark's mirror rule for a reveal's exit: out ↔ in, inOut unchanged. */
export function reverseEase(name: EaseName): EaseName {
  if (name.endsWith('.inOut') || name === 'none') return name;
  if (name.endsWith('.out')) return name.replace('.out', '.in') as EaseName;
  return name.replace('.in', '.out') as EaseName;
}

/** The dive's ease: a gentle start, a fast middle and a long settle (Loam `easeInOutPow`, a = 4). */
export const easeInOutPow = (t: number, a: number) => (t < 0.5 ? (2 * t) ** a / 2 : 1 - (2 * (1 - t)) ** a / 2);

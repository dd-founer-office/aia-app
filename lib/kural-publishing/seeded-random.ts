/**
 * Kural Publishing — Seeded Random
 * ----------------------------------------------------------------------------
 * Isolated to lib/kural-publishing/. Not shared with the Living Field Kernel
 * (which has its own, separate hash-based noise primitives) -- per today's
 * MVP instruction, this file does not import from or modify anything in
 * lib/living-field/.
 *
 * mulberry32 -- a small, well-known deterministic PRNG. Same seed always
 * produces the same sequence, which is what makes the publishing artwork
 * reproducible: "same seed + same renderer version -> same composition."
 */

export type RandomFn = () => number;

/** Returns a deterministic [0, 1) generator for the given integer seed. */
export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededRandom {
  /** Raw [0, 1) draw. */
  next: RandomFn;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max) -- max is exclusive. */
  int(min: number, max: number): number;
  /** Uniform pick from a non-empty array. */
  pick<T>(arr: readonly T[]): T;
  /** True with probability p (0..1). */
  chance(p: number): boolean;
}

export function createSeededRandom(seed: number): SeededRandom {
  const rnd = mulberry32(seed);
  return {
    next: rnd,
    range: (min, max) => min + rnd() * (max - min),
    int: (min, max) => Math.floor(min + rnd() * (max - min)),
    pick: (arr) => arr[Math.floor(rnd() * arr.length)],
    chance: (p) => rnd() < p,
  };
}

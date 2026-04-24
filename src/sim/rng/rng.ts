import seedrandom from "seedrandom";

/**
 * Deterministic RNG helper, seeded by an integer.
 *
 * Every procedural decision in enchanted-forest — grove layout,
 * corruption wave timing, rune note assignment, codename generation —
 * flows through this module. `Math.random()` is blocked in CI for any
 * file under `src/sim/`.
 *
 * Mirrors the shape used by bioluminescent-sea and cosmic-gardener so
 * the three repos share mental models.
 */

export interface Rng {
  /** Returns a float in [0, 1). */
  (): number;
  /** Returns an integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number;
  /** Returns a float in [lo, hi). */
  range(lo: number, hi: number): number;
  /** Returns one element of the array (must be non-empty). */
  pick<T>(arr: readonly T[]): T;
  /** The seed the rng was constructed with. */
  readonly seed: number;
}

export function createRng(seed: number): Rng {
  const startSeed = seed >>> 0;
  const g = seedrandom(String(startSeed));
  const call: Rng = Object.assign(
    () => g(),
    {
      int(lo: number, hi: number): number {
        return Math.floor(lo + g() * (hi - lo + 1));
      },
      range(lo: number, hi: number): number {
        return lo + g() * (hi - lo);
      },
      pick<T>(arr: readonly T[]): T {
        if (arr.length === 0) throw new Error("rng.pick: empty array");
        return arr[Math.floor(g() * arr.length)];
      },
      get seed() {
        return startSeed;
      },
    },
  );
  return call;
}

/**
 * Hash several integer inputs down to a single 32-bit seed using the
 * FNV-1a mix. Used to derive per-category seeds from a master seed
 * (e.g. `hashSeed(master, 0x1001)` for constellations vs
 * `hashSeed(master, 0x1002)` for corruption).
 */
export function hashSeed(...inputs: number[]): number {
  let h = 0x811c9dc5;
  for (const input of inputs) {
    const n = Math.trunc(input) >>> 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h ^= (n >>> shift) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}

/** Grab a fresh random seed from the host's crypto source. */
export function randomSeed(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return 1 + (values[0] % 2147483646);
}

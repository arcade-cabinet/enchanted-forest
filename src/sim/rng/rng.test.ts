import { describe, expect, it } from "vitest";
import { createRng, hashSeed, randomSeed } from "./rng";

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const aSeq = Array.from({ length: 10 }, () => a());
    const bSeq = Array.from({ length: 10 }, () => b());
    expect(aSeq).toEqual(bSeq);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it("int(lo, hi) stays in range", () => {
    const r = createRng(123);
    for (let i = 0; i < 200; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("range(lo, hi) stays in range", () => {
    const r = createRng(456);
    for (let i = 0; i < 200; i++) {
      const v = r.range(1.5, 4.5);
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThan(4.5);
    }
  });

  it("pick returns an element of the array", () => {
    const r = createRng(789);
    const arr = ["a", "b", "c", "d"];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(r.pick(arr));
    }
  });

  it("pick on empty array throws", () => {
    const r = createRng(0);
    expect(() => r.pick([])).toThrow();
  });

  it("exposes the seed", () => {
    expect(createRng(12345).seed).toBe(12345);
  });
});

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed(1, 2, 3)).toBe(hashSeed(1, 2, 3));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(1, 2, 4));
  });

  it("returns a 32-bit unsigned int", () => {
    const h = hashSeed(0xdeadbeef, 0xcafebabe);
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("randomSeed", () => {
  it("returns a positive 32-bit-ish integer", () => {
    const s = randomSeed();
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThan(0);
  });
});

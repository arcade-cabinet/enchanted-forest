import { describe, expect, it } from "vitest";
import {
  ADJECTIVES_PRIMARY,
  ADJECTIVES_SECONDARY,
  CODENAME_SEED_MASK,
  NOUNS,
  codenameFromSeed,
  codenamePartsFromSeed,
  codenameSlug,
  dailySeed,
  seedFromCodename,
} from "./codename";

describe("codename word pools", () => {
  it("each pool has exactly 64 entries so 6-bit indices address the full pool", () => {
    expect(ADJECTIVES_PRIMARY).toHaveLength(64);
    expect(ADJECTIVES_SECONDARY).toHaveLength(64);
    expect(NOUNS).toHaveLength(64);
  });

  it("no duplicate words inside any pool", () => {
    expect(new Set(ADJECTIVES_PRIMARY).size).toBe(ADJECTIVES_PRIMARY.length);
    expect(new Set(ADJECTIVES_SECONDARY).size).toBe(ADJECTIVES_SECONDARY.length);
    expect(new Set(NOUNS).size).toBe(NOUNS.length);
  });
});

describe("codenameFromSeed", () => {
  it("is deterministic for a given seed", () => {
    expect(codenameFromSeed(12345)).toBe(codenameFromSeed(12345));
  });

  it("produces three title-cased words separated by spaces", () => {
    const name = codenameFromSeed(12345);
    const parts = name.split(" ");
    expect(parts).toHaveLength(3);
    for (const p of parts) {
      expect(p[0]).toBe(p[0].toUpperCase());
    }
  });

  it("spans multiple distinct codenames across small seed range", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      seen.add(codenameFromSeed(i));
    }
    expect(seen.size).toBeGreaterThan(100);
  });

  it("masks seed to 18 bits so larger seeds still map to the codename space", () => {
    const a = codenameFromSeed(0x1234);
    const b = codenameFromSeed(0x1234 | (1 << 20));
    // Same 18-bit payload → same codename.
    expect(a).toBe(b);
  });
});

describe("codenamePartsFromSeed", () => {
  it("decomposes a seed into its three words", () => {
    const parts = codenamePartsFromSeed(0);
    expect(ADJECTIVES_PRIMARY).toContain(parts.adjective1);
    expect(ADJECTIVES_SECONDARY).toContain(parts.adjective2);
    expect(NOUNS).toContain(parts.noun);
  });
});

describe("seedFromCodename", () => {
  it("round-trips every seed in [0, mask]", () => {
    // Sample 200 representative seeds rather than all 262144.
    for (let i = 0; i < 200; i++) {
      const seed = (i * 1319) & CODENAME_SEED_MASK;
      const codename = codenameFromSeed(seed);
      expect(seedFromCodename(codename)).toBe(seed);
    }
  });

  it("is case-insensitive and whitespace-tolerant", () => {
    const seed = 0x1234;
    const codename = codenameFromSeed(seed);
    expect(seedFromCodename(codename.toLowerCase())).toBe(seed);
    expect(seedFromCodename(codename.toUpperCase())).toBe(seed);
    expect(seedFromCodename(`  ${codename}  `)).toBe(seed);
  });

  it("accepts hyphenated slug form", () => {
    const seed = 0x1234;
    const codename = codenameFromSeed(seed);
    expect(seedFromCodename(codenameSlug(codename))).toBe(seed);
  });

  it("returns null for malformed input", () => {
    expect(seedFromCodename("not a codename")).toBeNull();
    expect(seedFromCodename("NotA Real Triple Codename")).toBeNull();
    expect(seedFromCodename("")).toBeNull();
  });
});

describe("codenameSlug", () => {
  it("produces lowercase-hyphenated form", () => {
    expect(codenameSlug("Patient Orrery Grove")).toBe("patient-orrery-grove");
  });
});

describe("dailySeed", () => {
  it("produces the same seed for the same calendar date", () => {
    const d = new Date(2026, 3, 24);
    expect(dailySeed(d)).toBe(dailySeed(new Date(2026, 3, 24)));
  });

  it("produces different seeds across days", () => {
    const a = dailySeed(new Date(2026, 3, 24));
    const b = dailySeed(new Date(2026, 3, 25));
    expect(a).not.toBe(b);
  });

  it("falls inside the codename seed mask", () => {
    const d = new Date(2026, 3, 24);
    expect(dailySeed(d)).toBeLessThanOrEqual(CODENAME_SEED_MASK);
    expect(dailySeed(d)).toBeGreaterThanOrEqual(0);
  });
});

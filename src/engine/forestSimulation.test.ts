import { describe, expect, test } from "vitest";
import { RUNE_PATTERNS } from "../lib/runePatterns";
import {
  advanceShadowPosition,
  analyzeRuneGesture,
  applyShadowHit,
  applySpellCast,
  createGroveLayout,
  createInitialForestState,
  getForestModeTuning,
  getForestRitualCue,
  getForestRunSummary,
  getForestSessionTargetMinutes,
  getForestSpellCadenceCue,
  getForestTransition,
  getShadowHitDamage,
  getShadowIntentPath,
  MAX_WAVES,
  regenerateMana,
  removePurifiedShadow,
  spawnCorruptionWave,
  TREE_POSITIONS,
} from "./forestSimulation";

describe("forest simulation", () => {
  test("creates a complete intro/play state and authored grove layout", () => {
    const state = createInitialForestState("playing");
    const layout = createGroveLayout();

    expect(state.phase).toBe("playing");
    expect(state.sessionMode).toBe("standard");
    expect(state.mana).toBe(state.maxMana);
    expect(state.trees).toHaveLength(3);
    expect(layout.trees).toEqual(TREE_POSITIONS);
    expect(layout.wardRings).toHaveLength(2);
    expect(layout.standingStones.map((stone) => stone.id)).toEqual([
      "stone-left",
      "stone-right",
      "stone-crown",
    ]);
  });

  test("spawns deterministic corruption waves with stable ids and targets", () => {
    const wave = spawnCorruptionWave(3, 10);
    const again = spawnCorruptionWave(3, 10);

    expect(wave).toEqual(again);
    expect(wave.shadows).toHaveLength(9);
    expect(wave.nextShadowId).toBe(19);
    expect(wave.shadows[0]?.id).toBe(10);
    expect(wave.shadows.every((shadow) => shadow.targetTreeIndex >= 0)).toBe(true);
  });

  test("uses session modes for shadow pressure and mana recovery", () => {
    const cozy = spawnCorruptionWave(3, 10, "cozy");
    const standard = spawnCorruptionWave(3, 10, "standard");
    const challenge = spawnCorruptionWave(3, 10, "challenge");

    expect(cozy.shadows[0]?.speed).toBeLessThan(standard.shadows[0]?.speed ?? 0);
    expect(challenge.shadows[0]?.speed).toBeGreaterThan(standard.shadows[0]?.speed ?? 0);
    expect(getForestModeTuning("cozy").manaRegenPerSecond).toBeGreaterThan(
      getForestModeTuning("standard").manaRegenPerSecond
    );
    expect(getForestModeTuning("challenge").targetMinutes).toBeLessThan(
      getForestModeTuning("standard").targetMinutes
    );
  });

  test("exposes deterministic shadow intent paths for target telegraphs", () => {
    const wave = spawnCorruptionWave(1, 10);
    const firstShadow = wave.shadows[0];
    if (!firstShadow) throw new Error("missing shadow");

    const intent = getShadowIntentPath(firstShadow);

    expect(intent.id).toBe(10);
    expect(intent.targetTreeId).toBe(TREE_POSITIONS[firstShadow.targetTreeIndex].id);
    expect(intent.targetX).toBeGreaterThan(0);
    expect(intent.alertLevel).toBeGreaterThanOrEqual(0);
    expect(intent.alertLevel).toBeLessThanOrEqual(1);
  });

  test("exposes ritual cues for shield, heal, and harmony decisions", () => {
    const threatenedTree = TREE_POSITIONS[1];
    const shadow = {
      id: 7,
      health: 24,
      maxHealth: 24,
      size: 34,
      speed: 0.7,
      targetTreeIndex: 1,
      x: threatenedTree.x,
      y: threatenedTree.y - 4,
    };
    const shieldCue = getForestRitualCue({
      ...createInitialForestState("playing"),
      shadows: [shadow],
      threatLevel: 44,
    });
    const healCue = getForestRitualCue({
      ...createInitialForestState("playing"),
      mana: 20,
      trees: [
        { health: 35, isShielded: false, maxHealth: 100 },
        { health: 90, isShielded: false, maxHealth: 100 },
        { health: 100, isShielded: false, maxHealth: 100 },
      ],
    });
    const harmonyCue = getForestRitualCue({
      ...createInitialForestState("playing"),
      harmonyLevel: 2,
      lastRuneType: "shield",
    });

    expect(shieldCue).toMatchObject({
      highestShadowAlert: 0.96,
      recommendedRune: "shield",
      recommendedTreeId: "heart-tree",
      threatBand: "critical",
    });
    expect(healCue).toMatchObject({
      manaNeeded: 30,
      manaReady: false,
      recommendedRune: "heal",
      recommendedTreeId: "left-grove",
    });
    expect(harmonyCue).toMatchObject({
      manaNeeded: 23,
      nextHarmonyRune: "heal",
      recommendedRune: "heal",
    });
    expect(harmonyCue.harmonyText).toContain("surge");
  });

  test("applies spells, mana costs, shield, heal, and purify zones", () => {
    const shield = RUNE_PATTERNS.find((rune) => rune.type === "shield");
    const heal = RUNE_PATTERNS.find((rune) => rune.type === "heal");
    const purify = RUNE_PATTERNS.find((rune) => rune.type === "purify");
    if (!shield || !heal || !purify) throw new Error("missing rune patterns");

    const damaged = {
      ...createInitialForestState("playing"),
      trees: [
        { health: 50, maxHealth: 100, isShielded: false },
        { health: 80, maxHealth: 100, isShielded: false },
        { health: 100, maxHealth: 100, isShielded: false },
      ],
    };
    const shielded = applySpellCast(damaged, shield);
    const healed = applySpellCast(damaged, heal);
    const purified = applySpellCast(damaged, purify);

    expect(shielded.mana).toBe(80);
    expect(shielded.trees.every((tree) => tree.isShielded)).toBe(true);
    expect(healed.trees[0]?.health).toBe(70);
    expect(healed.healingTreeIndex).toBe(0);
    expect(purified.purifyZone).toEqual({ x: 50, y: 50, radius: 30 });
  });

  test("builds harmony across alternating runes and amplifies the third spell", () => {
    const shield = RUNE_PATTERNS.find((rune) => rune.type === "shield");
    const heal = RUNE_PATTERNS.find((rune) => rune.type === "heal");
    const purify = RUNE_PATTERNS.find((rune) => rune.type === "purify");
    if (!shield || !heal || !purify) throw new Error("missing rune patterns");

    const shielded = applySpellCast(createInitialForestState("playing"), shield);
    const healed = applySpellCast(shielded, heal);
    const surged = applySpellCast(healed, purify);

    expect(healed.harmonyLevel).toBe(2);
    expect(surged.harmonyLevel).toBe(3);
    expect(surged.harmonySurgeActive).toBe(true);
    expect(surged.purifyZone?.radius).toBe(42);
    expect(surged.mana).toBe(37);
    expect(getForestSpellCadenceCue(shielded)).toMatchObject({
      beatPattern: ["root", "ward", "hold"],
      label: "Shield Chorus",
      motif: "ring",
      spellType: "shield",
    });
    expect(getForestSpellCadenceCue(healed)).toMatchObject({
      beatPattern: ["rise", "mend", "bloom"],
      label: "Healing Motif",
      motif: "ascending",
      spellType: "heal",
    });
    expect(getForestSpellCadenceCue(surged)).toMatchObject({
      beatPattern: ["mark", "flash", "clear"],
      harmonyBonusActive: true,
      label: "Purify Rhythm",
      motif: "zigzag",
      spellType: "purify",
    });
  });

  test("handles shadow movement, tree hits, purification, and wave transitions", () => {
    const spawned = spawnCorruptionWave(1, 0);
    const state = {
      ...createInitialForestState("playing"),
      shadows: spawned.shadows,
    };
    const firstShadow = spawned.shadows[0];
    if (!firstShadow) throw new Error("missing shadow");

    const moved = advanceShadowPosition(firstShadow, TREE_POSITIONS[firstShadow.targetTreeIndex]);
    const hit = applyShadowHit(state, firstShadow.id, firstShadow.targetTreeIndex);
    const purified = removePurifiedShadow(state, firstShadow.id);

    expect(moved.y).toBeGreaterThan(firstShadow.y);
    expect(hit.shadows).toHaveLength(2);
    expect(hit.trees[firstShadow.targetTreeIndex]?.health).toBe(97);
    expect(purified.shadows).toHaveLength(2);
    expect(getForestTransition({ ...state, shadows: [] }, MAX_WAVES)).toEqual({
      type: "next-wave",
      nextWave: 2,
    });
    expect(getForestTransition({ ...state, wave: MAX_WAVES, shadows: [] }, MAX_WAVES)).toEqual({
      type: "victory",
    });
  });

  test("keeps standard opening hits recoverable while challenge keeps full pressure", () => {
    const openingState = {
      ...createInitialForestState("playing", "standard"),
      elapsedMs: 30_000,
      shadows: Array.from({ length: 24 }, (_, index) => {
        const targetTreeIndex = index % TREE_POSITIONS.length;
        const target = TREE_POSITIONS[targetTreeIndex] ?? {
          canopyScale: 1,
          id: "fallback",
          x: 50,
          y: 77,
        };

        return {
          id: index,
          health: 20,
          maxHealth: 20,
          size: 30,
          speed: 0.5,
          targetTreeIndex,
          x: target.x,
          y: target.y,
        };
      }),
    };
    const hitState = openingState.shadows.reduce(
      (state, shadow) => applyShadowHit(state, shadow.id, shadow.targetTreeIndex),
      openingState
    );
    const challengeState = createInitialForestState("playing", "challenge");
    const lateState = {
      ...createInitialForestState("playing", "standard"),
      elapsedMs: 61_000,
    };

    expect(getShadowHitDamage(openingState)).toBe(3);
    expect(getShadowHitDamage(lateState)).toBe(10);
    expect(getShadowHitDamage(challengeState)).toBe(10);
    expect(hitState.trees.every((tree) => tree.health > 0)).toBe(true);
    expect(hitState.trees.every((tree) => tree.health >= 76)).toBe(true);
  });

  test("targets a longer couch ritual with summary telemetry", () => {
    const state = regenerateMana(createInitialForestState("playing", "standard"), 2, 125_000);
    const summary = getForestRunSummary({ ...state, wave: MAX_WAVES });

    expect(MAX_WAVES).toBeGreaterThanOrEqual(8);
    expect(getForestSessionTargetMinutes("standard")).toBeGreaterThanOrEqual(8);
    expect(getForestSessionTargetMinutes("standard")).toBeLessThanOrEqual(15);
    expect(summary).toMatchObject({
      elapsedSeconds: 125,
      healthyTrees: 3,
      targetMinutes: 10,
      totalWaves: MAX_WAVES,
      wave: MAX_WAVES,
    });
  });

  test("classifies rune gestures for shield, heal, and purify", () => {
    const circle = Array.from({ length: 36 }, (_, index) => {
      const angle = (index / 35) * Math.PI * 2;
      return { x: 0.5 + Math.cos(angle) * 0.24, y: 0.5 + Math.sin(angle) * 0.24 };
    });
    const upward = Array.from({ length: 24 }, (_, index) => ({
      x: 0.5 + Math.sin(index / 2) * 0.04,
      y: 0.86 - index * 0.028,
    }));
    const zigzag = Array.from({ length: 24 }, (_, index) => ({
      x: 0.2 + index * 0.026,
      y: index % 8 < 4 ? 0.25 + (index % 4) * 0.14 : 0.81 - (index % 4) * 0.14,
    }));

    expect(analyzeRuneGesture(circle)).toBe("shield");
    expect(analyzeRuneGesture(upward)).toBe("heal");
    expect(analyzeRuneGesture(zigzag)).toBe("purify");
  });
});

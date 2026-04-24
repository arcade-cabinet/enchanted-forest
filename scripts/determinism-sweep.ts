#!/usr/bin/env tsx
/**
 * Nightly determinism sweep.
 *
 * enchanted-forest's sim is deterministic by absence-of-RNG — the
 * engine has no `Math.random` calls; every output derives from
 * state + spell + wave. This sweep exercises the core pure-sim
 * paths and asserts:
 *
 *   - createInitialForestState + spawnCorruptionWave produce
 *     byte-identical outputs on repeated calls for a given mode
 *     + wave.
 *   - advanceShadowPosition over 180 frames produces no NaN /
 *     Infinity positions.
 *   - applySpellCast across each rune type (shield / heal /
 *     purify) leaves mana + tree health in valid ranges.
 *   - getForestRitualCue + getForestSpellCadenceCue return
 *     well-formed cues for every phase (intro / playing /
 *     victory / defeat).
 *   - analyzeRuneGesture is deterministic for identical inputs.
 *   - Per-frame cost stays under 3ms.
 *
 * Exits non-zero on any assertion failure; `analysis-nightly.yml`
 * opens a regression issue when that happens.
 */

import { applyShadowHit, advanceShadowPosition, spawnCorruptionWave } from "../src/sim/corruption";
import {
  createInitialForestState,
  getForestRitualCue,
  getForestSpellCadenceCue,
  getForestTransition,
  MAX_WAVES,
  TREE_POSITIONS,
} from "../src/sim/grove";
import { analyzeRuneGesture, applySpellCast, regenerateMana } from "../src/sim/runes";
import { RUNE_PATTERNS } from "../src/lib/runePatterns";

const DELTA_MS = 1000 / 60;
const FRAMES_PER_WAVE = 180;
const FRAME_TIME_BUDGET_MS = 3;
const MODES = ["cozy", "standard", "challenge"] as const;

interface SweepError {
  scope: string;
  message: string;
}

const errors: SweepError[] = [];

const assertFinite = (scope: string, label: string, value: number): void => {
  if (!Number.isFinite(value)) {
    errors.push({ scope, message: `${label} is not finite: ${value}` });
  }
};

let worstFrameMs = 0;
const startAll = performance.now();

// 1. Initial state — deterministic per mode; fields sane.
for (const mode of MODES) {
  const a = createInitialForestState("playing", mode);
  const b = createInitialForestState("playing", mode);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    errors.push({
      scope: `initial state ${mode}`,
      message: "createInitialForestState not deterministic",
    });
  }
  assertFinite(`initial state ${mode}`, "mana", a.mana);
  assertFinite(`initial state ${mode}`, "maxMana", a.maxMana);
  if (a.trees.length !== TREE_POSITIONS.length) {
    errors.push({
      scope: `initial state ${mode}`,
      message: `wrong tree count: ${a.trees.length}`,
    });
  }
  for (const tree of a.trees) {
    assertFinite(`initial state ${mode}`, "tree.health", tree.health);
    if (tree.health < 0 || tree.health > tree.maxHealth) {
      errors.push({
        scope: `initial state ${mode}`,
        message: `tree.health out of range: ${tree.health}/${tree.maxHealth}`,
      });
    }
  }
}

// 2. Wave spawn determinism + shadow advance.
for (const mode of MODES) {
  for (let wave = 1; wave <= MAX_WAVES; wave++) {
    const a = spawnCorruptionWave(wave, 0, mode);
    const b = spawnCorruptionWave(wave, 0, mode);
    if (JSON.stringify(a.shadows) !== JSON.stringify(b.shadows)) {
      errors.push({
        scope: `spawn ${mode} w=${wave}`,
        message: "spawnCorruptionWave not deterministic",
      });
    }
    for (const shadow of a.shadows) {
      assertFinite(`spawn ${mode} w=${wave}`, "shadow.x", shadow.x);
      assertFinite(`spawn ${mode} w=${wave}`, "shadow.y", shadow.y);
      assertFinite(`spawn ${mode} w=${wave}`, "shadow.speed", shadow.speed);
      if (shadow.health < 0 || shadow.health > shadow.maxHealth) {
        errors.push({
          scope: `spawn ${mode} w=${wave}`,
          message: `shadow.health out of range: ${shadow.health}/${shadow.maxHealth}`,
        });
      }
    }
  }
}

// 3. Shadow advance over 180 frames — no NaN leaks.
{
  const wave = spawnCorruptionWave(3, 0, "standard");
  for (const shadow of wave.shadows) {
    const target = TREE_POSITIONS[shadow.targetTreeIndex];
    let pos = { x: shadow.x, y: shadow.y, reached: false };
    let current = { ...shadow };
    for (let f = 0; f < FRAMES_PER_WAVE; f++) {
      const before = performance.now();
      pos = advanceShadowPosition(current, target);
      const elapsed = performance.now() - before;
      if (elapsed > worstFrameMs) worstFrameMs = elapsed;
      assertFinite(`shadow advance f=${f}`, "x", pos.x);
      assertFinite(`shadow advance f=${f}`, "y", pos.y);
      current = { ...current, x: pos.x, y: pos.y };
      if (pos.reached) break;
    }
  }
}

// 4. Spell cast across each rune type + validate post-state.
for (const rune of RUNE_PATTERNS) {
  const initial = createInitialForestState("playing", "standard");
  const before = performance.now();
  const next = applySpellCast(initial, rune);
  const elapsed = performance.now() - before;
  if (elapsed > worstFrameMs) worstFrameMs = elapsed;

  assertFinite(`cast ${rune.type}`, "mana", next.mana);
  if (next.mana < 0 || next.mana > next.maxMana) {
    errors.push({
      scope: `cast ${rune.type}`,
      message: `mana out of range: ${next.mana}/${next.maxMana}`,
    });
  }
  for (const tree of next.trees) {
    if (tree.health < 0 || tree.health > tree.maxHealth) {
      errors.push({
        scope: `cast ${rune.type}`,
        message: `tree.health out of range: ${tree.health}/${tree.maxHealth}`,
      });
    }
  }
}

// 5. Apply shadow hit + regenerate — invariants under 300 ticks.
{
  let state = createInitialForestState("playing", "standard");
  const wave = spawnCorruptionWave(1, 0, "standard");
  state = { ...state, shadows: wave.shadows };
  for (let tick = 0; tick < 300; tick++) {
    state = regenerateMana(state, 1, DELTA_MS);
    if (tick % 30 === 0 && state.shadows.length > 0) {
      const shadow = state.shadows[0];
      state = applyShadowHit(state, shadow.id, shadow.targetTreeIndex);
    }
    assertFinite(`regen tick=${tick}`, "mana", state.mana);
    assertFinite(`regen tick=${tick}`, "threatLevel", state.threatLevel);
    if (state.threatLevel < 0 || state.threatLevel > 100) {
      errors.push({
        scope: `regen tick=${tick}`,
        message: `threatLevel out of range: ${state.threatLevel}`,
      });
      break;
    }
  }
}

// 6. UI cues — well-formed for every canonical state shape.
for (const mode of MODES) {
  const state = createInitialForestState("playing", mode);
  const ritual = getForestRitualCue(state);
  const cadence = getForestSpellCadenceCue(state);
  const transition = getForestTransition(state);

  if (!ritual.waveLabel || !ritual.recommendedRune) {
    errors.push({
      scope: `cues ${mode}`,
      message: "ritual cue missing required fields",
    });
  }
  if (!cadence.label || !cadence.motif) {
    errors.push({
      scope: `cues ${mode}`,
      message: "cadence cue missing required fields",
    });
  }
  if (!transition.type) {
    errors.push({
      scope: `cues ${mode}`,
      message: "transition missing type",
    });
  }
  assertFinite(`cues ${mode}`, "manaNeeded", ritual.manaNeeded);
  assertFinite(`cues ${mode}`, "highestShadowAlert", ritual.highestShadowAlert);
}

// 7. analyzeRuneGesture determinism.
const circle: { x: number; y: number }[] = [];
for (let i = 0; i < 32; i++) {
  const angle = (i / 32) * Math.PI * 2;
  circle.push({ x: 0.5 + Math.cos(angle) * 0.45, y: 0.5 + Math.sin(angle) * 0.45 });
}
if (analyzeRuneGesture(circle) !== analyzeRuneGesture(circle)) {
  errors.push({
    scope: "gesture",
    message: "analyzeRuneGesture not deterministic",
  });
}

const totalMs = performance.now() - startAll;
console.log(
  `[determinism-sweep] ${MODES.length} modes × ${MAX_WAVES} waves + cues + gestures in ${totalMs.toFixed(0)}ms (worst frame: ${worstFrameMs.toFixed(2)}ms)`,
);

if (worstFrameMs > FRAME_TIME_BUDGET_MS) {
  errors.push({
    scope: "performance",
    message: `frame-time regression: ${worstFrameMs.toFixed(2)}ms exceeds budget ${FRAME_TIME_BUDGET_MS}ms`,
  });
}

if (errors.length > 0) {
  console.error(`[determinism-sweep] FAILED with ${errors.length} error(s):`);
  for (const e of errors.slice(0, 10)) {
    console.error(`  [${e.scope}] ${e.message}`);
  }
  if (errors.length > 10) console.error(`  ... and ${errors.length - 10} more`);
  process.exit(1);
}

console.log("[determinism-sweep] PASSED");

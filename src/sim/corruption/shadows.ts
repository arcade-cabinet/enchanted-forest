import { TREE_POSITIONS } from "@/sim/grove/constants";
import { getForestModeTuning } from "@/sim/grove/session";
import type {
  CorruptionShadow,
  ForestState,
  ShadowIntentPath,
  SpawnWaveResult,
  TreePosition,
} from "@/sim/grove/types";
import { clamp, round, updateThreat } from "@/sim/grove/utils";
import { createRng, hashSeed } from "@/sim/rng";

/**
 * Spawn a fresh wave of corruption shadows targeting the three
 * trees. Deterministic for a given (wave, startingShadowId, mode).
 */
export function spawnCorruptionWave(
  state: ForestState,
  wave: number,
  startingShadowId = 0,
  mode: string | null | undefined = "standard"
): SpawnWaveResult {
  const tuning = getForestModeTuning(mode);
  const count = wave * 3;
  const rng = createRng(hashSeed(state.seed, wave, 0x1002));
  const shadows = Array.from({ length: count }, (_, index): CorruptionShadow => {
    // Determine target via RNG instead of modulo
    const targetTreeIndex = rng.int(0, TREE_POSITIONS.length - 1);
    const target = TREE_POSITIONS[targetTreeIndex];
    const columnOffset = rng.range(-15, 15);
    const row = Math.floor(index / 3);

    return {
      id: startingShadowId + index,
      x: clamp(target.x + columnOffset, 8, 92),
      y: -12 - row * 7 - wave * 2,
      targetTreeIndex,
      health: 20 + wave * 2,
      maxHealth: 20 + wave * 2,
      speed: round(rng.range(0.5, 0.6) * tuning.shadowSpeedScale + wave * 0.05, 3),
      size: rng.int(30, 48),
    };
  });

  return {
    shadows,
    nextShadowId: startingShadowId + shadows.length,
  };
}

/**
 * Single-frame shadow step toward its target tree. Returns the new
 * position + a `reached` flag when the shadow is close enough to
 * damage the tree.
 */
export function advanceShadowPosition(
  shadow: CorruptionShadow,
  treePosition: TreePosition,
  stepScale = 0.3
): { x: number; y: number; reached: boolean } {
  const dx = treePosition.x - shadow.x;
  const dy = treePosition.y - shadow.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 3) {
    return { x: shadow.x, y: shadow.y, reached: true };
  }

  return {
    x: shadow.x + (dx / distance) * shadow.speed * stepScale,
    y: shadow.y + (dy / distance) * shadow.speed * stepScale,
    reached: false,
  };
}

export function getShadowIntentPath(shadow: CorruptionShadow): ShadowIntentPath {
  const target = TREE_POSITIONS[shadow.targetTreeIndex] ?? TREE_POSITIONS[0];
  const distance = Math.hypot(target.x - shadow.x, target.y - shadow.y);

  return {
    alertLevel: clamp(1 - distance / 92, 0, 1),
    fromX: shadow.x,
    fromY: shadow.y,
    id: shadow.id,
    targetTreeId: target.id,
    targetX: target.x,
    targetY: target.y,
  };
}

export function getShadowHitDamage(state: ForestState): number {
  const tuning = getForestModeTuning(state.sessionMode);
  const openingScale = state.elapsedMs < tuning.openingGraceMs ? tuning.openingDamageScale : 1;

  return Math.max(1, Math.round(tuning.shadowHitDamage * openingScale));
}

export function applyShadowHit(
  state: ForestState,
  shadowId: number,
  treeIndex: number
): ForestState {
  const damage = getShadowHitDamage(state);
  const nextTrees = state.trees.map((tree, index) => {
    if (index !== treeIndex || tree.isShielded) return tree;

    return {
      ...tree,
      health: Math.max(0, tree.health - damage),
    };
  });

  return updateThreat({
    ...state,
    trees: nextTrees,
    shadows: state.shadows.filter((shadow) => shadow.id !== shadowId),
  });
}

export function removePurifiedShadow(state: ForestState, shadowId: number): ForestState {
  return updateThreat({
    ...state,
    shadows: state.shadows.filter((shadow) => shadow.id !== shadowId),
  });
}

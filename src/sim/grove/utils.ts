import { TREE_POSITIONS } from "./constants";
import type { CorruptionShadow, ForestState, GroveTreeState } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, precision: number): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Recompute `threatLevel` from current shadows + tree health and
 * promote the objective string when the line is breaking. Pure.
 */
export function updateThreat(state: ForestState): ForestState {
  const averageTreeHealth =
    state.trees.reduce((sum, tree) => sum + tree.health / tree.maxHealth, 0) /
    state.trees.length;
  const threatLevel = clamp(
    Math.round((state.shadows.length * 7 + (1 - averageTreeHealth) * 50) * 10) / 10,
    0,
    100
  );

  return {
    ...state,
    threatLevel,
    objective:
      threatLevel > 55
        ? "Corruption is breaking the ward line. Purify or shield now."
        : state.objective,
  };
}

export function findWeakestTreeIndex(trees: GroveTreeState[]): number {
  return trees.reduce((weakestIndex, tree, index) => {
    const weakest = trees[weakestIndex];
    return tree.health / tree.maxHealth < weakest.health / weakest.maxHealth
      ? index
      : weakestIndex;
  }, 0);
}

export function getShadowTargetDistance(shadow: CorruptionShadow): number {
  const target = TREE_POSITIONS[shadow.targetTreeIndex] ?? TREE_POSITIONS[0];
  return Math.hypot(target.x - shadow.x, target.y - shadow.y);
}

import { normalizeSessionMode } from "@/lib/sessionMode";
import { FOREST_MODE_TUNING, MAX_WAVES } from "./constants";
import type { ForestModeTuning, ForestState } from "./types";

export function getForestSessionTargetMinutes(
  mode: string | null | undefined = "standard"
): number {
  return getForestModeTuning(mode).targetMinutes;
}

export function getForestModeTuning(mode: string | null | undefined): ForestModeTuning {
  return FOREST_MODE_TUNING[normalizeSessionMode(mode)];
}

export function getForestTransition(
  state: ForestState,
  maxWaves = MAX_WAVES
): { type: "none" | "next-wave" | "victory" | "defeat"; nextWave?: number } {
  if (state.phase !== "playing") return { type: "none" };

  if (state.trees.every((tree) => tree.health <= 0)) {
    return { type: "defeat" };
  }

  if (state.shadows.length === 0 && state.wave < maxWaves) {
    return { type: "next-wave", nextWave: state.wave + 1 };
  }

  if (state.shadows.length === 0 && state.wave === maxWaves) {
    return { type: "victory" };
  }

  return { type: "none" };
}

export function getForestRunSummary(state: ForestState) {
  const healthyTrees = state.trees.filter((tree) => tree.health > 0).length;

  return {
    elapsedSeconds: Math.round(state.elapsedMs / 1000),
    healthyTrees,
    harmonyLevel: state.harmonyLevel,
    targetMinutes: getForestSessionTargetMinutes(state.sessionMode),
    totalWaves: MAX_WAVES,
    wave: state.wave,
  };
}

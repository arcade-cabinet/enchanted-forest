import { getShadowIntentPath } from "@/sim/corruption/shadows";
import { MAX_WAVES, RUNE_BASE_COSTS, TREE_POSITIONS } from "./constants";
import type {
  CorruptionShadow,
  ForestRitualCue,
  ForestSpellCadenceCue,
  ForestState,
  ForestThreatBand,
  RuneType,
  ShadowIntentPath,
  TreePosition,
} from "./types";
import {
  clamp,
  findWeakestTreeIndex,
  getShadowTargetDistance,
  round,
} from "./utils";

/**
 * Derive the top-of-HUD "what the grove wants you to do now" cue.
 * Pure — pulls only from ForestState. The cue surfaces the
 * recommended rune, target tree, threat band, mana readiness, and
 * the harmony-surge path.
 */
export function getForestRitualCue(state: ForestState): ForestRitualCue {
  const intents = state.shadows.map((shadow) => ({
    ...getShadowIntentPath(shadow),
    distance: getShadowTargetDistance(shadow),
    targetTreeIndex: shadow.targetTreeIndex,
  }));
  const mostAlertIntent = intents.reduce<
    (ShadowIntentPath & { distance: number; targetTreeIndex: number }) | null
  >((mostAlert, intent) => {
    if (!mostAlert) return intent;
    return intent.alertLevel > mostAlert.alertLevel ? intent : mostAlert;
  }, null);
  const highestShadowAlert = round(mostAlertIntent?.alertLevel ?? 0, 2);
  const nearestShadowDistance =
    intents.length > 0 ? round(Math.min(...intents.map((intent) => intent.distance)), 1) : null;
  const weakestTreeIndex = findWeakestTreeIndex(state.trees);
  const weakestTree = state.trees[weakestTreeIndex] ?? state.trees[0];
  const weakestTreeRatio = weakestTree ? weakestTree.health / weakestTree.maxHealth : 1;
  const threatenedTreeIndex =
    mostAlertIntent?.targetTreeIndex ?? selectMostThreatenedTreeIndex(state.shadows);
  const threatBand = getForestThreatBand(state, highestShadowAlert, weakestTreeRatio);
  const nextHarmonyRune = getNextHarmonyRune(state);
  const recommendedRune = selectRecommendedRune({
    nextHarmonyRune,
    state,
    threatenedTreeIndex,
    threatBand,
    weakestTreeIndex,
    weakestTreeRatio,
  });
  const targetTreeIndex =
    recommendedRune === "purify"
      ? null
      : recommendedRune === "heal"
        ? weakestTreeIndex
        : threatenedTreeIndex;
  const targetTree = targetTreeIndex === null ? null : TREE_POSITIONS[targetTreeIndex];
  const manaNeeded = getRuneManaCostForType(state, recommendedRune);

  return {
    focusRadius: recommendedRune === "purify" ? 32 : 11,
    focusX: targetTree?.x ?? 50,
    focusY: targetTree?.y ?? 52,
    harmonyText: describeHarmonyCue(state, nextHarmonyRune),
    highestShadowAlert,
    manaNeeded,
    manaReady: state.mana >= manaNeeded,
    nearestShadowDistance,
    nextHarmonyRune,
    objective: describeRitualCueObjective({
      recommendedRune,
      state,
      targetTree,
      threatBand,
    }),
    recommendedRune,
    recommendedTreeId: targetTree?.id ?? null,
    recommendedTreeIndex: targetTreeIndex,
    threatBand,
    waveLabel: `Wave ${state.wave}/${MAX_WAVES}`,
  };
}

/**
 * The visual-cadence cue shown to players who prefer visual over
 * audio feedback (reduced-motion players, muted-audio players).
 * Pure — reads only lastRune / lastRuneType / harmonySurgeActive.
 */
export function getForestSpellCadenceCue(state: ForestState): ForestSpellCadenceCue {
  if (!state.lastRuneType) {
    return {
      beatPattern: ["listen", "draw", "answer"],
      color: "#a7f3d0",
      fallbackText: "Visual cadence ready.",
      harmonyBonusActive: false,
      intensity: 0.32,
      label: "Listening Grove",
      motif: "listening",
      spellType: null,
    };
  }

  const recent = state.lastRune !== null;
  const intensity = state.harmonySurgeActive ? 1 : recent ? 0.82 : 0.52;

  if (state.lastRuneType === "shield") {
    return {
      beatPattern: ["root", "ward", "hold"],
      color: "#4ade80",
      fallbackText: "Shield pulses as visible ward rings.",
      harmonyBonusActive: state.harmonySurgeActive,
      intensity,
      label: "Shield Chorus",
      motif: "ring",
      spellType: "shield",
    };
  }

  if (state.lastRuneType === "heal") {
    return {
      beatPattern: ["rise", "mend", "bloom"],
      color: "#a78bfa",
      fallbackText: "Heal climbs as visible root light.",
      harmonyBonusActive: state.harmonySurgeActive,
      intensity,
      label: "Healing Motif",
      motif: "ascending",
      spellType: "heal",
    };
  }

  return {
    beatPattern: ["mark", "flash", "clear"],
    color: "#fbbf24",
    fallbackText: "Purify flashes as a visible ward break.",
    harmonyBonusActive: state.harmonySurgeActive,
    intensity,
    label: "Purify Rhythm",
    motif: "zigzag",
    spellType: "purify",
  };
}

function selectMostThreatenedTreeIndex(shadows: CorruptionShadow[]): number {
  if (shadows.length === 0) return 1;

  const threatByTree = shadows.reduce(
    (totals, shadow) => {
      const distance = getShadowTargetDistance(shadow);
      const targetIndex = Math.round(clamp(shadow.targetTreeIndex, 0, TREE_POSITIONS.length - 1));
      totals[targetIndex] = (totals[targetIndex] ?? 0) + 1 + Math.max(0, 1 - distance / 92);
      return totals;
    },
    [0, 0, 0]
  );

  return threatByTree.reduce(
    (highestIndex, threat, index) =>
      threat > (threatByTree[highestIndex] ?? 0) ? index : highestIndex,
    0
  );
}

function getForestThreatBand(
  state: ForestState,
  highestShadowAlert: number,
  weakestTreeRatio: number
): ForestThreatBand {
  if (state.threatLevel >= 58 || highestShadowAlert >= 0.72 || weakestTreeRatio <= 0.32) {
    return "critical";
  }
  if (state.threatLevel >= 28 || highestShadowAlert >= 0.42 || weakestTreeRatio <= 0.68) {
    return "pressing";
  }
  return "calm";
}

function getNextHarmonyRune(state: ForestState): RuneType | null {
  if (state.lastRuneType === null || state.harmonyLevel <= 0) return null;
  const rotation: RuneType[] = ["shield", "heal", "purify"];
  return rotation.find((rune) => rune !== state.lastRuneType) ?? null;
}

function selectRecommendedRune({
  nextHarmonyRune,
  state,
  threatenedTreeIndex,
  threatBand,
  weakestTreeIndex,
  weakestTreeRatio,
}: {
  nextHarmonyRune: RuneType | null;
  state: ForestState;
  threatenedTreeIndex: number;
  threatBand: ForestThreatBand;
  weakestTreeIndex: number;
  weakestTreeRatio: number;
}): RuneType {
  if (weakestTreeRatio <= 0.58) return "heal";

  const threatenedTree = state.trees[threatenedTreeIndex];
  if (
    state.shadows.length > 0 &&
    threatBand !== "calm" &&
    threatenedTree &&
    !threatenedTree.isShielded
  ) {
    return "shield";
  }

  if (state.shadows.length > 0) return "purify";

  const weakestTree = state.trees[weakestTreeIndex];
  if (weakestTree && weakestTree.health < weakestTree.maxHealth) {
    return "heal";
  }

  return nextHarmonyRune ?? "shield";
}

function getRuneManaCostForType(state: ForestState, runeType: RuneType): number {
  const baseCost = RUNE_BASE_COSTS[runeType];
  const alternating = state.lastRuneType !== null && state.lastRuneType !== runeType;
  const harmonyDiscount = alternating && state.harmonyLevel >= 2 ? 0.75 : 1;

  return Math.ceil(baseCost * harmonyDiscount);
}

function describeHarmonyCue(state: ForestState, nextHarmonyRune: RuneType | null): string {
  if (state.harmonySurgeActive) return "Surge echo is active";
  if (state.harmonyLevel >= 2 && nextHarmonyRune) {
    return `Draw ${nextHarmonyRune} next to trigger a surge`;
  }
  if (state.harmonyLevel === 1 && nextHarmonyRune) {
    return `Alternate into ${nextHarmonyRune} to build harmony`;
  }
  return "Alternate rune types to build harmony";
}

function describeRitualCueObjective({
  recommendedRune,
  state,
  targetTree,
  threatBand,
}: {
  recommendedRune: RuneType;
  state: ForestState;
  targetTree: TreePosition | null;
  threatBand: ForestThreatBand;
}): string {
  if (recommendedRune === "heal" && targetTree) {
    return `Heal ${targetTree.id.replace("-", " ")} before the next shadow hit.`;
  }
  if (recommendedRune === "shield" && targetTree) {
    return `Shield ${targetTree.id.replace("-", " ")} while the path is readable.`;
  }
  if (recommendedRune === "purify" && state.shadows.length > 0) {
    return threatBand === "critical"
      ? "Draw purify through the center to break the critical wave."
      : "Draw purify across the center while shadows are in the ward.";
  }
  return "Open with a shield rune and alternate spells for harmony.";
}

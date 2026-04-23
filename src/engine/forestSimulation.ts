import { normalizeSessionMode, type SessionMode } from "@/lib/sessionMode";
import type { RunePattern } from "../lib/runePatterns";

export type ForestPhase = "intro" | "tutorial" | "playing" | "victory" | "defeat";
export type RuneType = RunePattern["type"];

export interface TreePosition {
  id: string;
  x: number;
  y: number;
  canopyScale: number;
}

export interface GroveTreeState {
  health: number;
  maxHealth: number;
  isShielded: boolean;
}

export interface CorruptionShadow {
  id: number;
  x: number;
  y: number;
  targetTreeIndex: number;
  health: number;
  maxHealth: number;
  speed: number;
  size: number;
}

export interface PurifyZone {
  x: number;
  y: number;
  radius: number;
}

export interface ShadowIntentPath {
  id: number;
  alertLevel: number;
  fromX: number;
  fromY: number;
  targetTreeId: string;
  targetX: number;
  targetY: number;
}

export type ForestThreatBand = "calm" | "pressing" | "critical";

export interface ForestRitualCue {
  waveLabel: string;
  recommendedRune: RuneType;
  recommendedTreeIndex: number | null;
  recommendedTreeId: string | null;
  focusX: number;
  focusY: number;
  focusRadius: number;
  threatBand: ForestThreatBand;
  highestShadowAlert: number;
  nearestShadowDistance: number | null;
  manaReady: boolean;
  manaNeeded: number;
  nextHarmonyRune: RuneType | null;
  harmonyText: string;
  objective: string;
}

export interface ForestSpellCadenceCue {
  spellType: RuneType | null;
  label: string;
  motif: "ascending" | "ring" | "zigzag" | "listening";
  color: string;
  beatPattern: string[];
  intensity: number;
  harmonyBonusActive: boolean;
  fallbackText: string;
}

export interface ForestState {
  phase: ForestPhase;
  sessionMode: SessionMode;
  elapsedMs: number;
  wave: number;
  mana: number;
  maxMana: number;
  trees: GroveTreeState[];
  shadows: CorruptionShadow[];
  lastRune: string | null;
  lastRuneType: RuneType | null;
  lastSpellCastMs: number;
  harmonyLevel: number;
  harmonySurgeActive: boolean;
  purifyZone: PurifyZone | null;
  healingTreeIndex: number | null;
  objective: string;
  threatLevel: number;
}

export interface SpawnWaveResult {
  shadows: CorruptionShadow[];
  nextShadowId: number;
}

export interface ForestModeTuning {
  manaRegenPerSecond: number;
  openingDamageScale: number;
  openingGraceMs: number;
  shadowHitDamage: number;
  shadowSpeedScale: number;
  targetMinutes: number;
}

export const MAX_WAVES = 8;
const RUNE_BASE_COSTS: Record<RuneType, number> = {
  heal: 30,
  purify: 25,
  shield: 20,
};
const FOREST_MODE_TUNING: Record<SessionMode, ForestModeTuning> = {
  challenge: {
    manaRegenPerSecond: 0.72,
    openingDamageScale: 1,
    openingGraceMs: 0,
    shadowHitDamage: 10,
    shadowSpeedScale: 1.26,
    targetMinutes: 8,
  },
  cozy: {
    manaRegenPerSecond: 1.55,
    openingDamageScale: 0.2,
    openingGraceMs: 75_000,
    shadowHitDamage: 8,
    shadowSpeedScale: 0.78,
    targetMinutes: 12,
  },
  standard: {
    manaRegenPerSecond: 1,
    openingDamageScale: 0.3,
    openingGraceMs: 60_000,
    shadowHitDamage: 10,
    shadowSpeedScale: 1,
    targetMinutes: 10,
  },
};
export const TREE_POSITIONS: TreePosition[] = [
  { id: "left-grove", x: 30, y: 73, canopyScale: 1.02 },
  { id: "heart-tree", x: 50, y: 77, canopyScale: 1.18 },
  { id: "right-grove", x: 64, y: 73, canopyScale: 1.02 },
];

const DEFAULT_OBJECTIVE = "Draw musical runes over the grove before corruption reaches the roots.";

export function createInitialForestState(
  phase: ForestPhase = "intro",
  mode: string | null | undefined = "standard"
): ForestState {
  return {
    elapsedMs: 0,
    phase,
    sessionMode: normalizeSessionMode(mode),
    wave: 1,
    mana: 100,
    maxMana: 100,
    trees: createInitialTreeStates(),
    shadows: [],
    lastRune: null,
    lastRuneType: null,
    lastSpellCastMs: 0,
    harmonyLevel: 0,
    harmonySurgeActive: false,
    purifyZone: null,
    healingTreeIndex: null,
    objective: DEFAULT_OBJECTIVE,
    threatLevel: 0,
  };
}

export function createInitialTreeStates(): GroveTreeState[] {
  return TREE_POSITIONS.map(() => ({ health: 100, maxHealth: 100, isShielded: false }));
}

export function createGroveLayout() {
  return {
    trees: TREE_POSITIONS,
    roots: [
      { id: "left-root", x: 34, y: 82, width: 28, rotate: -9 },
      { id: "heart-root", x: 50, y: 84, width: 36, rotate: 0 },
      { id: "right-root", x: 66, y: 82, width: 28, rotate: 9 },
    ],
    wardRings: [
      { id: "outer-ward", x: 50, y: 73, width: 72, height: 34, color: "#fbbf24" },
      { id: "inner-ward", x: 50, y: 73, width: 46, height: 20, color: "#a78bfa" },
    ],
    standingStones: [
      { id: "stone-left", x: 16, y: 77, height: 18, color: "#1f3f36" },
      { id: "stone-right", x: 84, y: 77, height: 18, color: "#1f3f36" },
      { id: "stone-crown", x: 50, y: 52, height: 12, color: "#26493f" },
    ],
  };
}

export function spawnCorruptionWave(
  wave: number,
  startingShadowId = 0,
  mode: string | null | undefined = "standard"
): SpawnWaveResult {
  const tuning = getForestModeTuning(mode);
  const count = wave * 3;
  const shadows = Array.from({ length: count }, (_, index): CorruptionShadow => {
    const targetTreeIndex = (index + wave) % TREE_POSITIONS.length;
    const target = TREE_POSITIONS[targetTreeIndex];
    const columnOffset = ((index % 3) - 1) * (7 + wave * 0.7);
    const row = Math.floor(index / 3);

    return {
      id: startingShadowId + index,
      x: clamp(target.x + columnOffset + wave * 1.3, 8, 92),
      y: -12 - row * 7 - wave * 2,
      targetTreeIndex,
      health: 20 + wave * 2,
      maxHealth: 20 + wave * 2,
      speed: round((0.5 + wave * 0.065 + (index % 2) * 0.04) * tuning.shadowSpeedScale, 3),
      size: 30 + ((wave * 7 + index * 5) % 18),
    };
  });

  return {
    shadows,
    nextShadowId: startingShadowId + shadows.length,
  };
}

export function regenerateMana(state: ForestState, amount = 1, deltaMs = 1000): ForestState {
  if (state.phase !== "playing") return state;

  return {
    ...state,
    elapsedMs: state.elapsedMs + Math.max(0, deltaMs),
    mana: clamp(state.mana + amount, 0, state.maxMana),
  };
}

export function canCastSpell(state: ForestState, spell: RunePattern): boolean {
  return state.phase === "playing" && state.mana >= getSpellManaCost(state, spell);
}

export function getSpellManaCost(state: ForestState, spell: RunePattern): number {
  const alternating = state.lastRuneType !== null && state.lastRuneType !== spell.type;
  const harmonyDiscount = alternating && state.harmonyLevel >= 2 ? 0.75 : 1;

  return Math.ceil(spell.manaCost * harmonyDiscount);
}

export function applySpellCast(state: ForestState, spell: RunePattern): ForestState {
  if (!canCastSpell(state, spell)) return state;

  const alternating = state.lastRuneType !== null && state.lastRuneType !== spell.type;
  const harmonyLevel = alternating ? Math.min(3, state.harmonyLevel + 1) : 1;
  const harmonySurgeActive = harmonyLevel >= 3;
  const mana = clamp(
    state.mana - getSpellManaCost(state, spell) + (harmonySurgeActive ? 6 : 0),
    0,
    state.maxMana
  );
  const base = {
    ...state,
    harmonyLevel,
    harmonySurgeActive,
    lastSpellCastMs: state.elapsedMs,
    lastRuneType: spell.type,
    mana,
    lastRune: spell.name,
    objective: describeObjective(state, spell.type, harmonySurgeActive),
  };

  if (spell.type === "shield") {
    return {
      ...base,
      trees: state.trees.map((tree) => ({
        ...tree,
        health: harmonySurgeActive ? Math.min(tree.maxHealth, tree.health + 6) : tree.health,
        isShielded: true,
      })),
    };
  }

  if (spell.type === "heal") {
    const healAmount = harmonySurgeActive ? 35 : 20;
    return {
      ...base,
      trees: state.trees.map((tree) => ({
        ...tree,
        health: Math.min(tree.maxHealth, tree.health + healAmount),
      })),
      healingTreeIndex: findWeakestTreeIndex(state.trees),
    };
  }

  return {
    ...base,
    purifyZone: { x: 50, y: 50, radius: harmonySurgeActive ? 42 : 30 },
  };
}

export function clearRuneFeedback(state: ForestState): ForestState {
  return { ...state, harmonySurgeActive: false, lastRune: null };
}

export function clearShield(state: ForestState): ForestState {
  return {
    ...state,
    trees: state.trees.map((tree) => ({ ...tree, isShielded: false })),
  };
}

export function clearHealing(state: ForestState): ForestState {
  return { ...state, healingTreeIndex: null };
}

export function clearPurifyZone(state: ForestState): ForestState {
  return { ...state, purifyZone: null };
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

export function getForestSessionTargetMinutes(mode: string | null | undefined = "standard") {
  return getForestModeTuning(mode).targetMinutes;
}

export function getForestModeTuning(mode: string | null | undefined): ForestModeTuning {
  return FOREST_MODE_TUNING[normalizeSessionMode(mode)];
}

export function getShadowHitDamage(state: ForestState): number {
  const tuning = getForestModeTuning(state.sessionMode);
  const openingScale = state.elapsedMs < tuning.openingGraceMs ? tuning.openingDamageScale : 1;

  return Math.max(1, Math.round(tuning.shadowHitDamage * openingScale));
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

export function analyzeRuneGesture(points: { x: number; y: number }[]): RuneType | null {
  if (points.length < 20) return null;

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const distances = points.map((point) => Math.hypot(point.x - centerX, point.y - centerY));
  const avgDistance = distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
  const distanceVariance =
    distances.reduce((sum, distance) => sum + (distance - avgDistance) ** 2, 0) / distances.length;
  const isCircular = distanceVariance < 0.003 && width > 0.15 && height > 0.15;
  const startY = points.slice(0, 5).reduce((sum, point) => sum + point.y, 0) / 5;
  const endY = points.slice(-5).reduce((sum, point) => sum + point.y, 0) / 5;
  const isUpward = startY - endY > 0.2 && height > 0.25;
  let directionChanges = 0;
  let verticalDirectionChanges = 0;
  let lastDirection = 0;
  let lastVerticalDirection = 0;
  let pathLength = 0;

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current) {
      pathLength += Math.hypot(current.x - previous.x, current.y - previous.y);
    }
  }

  for (let index = 10; index < points.length; index += 5) {
    const previous = points[index - 10];
    const current = points[index];
    if (!previous || !current) continue;

    const dx = current.x - previous.x;
    const currentDirection = dx > 0.02 ? 1 : dx < -0.02 ? -1 : 0;
    if (currentDirection !== 0 && currentDirection !== lastDirection && lastDirection !== 0) {
      directionChanges++;
    }
    if (currentDirection !== 0) lastDirection = currentDirection;

    const dy = current.y - previous.y;
    const currentVerticalDirection = dy > 0.02 ? 1 : dy < -0.02 ? -1 : 0;
    if (
      currentVerticalDirection !== 0 &&
      currentVerticalDirection !== lastVerticalDirection &&
      lastVerticalDirection !== 0
    ) {
      verticalDirectionChanges++;
    }
    if (currentVerticalDirection !== 0) lastVerticalDirection = currentVerticalDirection;
  }

  const pathRatio = pathLength / Math.max(0.001, Math.hypot(width, height));
  const isZigzag =
    directionChanges + verticalDirectionChanges >= 2 && width > 0.2 && pathRatio > 2.4;

  if (isCircular) return "shield";
  if (isUpward) return "heal";
  if (isZigzag) return "purify";

  return null;
}

function updateThreat(state: ForestState): ForestState {
  const averageTreeHealth =
    state.trees.reduce((sum, tree) => sum + tree.health / tree.maxHealth, 0) / state.trees.length;
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

function findWeakestTreeIndex(trees: GroveTreeState[]): number {
  return trees.reduce((weakestIndex, tree, index) => {
    const weakest = trees[weakestIndex];
    return tree.health / tree.maxHealth < weakest.health / weakest.maxHealth ? index : weakestIndex;
  }, 0);
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

function getShadowTargetDistance(shadow: CorruptionShadow): number {
  const target = TREE_POSITIONS[shadow.targetTreeIndex] ?? TREE_POSITIONS[0];
  return Math.hypot(target.x - shadow.x, target.y - shadow.y);
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

function describeObjective(
  state: ForestState,
  spellType: RuneType,
  harmonySurgeActive = false
): string {
  if (harmonySurgeActive) {
    return "Harmony surge active. The grove echoes the spell with extra force.";
  }
  if (spellType === "shield") return "Shield chorus raised. Hold the line while mana returns.";
  if (spellType === "heal") return "Healing motif restored root light across the grove.";
  if (state.shadows.length > 0)
    return "Purification field active. Keep corruption inside the circle.";

  return DEFAULT_OBJECTIVE;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision: number) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

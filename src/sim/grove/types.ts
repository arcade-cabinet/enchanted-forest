import type { SessionMode } from "@/lib/sessionMode";
import type { RunePattern } from "@/lib/runePatterns";

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

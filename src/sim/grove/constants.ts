import type { SessionMode } from "@/lib/sessionMode";
import type { ForestModeTuning, RuneType, TreePosition } from "./types";

export const MAX_WAVES = 8;

export const RUNE_BASE_COSTS: Record<RuneType, number> = {
  heal: 30,
  purify: 25,
  shield: 20,
};

export const FOREST_MODE_TUNING: Record<SessionMode, ForestModeTuning> = {
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

export const DEFAULT_OBJECTIVE =
  "Draw musical runes over the grove before corruption reaches the roots.";

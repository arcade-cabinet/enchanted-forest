import { normalizeSessionMode } from "@/lib/sessionMode";
import { DEFAULT_OBJECTIVE, TREE_POSITIONS } from "./constants";
import type { ForestPhase, ForestState, GroveTreeState } from "./types";

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

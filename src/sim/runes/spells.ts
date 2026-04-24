import type { RunePattern } from "@/lib/runePatterns";
import { DEFAULT_OBJECTIVE } from "@/sim/grove/constants";
import type { ForestState, RuneType } from "@/sim/grove/types";
import { clamp, findWeakestTreeIndex } from "@/sim/grove/utils";

export function canCastSpell(state: ForestState, spell: RunePattern): boolean {
  return state.phase === "playing" && state.mana >= getSpellManaCost(state, spell);
}

export function getSpellManaCost(state: ForestState, spell: RunePattern): number {
  const alternating = state.lastRuneType !== null && state.lastRuneType !== spell.type;
  const harmonyDiscount = alternating && state.harmonyLevel >= 2 ? 0.75 : 1;

  return Math.ceil(spell.manaCost * harmonyDiscount);
}

export function regenerateMana(state: ForestState, amount = 1, deltaMs = 1000): ForestState {
  if (state.phase !== "playing") return state;

  return {
    ...state,
    elapsedMs: state.elapsedMs + Math.max(0, deltaMs),
    mana: clamp(state.mana + amount, 0, state.maxMana),
  };
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

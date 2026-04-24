import { COMPILED_RUNES } from "@config/compiled/content";

export interface RunePattern {
  name: string;
  type: "shield" | "heal" | "purify";
  description: string;
  templatePoints: { x: number; y: number }[];
  tolerance: number;
  color: string;
  glowColor: string;
  manaCost: number;
  duration: number;
}

// The generated `as const` array is deeply-readonly; re-project to
// the public mutable-interface shape so callers that spread across
// templatePoints don't fight variance. Authored JSON lives at
// config/raw/runes/*.json — do not edit runes here.
export const RUNE_PATTERNS: RunePattern[] = COMPILED_RUNES.map((r) => ({
  name: r.name,
  type: r.type,
  description: r.description,
  templatePoints: r.templatePoints.map((p) => ({ x: p.x, y: p.y })),
  tolerance: r.tolerance,
  color: r.color,
  glowColor: r.glowColor,
  manaCost: r.manaCost,
  duration: r.duration,
}));

export function getRuneByType(type: RunePattern["type"]): RunePattern | undefined {
  return RUNE_PATTERNS.find((r) => r.type === type);
}

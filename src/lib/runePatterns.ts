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

export const RUNE_PATTERNS: RunePattern[] = [
  {
    name: "Shield",
    type: "shield",
    description: "Draw a circle to create a protective barrier",
    templatePoints: generateCirclePoints(16),
    tolerance: 0.35,
    color: "#4ade80",
    glowColor: "rgba(74, 222, 128, 0.6)",
    manaCost: 20,
    duration: 5000,
  },
  {
    name: "Heal",
    type: "heal",
    description: "Draw an upward triangle to heal sacred trees",
    templatePoints: [
      { x: 0.5, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0.5, y: 0 },
    ],
    tolerance: 0.45,
    color: "#a78bfa",
    glowColor: "rgba(167, 139, 250, 0.6)",
    manaCost: 30,
    duration: 3000,
  },
  {
    name: "Purify",
    type: "purify",
    description: "Draw a zigzag to banish corruption",
    templatePoints: [
      { x: 0, y: 0 },
      { x: 0.33, y: 1 },
      { x: 0.66, y: 0 },
      { x: 1, y: 1 },
    ],
    tolerance: 0.45,
    color: "#fbbf24",
    glowColor: "rgba(251, 191, 36, 0.6)",
    manaCost: 25,
    duration: 2000,
  },
];

function generateCirclePoints(segments: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: 0.5 + Math.cos(angle) * 0.5,
      y: 0.5 + Math.sin(angle) * 0.5,
    });
  }
  return points;
}

export function getRuneByType(type: RunePattern["type"]): RunePattern | undefined {
  return RUNE_PATTERNS.find((r) => r.type === type);
}

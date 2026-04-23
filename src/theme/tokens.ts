/**
 * Enchanted Forest palette — moss, bark, firefly.
 *
 * See docs/DESIGN.md for rationale. Short version: the player learns a
 * rune in a living grove. Safe life is mossy green; the ritual mark and
 * spirit light are firefly amber; corruption arrives as warm warn-coral
 * that breaks the palette like smoke through moonlight.
 */

export const palette = {
  bg: "#0c1a10",
  moss: "#1a3a22",
  bark: "#2e1810",
  firefly: "#f2c14e",
  spirit: "#8b5cf6",
  fg: "#ecf1df",
  fgMuted: "#8a9b82",
  warn: "#f29679",
} as const;

export type PaletteKey = keyof typeof palette;

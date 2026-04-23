---
title: Standards
updated: 2026-04-23
status: current
domain: quality
---

# Enchanted Forest — Standards

## Code quality

### File length

Soft limit 300 LOC per file. Hard exceptions:

- `src/engine/forestSimulation.ts` — deterministic sim. Currently
  ~800 LOC because it holds wave spawn tables, shadow path tuning,
  and the full session-mode matrix. Acceptable while those tables
  stay colocated with the advance functions; split by system if it
  grows past 1200.
- `src/ui/game/GameUI.tsx` — the HUD overlay. ~600 LOC because it
  renders the rune legend, wave indicator, cadence cues, harmony
  meter, and the intro title card inline. Split the title card out
  if it grows past 800.
- `src/ui/game/ForestGame.tsx` — the orchestrator. ~300 LOC;
  acceptable to grow with phase lifecycle additions.

### TypeScript

- Strict mode via `tsconfig.app.json`.
- `verbatimModuleSyntax: true` — use `import type` for type-only
  imports.
- No `any`. Prefer discriminated unions.
- Explicit return types on exported functions.

### Linting and formatting

- Biome 2.4. `pnpm lint` = `biome lint .`.
- No ESLint, no Prettier, no stylelint.
- Do NOT introduce Tailwind. `src/theme/tw.css` holds the pinned
  utility subset used by legacy playfield components.

### Dependencies

- Weekly dependabot, minor + patch grouped.
- Tone.js is pinned by major; don't auto-bump.
- Capacitor is pinned by major; don't auto-bump.
- react / react-dom share version, bump together.

## Player-journey gate (non-negotiable)

A PR may not merge if any of the below fail on desktop (1280×800) OR
mobile-portrait (390×844) viewports.

1. Cold load: DOM ready and first-render frame paints in under 2
   seconds from navigation start.
2. Start screen shows the title "Enchanted Forest" in Cinzel amber,
   a one-sentence subtitle tagline, three verb-chip teasers, and the
   "START" primary CTA. No layout shift.
3. Clicking "START" transitions to gameplay within 600ms, no console
   errors.
4. Within 15 seconds of gameplay a cold player can identify: three
   sacred trees at the foreground, the rune-drawing surface (the
   spirit follows their cursor), the wave counter, the harmony meter,
   and at least one corruption shadow approaching from the treeline.
5. Drawing a full rune stroke plays a note via Tone.js and produces
   visible feedback (shield halo / heal pulse / purify zone).
6. No console errors throughout the run.
7. Victory finale is quiet (harmony chord + "wiser mage" phrasing);
   defeat is the roots going dark (coral flash + "roots dark"
   phrasing). Neither screams GAME OVER.

## Brand

- Title: "Enchanted Forest"
- Tagline: "Learn a rune, chain it, survive grove variety that tests
  the reading of your cadence. Finish as a wiser mage."
- Palette and fonts: see [`CLAUDE.md`](./CLAUDE.md) palette block.
- Icon: a single amber-glowing rune silhouette over mossy green.
  TODO (tracked in `docs/STATE.md`).

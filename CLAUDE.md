---
title: Claude Code Instructions
updated: 2026-04-23
status: current
---

# Enchanted Forest — Agent Instructions

## What This Is

A rune-cadence survival grove. The player draws one of three runes —
shield, heal, purify — over a living grove stage. Each rune plays a
pentatonic note via Tone.js; chaining them builds harmony; harmony
empowers the next cast. Corruption shadows march toward the three
sacred trees; when a tree's HP reaches zero the grove starts to die;
when all three fall the run ends in defeat. Sealing all waves ends
the run in victory, with the player a "wiser mage."

The game rewards rhythm: knowing *when* to cast, in what order, to
harvest the harmony multiplier. It is not twitch — the drawing
interaction is slow enough that a cold player can follow their own
stroke. Audio is load-bearing.

## Critical Rules

1. **Engine is deterministic.** `src/engine/forestSimulation.ts` is pure
   TypeScript and must stay testable without the DOM. React components
   read state; they do not own it.
2. **Drawing is canvas, everything else is DOM.** `ToneDrawer` uses a
   full-stage `<canvas>` for the rune stroke path. Trees, spirits,
   shadows, fireflies, UI are all framer-motion DOM elements.
3. **Tone.js is mandatory.** `src/lib/forestAudio.ts` initializes an
   audio context on first user interaction and plays one note per rune
   tone. If this breaks, the grove loses its best sense — fix before
   anything else.
4. **No Tailwind build.** `src/theme/tw.css` holds the pinned utility
   subset used by the legacy playfield components. All identity
   (color, font, glow) lives in `src/theme/global.css` + inline styles.
5. **Biome, not ESLint.** `pnpm lint` runs Biome.
6. **pnpm only.** Do not create `package-lock.json` or `yarn.lock`.
7. **Finale is wiser-mage, not high-score.** Completion leaves the
   grove quiet and offers "continue." Defeat is not a scream — it's
   the roots going dark.

## Commands

```bash
pnpm dev                 # Vite dev server
pnpm build               # tsc + vite build
pnpm typecheck           # tsc -b --pretty false
pnpm lint                # Biome
pnpm test                # test:node + test:dom
pnpm test:browser        # real Chromium via @vitest/browser-playwright
pnpm test:e2e            # Playwright end-to-end
pnpm cap:sync            # build + cap sync (android)
pnpm cap:open:android    # open Android Studio
pnpm cap:run:android     # pnpm cap:sync && cap run android
```

## Project Structure

- `src/engine/forestSimulation.ts` — pure simulation, deterministic,
  testable in node. Wave spawn, shadow paths, rune cadence tuning,
  mode scaling, victory/defeat transitions.
- `src/lib/` — `forestAudio`, `runePatterns`, `sessionMode`,
  `runtimePause`, `utils`.
- `src/hooks/` — `useResponsive`, `useRunSnapshotAutosave`,
  `runtimeResult`. Cabinet-shim replacements.
- `src/theme/` — palette tokens, global CSS, `tw.css` utility subset.
- `src/ui/Game.tsx` — the thin mount. Delegates to `ForestGame`.
- `src/ui/game/ForestGame.tsx` — the orchestrator. Owns phase
  (intro / playing / victory / defeat), autosave, and audio lifecycle.
- `src/ui/game/GameUI.tsx` — HUD overlay.
- `src/ui/game/*.tsx` — in-playfield particles and stage chrome.
- `src/ui/shell/*` — identity chrome (`GameViewport`, `StartScreen`,
  `OverlayButton`, game-over).

## Design palette (locked-in)

See [`docs/DESIGN.md`](docs/DESIGN.md) for rationale.

```
--color-bg:        #0c1a10   deep forest void (background)
--color-moss:      #1a3a22   mossy green (safe-life anchors)
--color-bark:      #2e1810   warm bark (trees, underlays)
--color-firefly:   #f2c14e   firefly amber (runes, CTA, harmony)
--color-spirit:    #8b5cf6   spirit violet (wisp, purify)
--color-fg:        #ecf1df   pale starlight (body text)
--color-fg-muted:  #8a9b82   muted sage (secondary labels)
--color-warn:      #f29679   warm coral (corruption / defeat)
```

Display font: Cinzel (serif, rune-adjacent capital detailing).
Body font: Inter (sans, HUD + body).

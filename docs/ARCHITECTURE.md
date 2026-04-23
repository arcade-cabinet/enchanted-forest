---
title: Architecture
updated: 2026-04-23
status: current
domain: technical
---

# Architecture

## Stack

| Layer              | Choice                                                           |
| ------------------ | ---------------------------------------------------------------- |
| Drawing surface    | 2D `<canvas>` — one full-stage canvas owned by `ToneDrawer`      |
| Particles / stage  | DOM + framer-motion, absolutely-positioned inside `GameViewport` |
| UI framework       | React 19                                                         |
| State              | React hooks; engine state lives in `useState`/refs               |
| Audio              | Tone.js 15 (pentatonic notes + ambient layer)                    |
| Animation (chrome) | framer-motion                                                    |
| Build              | Vite 8                                                           |
| Test               | Vitest 4 (node / jsdom / browser) + Playwright                   |
| Lint/format        | Biome 2.4                                                        |
| Mobile wrap        | Capacitor 8                                                      |

No Tailwind build. A small pinned subset of utility classes —
positioning + `rounded-full` fragments used by legacy playfield
components — lives in `src/theme/tw.css`. Identity-bearing surfaces
use CSS custom properties from `src/theme/global.css` plus inline
style objects.

## Data flow

```
user input (pointer stroke over <canvas>)
        ↓
  ToneDrawer.onSpellCast(rune)
        ↓
  forestAudio.playSpellEffect(type) ─→ Tone.js synth
        ↓
  ForestGame.applySpellCast(forestState, rune)
        ↓
  forestSimulation.advance(...)       (wave transitions, shadow paths)
        ↓
  React state update → re-renders <SacredTree>, <CorruptionWave>,
                       <Spirit>, <GameUI>
```

Engine state is held in React state (not refs) because the grove is
event-driven, not frame-driven — each rune cast is a discrete tick,
not a 60fps simulation.

## Files you'll edit most

- `src/engine/forestSimulation.ts` — deterministic sim: wave spawn
  tables, shadow paths, harmony / cadence calculations.
- `src/lib/forestAudio.ts` — Tone.js glue. Every rune fires here.
- `src/lib/runePatterns.ts` — the three rune templates used by the
  gesture matcher.
- `src/ui/game/ForestGame.tsx` — orchestrator + phase router + save
  persistence.
- `src/ui/game/ToneDrawer.tsx` — the canvas drawing surface.
- `src/ui/game/GameUI.tsx` — HUD overlay.
- `src/ui/game/*.tsx` — in-playfield particle components.
- `src/theme/*` — palette + global CSS + utility shim.

## Responsibilities

| Responsibility                | Owner                                 |
| ----------------------------- | ------------------------------------- |
| Deterministic state advance   | `src/engine/forestSimulation.ts`      |
| Rune gesture → spell          | `analyzeRuneGesture()` in engine      |
| Audio lifecycle               | `src/lib/forestAudio.ts`              |
| Stroke capture                | `src/ui/game/ToneDrawer.tsx`          |
| HUD overlay                   | `src/ui/game/GameUI.tsx`              |
| Phase transitions             | `src/ui/game/ForestGame.tsx`          |
| Save slot / last run          | `src/hooks/runtimeResult.ts` +        |
|                               | `useRunSnapshotAutosave`              |

Save keys: `enchanted-forest:v1:save`,
`enchanted-forest:v1:last-run`, `enchanted-forest:v1:best-score`.

## Performance contract

- Target 60 FPS on mid-tier mobile (iPhone 12, Pixel 6) during stroke.
- Canvas redraw per frame is ~O(stroke-points) — each stroke is
  bounded to 256 samples by `ToneDrawer`.
- DOM node budget on playfield: ~60–100 (3 trees, 4–10 shadows,
  40 fireflies, 1 spirit, HUD).
- If a frame drops below 50 FPS on mobile, reduce `FireflyParticles`
  count (currently 40) and the drop-shadow strength on the spirit.

## Build budget

- JS ≤ 700 KB gzipped (Tone.js is ~80 KB gzip). Currently ~183 KB
  gzip of first-party + Tone ≈ 250 KB gzip total.
- CSS ≤ 50 KB (currently ~12 KB).
- Fonts: Cinzel + Inter, weights 400/500/600.

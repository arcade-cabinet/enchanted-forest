---
title: Decisions log — Enchanted Forest
updated: 2026-04-24
status: current
domain: context
---

# Enchanted Forest — Decisions log

---

## 2026-04-24 — NoiseBackground reuses ImageData; sin is a LUT

**Reason:** `createImageData(512, 512)` every ~3 frames allocates
~1MB Uint8ClampedArrays (~20MB/s sustained) and 250K `Math.sin`
calls/frame hammers the main thread. Under a Playwright-driven
viewport-resize loop this compounds.

**Constraint:** Allocate ImageData once outside the draw loop.
Pre-seed alpha to 10 so the hot loop doesn't write it. Precompute a
`Float32Array` of `Math.sin(p * 12.9898)` for `S*S` pixels at init
and rotate the lookup index by a frame-dependent step. Visual
character preserved, CPU + GC pressure killed. PR #21.

---

## 2026-04-24 — Per-shadow intervals mount exactly once

**Reason:** `CorruptionShadowEntity`'s 16ms movement interval had
`shadow.health`, `shadow.size`, `shadow.speed`, `onReachTree`,
`onPurified` in its deps. `onReachTree` was a fresh arrow on every
`ForestGame` render, so the N intervals tore down and re-registered
every frame under memory pressure.

**Constraint:** Stash volatile props in refs (`shadowRef`,
`treePositionRef`, `onReachTreeRef`, `onPurifiedRef`,
`purifyZoneRef`). Interval deps = `[isVaporizing]`. Interval mounts
once per shadow, lives for the shadow's lifetime. PR #21.

---

## 2026-04-24 — Tutorial→playing phase flip is inside the setTimeout

**Reason:** The original code dispatched `phase: "playing"` before
the 700ms tutorial fade, which tripped the transition effect into
calling `spawnWave(1)`. Then the setTimeout fired and ALSO spawned
wave 1 with hardcoded `startingShadowId=0`, overwriting shadow IDs
and double-playing `playWaveStart`.

**Constraint:** Flip `phase: "playing"` INSIDE the setTimeout at
the same moment `setForestState` populates `shadows: wave.shadows`.
Transition effect only sees the promoted phase once shadows
already exist. PR #21.

---

## 2026-04-24 — Tone cleanup on unmount and on restart

**Reason:** `restartGame` used to call `stopAmbient` but unmount
did nothing. HMR or Playwright navigation accumulated Transport
schedules + PolySynth + reverbs indefinitely. Spell-cleanup
setTimeouts also fired into stale React trees after restart.

**Constraint:** Top-level `useEffect` returns a cleanup that calls
`forestAudio.stopAmbient()` and clears `spellTimeoutsRef`.
`restartGame` calls `clearSpellTimeouts()` in addition to
`stopAmbient`. PR #21.

---

## 2026-04-24 — Tutorial phase exists; landing is gated

**Reason:** User critique: the landing rendered with the live
game bleeding through, AND the game immediately hostile'd the
player — shadows descended the instant you clicked START with no
time to learn the interaction.

**Constraint:** Landing uses an `intro` phase (playfield not
mounted). On Begin Dive, switch to `tutorial` phase with full-HP
trees and zero shadows, plus an overlay "Draw a circle anywhere
to cast SHIELD." First successful cast → `playing` via the
setTimeout chain. PR #20.

---

## 2026-04-24 — Real Tailwind v4, not the hand-rolled subset

**Reason:** `src/theme/tw.css` was a curated utility subset that
lacked `sm:hidden`, `md:p-4`, `max-w-5xl`, `.fixed`, etc. Mobile
and desktop HUD panels both rendered and overlapped; landing was a
mess.

**Constraint:** Single line: `@import "tailwindcss";`. Real
responsive classes work. PR #20.

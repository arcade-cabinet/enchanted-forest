---
title: Next work — Enchanted Forest
updated: 2026-04-24
status: current
domain: context
---

# Enchanted Forest — Next work

Handoff for the next agent (or human). Read cold — no prior
conversation context required.

## Current state (as of 2026-04-24)

- React 19 + Tailwind v4 (real `@tailwindcss/vite`, not the
  hand-rolled subset that used to be in `src/theme/tw.css`) +
  framer-motion + Tone.js ambient + DOM-particle rendering.
- Landing → tutorial → playing → victory/defeat state machine.
  Landing is properly gated (no live playfield bleed under the
  modal); tutorial phase has full-HP trees and zero shadows so the
  player can cast their first rune without pressure. First
  successful cast promotes `tutorial → playing` and spawns wave 1
  700ms later.
- Rune drawing via `ToneDrawer`: pointer path → rune match →
  spell cast. Three runes: shield, heal, purify.
- Authored-JSON rune-pattern pipeline at `config/raw/` +
  `scripts/compile-content.mjs`. 3 runes seeded.
- Codename codec (adjective × adjective × noun) for run identity.
- Branded icons (triskelion) for web + Android.
- Memory-spike audit perf patches landed (PR #21):
  - `NoiseBackground` allocates its 512×512 ImageData once and
    mutates the buffer in place; a precomputed
    `Float32Array` sin-LUT replaces 250K `Math.sin` calls per frame
    (~20 MB/s GC churn killed).
  - `CorruptionWave` per-shadow movement interval reads
    `shadow`/`treePosition`/callbacks via refs, so the 16 ms
    interval mounts exactly once per shadow instead of re-registering
    on every parent render.
  - `ForestGame` has an unmount cleanup that calls
    `forestAudio.stopAmbient()` and cancels pending spell-cleanup
    timeouts; Tone.Transport schedules + synth nodes no longer
    accumulate across HMR / navigation.
  - Tutorial → playing race fixed: phase flips INSIDE the setTimeout,
    not before, so the transition effect no longer double-spawns
    wave 1.

## What's NOT done

### Priority 1 — graphics

User mandate: Sacred Trees are a green triangle on a brown stick.
Not acceptable.

- `src/ui/game/SacredTree.tsx` — replace with layered SVG (leaf
  canopy shapes, trunk detail, root glow) that reflects `health`
  dynamically (darken + shrink canopy on low HP, cracks on impact).
- `src/ui/game/Spirit.tsx` — the player avatar. Currently a
  decorative trailing dot. A small firefly silhouette (SVG) would
  land.
- `src/ui/game/CorruptionWave.tsx` — the shadows are
  simple blob shapes. Silhouette creatures (moth, wisp) that read
  at mobile size would ground the fiction.

### Priority 2 — journey-harness parity with bioluminescent-sea

bs ships a multi-viewport Playwright harness at `e2e/journey.spec.ts`
that dumps screenshots + diagnostics per beat across mobile / tablet
/ desktop. ef doesn't have one. Copy the pattern:

- Unique port (e.g. 41733).
- Three viewport projects.
- Beats: landing → tutorial → first rune → wave 1 → victory
  (cheat-code path or fast-wave seed).
- Probe selectors: add `data-testid` hooks to the HUD, the
  tutorial overlay, the tree positions, and the corruption-wave
  container.

### Priority 3 — audio autoplay + UX gaps

- On fresh load, Chrome prints "The AudioContext was not allowed to
  start" — a user gesture is required. `forestAudio.initialize()`
  is called on `startGame`, but the first audible event (wave
  chime) is delayed ~700ms. Wire a silent no-op SFX on the Begin
  button's onClick to unlock the context earlier.
- "DRAW SHIELD" floating label from the ToneDrawer duplicates the
  RUNE CUE panel. One or the other, not both.
- HUD cue strip (ritual + spell cadence) is too dense on mobile
  portrait. Collapse to a single primary cue when the viewport is
  narrow.

### Priority 4 — memory-spike audit Medium / Low

- **`src/ui/game/SacredTree.tsx:64`** — damage-flash `setTimeout`
  not cancelled on unmount. Fires `setShowDamage(false)` on a
  possibly-unmounted tree. Low risk (component mounted for the
  dive lifetime) but worth fixing when you're in there for the
  graphics rewrite.
- **`src/ui/game/FireflyParticles.tsx`** — 40 canvas fireflies
  with a fresh `createRadialGradient` per firefly per frame
  (~2400 allocations/s). Cache the gradient per firefly.

## How to ship

1. Branch off main. Conventional Commits.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` must stay green.
3. Run the harness (once built) across all three viewports.
4. `gh pr create` + `gh pr merge <n> --auto --squash`.

## Key files

- `src/ui/game/ForestGame.tsx` — state machine, spellTimeoutsRef,
  transition effect.
- `src/ui/game/ToneDrawer.tsx` — pointer → rune → spell.
- `src/ui/game/CorruptionWave.tsx` — per-shadow movement intervals.
- `src/ui/game/NoiseBackground.tsx` — optimized LUT noise.
- `src/lib/forestAudio.ts` — Tone.js ambient + SFX. NEEDS a
  `dispose()` method; currently only `stopAmbient` exists.
- `src/sim/**` — pure engine (grove / runes / corruption).

## Don'ts

- Do NOT reintroduce per-frame `createImageData` in NoiseBackground
  or per-render `setInterval` teardown in CorruptionWave. Refs +
  mutate-in-place are the pattern.
- Do NOT spawn timers in `handleSpellCast` without pushing them
  into `spellTimeoutsRef` — they must be cancellable on unmount
  and restart.
- Do NOT flip `phase` before the tutorial setTimeout fires; it
  re-introduces the double-spawn race.

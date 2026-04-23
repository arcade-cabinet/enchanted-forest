---
title: Testing
updated: 2026-04-23
status: current
domain: quality
---

# Testing

## Lanes

| Lane                 | When it runs | Config                     | Covers                                        |
| -------------------- | ------------ | -------------------------- | --------------------------------------------- |
| `pnpm test:node`     | dev + CI     | `vitest.config.ts`         | simulation, cadence, shadow paths, mode tuning |
| `pnpm test:dom`      | dev + CI     | `vitest.dom.config.ts`     | presentational React components               |
| `pnpm test:browser`  | dev + CI     | `vitest.browser.config.ts` | real-Chromium canvas + stroke + audio mock    |
| `pnpm test:e2e`      | CI only      | `playwright.config.ts`     | full user journeys                            |

## What to test

- **Engine invariants**: `forestSimulation` is deterministic. Seeded
  inputs must produce the same wave / transition / victory sequence.
- **Palette lock**: any change to `src/theme/tokens.ts` gets a dom
  test asserting CSS vars are still exposed.
- **Stroke recognition**: for each rune template, a browser test
  plays a canonical stroke and asserts the matching rune type fires.
- **Audio no-op under jsdom**: forestAudio's initialize + play
  methods must not throw when no audio context is available.
- **Player journey**: an e2e per release that loads, clicks START,
  waits 5s, asserts the wave counter shows "Wave 1" and at least one
  shadow is present.

## Coverage

Target 80% on `src/engine/` and `src/lib/`. The UI layer is covered
by browser + e2e rather than unit coverage.

## Screenshots

E2E screenshots land in `test-results/` (gitignored). Headless harness
screenshots land in `/tmp/ef-*.png` via `node scripts/snapshot.mjs`.

---
title: State
updated: 2026-04-23
status: in-progress
domain: context
---

# State

## Current baseline

Initial cut extracted from `jbcom/arcade-cabinet` on 2026-04-23.
DOM particles + canvas drawing surface are live: grove stage with
three sacred trees, harmony meter, rune drawer, spirit trail,
corruption shadows with intent paths, firefly decor, wave HUD.

- Node tests: 11 passing (forestSimulation).
- Typecheck clean, build clean at ~637 KB JS (~183 KB gzip) +
  ~12 KB CSS + font files.
- Headless Chromium verified at 1280×800 and 390×844 portrait:
  landing → START → playing → HUD updates → zero console errors.

## Remaining before 1.0

| Area                 | Status          | Next step                                                         |
| -------------------- | --------------- | ----------------------------------------------------------------- |
| Audio init on start  | partial         | Ensure `forestAudio.initialize()` awaits before first wave spawn  |
| Rune gesture tuning  | ported          | Playtest with cold users; tune template tolerances                |
| Icons                | placeholder     | Generate amber-rune SVG favicon + Android icon pack               |
| Landing hero         | placeholder     | Optional: grove hero art for the title card                       |
| E2E test             | not started     | Playwright journey spec                                           |
| Android APK          | not scaffolded  | `pnpm exec cap add android` + verify locally                       |
| GitHub Pages         | not deployed    | First release-please tag triggers it                              |
| Daily grove seed     | not in engine   | Add `?seed=<YYYYMMDD>` query-param                                |
| Victory diary        | stub            | "Every rune you cast" mini-screen after victory                   |

## Known bugs / quirks

- ToneDrawer canvas previously intercepted pointer events during the
  intro phase, blocking the START button. Fixed by setting
  `pointer-events: none` on the canvas when disabled. (2026-04-23)

## Decisions log

- 2026-04-23: Kept the legacy DOM-particle grove components instead
  of rewriting to canvas. Replaced Tailwind with the pinned
  `src/theme/tw.css` utility subset so existing `className` strings
  resolve without the Tailwind build.
- 2026-04-23: Extended `StartScreen` shell with `verbs` / `glowColor`
  / `glowRgb` / `background` props so the grove palette (amber on
  moss) could reuse the same title card rhythm from
  bioluminescent-sea without a copy-paste fork.
- 2026-04-23: Replaced cabinet-runtime save-slot API with
  `localStorage["enchanted-forest:v1:save"]` +
  `…:best-score` + `…:last-run`.
- 2026-04-23: Replaced cabinet `<RuntimeResultRecorder>` JSX element
  with a `RunResultEffect` functional component that calls
  `recordRunResult(...)` in a `useEffect`.

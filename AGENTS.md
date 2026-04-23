---
title: Agent Operating Protocols
updated: 2026-04-23
status: current
---

# Enchanted Forest — Agent Protocols

See [`CLAUDE.md`](./CLAUDE.md) for the Claude-specific version.

## Contract

Every change must:

1. Keep `pnpm typecheck` green.
2. Keep `pnpm test` green (engine + session + cadence tests).
3. Keep `pnpm build` green (bundle ≤ 700 KB gzipped; Tone.js is
   heavy — budget accordingly).
4. Preserve zero console errors on desktop (1280×800) + mobile-
   portrait (390×844) playthrough via `scripts/snapshot.mjs`.
5. Preserve the player-journey gate in [`STANDARDS.md`](./STANDARDS.md).

## Testing lanes

| Lane                 | Config                     | What it proves                         |
| -------------------- | -------------------------- | -------------------------------------- |
| `pnpm test:node`     | `vitest.config.ts`         | pure simulation, cadence, shadow paths |
| `pnpm test:dom`      | `vitest.dom.config.ts`     | jsdom component tests                  |
| `pnpm test:browser`  | `vitest.browser.config.ts` | real-Chromium canvas stroke tests      |
| `pnpm test:e2e`      | `playwright.config.ts`     | full user journeys                     |

New rune-drawing behavior → a `*.browser.test.tsx` that plays a
stroke and asserts the spell fired.

## Commit conventions

Conventional Commits. Types: `feat`, `fix`, `chore`, `docs`, `refactor`,
`perf`, `test`, `ci`, `build`. release-please reads these to build the
changelog.

## Dependencies

Weekly dependabot, minor+patch grouped. Do NOT bump major versions
without a manual compat pass (tone, framer-motion, capacitor, react).

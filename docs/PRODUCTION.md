---
title: Production
updated: 2026-04-24
status: current
domain: context
---

# Production

The pre-1.0 readiness queue. When everything here is done, we cut 1.0.
Replaces the earlier HANDOFF-PRD; that document stays in the repo as a
frozen artifact of the extraction handoff but is no longer the working
queue.

## What this is (locked)

A rune-cadence survival grove. The player draws one of three runes
(shield / heal / purify) over a living grove stage. Each rune plays a
pentatonic note via Tone.js; chaining runes builds harmony; harmony
empowers the next cast. Corruption shadows advance toward three sacred
trees. Sealing all waves ends in victory as a "wiser mage"; all three
trees fallen ends the run.

The game rewards rhythm — *when* to cast, in what order, to harvest
the harmony multiplier. Not twitch. The drawing is forgiving; the
timing is what matters.

## Foundation (PR sequence A → H)

Enchanted-forest already has Tone.js wired (per extraction), so its
sequence is different from bioluminescent-sea's and cosmic-gardener's.

- [x] **PR A — Foundation scaffolding.** Libraries, docs tree,
      directory skeleton, tsconfig split, Biome, Vitest, Playwright,
      Capacitor Android — in place from the initial extraction.
- [ ] **PR B — Engine split.** Decompose the grove simulation into
      responsibility-scoped modules (`src/sim/grove/*`,
      `src/sim/runes/*`, `src/sim/corruption/*`). Old module path
      deleted outright. No compat shims.
- [ ] **PR C — Seeded determinism.** `seedrandom` + `createRng(seed)`
      plumbed through every grove layout, corruption wave, and rune
      note assignment. Landing shows a codename preview ("Your Next
      Grove") in Cinzel. `?seed=<slug>` makes groves shareable.
- [ ] **PR D — Identity-forward landing.** Animated hero replaces the
      typographic-only card: three runes drifting in the background,
      a sacred tree silhouette, soft cinders. Verb teaser chips
      pre-teach the loop ("draw a rune · chain the cadence · hold the
      grove"). Procedural blurb under the codename.
- [ ] **PR E — Audio consolidation.** Tone.js ambient pad with
      grove-specific chord voicings; pentatonic rune notes already
      present get gathered into a single audio module with master
      mute + localStorage persistence + `prefers-reduced-motion`
      honoring. SFX for rune cast, chain break, corruption hit, wave
      sealed, tree fallen.
- [ ] **PR F — Content pipeline.** Waves + rune patterns authored in
      `config/raw/*.json` and compiled via
      `scripts/compile-content.mjs` (Zod-validated). Runs as
      `predev` / `prebuild` / `pretypecheck` / `pretest:*`.
      Output to `config/compiled/content.ts` (gitignored).
- [ ] **PR G — Identity icons.** Favicon, apple-touch, OG image with
      the enchanted-forest identity (three-rune triskelion on a deep
      forest green with warm amber accents). Android icon pack at all
      mipmap resolutions.
- [ ] **PR H — Production deploy.** `release.yml` tags + builds
      Android AAB. `cd.yml` deploys web bundle to GitHub Pages.
      `analysis-nightly.yml` runs a determinism sweep.

## Quality gates

- [ ] `pnpm lint` passes on every authored file.
- [ ] `pnpm typecheck` strict mode passes on all composite projects.
- [ ] `pnpm test:node` + `pnpm test:dom` pass with real assertions.
- [ ] `pnpm test:browser` captures a representative frame per wave.
- [ ] `pnpm test:e2e` covers the full journey landing → draw rune →
      wave cleared → next wave → victory / defeat → restart.
- [ ] `pnpm build` produces a bundle under 500 KB gzipped.
- [ ] `./gradlew assembleDebug` produces a < 10 MB debug APK.
- [ ] GitHub Pages URL loads with zero console errors on desktop
      (1280×720) and mobile portrait (390×844).

## CI / CD

- [x] `ci.yml` — lint + typecheck + test:node + test:dom + build +
      Android APK + `test:browser` (Browser canvas tests job already
      runs `pnpm run test:browser`).
- [ ] `ci.yml` augmented with `test:e2e` (Playwright golden-path
      specs on desktop + mobile Chromium).
- [x] `release.yml` — on release-please tag: build bundle, publish
      artifact, build Android AAB.
- [x] `cd.yml` — on push:main: deploy Pages artifact.
- [ ] `analysis-nightly.yml` — determinism sweep once seeded
      content lands.
- [ ] `automerge.yml` — auto-merge green dependabot PRs for
      semver-patch + semver-minor updates.

## Decisions that need lore/design follow-through

- [ ] Codename word pools for procedural grove names ("Moss Lyric
      Triskelion," "Ember Cinder Thicket") — adjective × adjective ×
      noun with a forest-rune register, bijective with an 18-bit seed
      mask.
- [ ] Harmony multiplier visualization — currently a numeric stat;
      DESIGN.md needs a visual cadence cue the player reads before
      looking at the HUD.
- [ ] Wiser-mage finale — what does the victory screen look like?
      Currently generic "victory" framing; needs a moment consistent
      with rune lore.

## Production polish — player journey audit

Run once foundation PRs (A → H) merge. Do not ship 1.0 without these:

- [ ] Every POC-era string, placeholder blurb, filler headline
      replaced with voice-aligned content.
- [ ] Every POC visual replaced with production art unique to
      Enchanted Forest — no generic-AI aesthetic leakage.
- [ ] Cold 60-second playthrough passes for a first-time player: the
      rune UI is legible, a cast + its effect are intelligible, the
      corruption threat is clear, the first harmony moment is felt.
- [ ] Deployed to GitHub Pages. Zero console errors on the live URL
      across desktop (1280×720) and mobile portrait (390×844).
- [ ] All review feedback on every PR in the foundation sequence
      addressed.

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
- [x] **PR B — Engine split.** Decomposed `src/engine/forestSimulation.ts`
      (797 LOC) into responsibility-scoped modules:
      - `src/sim/grove/types.ts` — shared types
        (ForestState, tree/shadow/cue/mode types).
      - `src/sim/grove/constants.ts` — MAX_WAVES, tuning table,
        tree positions, rune base costs, default objective.
      - `src/sim/grove/state.ts` — initial-state + layout
        factories.
      - `src/sim/grove/session.ts` — mode tuning + transition +
        run summary.
      - `src/sim/grove/cues.ts` — ritual + spell-cadence cues
        (+ their private helpers).
      - `src/sim/grove/utils.ts` — clamp / round / updateThreat
        / findWeakestTreeIndex / getShadowTargetDistance.
      - `src/sim/runes/spells.ts` — apply / canCast / cost /
        clear / regenerateMana.
      - `src/sim/runes/gesture.ts` — analyzeRuneGesture
        (circular / upward / zigzag classifier).
      - `src/sim/corruption/shadows.ts` — spawn / advance /
        applyHit / removePurified / intent-path / hit-damage.
      - Barrels at `src/sim/{grove,runes,corruption}/index.ts` so
        consumers import by domain.
      Old `src/engine/` directory deleted outright. No compat
      shims.
- [x] **PR C — Seeded determinism (scaffold).** `seedrandom` +
      `createRng` + `hashSeed` + `randomSeed` shipped in
      `src/sim/rng/` (PR #9); codename codec shipped in
      `src/sim/rng/codename.ts` (PR #12) with a rune-forest word
      register (woodland geography, amulet metals, pentatonic musical
      terms, slow-ritual vocabulary). 262,144 distinct codenames per
      18-bit seed. Wiring the codename into the landing card +
      `?seed=<slug>` URL is the follow-up.
- [x] **PR D — Identity-forward landing.** Animated grove hero
      shipped (PR #10): forest canopy + sacred tree silhouette + 32
      fireflies + 18 rising cinders + three drifting rune glyphs
      (shield / heal / purify) at low opacity. StartScreen gained a
      `renderHero` slot to support the canvas. Existing verb chips
      ("Draw a rune / Chain its cadence / Seal the grove") stayed.
      Codename + procedural blurb are the follow-up.
- [x] **PR E — Audio consolidation.** Audio already lived in a
      single module (`src/lib/forestAudio.ts`) — the extraction
      consolidation work — so PR E added the missing controls:
      `setMuted`/`isMuted` on the engine ramp the master volume,
      `useAudioMute` persists to `localStorage` under
      `ef-audio-muted` and defaults to `prefers-reduced-motion`,
      and a `MuteToggle` component sits bottom-left of the viewport
      with `aria-pressed` + `aria-label`. Existing pentatonic rune
      notes, ambient pad, wind noise, and spell-effect synths are
      untouched.
- [x] **PR F — Content pipeline.** Rune patterns authored
      one-per-file in `config/raw/runes/*.json` and compiled via
      `scripts/compile-content.mjs` (Zod-validated; enforces a
      discriminated-union `templatePoints` shape — either
      `{ shape: "polyline", points: [...] }` or
      `{ shape: "circle", segments }` — and deduplicates rune
      types across files). Pipeline runs as `predev` / `prebuild`
      / `pretypecheck` / `pretest:{node,dom,browser}`. Output
      lands at `config/compiled/content.ts` (gitignored).
      `@config/*` path alias wired into `tsconfig.app.json`,
      `vite.config.ts`, and all three vitest configs. Waves are
      still formula-driven (`wave * 3` shadows in
      `spawnCorruptionWave`); if distinct wave-authoring is ever
      needed it's a follow-up on the same pipeline.
- [x] **PR G — Identity icons.** Web favicon / apple-touch /
      OG image shipped at `public/{favicon,apple-touch-icon,og-image}.svg`
      with the enchanted-forest identity: three-rune triskelion
      (shield · heal · purify glyphs at 120°) on the deep-forest
      backdrop (`#0c1a10` bg, `#1a3a22` moss disk, `#2e4a2f`
      halo, `#f2c14e` firefly amber for the rune glyphs + arms).
      `index.html` now links the apple-touch icon and carries
      OG + Twitter meta tags with the "Learn a rune, chain its
      cadence, seal the grove" tagline. All asset paths are
      relative (`./` not `/`) so GitHub Pages subpath serving
      works. Android mipmap pack generated from
      `res-svg/ic_launcher_{foreground,legacy}.svg` at all five
      densities (48/72/96/144/192 px) — covers
      `ic_launcher.png`, `ic_launcher_round.png`, and
      `ic_launcher_foreground.png` for the adaptive-icon path.
      Adaptive-icon background updated from default white to
      `#0c1a10` so the launcher reads as the same forest identity
      as the web tabs.
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
- [x] `automerge.yml` — auto-merge green dependabot PRs for
      semver-patch + semver-minor updates. Shipped in PR #11; mirrors
      the shared workflow used across the three game repos.

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

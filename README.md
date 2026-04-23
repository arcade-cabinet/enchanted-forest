---
title: Enchanted Forest
updated: 2026-04-23
status: current
---

# Enchanted Forest

> Learn a rune, chain it, survive grove variety that tests the reading
> of your cadence. Finish as a wiser mage.

A rune-cadence survival grove. You draw three runes — shield, heal,
purify — over a living stage of sacred trees, while corruption shadows
march from the treeline toward the ritual core. Each rune plays a
note; chaining them builds harmony; harmony empowers the next cast.
The grove is sealed when the last wave is cleared.

Built with React 19 + Vite 8 + Canvas (for rune drawing) + DOM
particles (for spirits, fireflies, shadows) + Tone.js (audio). Capacitor
wraps it as a debug APK for Android; the web build deploys to GitHub
Pages at `/enchanted-forest/`.

## Quick start

```bash
pnpm install
pnpm dev          # Vite dev server — http://localhost:5181
pnpm test         # node-mode unit tests (engine + audio)
pnpm test:dom     # jsdom tests for presentational shells
pnpm test:browser # real-Chromium canvas tests
pnpm test:e2e     # Playwright end-to-end
pnpm build        # production bundle → dist/
pnpm preview      # serve dist/ locally
pnpm cap:sync     # copy dist/ into android/
```

## Documentation

The docs tree is the source of truth for design, architecture, and
operations. Start at [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) or
[`docs/DESIGN.md`](docs/DESIGN.md).

| File                                         | Domain         |
| -------------------------------------------- | -------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | technical      |
| [docs/DESIGN.md](docs/DESIGN.md)             | product        |
| [docs/TESTING.md](docs/TESTING.md)           | quality        |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)     | ops            |
| [docs/STATE.md](docs/STATE.md)               | context        |
| [docs/RELEASE.md](docs/RELEASE.md)           | ops            |
| [AGENTS.md](AGENTS.md)                       | agent entry    |
| [CLAUDE.md](CLAUDE.md)                       | Claude entry   |
| [STANDARDS.md](STANDARDS.md)                 | quality        |
| [CHANGELOG.md](CHANGELOG.md)                 | release-please |

## License

MIT. See [LICENSE](LICENSE).

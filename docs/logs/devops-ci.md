# DevOps & CI/CD — Implementation Log

## Status: Done

**Date completed**: 2026-02-26

---

## What Was Built

Single workflow at `.github/workflows/ci.yml` with two jobs:

**`ci` job** — runs on every push and PR, blocks merges on failure:
1. Checkout + pnpm 10 + Node 20 with pnpm store cache
2. `pnpm install --frozen-lockfile`
3. Generate Paraglide i18n runtime
4. `pnpm check` — Biome lint + format
5. `npx tsc --noEmit` — TypeScript strict
6. `pnpm test` — Vitest unit + integration
7. `pnpm knip` — dead code detection

**`playwright` job** — runs after `ci`, `continue-on-error: true` (non-blocking until stable deployment target exists):
1. Installs Playwright + Chromium
2. Creates `.dev.vars` with `CYPRESS=true` for test auth stub
3. Applies D1 migrations locally
4. Starts `wrangler dev --port 3000` in background, polls until ready
5. Runs `npm run pw:run`
6. Uploads `test-results/` as artifact on failure (7-day retention)

---

## What's Next

- Drop `continue-on-error: true` on the Playwright job once the app has a stable deployment URL and E2E tests run against a real environment rather than a local Wrangler dev server.

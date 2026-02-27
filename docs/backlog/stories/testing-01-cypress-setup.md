# Story: E2E Test Runner Setup

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: S
- **Priority**: High — blocks all other testing stories

## Goal

Install an E2E test runner and wire it into the project so that E2E tests can be written and run against the local Wrangler dev server.

## History

Initially set up with **Cypress** (15.11.0), then migrated to **Playwright** (`@playwright/test`) due to a Cypress binary path resolution bug on macOS 13 that prevented headless execution. See [ADR-0009](../../adr/0009-cypress-e2e-testing.md) (superseded) and [ADR-0010](../../adr/0010-playwright-over-cypress.md).

## Acceptance Criteria (Playwright)

- `@playwright/test` appears in `devDependencies`
- `playwright.config.ts` exists at the repo root with `baseURL: "http://localhost:3000"` and `testDir: "tests/e2e"`
- `package.json` has two scripts:
  - `pw:open` — opens Playwright interactive UI mode
  - `pw:run` — runs the full suite headless
- `tests/e2e/` directory exists and is committed

## Done When

- [x] Playwright installed and configured
- [x] `npm run pw:run` exits 0 with the auth suite passing
- [x] `npm run check` passes (Biome)
- [x] Changes committed on a feature branch

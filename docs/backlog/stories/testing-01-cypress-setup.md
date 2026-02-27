# Story: Cypress Setup & Configuration

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: S
- **Priority**: High — blocks all other testing stories

## Goal

Install Cypress and wire it into the project so that E2E tests can be written and run against the local Wrangler dev server. This story produces no tests itself — it is the foundation everything else depends on.

## Acceptance Criteria

- `npx pnpm add -D cypress` has been run and `cypress` appears in `devDependencies`
- `cypress.config.ts` exists at the repo root, with `baseUrl: "http://localhost:3000"` and `specPattern: "cypress/e2e/**/*.cy.{ts,tsx}"`
- `package.json` has two new scripts:
  - `cy:open` — opens the Cypress interactive Test Runner
  - `cy:run` — runs the full suite headless
- `cypress/support/commands.ts` and `cypress/support/e2e.ts` exist (Cypress boilerplate)
- Running `npm run cy:open` opens the Cypress UI without errors
- `cypress/` directory is committed; `.cypress-cache` is gitignored

## Tasks

- [x] Install Cypress: `npx pnpm add -D cypress`
- [x] Create `cypress.config.ts` with `baseUrl`, `specPattern`, and TypeScript support
- [x] Add `cy:open` and `cy:run` scripts to `package.json`
- [x] Scaffold `cypress/support/commands.ts` and `cypress/support/e2e.ts`
- [x] Add Cypress cache and video/screenshot output dirs to `.gitignore`
- [x] Verify `npm run cy:open` launches without errors

## Done When

- [x] `npm run cy:open` opens Cypress UI cleanly
- [x] `npm run cy:run` exits 0 with no test files (empty suite is fine at this stage)
- [x] `npm run check` passes (Biome)
- [x] Changes committed on a feature branch

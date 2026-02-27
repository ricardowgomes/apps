# ADR-0009: Cypress E2E Testing as Third Testing Layer

- **Date**: 2026-02-26
- **Status**: Superseded by [ADR-0010](0010-playwright-over-cypress.md)
- **Amends**: [ADR-0005](0005-testing-strategy.md)

## Context

ADR-0005 established a two-level testing strategy (unit tests with Vitest + integration tests with Testing Library/jsdom) and explicitly rejected E2E tests with Cypress/Playwright as "too slow for rapid iteration; no unit-level confidence".

Since then, the project has grown to include real production features (Finance tracker, Google OAuth) where the unit and integration tests cannot fully verify:

- The full authentication flow (cookie handling, session middleware, route guards)
- Server function round-trips through a real Cloudflare Workers environment
- UI interactions that depend on the full rendered page (form submission → D1 insert → list refresh)

The jsdom/Node 20 ESM compatibility issue has also limited integration tests to application-layer logic only — no React component rendering. Cypress, running against a real browser, sidesteps this problem entirely.

The decision to add Cypress was driven by a requirement for **100% feature coverage** on all production routes.

## Decision

Add **Cypress** as a third testing layer, sitting above Vitest unit and integration tests:

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Domain logic, pure functions |
| Integration | Vitest + Testing Library | Application-layer logic (no DOM for now) |
| E2E | Cypress | Full user flows against a running Wrangler local server |

### Scope of Cypress tests
- Every **production feature** (not demo routes) must have at least one Cypress E2E test covering its primary user flow
- Auth flows: unauthenticated redirect, login page render
- Finance flows: page load, add transaction, delete transaction, filter, search, summary card totals

### Configuration
- Base URL: `http://localhost:3000` (local Wrangler dev server)
- Test files: `cypress/e2e/{domain}/` (mirrors the `src/{domain}/` structure)
- Custom commands: `cypress/support/commands.ts`
- Auth stub: a `cy.loginAsTestUser()` command that seeds a test session in local D1 without real Google OAuth

### CI
- Cypress runs in CI after the build step, against a Wrangler local server started in the background
- Failure blocks merge to main

## Consequences

### Positive
- Full user-flow coverage that unit and integration tests cannot provide
- Catches integration bugs between auth middleware, server functions, and UI
- Works around the jsdom/Node 20 limitation by using a real browser
- Gives confidence that D1 round-trips actually work end-to-end

### Negative / Trade-offs
- Slower than Vitest — E2E suite will add minutes to CI
- Requires a running local server (Wrangler) in CI, adding setup complexity
- Auth stubbing for Google OAuth requires careful test isolation to avoid polluting the local D1 database between test runs

### Rule
**Every new production feature must ship with at least one Cypress E2E test covering its primary user flow.** This is a hard requirement — a task is not done until its Cypress test passes.

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Playwright instead of Cypress | Cypress is more widely known; either works — Cypress chosen for its developer-friendly DX and built-in test runner UI |
| Expand Vitest integration tests | Still blocked by jsdom/Node 20 ESM issue; does not cover real server round-trips |
| Accept current coverage | Insufficient — real production bugs (auth, D1 queries) are invisible to unit tests |

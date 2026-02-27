# ADR-0010: Switch from Cypress to Playwright for E2E Testing

- **Date**: 2026-02-26
- **Status**: Accepted
- **Supersedes**: [ADR-0009](0009-cypress-e2e-testing.md)

## Context

ADR-0009 chose Cypress as the E2E testing layer. After setup, the Cypress 15 binary consistently failed to launch on macOS 13 (x86_64) with a path resolution bug (`Contents/MacOS/Contents/Resources/…` instead of `Contents/Resources/…`). The secondary smoke-test failure (`bad option: --smoke-test`) compounded this.

E2E tests must run reliably at every feature iteration — both locally and in CI. A test runner that requires manual binary surgery to function is not fit for that purpose.

## Decision

Replace Cypress with **Playwright** (`@playwright/test`).

Everything established in ADR-0009 about scope, coverage expectations, and the auth stub pattern remains unchanged; only the tool changes.

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Domain logic, pure functions |
| Integration | Vitest | Application-layer logic |
| E2E | **Playwright** | Full user flows against a running Wrangler local server |

### Configuration
- Base URL: `http://localhost:3000`
- Test files: `tests/e2e/{domain}/` (mirrors `src/{domain}/` and the old `cypress/e2e/{domain}/`)
- Auth helper: `loginAsTestUser()` utility in `tests/e2e/helpers.ts` — same D1 session-seed approach as the old `cy.loginAsTestUser()` command
- Browser: Chromium (default), configured headless in CI

### Scripts
```
pw:open   → playwright test --ui        (interactive mode)
pw:run    → playwright test             (headless, CI mode)
```

## Consequences

### Positive
- Reliable headless execution — Playwright downloads Chromium itself, no Electron dependency
- Better macOS/CI compatibility
- `@playwright/test` has a built-in test runner, fixture system, and parallel execution
- Minimal migration cost — one existing test file plus the auth stub command to port

### Negative / Trade-offs
- Cypress UI is more visual for debugging; Playwright UI mode (`--ui`) covers this adequately
- Existing knowledge of Cypress commands needs a small mental-model shift (`cy.get` → `page.locator`, etc.)

### Rule (unchanged from ADR-0009)
**Every new production feature must ship with at least one Playwright E2E test covering its primary user flow.** A task is not done until its Playwright test passes.

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Fix Cypress binary | Requires machine-specific symlink workaround; would recur in CI |
| Downgrade Cypress | Older versions have other known headless issues on macOS |

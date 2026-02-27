# Automated Testing — Implementation Log

## Status: Done

**Date completed**: 2026-02-26

---

## Goal

Establish a full Playwright E2E test suite for all production features (Auth + Finance), covering real user flows against a running Wrangler dev server. Every future feature ships with at least one Playwright spec.

---

## What Was Built

### Test runner: Playwright

Replaced an initial Cypress setup (abandoned due to a Cypress 15 binary path bug on macOS 13) with **Playwright** (`@playwright/test`). See [ADR-0009](../adr/0009-cypress-e2e-testing.md) (superseded) and [ADR-0010](../adr/0010-playwright-over-cypress.md).

**Config** (`playwright.config.ts`):
- `testDir: "tests/e2e"`, `baseURL: "http://localhost:3000"`, Chromium only
- `retries: 2` in CI, `forbidOnly` enabled in CI
- `trace: "on-first-retry"` — captures traces on the first retry for debugging

**Scripts added to `package.json`**:
- `pw:open` — interactive Playwright UI mode
- `pw:run` — headless run against a running dev server

### Auth test stub

`tests/e2e/helpers.ts` — `loginAsTestUser(page)` bypasses real Google OAuth by calling `GET /api/test/login`, which seeds a fake D1 session for `test@example.com` and returns the session ID. The helper sets the `session_id` cookie directly on the browser context.

The stub endpoint (`src/routes/api.test.login.ts`) is gated behind `env.CYPRESS === "true"`, which is only set in `.dev.vars` (local) or in the CI `.dev.vars` step — never in production.

A companion endpoint `src/routes/api.test.finance.ts` enables test-data seeding and teardown for Finance specs.

### Auth E2E specs (`tests/e2e/auth/auth.spec.ts`)

| Spec | What it verifies |
|---|---|
| Unauthenticated redirect | Fresh browser visiting `/finance` lands on `/login` |
| Login page render | `/login` shows the "Sign in with Google" button |

### Finance E2E specs (`tests/e2e/finance/finance.spec.ts`)

All specs call `loginAsTestUser(page)` in `beforeEach` and seed/clean test data via the test API.

| Spec | What it verifies |
|---|---|
| Finance page loads | `/finance` renders summary cards and transaction list |
| Add income | Open sheet → fill form → submit → row visible, income total increases |
| Add expense | Same flow → expense total increases, balance decreases |
| Delete transaction | Click delete → row removed, totals update |
| Filter: income | "Income" toggle → only income rows visible |
| Filter: expense | "Expenses" toggle → only expense rows visible |
| Search | Type in search box → only matching rows visible |
| Summary cards | Balance = income − expense; cards match visible transaction sums |

### CI integration (`.github/workflows/ci.yml`)

Added a `playwright` job that runs after the existing `ci` job (lint + typecheck + Vitest + Knip):

1. Installs Playwright browsers: `npx playwright install --with-deps chromium`
2. Creates a minimal `.dev.vars` with `CYPRESS=true` and `ALLOWED_EMAILS=test@example.com`
3. Applies both D1 migrations against local D1
4. Starts `wrangler dev --port 3000` in the background
5. Polls `localhost:3000` until ready (60 s timeout)
6. Runs `npm run pw:run`
7. Uploads `test-results/` as an artifact on failure (7-day retention)

The job has `continue-on-error: true` for now — it reports pass/fail as a warning but does not block merges. This will be hardened when the app has a stable deployment target.

---

## File Layout

```
tests/
  e2e/
    auth/
      auth.spec.ts           # Unauthenticated redirect + login page
      login-stub.spec.ts     # Smoke test for loginAsTestUser()
    finance/
      finance.spec.ts        # 8 finance feature specs
    helpers.ts               # loginAsTestUser(page)

src/routes/
  api.test.login.ts          # Seeds a D1 session for test@example.com
  api.test.finance.ts        # Seeds / tears down Finance test data

playwright.config.ts         # Playwright config
.github/workflows/ci.yml     # ci + playwright jobs
```

---

## What's Next

- **Harden CI** — once the app is deployed to a real domain, point `baseURL` at the staging URL, remove the wrangler dev setup steps, and drop `continue-on-error: true` to make the Playwright job a hard gate.
- **New features** — every production feature going forward ships with at least one Playwright spec (enforced by the CLAUDE.md rule and ADR-0005).

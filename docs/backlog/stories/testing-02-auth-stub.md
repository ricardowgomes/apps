# Story: Auth Test Stub

- **Epic**: [Automated Testing](../epic-testing.md)
- **Status**: Done
- **Size**: M
- **Priority**: High — required by Auth E2E and Finance E2E stories
- **Depends on**: [testing-01-cypress-setup.md](testing-01-cypress-setup.md)

## Goal

Create a `cy.loginAsTestUser()` Cypress custom command that authenticates a test user without going through real Google OAuth. All subsequent E2E tests for protected routes call this command in their `beforeEach`.

## Context

The app uses Google OAuth (arctic) + Cloudflare D1 sessions. There are two realistic bypass strategies:

1. **D1 session seed** — Insert a fake session row directly into the local D1 database via a Wrangler CLI call or a dedicated test-only API endpoint, then set the `session_id` cookie to that row's ID.
2. **Cookie intercept** — Intercept the OAuth callback request in Cypress and manually set the session cookie to a known value that matches a pre-seeded D1 row.

Prefer option 1 (D1 seed via a test endpoint) as it is more deterministic and doesn't depend on network interception.

## Acceptance Criteria

- `cy.loginAsTestUser()` is defined in `cypress/support/commands.ts`
- Calling the command results in a valid `session_id` cookie being set for `localhost:3000`
- After the command runs, visiting `/finance` renders the finance dashboard (not `/login`)
- The test session uses a fixed test user (e.g. `test@example.com`) that is in `ALLOWED_EMAILS` for the local dev environment
- No real Google credentials are needed to run the suite
- The stub mechanism is gated to the local dev environment — it must not be deployable to production

## Tasks

- [x] Add `test@example.com` to `ALLOWED_EMAILS` in `.dev.vars` (local Wrangler env only)
- [x] Create a test-only API route (e.g. `GET /api/test/login`) that is conditionally registered only when `NODE_ENV === "test"` or a `CYPRESS` env flag is set; the route inserts a session row into D1 and returns the session ID
- [x] Define `cy.loginAsTestUser()` in `cypress/support/commands.ts` — calls `GET /api/test/login`, then sets the `session_id` cookie
- [x] Add TypeScript types for the custom command in `cypress/support/index.d.ts`
- [x] Write a smoke test (`cypress/e2e/auth/login-stub.cy.ts`) that calls `cy.loginAsTestUser()` and asserts `/finance` renders without redirecting

## Done When

- [x] `cy.loginAsTestUser()` is callable in any spec
- [x] The smoke test passes against a running local Wrangler dev server
- [x] The test endpoint is not reachable in a production build
- [x] `npm run check` and `npx tsc --noEmit` pass
- [x] Changes committed on a feature branch
